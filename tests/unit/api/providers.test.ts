import { describe, expect, it } from 'vitest';
import {
	buildProviders,
	buildOllamaProvider,
	buildGoogleProvider,
	buildGroqProvider,
	buildCerebrasProvider
} from '../../../src/routes/api/analyze/providers';

describe('buildProviders: chain composition', () => {
	it('returns an empty array when no env vars are set', () => {
		expect(buildProviders({})).toEqual([]);
	});

	// exactly one model per vendor. a second Gemini leg would share the same key's
	// quota, so it adds latency without adding redundancy
	it('hosted-only env (Gemini + Groq) composes [flash-lite, groq] in that order', () => {
		const chain = buildProviders({
			GEMINI_API_KEY: 'fake-gemini',
			GROQ_API_KEY: 'fake-groq'
		});
		expect(chain.map((p) => p.name)).toEqual(['gemini-3.5-flash-lite', 'groq-llama-3.3-70b']);
	});

	it('never puts two models from the same vendor in the chain', () => {
		const chain = buildProviders({
			GEMINI_API_KEY: 'fake-gemini',
			GROQ_API_KEY: 'fake-groq'
		});
		const perKey = chain.map((p) => p.configKey);
		expect(new Set(perKey).size).toBe(perKey.length);
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

	it('all-three env composes [ollama, flash-lite, groq] - Ollama prepends', () => {
		const chain = buildProviders({
			OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
			OLLAMA_MODEL: 'llama3.2',
			GEMINI_API_KEY: 'fake-gemini',
			GROQ_API_KEY: 'fake-groq'
		});
		expect(chain.map((p) => p.name)).toEqual([
			'ollama-llama3.2',
			'gemini-3.5-flash-lite',
			'groq-llama-3.3-70b'
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
	// timeouts must sum to less than the route's maxDuration or the last leg can
	// never run: 30 + 15 = 45s against maxDuration 60. raising either means raising that.
	it('google provider keeps its 30s timeout', () => {
		expect(buildGoogleProvider('x', 'm').timeoutMs).toBe(30_000);
	});

	it('groq provider keeps its 15s timeout', () => {
		expect(buildGroqProvider('x', 'm').timeoutMs).toBe(15_000);
	});

	// a provider must never be allowed to generate more than its timeout permits, or a
	// full-budget response is aborted mid-flight and burns the fallback with it.
	// throughputs are the slowest observed: Google 311 tok/s, Groq 290 tok/s.
	it('token budgets are reachable within each provider timeout', () => {
		const g = buildGoogleProvider('x', 'm');
		const gBody = JSON.parse(g.buildRequest('p', 'k').init.body as string);
		expect((gBody.generationConfig.maxOutputTokens / 311) * 1000).toBeLessThan(g.timeoutMs);

		const q = buildGroqProvider('x', 'm');
		const qBody = JSON.parse(q.buildRequest('p', 'k').init.body as string);
		expect((qBody.max_tokens / 290) * 1000).toBeLessThan(q.timeoutMs);
	});

	// the bug that took the whole chain down: Groq reserves (input + max_tokens)
	// against its per-minute ceiling, so a max_tokens above the TPM limit 413s every
	// request no matter how small the input. free-tier TPM is 12,000.
	it('groq max_tokens stays well under the free-tier TPM ceiling', () => {
		const body = JSON.parse(buildGroqProvider('x', 'm').buildRequest('p', 'k').init.body as string);
		expect(body.max_tokens).toBeLessThan(12_000);
	});

	// without this the model returns prose and extractJSON has to salvage it
	it('google provider requests JSON natively by default', () => {
		const body = JSON.parse(
			buildGoogleProvider('x', 'm').buildRequest('p', 'k').init.body as string
		);
		expect(body.generationConfig.responseMimeType).toBe('application/json');
	});

	it('google provider configKey is GEMINI_API_KEY', () => {
		expect(buildGoogleProvider('x', 'm').configKey).toBe('GEMINI_API_KEY');
	});

	it('groq provider configKey is GROQ_API_KEY', () => {
		expect(buildGroqProvider('x', 'm').configKey).toBe('GROQ_API_KEY');
	});

	it('cerebras provider configKey is CEREBRAS_API_KEY', () => {
		expect(buildCerebrasProvider('x', 'm').configKey).toBe('CEREBRAS_API_KEY');
	});

	// the whole chain has to fit the route's maxDuration of 60s or the last leg is
	// unreachable. 30 + 15 + 12 = 57. raising any of them means raising maxDuration too
	it('every configured leg fits inside the route maxDuration', () => {
		const total = buildProviders({
			GEMINI_API_KEY: 'k',
			GROQ_API_KEY: 'k',
			CEREBRAS_API_KEY: 'k'
		}).reduce((sum, p) => sum + p.timeoutMs, 0);
		expect(total).toBeLessThan(60_000);
	});

	// same reachability rule as the other cloud legs. cerebras sustains far more than
	// this, 500 tok/s is a deliberately pessimistic floor
	it('cerebras token budget is reachable within its timeout', () => {
		const c = buildCerebrasProvider('x', 'm');
		const body = JSON.parse(c.buildRequest('p', 'k').init.body as string);
		expect((body.max_tokens / 500) * 1000).toBeLessThan(c.timeoutMs);
	});

	it('cerebras requests JSON natively and sends the key as a bearer header', () => {
		const req = buildCerebrasProvider('x', 'm').buildRequest('p', 'secret-key');
		const body = JSON.parse(req.init.body as string);
		expect(body.response_format).toEqual({ type: 'json_object' });
		expect(headersOf(req.init).Authorization).toBe('Bearer secret-key');
		// the key must never reach the url, only the header
		expect(req.url).not.toContain('secret-key');
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

describe('buildProviders: cerebras leg', () => {
	// inert until the key is set, exactly like the ollama leg
	it('is absent when CEREBRAS_API_KEY is unset', () => {
		const chain = buildProviders({ GEMINI_API_KEY: 'k', GROQ_API_KEY: 'k' });
		expect(chain.map((p) => p.name)).toEqual(['gemini-3.5-flash-lite', 'groq-llama-3.3-70b']);
	});

	it('appends after groq so the current chain order is unchanged', () => {
		const chain = buildProviders({
			GEMINI_API_KEY: 'k',
			GROQ_API_KEY: 'k',
			CEREBRAS_API_KEY: 'k'
		});
		expect(chain.map((p) => p.name)).toEqual([
			'gemini-3.5-flash-lite',
			'groq-llama-3.3-70b',
			'cerebras-llama-3.3-70b'
		]);
	});

	// groq loses its only viable model on 2026-08-16, so cerebras alone must still
	// give a cross-vendor fallback next to google
	it('still pairs with google once groq is dropped', () => {
		const chain = buildProviders({ GEMINI_API_KEY: 'k', CEREBRAS_API_KEY: 'k' });
		expect(chain.map((p) => p.name)).toEqual(['gemini-3.5-flash-lite', 'cerebras-llama-3.3-70b']);
	});
});
