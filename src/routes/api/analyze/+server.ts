import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { buildFullScoringPrompt, buildJDAnalysisPrompt } from '$engine/llm/prompts';
import { logger } from '$lib/log';
import { hashPrompt, getCached, setCached } from './cache';
import { checkRateLimit } from './rate-limiter';
import { buildProviders } from './providers';
import { resolveAuthMode } from '$lib/server/auth/config';

// tries each provider in sequence until one succeeds and returns valid JSON
async function callLLM(
	prompt: string,
	env: Record<string, string>
): Promise<{ parsed: Record<string, unknown>; provider: string } | null> {
	const providers = buildProviders(env);
	for (const provider of providers) {
		const secret = env[provider.configKey] ?? '';
		if (!secret) continue;

		try {
			const { url, init } = provider.buildRequest(prompt, secret);

			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), provider.timeoutMs);

			const response = await fetch(url, { ...init, signal: controller.signal });
			clearTimeout(timeout);

			if (!response.ok) {
				const errBody = await response.text().catch(() => '');
				logger.warn('llm.provider_http_error', {
					provider: provider.name,
					status: response.status,
					errorPreview: errBody.slice(0, 300)
				});
				continue;
			}

			const data = await response.json();
			const text = provider.extractText(data);

			if (!text) {
				logger.warn('llm.provider_empty_text', { provider: provider.name });
				continue;
			}

			// validate JSON before accepting this provider's response
			const parsed = extractJSON(text);
			if (!parsed || typeof parsed !== 'object') {
				logger.warn('llm.provider_unparseable_json', { provider: provider.name });
				continue;
			}

			return { parsed: parsed as Record<string, unknown>, provider: provider.name };
		} catch (err) {
			const isTimeout = err instanceof DOMException && err.name === 'AbortError';
			logger.warn(isTimeout ? 'llm.provider_timeout' : 'llm.provider_failed', {
				provider: provider.name,
				...(isTimeout
					? { timeoutMs: provider.timeoutMs }
					: { error: err instanceof Error ? err.message : String(err) })
			});
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

export const POST: RequestHandler = async ({ request, locals }) => {
	// in ldap self-host mode the scanner sits behind a login, so the analyze API
	// requires a valid session too (defense in depth). public and unchanged in
	// the hosted firebase deploy and anonymous self-host (resolveAuthMode is
	// 'ldap' only when LDAP_URL is set, which neither of those configures).
	if (resolveAuthMode(env) === 'ldap' && !locals.user) {
		return json({ error: 'authentication required' }, { status: 401 });
	}

	// collect provider config from SvelteKit $env. OLLAMA_BASE_URL is the
	// presence signal for the local-Ollama path; OLLAMA_MODEL is read inside
	// buildProviders() and defaults to llama3.2 when unset; OLLAMA_API_KEY is
	// optional and, when set, attaches Authorization: Bearer {key} for forks
	// running Ollama behind a reverse-proxy or hosted Ollama-compatible API.
	const keys: Record<string, string> = {
		GEMINI_API_KEY: env.GEMINI_API_KEY ?? '',
		GROQ_API_KEY: env.GROQ_API_KEY ?? '',
		OLLAMA_BASE_URL: env.OLLAMA_BASE_URL ?? '',
		OLLAMA_MODEL: env.OLLAMA_MODEL ?? '',
		OLLAMA_API_KEY: env.OLLAMA_API_KEY ?? ''
	};

	// at least one provider must be configured. cloud-hosted instances set
	// GEMINI/GROQ; self-hosted forks can opt into Ollama-only by setting
	// OLLAMA_BASE_URL with no cloud keys.
	const hasAnyProvider =
		keys.GEMINI_API_KEY.length > 0 ||
		keys.GROQ_API_KEY.length > 0 ||
		keys.OLLAMA_BASE_URL.length > 0;
	if (!hasAnyProvider) {
		return json({ error: 'no LLM providers configured', fallback: true }, { status: 503 });
	}

	// rate limiting per IP
	const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
	const limit = checkRateLimit(ip);
	if (!limit.allowed) {
		const reasonMsg =
			limit.reason === 'minute' ? 'too many requests this minute' : 'daily limit reached';
		return json(
			{
				error: `rate limit exceeded: ${reasonMsg}. retry after ${limit.retryAfterSec}s.`,
				retryAfter: limit.retryAfterSec
			},
			{
				status: 429,
				headers: { 'Retry-After': String(limit.retryAfterSec) }
			}
		);
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

	const securityHeaders = {
		'X-Content-Type-Options': 'nosniff',
		'X-Frame-Options': 'DENY',
		'Cache-Control': 'no-store'
	};

	// content-addressed cache: identical prompts return identical results, no LLM call
	const cacheKey = await hashPrompt(prompt);
	const cached = getCached(cacheKey);
	if (cached) {
		return json(
			{ ...cached.parsed, _provider: cached.provider, _fallback: false, _cached: true },
			{ headers: securityHeaders }
		);
	}

	const result = await callLLM(prompt, keys);

	if (!result) {
		return json({ error: 'all LLM providers failed', fallback: true }, { status: 503 });
	}

	setCached(cacheKey, result.parsed, result.provider);

	return json(
		{ ...result.parsed, _provider: result.provider, _fallback: false, _cached: false },
		{ headers: securityHeaders }
	);
};
