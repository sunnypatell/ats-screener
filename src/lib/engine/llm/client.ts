import type { ScoreResult, Suggestion, StructuredSuggestion } from '$engine/scorer/types';
import type { LLMAnalysis, LLMRequestPayload, LLMResponse } from './types';
import { generateFallbackAnalysis } from './fallback';

const CLIENT_TIMEOUT_MS = 65_000;

// performs full LLM-powered ATS scoring via the server endpoint
// falls back to rule-based if all providers fail
export async function scoreLLM(
	resumeText: string,
	jobDescription?: string
): Promise<{ results: ScoreResult[]; provider: string; fallback: boolean } | null> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

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

		clearTimeout(timeout);

		if (!response.ok) {
			const data = await response.json().catch(() => ({}));
			console.warn('[scoreLLM] API returned', response.status, data.error ?? 'unknown error');
			return null;
		}

		const data = await response.json();

		if (data._fallback || !data.results || !Array.isArray(data.results)) {
			console.warn(
				'[scoreLLM] response missing results or is fallback, falling back to rule-based'
			);
			return null;
		}

		// validate and normalize the LLM response to match ScoreResult[]
		const results: ScoreResult[] = data.results.map((r: Record<string, unknown>) =>
			normalizeScoreResult(r)
		);

		return {
			results,
			provider: (data._provider as string) ?? 'unknown',
			fallback: false
		};
	} catch (err) {
		if (err instanceof DOMException && err.name === 'AbortError') {
			console.warn('LLM scoring timed out after', CLIENT_TIMEOUT_MS, 'ms');
		}
		return null;
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
