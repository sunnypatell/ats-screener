// quick-wins picker: surfaces the top N highest-impact structured
// suggestions across every ATS profile, deduplicated by summary text.
// used by the dashboard's Quick Wins band so users see the 2-3 things
// to fix first instead of scrolling through every per-platform tab.
//
// pure function. fully unit-tested in tests/unit/scorer/quick-wins.test.ts.

import type { ScoreResult, StructuredSuggestion, Suggestion } from './types';

const IMPACT_RANK: Record<string, number> = {
	critical: 4,
	high: 3,
	medium: 2,
	low: 1
};

function isStructured(s: Suggestion): s is StructuredSuggestion {
	return typeof s !== 'string' && typeof s.summary === 'string' && s.summary.length > 0;
}

// ranks structured suggestions across all results by impact, dedupes
// by summary text (case-insensitive, whitespace-trimmed), returns the
// first `limit` entries. plain-string suggestions and structured
// suggestions with empty summary are skipped silently.
//
// stable-sort behaviour: when two suggestions have the same impact,
// the order preserves first-seen across the input results array.
// that gives platforms appearing earlier in the dashboard slight
// preference, which matches what the user expects when scanning
// top-down.
export function pickQuickWins(results: ScoreResult[], limit = 3): StructuredSuggestion[] {
	if (limit <= 0) return [];

	const collected: StructuredSuggestion[] = [];
	const seen = new Set<string>();

	for (const result of results) {
		for (const suggestion of result.suggestions) {
			if (!isStructured(suggestion)) continue;
			const key = suggestion.summary.trim().toLowerCase();
			if (seen.has(key)) continue;
			seen.add(key);
			collected.push(suggestion);
		}
	}

	// stable sort by impact rank descending. unknown impacts sort last.
	collected.sort((a, b) => {
		const rankA = IMPACT_RANK[a.impact] ?? 0;
		const rankB = IMPACT_RANK[b.impact] ?? 0;
		return rankB - rankA;
	});

	return collected.slice(0, limit);
}
