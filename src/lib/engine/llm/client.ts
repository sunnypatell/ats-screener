import type { LLMAnalysis, LLMRequestPayload, LLMResponse } from './types';
import { generateFallbackAnalysis } from './fallback';

/**
 * client-side LLM caller.
 * sends requests to our SvelteKit server endpoint which proxies to Gemini.
 * falls back to rule-based analysis if the server is unavailable or quota exhausted.
 */
export async function analyzWithLLM(payload: LLMRequestPayload): Promise<LLMResponse> {
	try {
		const response = await fetch('/api/analyze', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			if (response.status === 429) {
				// rate limited or quota exhausted, fall back
				return {
					success: true,
					data: generateFallbackAnalysis(payload),
					error: null,
					fallback: true
				};
			}
			throw new Error(`API error: ${response.status}`);
		}

		const data: LLMAnalysis = await response.json();
		return { success: true, data, error: null, fallback: false };
	} catch (error) {
		// any failure falls back to rule-based
		return {
			success: true,
			data: generateFallbackAnalysis(payload),
			error: error instanceof Error ? error.message : 'unknown error',
			fallback: true
		};
	}
}
