// LLM provider abstraction for /api/analyze.
//
// cloud chain is Gemini 3.5 Flash Lite (Google) -> Llama 3.3 70B (Groq): one model
// per vendor, because a second model on the same key shares that key's quota and adds
// no real redundancy. crossing vendors is what keeps one provider's limits from
// cascading. both models were measured against the real full-scoring prompt rather
// than picked from published limits - see buildProviders.
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

// measured against the real full-scoring prompt (both slices at their caps):
// ~5,950 tokens in, 2,950-3,419 out over repeated runs at 311-338 tok/s. output size
// tracks the fixed 6-platform schema, not the user's resume length - a minimal resume
// produced within 5% of a maxed-out one - so both directions are already bounded.
//
// INVARIANT: maxOutputTokens / slowest-observed-throughput must stay under timeoutMs,
// or a response that legitimately runs to its full budget gets aborted mid-flight and
// burns the fallback too. 6144 / 311 tok/s = 19.8s against a 30s timeout.
// 6144 is ~1.8x the largest output ever observed, so truncation risk stays remote.
const GOOGLE_MAX_OUTPUT_TOKENS = 6144;

export function buildGoogleProvider(
	name: string,
	model: string,
	opts?: { jsonMode?: boolean; timeoutMs?: number; maxOutputTokens?: number }
): LLMProvider {
	return {
		name,
		configKey: 'GEMINI_API_KEY',
		// flash-lite answers the full prompt in 9-11s measured. 30s covers the worst
		// case where the model runs to the full token budget (19.8s) with margin,
		// while keeping the whole chain inside the route's maxDuration
		timeoutMs: opts?.timeoutMs ?? 30_000,
		buildRequest: (prompt, apiKey) => ({
			url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
			init: {
				method: 'POST',
				// key goes in the header, not ?key=, so it never lands in request logs
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

// Groq reserves (input + max_tokens) against its per-minute ceiling BEFORE running
// the model, so an oversized max_tokens alone can exceed the whole TPM budget and
// every request 413s regardless of input size. free-tier llama TPM is 12,000 and the
// real prompt measures ~5,950 in / ~2,020 out at ~290 tok/s.
//
// 3072 serves two masters: it keeps 5,950 + 3,072 = 9,022 under the 12k TPM ceiling
// (leaving room for a second request in the same minute), and 3072 / 290 tok/s = 10.6s
// stays under the 15s timeout so a full-budget response is never cut off.
const GROQ_MAX_TOKENS = 3072;

export function buildGroqProvider(
	name: string,
	model: string,
	opts?: { maxTokens?: number }
): LLMProvider {
	return {
		name,
		configKey: 'GROQ_API_KEY',
		// Groq is <1s typical but gets headroom for cold path
		timeoutMs: 15_000,
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
		// exactly one Google model. a second Gemini leg on the same key does NOT buy a
		// second quota pool - when the key is exhausted it is exhausted for every model
		// on it - so stacking them just burns latency before the real fallback.
		// 500 RPD / 250K TPM / 15 RPM against ~130 scans/day of observed demand.
		// the full Flash tiers are unusable no matter how good they are: 20 RPD.
		// Gemma 4 31B looks tempting on paper (14,400 RPD) but measured ~110s per call,
		// returned markdown-fenced output instead of JSON, and its free tier trains on
		// submitted data - disqualifying for resume text. deliberately excluded.
		providers.push(buildGoogleProvider('gemini-3.5-flash-lite', 'gemini-3.5-flash-lite'));
	}
	if (env.GROQ_API_KEY) {
		// cross-vendor last resort so a total Google outage still scores.
		// EXPIRES 2026-08-16: llama-3.3-70b-versatile shuts down then, and no remaining
		// Groq free-tier model fits this prompt (8K TPM ceiling vs ~9.3K needed), so
		// this leg has to be dropped or the prompt shrunk before that date.
		providers.push(buildGroqProvider('groq-llama-3.3-70b', 'llama-3.3-70b-versatile'));
	}
	return providers;
}
