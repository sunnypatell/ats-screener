import { describe, it, expect } from 'vitest';
import { computeJourneyStats } from '$engine/scorer/journey';
import type { ScoreResult } from '$engine/scorer/types';

function r(system: string, score: number): ScoreResult {
	return {
		system,
		vendor: 'V',
		overallScore: score,
		passesFilter: score >= 60,
		breakdown: {
			formatting: { score, issues: [], details: [] },
			keywordMatch: { score, matched: [], missing: [], synonymMatched: [] },
			sections: { score, present: [], missing: [] },
			experience: {
				score,
				quantifiedBullets: 0,
				totalBullets: 0,
				actionVerbCount: 0,
				highlights: []
			},
			education: { score, notes: [] }
		},
		suggestions: []
	};
}

describe('computeJourneyStats', () => {
	it('returns null on empty input', () => {
		expect(computeJourneyStats([])).toBeNull();
	});

	it('handles a single scan (no delta possible)', () => {
		const stats = computeJourneyStats([
			{ id: '1', timestamp: '2025-01-01', averageScore: 70, results: [r('Workday', 70)] }
		]);
		expect(stats?.totalScans).toBe(1);
		expect(stats?.firstScore).toBe(70);
		expect(stats?.latestScore).toBe(70);
		expect(stats?.totalDelta).toBe(0);
		expect(stats?.bestPlatformDelta).toBeNull();
	});

	it('computes total delta and best-platform delta across two scans', () => {
		const stats = computeJourneyStats([
			{
				id: '1',
				timestamp: '2025-01-01',
				averageScore: 60,
				results: [r('Workday', 60), r('Lever', 50)]
			},
			{
				id: '2',
				timestamp: '2025-02-01',
				averageScore: 80,
				results: [r('Workday', 75), r('Lever', 85)]
			}
		]);
		expect(stats?.totalDelta).toBe(20);
		expect(stats?.firstScore).toBe(60);
		expect(stats?.latestScore).toBe(80);
		expect(stats?.bestScore).toBe(80);
		expect(stats?.bestPlatformDelta).toEqual({ system: 'Lever', delta: 35 });
		expect(stats?.daysSpan).toBe(31);
	});

	it('sorts ascending so input order does not matter', () => {
		const stats = computeJourneyStats([
			{ id: '2', timestamp: '2025-02-01', averageScore: 80, results: [r('Workday', 80)] },
			{ id: '1', timestamp: '2025-01-01', averageScore: 60, results: [r('Workday', 60)] }
		]);
		expect(stats?.firstScore).toBe(60);
		expect(stats?.latestScore).toBe(80);
	});
});
