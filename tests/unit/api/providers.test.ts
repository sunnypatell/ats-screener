import { describe, expect, it } from 'vitest';
import {
	buildProviders,
	buildOllamaProvider,
	buildGoogleProvider,
	buildGroqProvider,
	PROVIDER_ENV_KEYS
} from '../../../src/routes/api/analyze/providers';

describe('buildProviders: chain composition', () => {
	it('returns an empty array when no env vars are set', () => {
		expect(buildProviders({})).toEqual([]);
	});

	// groq sits between the google legs: cross-vendor, and it 429s fast once its tpm is spent
	it('hosted env (Gemini + Groq) composes [3.5 flash-lite, groq, 3.1 flash-lite]', () => {
		const chain = buildProviders({
			GEMINI_API_KEY: 'fake-gemini',
			GROQ_API_KEY: 'fake-groq'
		});
		expect(chain.map((p) => p.name)).toEqual([
			'gemini-3.5-flash-lite',
			'groq-gpt-oss-120b',
			'gemini-3.1-flash-lite'
		]);
	});

	// gemini free-tier quotas are per model, so two google legs are two separate pools
	it('gemini alone still yields two distinct google models', () => {
		const chain = buildProviders({ GEMINI_API_KEY: 'fake-gemini' });
		expect(chain.map((p) => p.name)).toEqual(['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite']);
	});

	it('never lists the same model twice', () => {
		const names = buildProviders({ GEMINI_API_KEY: 'k', GROQ_API_KEY: 'k' }).map((p) => p.name);
		expect(new Set(names).size).toBe(names.length);
	});

	it('self-hosted-only env (Ollama) composes [ollama] with default model llama3.2', () => {
		const chain = buildProviders({
			OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
		});
		expect(chain).toHaveLength(1);
		expect(chain[0].name).toBe('ollama-llama3.2');
		expect(chain[0].configKey).toBe('OLLAMA_BASE_URL');
	});

	it('honors OLLAMA_MODEL when set', () => {
		const chain = buildProviders({
			OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
			OLLAMA_MODEL: 'gemma3:1b'
		});
		expect(chain[0].name).toBe('ollama-gemma3:1b');
	});

	it('all-three env prepends ollama to the cloud chain', () => {
		const chain = buildProviders({
			OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
			OLLAMA_MODEL: 'llama3.2',
			GEMINI_API_KEY: 'fake-gemini',
			GROQ_API_KEY: 'fake-groq'
		});
		expect(chain.map((p) => p.name)).toEqual([
			'ollama-llama3.2',
			'gemini-3.5-flash-lite',
			'groq-gpt-oss-120b',
			'gemini-3.1-flash-lite'
		]);
	});

	it('empty-string env values are treated as "not configured"', () => {
		expect(
			buildProviders({
				OLLAMA_BASE_URL: '',
				GEMINI_API_KEY: '',
				GROQ_API_KEY: ''
			})
		).toEqual([]);
	});
});

describe('buildOllamaProvider: request shape', () => {
	const provider = buildOllamaProvider('test', 'llama3.2');

	it('builds a POST to {baseUrl}/api/chat', () => {
		const { url, init } = provider.buildRequest('hello', 'http://127.0.0.1:11434');
		expect(url).toBe('http://127.0.0.1:11434/api/chat');
		expect(init.method).toBe('POST');
	});

	it('strips trailing slashes from baseUrl so OLLAMA_BASE_URL= is forgiving', () => {
		const { url } = provider.buildRequest('hello', 'http://127.0.0.1:11434//');
		expect(url).toBe('http://127.0.0.1:11434/api/chat');
	});

	it('sends format:"json" so the model returns strict JSON', () => {
		const { init } = provider.buildRequest('hello', 'http://127.0.0.1:11434');
		const body = JSON.parse(init.body as string);
		expect(body.format).toBe('json');
		expect(body.stream).toBe(false);
	});

	it('passes the model + a single user message in the chat schema', () => {
		const { init } = provider.buildRequest('the prompt', 'http://127.0.0.1:11434');
		const body = JSON.parse(init.body as string);
		expect(body.model).toBe('llama3.2');
		expect(body.messages).toEqual([{ role: 'user', content: 'the prompt' }]);
	});

	it('matches cloud providers on temperature + top_p', () => {
		const { init } = provider.buildRequest('hello', 'http://127.0.0.1:11434');
		const body = JSON.parse(init.body as string);
		expect(body.options.temperature).toBe(0.3);
		expect(body.options.top_p).toBe(0.85);
	});

	it('extractText reads message.content from the chat response', () => {
		expect(provider.extractText({ message: { content: '{"ok":true}' } })).toBe('{"ok":true}');
	});

	it('extractText returns empty string on malformed payload', () => {
		expect(provider.extractText({})).toBe('');
		expect(provider.extractText(null)).toBe('');
	});

	it('uses a 4-minute timeout to absorb local cold-start latency', () => {
		expect(provider.timeoutMs).toBe(240_000);
	});
});

