import type { ScoreResult } from '$engine/scorer/types';
import type { LLMAnalysis, LLMRequestPayload, LLMResponse } from './types';
import { generateFallbackAnalysis } from './fallback';

// performs full LLM-powered ATS scoring via the server endpoint
// falls back to rule-based if all providers fail
export async function scoreLLM(
	resumeText: string,
	jobDescription?: string
): Promise<{ results: ScoreResult[]; provider: string; fallback: boolean } | null> {
	try {
		const response = await fetch('/api/analyze', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				mode: 'full-score',
				resumeText,
				jobDescription
			})
		});

		if (!response.ok) {
			const data = await response.json().catch(() => ({}));
			if (data.fallback) return null;
			return null;
		}

		const data = await response.json();

		if (data._fallback || !data.results || !Array.isArray(data.results)) {
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
	} catch {
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
		suggestions: toStringArray(raw.suggestions)
	};
}

function clamp(n: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, Math.round(n)));
}

function toStringArray(val: unknown): string[] {
	if (!Array.isArray(val)) return [];
	return val.filter((v) => typeof v === 'string');
}

// legacy function for JD analysis and semantic matching
export async function analyzWithLLM(payload: LLMRequestPayload): Promise<LLMResponse> {
	try {
		const response = await fetch('/api/analyze', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

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
