import { describe, expect, it } from 'vitest';
import { pickQuickWins } from '../../../src/lib/engine/scorer/quick-wins';
import type { ScoreResult, StructuredSuggestion } from '../../../src/lib/engine/scorer/types';

function structured(summary: string, impact: StructuredSuggestion['impact']): StructuredSuggestion {
	return { summary, details: [], impact, platforms: [] };
}

function result(suggestions: Array<string | StructuredSuggestion>): ScoreResult {
	return {
		system: 'TestATS',
		vendor: 'Test',
		overallScore: 50,
		passesFilter: true,
		breakdown: {
			formatting: { score: 0, issues: [], details: [] },
			keywordMatch: { score: 0, matched: [], missing: [], synonymMatched: [] },
			sections: { score: 0, present: [], missing: [] },
			experience: {
				score: 0,
				quantifiedBullets: 0,
				totalBullets: 0,
				actionVerbCount: 0,
				highlights: []
			},
			education: { score: 0, notes: [] }
		},
		suggestions
	};
}

describe('pickQuickWins: empty / edge cases', () => {
	it('returns empty array for empty results', () => {
		expect(pickQuickWins([])).toEqual([]);
	});

	it('returns empty array when limit is 0', () => {
		expect(pickQuickWins([result([structured('x', 'critical')])], 0)).toEqual([]);
	});

	it('returns empty array when limit is negative', () => {
		expect(pickQuickWins([result([structured('x', 'critical')])], -1)).toEqual([]);
	});

	it('skips plain-string suggestions', () => {
		const r = result(['plain string suggestion']);
		expect(pickQuickWins([r])).toEqual([]);
	});

	it('skips structured suggestions with empty summary', () => {
		const r = result([structured('', 'critical')]);
		expect(pickQuickWins([r])).toEqual([]);
	});
});

describe('pickQuickWins: ranking', () => {
	it('ranks critical above high above medium above low', () => {
		const r = result([
			structured('low item', 'low'),
			structured('high item', 'high'),
			structured('critical item', 'critical'),
			structured('medium item', 'medium')
		]);
		const picks = pickQuickWins([r], 4);
		expect(picks.map((p) => p.impact)).toEqual(['critical', 'high', 'medium', 'low']);
	});

	it('respects the limit parameter', () => {
		const r = result([
			structured('a', 'critical'),
			structured('b', 'high'),
			structured('c', 'medium'),
			structured('d', 'low')
		]);
		expect(pickQuickWins([r], 2).length).toBe(2);
		expect(pickQuickWins([r], 3).length).toBe(3);
	});

	it('default limit is 3', () => {
		const r = result([
			structured('a', 'critical'),
			structured('b', 'high'),
			structured('c', 'medium'),
			structured('d', 'low')
		]);
		expect(pickQuickWins([r]).length).toBe(3);
	});
});

describe('pickQuickWins: dedupe across platforms', () => {
	it('dedupes identical summaries across platforms', () => {
		const a = result([structured('Add quantified metrics', 'high')]);
		const b = result([structured('Add quantified metrics', 'high')]);
		const c = result([structured('Add quantified metrics', 'high')]);
		const picks = pickQuickWins([a, b, c]);
		expect(picks.length).toBe(1);
		expect(picks[0].summary).toBe('Add quantified metrics');
	});

	it('dedupe is case-insensitive and whitespace-tolerant', () => {
		const a = result([structured('Add Action Verbs', 'high')]);
		const b = result([structured('  add action verbs  ', 'medium')]);
		const picks = pickQuickWins([a, b]);
		expect(picks.length).toBe(1);
	});

	it('keeps the first-seen impact when summaries dedupe', () => {
		// platform A says "high", platform B says "critical" for the same suggestion.
		// we keep the first-seen entry (high) since reordering by impact AFTER dedupe
		// would change rank but not impact field; this just locks in the first-seen rule.
		const a = result([structured('Same suggestion', 'high')]);
		const b = result([structured('Same suggestion', 'critical')]);
		const picks = pickQuickWins([a, b]);
		expect(picks.length).toBe(1);
		expect(picks[0].impact).toBe('high');
	});
});

describe('pickQuickWins: realistic scenarios', () => {
	it('combines per-platform structured suggestions into a unified top 3', () => {
		const workday = result([
			structured('Add quantified metrics to bullets', 'critical'),
			structured('Use stronger action verbs', 'high')
		]);
		const taleo = result([
			structured('Add a dedicated Skills section', 'high'),
			structured('Use stronger action verbs', 'high') // dedupe
		]);
		const greenhouse = result([
			structured('Tailor keywords to the job description', 'medium'),
			structured('Add quantified metrics to bullets', 'critical') // dedupe
		]);

		const picks = pickQuickWins([workday, taleo, greenhouse]);
		expect(picks.length).toBe(3);
		expect(picks[0].summary).toContain('quantified metrics');
		expect(picks[0].impact).toBe('critical');
		// the next two are both impact=high; either order is valid as long as
		// they are the high-impact ones, not the medium one.
		const remainingImpacts = picks.slice(1).map((p) => p.impact);
		expect(remainingImpacts).toContain('high');
	});

	it('mixes plain-string and structured suggestions, picking only structured', () => {
		const r = result([
			'plain string',
			structured('structured one', 'critical'),
			'another plain',
			structured('structured two', 'medium')
		]);
		const picks = pickQuickWins([r], 5);
		expect(picks.length).toBe(2);
		expect(picks[0].summary).toBe('structured one');
		expect(picks[1].summary).toBe('structured two');
	});
});