describe('cloud provider invariants (regression net)', () => {
	const cloudChain = () => buildProviders({ GEMINI_API_KEY: 'k', GROQ_API_KEY: 'k' });
	const bodyOf = (p: { buildRequest: (a: string, b: string) => { init: RequestInit } }) =>
		JSON.parse(p.buildRequest('p', 'k').init.body as string);

	// a provider must never be allowed to generate more than its timeout permits, or a
	// full-budget response is aborted mid-flight and burns the fallback with it.
	// slowest observed: 3.5 flash-lite 311 tok/s, 3.1 flash-lite 317, groq gpt-oss-120b 440
	// (floored to 400 here)
	it('token budgets are reachable within each provider timeout', () => {
		const floor: Record<string, number> = {
			'gemini-3.5-flash-lite': 311,
			'groq-gpt-oss-120b': 400,
			'gemini-3.1-flash-lite': 300
		};
		for (const p of cloudChain()) {
			const body = bodyOf(p);
			const budget = body.generationConfig?.maxOutputTokens ?? body.max_tokens;
			expect((budget / floor[p.name]) * 1000, p.name).toBeLessThan(p.timeoutMs);
		}
	});

	// the whole chain has to fit the route's maxDuration of 60s or the last leg is
	// unreachable. raising any timeout means raising maxDuration (and the 65s client) too
	it('every configured cloud leg fits inside the route maxDuration', () => {
		const total = cloudChain().reduce((sum, p) => sum + p.timeoutMs, 0);
		expect(total).toBeLessThan(60_000);
	});

	// gpt-oss spends max_tokens on reasoning first: at 3072 the json was cut off mid-array
	it('groq leg asks for low reasoning effort and enough room to finish the json', () => {
		const groq = cloudChain().find((p) => p.configKey === 'GROQ_API_KEY')!;
		const body = bodyOf(groq);
		expect(body.model).toBe('openai/gpt-oss-120b');
		expect(body.reasoning_effort).toBe('low');
		expect(body.max_tokens).toBeGreaterThanOrEqual(4096);
	});

	it('reasoning_effort is omitted unless a leg opts in', () => {
		expect(bodyOf(buildGroqProvider('x', 'm'))).not.toHaveProperty('reasoning_effort');
	});

	// without this the model returns prose and extractJSON has to salvage it
	it('every cloud leg requests JSON natively', () => {
		for (const p of cloudChain()) {
			const body = bodyOf(p);
			const mode = body.generationConfig?.responseMimeType ?? body.response_format?.type;
			expect(mode, p.name).toMatch(/^(application\/json|json_object)$/);
		}
	});

	it('cloud legs key on GEMINI_API_KEY / GROQ_API_KEY', () => {
		expect(buildGoogleProvider('x', 'm').configKey).toBe('GEMINI_API_KEY');
		expect(buildGroqProvider('x', 'm').configKey).toBe('GROQ_API_KEY');
	});

	it('api keys travel in headers, never the url', () => {
		for (const p of cloudChain()) {
			const { url, init } = p.buildRequest('p', 'secret-key');
			expect(url, p.name).not.toContain('secret-key');
			expect(Object.values(headersOf(init)).join(' '), p.name).toContain('secret-key');
		}
	});
});

// helper because headers init is HeadersInit (object literal in our case);
// indexing it requires narrowing to Record<string, string> first.
function headersOf(init: RequestInit): Record<string, string> {
	return init.headers as Record<string, string>;
}

