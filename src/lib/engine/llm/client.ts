import type { ScoreResult, Suggestion, StructuredSuggestion } from '$engine/scorer/types';
import type { LLMAnalysis, LLMRequestPayload, LLMResponse } from './types';
import { generateFallbackAnalysis } from './fallback';
import { logger } from '$lib/log';

const CLIENT_TIMEOUT_MS = 65_000;

// discriminated result so callers can distinguish "fall back to rule-based"
// from "user cancelled, do nothing" - the two need different downstream handling
// rate_limited is treated like error for fallback purposes, but carries a retry
// hint so the UI can tell users when the AI path will be available again
export type ScoreLLMResult =
	| { status: 'ok'; results: ScoreResult[]; provider: string; fallback: boolean }
	| { status: 'error' }
	| { status: 'rate_limited'; retryAfterSec: number }
	| { status: 'cancelled' };

// performs full LLM-powered ATS scoring via the server endpoint
// caller can pass an AbortSignal to cancel an in-flight request (e.g. on rescan/reset)
export async function scoreLLM(
	resumeText: string,
	jobDescription?: string,
	options?: { signal?: AbortSignal }
): Promise<ScoreLLMResult> {
	const external = options?.signal;
	if (external?.aborted) return { status: 'cancelled' };

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
	const onExternalAbort = () => controller.abort();
	external?.addEventListener('abort', onExternalAbort, { once: true });

	try {
		const response = await fetch('/api/analyze', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				mode: 'full-score',
				resumeText,
				jobDescription
			}),
			signal: controller.signal
		});

		if (!response.ok) {
			const data = await response.json().catch(() => ({}));
			logger.warn('llm.api_error', {
				status: response.status,
				error: data.error ?? 'unknown error'
			});
			if (response.status === 429) {
				const headerVal = response.headers.get('Retry-After');
				const retryAfterSec =
					typeof data.retryAfter === 'number' && data.retryAfter > 0
						? data.retryAfter
						: headerVal && Number.isFinite(Number(headerVal))
							? Math.max(1, Number(headerVal))
							: 60;
				return { status: 'rate_limited', retryAfterSec };
			}
			return { status: 'error' };
		}

		const data = await response.json();

		if (data._fallback || !data.results || !Array.isArray(data.results)) {
			logger.warn('llm.fallback_to_rule_based', {
				reason: 'response missing results or fallback flag'
			});
			return { status: 'error' };
		}

		// validate and normalize the LLM response to match ScoreResult[]
		const results: ScoreResult[] = data.results.map((r: Record<string, unknown>) =>
			normalizeScoreResult(r)
		);

		return {
			status: 'ok',
			results,
			provider: (data._provider as string) ?? 'unknown',
			fallback: false
		};
	} catch (err) {
		if (err instanceof DOMException && err.name === 'AbortError') {
			if (external?.aborted) return { status: 'cancelled' };
			logger.warn('llm.client_timeout', { timeoutMs: CLIENT_TIMEOUT_MS });
		}
		return { status: 'error' };
	} finally {
		clearTimeout(timeout);
		external?.removeEventListener('abort', onExternalAbort);
	}
}

// normalizes LLM output to our exact ScoreResult type with safe defaults
function normalizeScoreResult(raw: Record<string, unknown>): ScoreResult {
	const breakdown = (raw.breakdown ?? {}) as Record<string, unknown>;
	const formatting = (breakdown.formatting ?? {}) as Record<string, unknown>;
	const keywordMatch = (breakdown.keywordMatch ?? {}) as Record<string, unknown>;
	const sections = (breakdown.sections ?? {}) as Record<string, unknown>;
	const experience = (breakdown.experience ?? {}) as Record<string, unknown>;
	const education = (breakdown.education ?? {}) as Record<string, unknown>;

	return {
		system: String(raw.system ?? 'Unknown'),
		vendor: String(raw.vendor ?? 'Unknown'),
		overallScore: clamp(Number(raw.overallScore) || 0, 0, 100),
		passesFilter: Boolean(raw.passesFilter),
		breakdown: {
			formatting: {
				score: clamp(Number(formatting.score) || 0, 0, 100),
				issues: toStringArray(formatting.issues),
				details: toStringArray(formatting.details)
			},
			keywordMatch: {
				score: clamp(Number(keywordMatch.score) || 0, 0, 100),
				matched: toStringArray(keywordMatch.matched),
				missing: toStringArray(keywordMatch.missing),
				synonymMatched: toStringArray(keywordMatch.synonymMatched)
			},
			sections: {
				score: clamp(Number(sections.score) || 0, 0, 100),
				present: toStringArray(sections.present),
				missing: toStringArray(sections.missing)
			},
			experience: {
				score: clamp(Number(experience.score) || 0, 0, 100),
				quantifiedBullets: Number(experience.quantifiedBullets) || 0,
				totalBullets: Number(experience.totalBullets) || 0,
				actionVerbCount: Number(experience.actionVerbCount) || 0,
				highlights: toStringArray(experience.highlights)
			},
			education: {
				score: clamp(Number(education.score) || 0, 0, 100),
				notes: toStringArray(education.notes)
			}
		},
		suggestions: toSuggestionArray(raw.suggestions)
	};
}

function clamp(n: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, Math.round(n)));
}

function toStringArray(val: unknown): string[] {
	if (!Array.isArray(val)) return [];
	return val.filter((v) => typeof v === 'string');
}

function toSuggestionArray(val: unknown): Suggestion[] {
	if (!Array.isArray(val)) return [];
	return val
		.map((item) => {
			if (typeof item === 'string') return item;
			if (item && typeof item === 'object' && 'summary' in item) {
				return normalizeStructuredSuggestion(item as Record<string, unknown>);
			}
			return null;
		})
		.filter((v): v is Suggestion => v !== null);
}

function normalizeStructuredSuggestion(raw: Record<string, unknown>): StructuredSuggestion {
	const validImpacts = ['critical', 'high', 'medium', 'low'] as const;
	const impact = validImpacts.includes(raw.impact as (typeof validImpacts)[number])
		? (raw.impact as StructuredSuggestion['impact'])
		: 'medium';

	return {
		summary: String(raw.summary ?? ''),
		details: toStringArray(raw.details),
		impact,
		platforms: toStringArray(raw.platforms)
	};
}

// legacy function for JD analysis and semantic matching
export async function analyzWithLLM(payload: LLMRequestPayload): Promise<LLMResponse> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

		const response = await fetch('/api/analyze', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
			signal: controller.signal
		});

		clearTimeout(timeout);

		if (!response.ok) {
			if (response.status === 429) {
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
		return {
			success: true,
			data: generateFallbackAnalysis(payload),
			error: error instanceof Error ? error.message : 'unknown error',
			fallback: true
		};
	}
}
