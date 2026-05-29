import { describe, expect, it } from 'vitest';
import {
	buildProviders,
	buildOllamaProvider,
	buildGoogleProvider,
	buildGroqProvider
} from '../../../src/routes/api/analyze/providers';

describe('buildProviders: chain composition', () => {
	it('returns an empty array when no env vars are set', () => {
		expect(buildProviders({})).toEqual([]);
	});

	it('hosted-only env (Gemini + Groq) composes [gemma, groq] in that order', () => {
		const chain = buildProviders({
			GEMINI_API_KEY: 'fake-gemini',
			GROQ_API_KEY: 'fake-groq'
		});
		expect(chain.map((p) => p.name)).toEqual(['gemma-3-27b', 'groq-llama-3.3-70b']);
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

	it('all-three env composes [ollama, gemma, groq] - Ollama prepends', () => {
		const chain = buildProviders({
			OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
			OLLAMA_MODEL: 'llama3.2',
			GEMINI_API_KEY: 'fake-gemini',
			GROQ_API_KEY: 'fake-groq'
		});
		expect(chain.map((p) => p.name)).toEqual([
			'ollama-llama3.2',
			'gemma-3-27b',
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
	it('google provider keeps its 90s timeout', () => {
		expect(buildGoogleProvider('x', 'm').timeoutMs).toBe(90_000);
	});

	it('groq provider keeps its 30s timeout', () => {
		expect(buildGroqProvider('x', 'm').timeoutMs).toBe(30_000);
	});

	it('google provider configKey is GEMINI_API_KEY', () => {
		expect(buildGoogleProvider('x', 'm').configKey).toBe('GEMINI_API_KEY');
	});

	it('groq provider configKey is GROQ_API_KEY', () => {
		expect(buildGroqProvider('x', 'm').configKey).toBe('GROQ_API_KEY');
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
