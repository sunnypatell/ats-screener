// LLM provider abstraction for /api/analyze.
//
// cloud chain is Gemma 3 27B (Google) -> Llama 3.3 70B (Groq); cross-provider
// fallback gives independent quotas so one provider's limits don't cascade.
// self-hosters can prepend Ollama by setting OLLAMA_BASE_URL (and optionally
// OLLAMA_MODEL, plus OLLAMA_API_KEY for proxied / auth-gated daemons); the
// request handler treats Ollama as a configured provider so a fork running
// purely on local models doesn't need any cloud API key.
//
// timeoutMs lives on the provider itself (not a parallel array) so a dynamic
// chain composed from env can carry per-provider deadlines without
// index-juggling. extracted into its own module so the chain composition can
// be unit-tested without mounting the whole route handler.

export interface LLMProvider {
	name: string;
	// env var that must be non-empty for this provider to be considered "configured"
	configKey: string;
	timeoutMs: number;
	buildRequest: (prompt: string, secret: string) => { url: string; init: RequestInit };
	extractText: (response: unknown) => string;
}

// shared extractor for all Google Generative Language API models. defensive
// against null / non-object payloads because optional chaining only saves us
// AFTER a non-null object base; a malformed response that decodes to null
// still throws on `.candidates` without this guard.
const googleExtractText = (data: unknown) => {
	if (!data || typeof data !== 'object') return '';
	const d = data as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
	return d.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
};

export function buildGoogleProvider(
	name: string,
	model: string,
	opts?: { jsonMode?: boolean }
): LLMProvider {
	return {
		name,
		configKey: 'GEMINI_API_KEY',
		// Gemma typically responds in 30-45s but can spike under load
		timeoutMs: 90_000,
		buildRequest: (prompt, apiKey) => ({
			url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
			init: {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }],
					generationConfig: {
						temperature: 0.3,
						topP: 0.85,
						maxOutputTokens: 16384,
						...(opts?.jsonMode && { responseMimeType: 'application/json' })
					}
				})
			}
		}),
		extractText: googleExtractText
	};
}

export function buildGroqProvider(name: string, model: string): LLMProvider {
	return {
		name,
		configKey: 'GROQ_API_KEY',
		// Groq is <1s typical but gets headroom for cold path
		timeoutMs: 30_000,
		buildRequest: (prompt, apiKey) => ({
			url: 'https://api.groq.com/openai/v1/chat/completions',
			init: {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model,
					messages: [{ role: 'user', content: prompt }],
					temperature: 0.3,
					top_p: 0.85,
					max_tokens: 16384,
					response_format: { type: 'json_object' }
				})
			}
		}),
		extractText: (data: unknown) => {
			if (!data || typeof data !== 'object') return '';
			const d = data as { choices?: { message?: { content?: string } }[] };
			return d.choices?.[0]?.message?.content ?? '';
		}
	};
}

// Ollama provider for self-hosters. local daemon by default needs no key;
// reverse-proxied or hosted Ollama-compatible endpoints (OpenWebUI, LiteLLM,
// Caddy + bearer auth, Cloudflare-tunnel + service token, etc.) take an
// optional bearer token via opts.apiKey, which is attached as
// `Authorization: Bearer {key}` on every request. format: 'json' asks the
// model to return strict JSON without ad-hoc prompt engineering. the secret
// param carries the base URL so all providers share the same factory
// signature; trailing slashes are stripped to make OLLAMA_BASE_URL= forgiving.
export function buildOllamaProvider(
	name: string,
	model: string,
	opts?: { apiKey?: string }
): LLMProvider {
	// trim and treat empty / whitespace-only as not set so a stray
	// OLLAMA_API_KEY= line in .env does not produce a bogus
	// `Authorization: Bearer ` header that the proxy would reject as malformed.
	const apiKey = opts?.apiKey?.trim() ?? '';
	return {
		name,
		configKey: 'OLLAMA_BASE_URL',
		// local models on commodity hardware can be slow on cold start. allow up
		// to 4 minutes for the first request; subsequent calls hit the model
		// cache and are much faster.
		timeoutMs: 240_000,
		buildRequest: (prompt, baseUrl) => ({
			url: `${baseUrl.replace(/\/+$/, '')}/api/chat`,
			init: {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(apiKey && { Authorization: `Bearer ${apiKey}` })
				},
				body: JSON.stringify({
					model,
					messages: [{ role: 'user', content: prompt }],
					stream: false,
					format: 'json',
					options: {
						temperature: 0.3,
						top_p: 0.85,
						// 16k context window matches the cloud providers' max_tokens.
						// Ollama silently truncates if the model doesn't support it.
						num_ctx: 16384
					}
				})
			}
		}),
		extractText: (data: unknown) => {
			if (!data || typeof data !== 'object') return '';
			const d = data as { message?: { content?: string } };
			return d.message?.content ?? '';
		}
	};
}

// composes the provider chain from whatever's configured in env. ordering is
// intentional: when Ollama is configured we put it first so a self-hoster who
// also has cloud keys still defaults to local. callers without any of the
// three configured will see an empty array and the route returns 503.
export function buildProviders(env: Record<string, string>): LLMProvider[] {
	const providers: LLMProvider[] = [];
	if (env.OLLAMA_BASE_URL) {
		const model = env.OLLAMA_MODEL || 'llama3.2';
		// OLLAMA_API_KEY is optional. when set we attach Authorization: Bearer
		// {key} so the request gets through a reverse-proxy or hosted endpoint
		// that gates the daemon (OpenWebUI, LiteLLM, Caddy bearer auth, etc.).
		// vanilla localhost ollama leaves this unset and behaves as before.
		const apiKey = env.OLLAMA_API_KEY || undefined;
		providers.push(buildOllamaProvider(`ollama-${model}`, model, { apiKey }));
	}
	if (env.GEMINI_API_KEY) {
		// primary cloud: Gemma 3 27B via Google - 14,400 RPD, 30 RPM, 15K TPM
		providers.push(buildGoogleProvider('gemma-3-27b', 'gemma-3-27b-it'));
	}
	if (env.GROQ_API_KEY) {
		// fallback cloud: Llama 3.3 70B via Groq - 100-600ms, native JSON mode, 1K RPD
		providers.push(buildGroqProvider('groq-llama-3.3-70b', 'llama-3.3-70b-versatile'));
	}
	return providers;
}