describe('buildOllamaProvider: optional bearer auth for proxied endpoints', () => {
	it('omits Authorization header when no apiKey is given (vanilla local ollama)', () => {
		const provider = buildOllamaProvider('test', 'llama3.2');
		const { init } = provider.buildRequest('hello', 'http://127.0.0.1:11434');
		expect(headersOf(init).Authorization).toBeUndefined();
	});

	it('sets Authorization: Bearer {key} when apiKey is provided', () => {
		const provider = buildOllamaProvider('test', 'llama3.2', { apiKey: 'sk-secret-xyz' });
		const { init } = provider.buildRequest('hello', 'http://127.0.0.1:11434');
		expect(headersOf(init).Authorization).toBe('Bearer sk-secret-xyz');
	});

	it('treats empty-string apiKey as not set (no Authorization header)', () => {
		const provider = buildOllamaProvider('test', 'llama3.2', { apiKey: '' });
		const { init } = provider.buildRequest('hello', 'http://127.0.0.1:11434');
		expect(headersOf(init).Authorization).toBeUndefined();
	});

	it('treats whitespace-only apiKey as not set (no Authorization header)', () => {
		const provider = buildOllamaProvider('test', 'llama3.2', { apiKey: '   \n\t' });
		const { init } = provider.buildRequest('hello', 'http://127.0.0.1:11434');
		expect(headersOf(init).Authorization).toBeUndefined();
	});

	it('trims surrounding whitespace from apiKey before composing the header', () => {
		const provider = buildOllamaProvider('test', 'llama3.2', { apiKey: '  sk-secret-xyz\n' });
		const { init } = provider.buildRequest('hello', 'http://127.0.0.1:11434');
		expect(headersOf(init).Authorization).toBe('Bearer sk-secret-xyz');
	});

	it('preserves Content-Type: application/json alongside Authorization', () => {
		const provider = buildOllamaProvider('test', 'llama3.2', { apiKey: 'sk-secret' });
		const { init } = provider.buildRequest('hello', 'http://127.0.0.1:11434');
		const headers = headersOf(init);
		expect(headers['Content-Type']).toBe('application/json');
		expect(headers.Authorization).toBe('Bearer sk-secret');
	});

	it('does not mutate the request body or URL when apiKey is attached', () => {
		const noKey = buildOllamaProvider('test', 'llama3.2').buildRequest(
			'prompt',
			'http://127.0.0.1:11434'
		);
		const withKey = buildOllamaProvider('test', 'llama3.2', {
			apiKey: 'sk-secret'
		}).buildRequest('prompt', 'http://127.0.0.1:11434');
		expect(withKey.url).toBe(noKey.url);
		expect(withKey.init.body).toBe(noKey.init.body);
	});
});

describe('buildProviders: OLLAMA_API_KEY passthrough', () => {
	it('passes OLLAMA_API_KEY through to the ollama provider when set', () => {
		const chain = buildProviders({
			OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
			OLLAMA_API_KEY: 'sk-proxy-token'
		});
		expect(chain).toHaveLength(1);
		const { init } = chain[0].buildRequest('hello', 'http://127.0.0.1:11434');
		expect(headersOf(init).Authorization).toBe('Bearer sk-proxy-token');
	});

	it('does not attach Authorization when OLLAMA_API_KEY is unset', () => {
		const chain = buildProviders({
			OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
		});
		const { init } = chain[0].buildRequest('hello', 'http://127.0.0.1:11434');
		expect(headersOf(init).Authorization).toBeUndefined();
	});

	it('does not attach Authorization when OLLAMA_API_KEY is empty string', () => {
		const chain = buildProviders({
			OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
			OLLAMA_API_KEY: ''
		});
		const { init } = chain[0].buildRequest('hello', 'http://127.0.0.1:11434');
		expect(headersOf(init).Authorization).toBeUndefined();
	});

	it('OLLAMA_API_KEY alone (no OLLAMA_BASE_URL) does not produce an ollama provider', () => {
		const chain = buildProviders({
			OLLAMA_API_KEY: 'sk-stranded'
		});
		expect(chain).toEqual([]);
	});
});

describe('PROVIDER_ENV_KEYS covers every leg', () => {
	// deliberately hardcoded and NOT derived from PROVIDER_ENV_KEYS. deriving it makes
	// the assertion circular: dropping a name from the list would also drop it from the
	// env, the leg would never build, and the test would pass while the route broke
	const EVERY_PROVIDER_ENV: Record<string, string> = {
		GEMINI_API_KEY: 'k',
		GROQ_API_KEY: 'k',
		OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
		OLLAMA_MODEL: 'llama3.2',
		OLLAMA_API_KEY: 'k'
	};

	// the bug this exists to stop: the route copies env into a plain object before
	// calling buildProviders, so a configKey missing from that copy silently disables
	// a whole provider no matter how the deployment sets the variable
	it('contains the configKey of every provider the chain can produce', () => {
		const chain = buildProviders(EVERY_PROVIDER_ENV);
		expect(chain.length).toBeGreaterThan(0);
		for (const p of chain) {
			expect(PROVIDER_ENV_KEYS).toContain(p.configKey);
		}
	});

	// guards the hardcoded env above from going stale when a provider is added
	it('builds every leg from a fully populated env', () => {
		expect(buildProviders(EVERY_PROVIDER_ENV).map((p) => p.name)).toEqual([
			'ollama-llama3.2',
			'gemini-3.5-flash-lite',
			'groq-gpt-oss-120b',
			'gemini-3.1-flash-lite'
		]);
	});

	// read inside buildProviders but not a configKey any provider keys on, so they
	// would be silently dropped by the route without being listed
	it('lists the ollama tuning vars that no provider keys on', () => {
		expect(PROVIDER_ENV_KEYS).toContain('OLLAMA_MODEL');
		expect(PROVIDER_ENV_KEYS).toContain('OLLAMA_API_KEY');
	});
});
