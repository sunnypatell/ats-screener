import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { buildFullScoringPrompt, buildJDAnalysisPrompt } from '$engine/llm/prompts';

// provider configuration: Gemma 3 27B (Google) → Llama 3.3 70B (Groq)
// cross-provider fallback ensures independent quotas so one provider's limits don't cascade
interface LLMProvider {
	name: string;
	apiKeyName: string;
	buildRequest: (prompt: string, apiKey: string) => { url: string; init: RequestInit };
	extractText: (response: unknown) => string;
}

// shared extractor for all Google Generative Language API models
const googleExtractText = (data: unknown) => {
	const d = data as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
	return d.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
};

function buildGoogleProvider(
	name: string,
	model: string,
	opts?: { jsonMode?: boolean }
): LLMProvider {
	return {
		name,
		apiKeyName: 'GEMINI_API_KEY',
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

function buildGroqProvider(name: string, model: string): LLMProvider {
	return {
		name,
		apiKeyName: 'GROQ_API_KEY',
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
			const d = data as { choices?: { message?: { content?: string } }[] };
			return d.choices?.[0]?.message?.content ?? '';
		}
	};
}

const PROVIDERS: LLMProvider[] = [
	// primary: Gemma 3 27B via Google - 14,400 RPD, 30 RPM, 15K TPM
	buildGoogleProvider('gemma-3-27b', 'gemma-3-27b-it'),
	// fallback: Llama 3.3 70B via Groq - 100-600ms, native JSON mode, 14,400 RPD
	buildGroqProvider('groq-llama-3.3-70b', 'llama-3.3-70b-versatile')
];

// simple in-memory rate limiter per IP
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const dailyLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_RPM = 10;
const MAX_RPD = 200;
const MAX_MAP_SIZE = 10_000;
// per-provider timeouts: Gemma (90s) + Groq (30s) = 120s worst case
// Gemma typically responds in 30-45s but can spike under load; Groq is <1s but gets headroom
// Fluid Compute on Vercel Hobby gives 300s max, so 120s worst case fits comfortably
const PROVIDER_TIMEOUTS_MS = [90_000, 30_000];

function checkRateLimit(ip: string): boolean {
	const now = Date.now();

	// periodically clean up expired entries to prevent unbounded memory growth
	if (rateLimits.size > MAX_MAP_SIZE) {
		for (const [key, val] of rateLimits) {
			if (now > val.resetAt) rateLimits.delete(key);
		}
	}
	if (dailyLimits.size > MAX_MAP_SIZE) {
		for (const [key, val] of dailyLimits) {
			if (now > val.resetAt) dailyLimits.delete(key);
		}
	}

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

// tries each provider in sequence until one succeeds and returns valid JSON
async function callLLM(
	prompt: string,
	env: Record<string, string>
): Promise<{ parsed: Record<string, unknown>; provider: string } | null> {
	for (let i = 0; i < PROVIDERS.length; i++) {
		const provider = PROVIDERS[i];
		const timeoutMs = PROVIDER_TIMEOUTS_MS[i] ?? 10_000;
		const apiKey = env[provider.apiKeyName] ?? '';
		if (!apiKey) continue;

		try {
			const { url, init } = provider.buildRequest(prompt, apiKey);

			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), timeoutMs);

			const response = await fetch(url, { ...init, signal: controller.signal });
			clearTimeout(timeout);

			if (!response.ok) {
				const errBody = await response.text().catch(() => '');
				console.warn(`${provider.name} returned ${response.status}: ${errBody.slice(0, 300)}`);
				continue;
			}

			const data = await response.json();
			const text = provider.extractText(data);

			if (!text) {
				console.warn(`${provider.name} returned empty text, trying next provider`);
				continue;
			}

			// validate JSON before accepting this provider's response
			const parsed = extractJSON(text);
			if (!parsed || typeof parsed !== 'object') {
				console.warn(`${provider.name} returned unparseable JSON, trying next provider`);
				continue;
			}

			return { parsed: parsed as Record<string, unknown>, provider: provider.name };
		} catch (err) {
			const isTimeout = err instanceof DOMException && err.name === 'AbortError';
			console.warn(
				`${provider.name} ${isTimeout ? 'timed out' : 'failed'}:`,
				isTimeout ? `exceeded ${timeoutMs}ms` : err
			);
			continue;
		}
	}

	return null;
}

// tries to extract JSON from potentially messy LLM output
function extractJSON(raw: string): unknown {
	// try direct parse first
	const trimmed = raw.trim();
	try {
		return JSON.parse(trimmed);
	} catch {
		// ignore, try cleaning
	}

	// strip markdown fences
	const cleaned = trimmed.replace(/```json\n?|\n?```/g, '').trim();
	try {
		return JSON.parse(cleaned);
	} catch {
		// ignore, try finding JSON object
	}

	// try to find the first { ... } block
	const start = cleaned.indexOf('{');
	const end = cleaned.lastIndexOf('}');
	if (start !== -1 && end > start) {
		try {
			return JSON.parse(cleaned.slice(start, end + 1));
		} catch {
			// give up
		}
	}

	return null;
}

// vercel hobby plan defaults to 10s function timeout
// gemini can take 12-15s so we need to extend this
export const config = {
	maxDuration: 60
};

interface RequestBody {
	mode: 'full-score' | 'analyze-jd';
	resumeText?: string;
	jobDescription?: string;
}

export const POST: RequestHandler = async ({ request }) => {
	// collect all API keys from SvelteKit $env
	const keys: Record<string, string> = {
		GEMINI_API_KEY: env.GEMINI_API_KEY ?? '',
		GROQ_API_KEY: env.GROQ_API_KEY ?? ''
	};

	const hasAnyKey = Object.values(keys).some((v) => v.length > 0);
	if (!hasAnyKey) {
		return json({ error: 'no LLM providers configured', fallback: true }, { status: 503 });
	}

	// rate limiting per IP
	const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
	if (!checkRateLimit(ip)) {
		return json({ error: 'rate limit exceeded. try again in 60 seconds.' }, { status: 429 });
	}

	// validate Content-Type
	const contentType = request.headers.get('content-type') ?? '';
	if (!contentType.includes('application/json')) {
		throw error(400, 'Content-Type must be application/json');
	}

	let body: RequestBody;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'invalid JSON body');
	}

	// validate resume text isn't empty/whitespace and enforce length cap
	if (body.resumeText !== undefined) {
		if (body.resumeText.trim().length === 0) {
			throw error(400, 'resumeText cannot be empty');
		}
		if (body.resumeText.length > 50_000) {
			throw error(400, 'resumeText exceeds maximum length of 50,000 characters');
		}
	}

	// enforce length cap on job description
	if (body.jobDescription !== undefined && body.jobDescription.length > 20_000) {
		throw error(400, 'jobDescription exceeds maximum length of 20,000 characters');
	}

	// validate mode is a known value (prevent prompt injection via mode)
	if (body.mode && !['full-score', 'analyze-jd'].includes(body.mode)) {
		throw error(400, 'invalid mode');
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

	const result = await callLLM(prompt, keys);

	if (!result) {
		return json({ error: 'all LLM providers failed', fallback: true }, { status: 503 });
	}

	return json(
		{
			...result.parsed,
			_provider: result.provider,
			_fallback: false
		},
		{
			headers: {
				'X-Content-Type-Options': 'nosniff',
				'X-Frame-Options': 'DENY',
				'Cache-Control': 'no-store'
			}
		}
	);
};
