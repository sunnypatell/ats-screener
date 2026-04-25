import { describe, it, expect } from 'vitest';
import { computeTimeline } from '$engine/scorer/timeline';

function entry(
	id: string,
	timestamp: string,
	score: number,
	mode: 'general' | 'targeted' = 'general'
) {
	return { id, timestamp, averageScore: score, mode };
}

describe('computeTimeline', () => {
	it('returns null for fewer than two entries', () => {
		expect(computeTimeline([])).toBeNull();
		expect(computeTimeline([entry('a', '2025-01-01', 50)])).toBeNull();
	});

	it('sorts ascending so leftmost x is the oldest scan', () => {
		const chart = computeTimeline([
			entry('newer', '2025-03-01T00:00:00Z', 80),
			entry('older', '2025-01-01T00:00:00Z', 60)
		]);
		expect(chart).not.toBeNull();
		expect(chart?.points[0].id).toBe('older');
		expect(chart?.points[1].id).toBe('newer');
		expect(chart!.points[0].x).toBeLessThan(chart!.points[1].x);
	});

	it('inverts y so higher scores render visually higher', () => {
		const chart = computeTimeline([entry('a', '2025-01-01', 30), entry('b', '2025-02-01', 90)]);
		// higher score = lower y in SVG coordinates
		expect(chart!.points[1].y).toBeLessThan(chart!.points[0].y);
	});

	it('produces a path D string starting with M and using L for the rest', () => {
		const chart = computeTimeline([
			entry('a', '2025-01-01', 50),
			entry('b', '2025-02-01', 60),
			entry('c', '2025-03-01', 70)
		]);
		expect(chart!.pathD.startsWith('M ')).toBe(true);
		expect(chart!.pathD.split('L').length - 1).toBe(2);
	});

	it('areaD closes the shape back to the baseline', () => {
		const chart = computeTimeline([entry('a', '2025-01-01', 50), entry('b', '2025-02-01', 60)]);
		expect(chart!.areaD.endsWith(' Z')).toBe(true);
	});

	it('keeps points inside the inner padding box', () => {
		const chart = computeTimeline([entry('a', '2025-01-01', 0), entry('b', '2025-02-01', 100)]);
		for (const p of chart!.points) {
			expect(p.x).toBeGreaterThanOrEqual(chart!.innerLeft);
			expect(p.x).toBeLessThanOrEqual(chart!.innerRight);
			expect(p.y).toBeGreaterThanOrEqual(chart!.innerTop);
			expect(p.y).toBeLessThanOrEqual(chart!.innerBottom);
		}
	});

	it('clamps out-of-range averageScore so points stay inside the padding box', () => {
		const chart = computeTimeline([entry('a', '2025-01-01', -50), entry('b', '2025-02-01', 150)]);
		expect(chart).not.toBeNull();
		// y must stay in [innerTop, innerBottom] regardless of input score
		for (const p of chart!.points) {
			expect(p.y).toBeGreaterThanOrEqual(chart!.innerTop);
			expect(p.y).toBeLessThanOrEqual(chart!.innerBottom);
		}
		// the unclamped score is preserved on the point for tooltip display
		expect(chart!.points[0].score).toBe(-50);
		expect(chart!.points[1].score).toBe(150);
	});

	it('respects custom viewBox dimensions', () => {
		const chart = computeTimeline([entry('a', '2025-01-01', 50), entry('b', '2025-02-01', 60)], {
			width: 1200,
			height: 400
		});
		expect(chart!.width).toBe(1200);
		expect(chart!.height).toBe(400);
		expect(chart!.points[1].x).toBeLessThanOrEqual(1200);
	});
});
