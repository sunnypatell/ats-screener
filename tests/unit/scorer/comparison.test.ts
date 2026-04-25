import { describe, it, expect } from 'vitest';
import { computeScanComparison } from '$engine/scorer/comparison';
import type { ScoreResult } from '$engine/scorer/types';

function r(system: string, score: number, passes: boolean): ScoreResult {
	return {
		system,
		vendor: 'TestVendor',
		overallScore: score,
		passesFilter: passes,
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

describe('computeScanComparison', () => {
	it('returns null when either side is empty', () => {
		expect(computeScanComparison([], [r('Workday', 80, true)])).toBeNull();
		expect(computeScanComparison([r('Workday', 80, true)], [])).toBeNull();
		expect(computeScanComparison([], [])).toBeNull();
	});

	it('computes deltas across matching platforms', () => {
		const previous = [r('Workday', 70, true), r('Lever', 60, false)];
		const current = [r('Workday', 80, true), r('Lever', 75, true)];
		const cmp = computeScanComparison(current, previous);
		expect(cmp).not.toBeNull();
		expect(cmp?.previousAverage).toBe(65);
		expect(cmp?.currentAverage).toBe(78);
		expect(cmp?.deltaAverage).toBe(13);
		expect(cmp?.previousPassing).toBe(1);
		expect(cmp?.currentPassing).toBe(2);
		expect(cmp?.deltaPassing).toBe(1);
		expect(cmp?.improved).toBe(2);
		expect(cmp?.regressed).toBe(0);
		expect(cmp?.unchanged).toBe(0);
	});

	it('counts regressions and unchanged separately', () => {
		const previous = [r('Workday', 80, true), r('Lever', 70, true), r('iCIMS', 60, false)];
		const current = [r('Workday', 70, true), r('Lever', 70, true), r('iCIMS', 75, true)];
		const cmp = computeScanComparison(current, previous);
		expect(cmp?.improved).toBe(1);
		expect(cmp?.regressed).toBe(1);
		expect(cmp?.unchanged).toBe(1);
	});

	it('handles negative deltas without sign confusion', () => {
		const previous = [r('Workday', 90, true)];
		const current = [r('Workday', 70, true)];
		const cmp = computeScanComparison(current, previous);
		expect(cmp?.deltaAverage).toBe(-20);
		expect(cmp?.platforms[0].delta).toBe(-20);
		expect(cmp?.regressed).toBe(1);
	});

	it('skips platforms that do not exist in the previous scan', () => {
		const previous = [r('Workday', 70, true)];
		const current = [r('Workday', 80, true), r('NewPlatform', 60, false)];
		const cmp = computeScanComparison(current, previous);
		expect(cmp?.platforms).toHaveLength(1);
		expect(cmp?.platforms[0].system).toBe('Workday');
	});

	it('produces stable platform order matching the current scan', () => {
		const previous = [r('Lever', 50, false), r('Workday', 80, true)];
		const current = [r('Workday', 85, true), r('Lever', 55, false)];
		const cmp = computeScanComparison(current, previous);
		expect(cmp?.platforms.map((p) => p.system)).toEqual(['Workday', 'Lever']);
	});
});
