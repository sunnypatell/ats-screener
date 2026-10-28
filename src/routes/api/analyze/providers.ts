// LLM provider abstraction for /api/analyze, in its own module so chain composition is
// unit-testable without mounting the route.
//
// cloud chain: gemini-3.5-flash-lite -> groq gpt-oss-120b -> gemini-3.1-flash-lite.
// gemini free-tier quotas are per project per model, so the second google leg draws on a
// separate pool. groq sits in the middle because it is cross-vendor and, when its 8k tpm
// can't admit the request, it 429s or 413s in under 100ms instead of burning the last leg's budget.
// self-hosters can prepend Ollama by setting OLLAMA_BASE_URL (and optionally
// OLLAMA_MODEL, plus OLLAMA_API_KEY for proxied / auth-gated daemons); the
// request handler treats Ollama as a configured provider so a fork running
// purely on local models doesn't need any cloud API key.

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

const openAIExtractText = (data: unknown) => {
	if (!data || typeof data !== 'object') return '';
	const d = data as { choices?: { message?: { content?: string } }[] };
	return d.choices?.[0]?.message?.content ?? '';
};

// measured against the real full-scoring prompt (both slices at their caps): ~6,070 tokens
// in, 2,350-3,700 out. output size tracks the fixed 6-platform schema, not resume length.
//
// INVARIANT: maxOutputTokens / slowest-observed-throughput must stay under timeoutMs,
// or a response that legitimately runs to its full budget gets aborted mid-flight and
// burns the fallback too. 6144 / 311 tok/s = 19.8s against a 25s timeout.
const GOOGLE_MAX_OUTPUT_TOKENS = 6144;

export function buildGoogleProvider(
	name: string,
	model: string,
	opts?: { jsonMode?: boolean; timeoutMs?: number; maxOutputTokens?: number }
): LLMProvider {
	return {
		name,
		configKey: 'GEMINI_API_KEY',
		// flash-lite answers the full prompt in 7-11s measured; 25s covers a full-budget response
		timeoutMs: opts?.timeoutMs ?? 25_000,
		buildRequest: (prompt, apiKey) => ({
			url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
			init: {
				method: 'POST',
				// key goes in the header, not ?key=, so it stays out of urls and request lines
				headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }],
					generationConfig: {
						temperature: 0.3,
						topP: 0.85,
						maxOutputTokens: opts?.maxOutputTokens ?? GOOGLE_MAX_OUTPUT_TOKENS,
						// default on: the scoring contract is JSON, and without this the
						// model returns prose that extractJSON has to salvage
						...(opts?.jsonMode !== false && { responseMimeType: 'application/json' })
					}
				})
			}
		}),
		extractText: googleExtractText
	};
}

// gpt-oss reasons before it answers and those tokens count against max_tokens: at 3072 the
// answer was cut off after 2 of 6 platforms, at 4096 with low effort it finished at ~2,800.
// 4096 / 400 tok/s = 10.2s against the 12s timeout.
const GROQ_MAX_TOKENS = 4096;

export function buildGroqProvider(
	name: string,
	model: string,
	opts?: { maxTokens?: number; reasoningEffort?: 'low' | 'medium' | 'high' }
): LLMProvider {
	return {
		name,
		configKey: 'GROQ_API_KEY',
		timeoutMs: 12_000,
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
					max_tokens: opts?.maxTokens ?? GROQ_MAX_TOKENS,
					// only reasoning models accept this, so it is opt-in per leg
					...(opts?.reasoningEffort && { reasoning_effort: opts.reasoningEffort }),
					response_format: { type: 'json_object' }
				})
			}
		}),
		extractText: openAIExtractText
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

// every env var buildProviders reads. the route copies exactly these out of $env, so a
// name missing here silently disables a whole leg no matter how the var is configured
export const PROVIDER_ENV_KEYS = [
	'GEMINI_API_KEY',
	'GROQ_API_KEY',
	'OLLAMA_BASE_URL',
	'OLLAMA_MODEL',
	'OLLAMA_API_KEY'
] as const;

// Ollama goes first when configured, so a self-hoster who also has cloud keys stays local
export function buildProviders(env: Record<string, string>): LLMProvider[] {
	const providers: LLMProvider[] = [];
	if (env.OLLAMA_BASE_URL) {
		const model = env.OLLAMA_MODEL || 'llama3.2';
		const apiKey = env.OLLAMA_API_KEY || undefined;
		providers.push(buildOllamaProvider(`ollama-${model}`, model, { apiKey }));
	}
	if (env.GEMINI_API_KEY) {
		// gemma 4 31B is excluded: ~110s per call and markdown-fenced output instead of json
		providers.push(buildGoogleProvider('gemini-3.5-flash-lite', 'gemini-3.5-flash-lite'));
	}
	if (env.GROQ_API_KEY) {
		// the only groq free-tier model that fits: qwen3.8-27b caps output at 1k tokens/min,
		// gpt-oss-20b fails json_object validation on this prompt
		providers.push(
			buildGroqProvider('groq-gpt-oss-120b', 'openai/gpt-oss-120b', { reasoningEffort: 'low' })
		);
	}
	if (env.GEMINI_API_KEY) {
		// 2,350 out measured at 317 tok/s; 5120 keeps a full budget inside the shorter timeout
		providers.push(
			buildGoogleProvider('gemini-3.1-flash-lite', 'gemini-3.1-flash-lite', {
				timeoutMs: 20_000,
				maxOutputTokens: 5120
			})
		);
	}
	return providers;
}
