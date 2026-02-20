import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	buildJDAnalysisPrompt,
	buildSemanticMatchPrompt,
	buildSuggestionsPrompt
} from '$engine/llm/prompts';
import type { LLMRequestPayload } from '$engine/llm/types';

const GEMINI_API_URL =
	'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// simple in-memory rate limiter (per-IP, resets on function cold start)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_MINUTE = 10;
const MAX_REQUESTS_PER_DAY = 100;
const dailyLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
	const now = Date.now();

	// per-minute check
	const minute = rateLimits.get(ip);
	if (minute && now < minute.resetAt) {
		if (minute.count >= MAX_REQUESTS_PER_MINUTE) return false;
		minute.count++;
	} else {
		rateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
	}

	// per-day check
	const day = dailyLimits.get(ip);
	if (day && now < day.resetAt) {
		if (day.count >= MAX_REQUESTS_PER_DAY) return false;
		day.count++;
	} else {
		dailyLimits.set(ip, { count: 1, resetAt: now + 86_400_000 });
	}

	return true;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const apiKey = platform?.env?.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;

	if (!apiKey) {
		return json({ error: 'LLM service not configured' }, { status: 503 });
	}

	// rate limiting
	const ip =
		request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';

	if (!checkRateLimit(ip)) {
		return json({ error: 'rate limit exceeded' }, { status: 429 });
	}

	let payload: LLMRequestPayload;
	try {
		payload = await request.json();
	} catch {
		throw error(400, 'invalid JSON body');
	}

	if (!payload.jobDescription || !payload.resumeText) {
		throw error(400, 'resumeText and jobDescription are required');
	}

	// build the prompt based on mode
	let prompt: string;
	switch (payload.mode) {
		case 'analyze-jd':
			prompt = buildJDAnalysisPrompt(payload.jobDescription);
			break;
		case 'semantic-match':
			prompt = buildSemanticMatchPrompt(
				payload.resumeSkills,
				payload.jobDescription,
				payload.resumeText
			);
			break;
		case 'suggestions':
			prompt = buildSuggestionsPrompt(payload.resumeText, payload.jobDescription, 50);
			break;
		default:
			throw error(400, 'invalid mode');
	}

	try {
		const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }],
				generationConfig: {
					temperature: 0.2,
					topP: 0.8,
					maxOutputTokens: 2048
				}
			})
		});

		if (!response.ok) {
			const errText = await response.text();
			console.error('Gemini API error:', response.status, errText);

			if (response.status === 429) {
				return json({ error: 'API quota exceeded' }, { status: 429 });
			}
			return json({ error: 'LLM service error' }, { status: 502 });
		}

		const result = await response.json();
		const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

		if (!text) {
			return json({ error: 'empty response from LLM' }, { status: 502 });
		}

		// parse JSON from response (strip any markdown fences if present)
		const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
		const parsed = JSON.parse(cleaned);

		return json(parsed);
	} catch (err) {
		console.error('LLM request failed:', err);
		return json({ error: 'failed to process LLM response' }, { status: 500 });
	}
};
