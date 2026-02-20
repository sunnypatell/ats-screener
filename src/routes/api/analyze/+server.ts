import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildFullScoringPrompt, buildJDAnalysisPrompt } from '$engine/llm/prompts';

// provider configuration: Gemini → Groq → Cerebras fallback chain
interface LLMProvider {
	name: string;
	buildRequest: (prompt: string, apiKey: string) => { url: string; init: RequestInit };
	extractText: (response: unknown) => string;
}

const PROVIDERS: LLMProvider[] = [
	{
		name: 'gemini',
		buildRequest: (prompt, apiKey) => ({
			url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
			init: {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }],
					generationConfig: {
						temperature: 0.3,
						topP: 0.85,
						maxOutputTokens: 4096,
						responseMimeType: 'application/json'
					}
				})
			}
		}),
		extractText: (data: unknown) => {
			const d = data as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
			return d.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
		}
	},
	{
		name: 'groq',
		buildRequest: (prompt, apiKey) => ({
			url: 'https://api.groq.com/openai/v1/chat/completions',
			init: {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model: 'llama-3.3-70b-versatile',
					messages: [{ role: 'user', content: prompt }],
					temperature: 0.3,
					max_tokens: 4096,
					response_format: { type: 'json_object' }
				})
			}
		}),
		extractText: (data: unknown) => {
			const d = data as { choices?: { message?: { content?: string } }[] };
			return d.choices?.[0]?.message?.content ?? '';
		}
	},
	{
		name: 'cerebras',
		buildRequest: (prompt, apiKey) => ({
			url: 'https://api.cerebras.ai/v1/chat/completions',
			init: {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model: 'llama-3.3-70b',
					messages: [{ role: 'user', content: prompt }],
					temperature: 0.3,
					max_tokens: 4096,
					response_format: { type: 'json_object' }
				})
			}
		}),
		extractText: (data: unknown) => {
			const d = data as { choices?: { message?: { content?: string } }[] };
			return d.choices?.[0]?.message?.content ?? '';
		}
	}
];

// simple in-memory rate limiter per IP
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const dailyLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_RPM = 10;
const MAX_RPD = 200;

function checkRateLimit(ip: string): boolean {
	const now = Date.now();

	const minute = rateLimits.get(ip);
	if (minute && now < minute.resetAt) {
		if (minute.count >= MAX_RPM) return false;
		minute.count++;
	} else {
		rateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
	}

	const day = dailyLimits.get(ip);
	if (day && now < day.resetAt) {
		if (day.count >= MAX_RPD) return false;
		day.count++;
	} else {
		dailyLimits.set(ip, { count: 1, resetAt: now + 86_400_000 });
	}

	return true;
}

// tries each provider in sequence until one succeeds
async function callLLM(
	prompt: string,
	env: Record<string, string>
): Promise<{ text: string; provider: string } | null> {
	const keyMap: Record<string, string> = {
		gemini: env.GEMINI_API_KEY ?? '',
		groq: env.GROQ_API_KEY ?? '',
		cerebras: env.CEREBRAS_API_KEY ?? ''
	};

	for (const provider of PROVIDERS) {
		const apiKey = keyMap[provider.name];
		if (!apiKey) continue;

		try {
			const { url, init } = provider.buildRequest(prompt, apiKey);
			const response = await fetch(url, init);

			if (!response.ok) {
				console.warn(`${provider.name} returned ${response.status}, trying next provider`);
				continue;
			}

			const data = await response.json();
			const text = provider.extractText(data);

			if (!text) {
				console.warn(`${provider.name} returned empty text, trying next provider`);
				continue;
			}

			return { text, provider: provider.name };
		} catch (err) {
			console.warn(`${provider.name} failed:`, err);
			continue;
		}
	}

	return null;
}

interface RequestBody {
	mode: 'full-score' | 'analyze-jd';
	resumeText?: string;
	jobDescription?: string;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	// collect all API keys from platform env or process env
	const platformEnv = (platform?.env ?? {}) as Record<string, string>;
	const env: Record<string, string> = {
		GEMINI_API_KEY: platformEnv.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY ?? '',
		GROQ_API_KEY: platformEnv.GROQ_API_KEY ?? process.env.GROQ_API_KEY ?? '',
		CEREBRAS_API_KEY: platformEnv.CEREBRAS_API_KEY ?? process.env.CEREBRAS_API_KEY ?? ''
	};

	const hasAnyKey = Object.values(env).some((v) => v.length > 0);
	if (!hasAnyKey) {
		return json({ error: 'no LLM providers configured', fallback: true }, { status: 503 });
	}

	// rate limiting
	const ip =
		request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';

	if (!checkRateLimit(ip)) {
		return json({ error: 'rate limit exceeded' }, { status: 429 });
	}

	let body: RequestBody;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'invalid JSON body');
	}

	// build the prompt based on mode
	let prompt: string;

	switch (body.mode) {
		case 'full-score':
			if (!body.resumeText) throw error(400, 'resumeText is required');
			prompt = buildFullScoringPrompt(body.resumeText, body.jobDescription);
			break;
		case 'analyze-jd':
			if (!body.jobDescription) throw error(400, 'jobDescription is required');
			prompt = buildJDAnalysisPrompt(body.jobDescription);
			break;
		default:
			throw error(400, 'invalid mode');
	}

	const result = await callLLM(prompt, env);

	if (!result) {
		return json({ error: 'all LLM providers failed', fallback: true }, { status: 503 });
	}

	try {
		const cleaned = result.text.replace(/```json\n?|\n?```/g, '').trim();
		const parsed = JSON.parse(cleaned);

		return json({
			...parsed,
			_provider: result.provider,
			_fallback: false
		});
	} catch (err) {
		console.error(`failed to parse ${result.provider} response:`, err);
		return json({ error: 'failed to parse LLM response', fallback: true }, { status: 502 });
	}
};
