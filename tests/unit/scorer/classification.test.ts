import { describe, it, expect } from 'vitest';
import { classifyScore, getScoreLabel, getScoreColor } from '$engine/scorer/classification';

describe('classifyScore tiers', () => {
	it('returns excellent for 80+', () => {
		expect(classifyScore(80).tier).toBe('excellent');
		expect(classifyScore(95).tier).toBe('excellent');
		expect(classifyScore(100).tier).toBe('excellent');
	});

	it('returns good for 60-79', () => {
		expect(classifyScore(60).tier).toBe('good');
		expect(classifyScore(70).tier).toBe('good');
		expect(classifyScore(79).tier).toBe('good');
	});

	it('returns fair for 40-59', () => {
		expect(classifyScore(40).tier).toBe('fair');
		expect(classifyScore(50).tier).toBe('fair');
		expect(classifyScore(59).tier).toBe('fair');
	});

	it('returns poor for below 40', () => {
		expect(classifyScore(0).tier).toBe('poor');
		expect(classifyScore(20).tier).toBe('poor');
		expect(classifyScore(39).tier).toBe('poor');
	});

	it('handles boundary scores precisely (>=, not >)', () => {
		expect(classifyScore(80).tier).toBe('excellent');
		expect(classifyScore(79.9).tier).toBe('good');
		expect(classifyScore(60).tier).toBe('good');
		expect(classifyScore(59.9).tier).toBe('fair');
		expect(classifyScore(40).tier).toBe('fair');
		expect(classifyScore(39.9).tier).toBe('poor');
	});

	it('classifies negative scores as poor', () => {
		expect(classifyScore(-1).tier).toBe('poor');
		expect(classifyScore(-100).tier).toBe('poor');
	});

	it('returns labels matching tiers', () => {
		expect(classifyScore(85).label).toBe('Excellent');
		expect(classifyScore(70).label).toBe('Good');
		expect(classifyScore(50).label).toBe('Needs Work');
		expect(classifyScore(20).label).toBe('Poor');
	});

	it('returns hex colors matching tiers', () => {
		expect(classifyScore(85).color).toBe('#22c55e');
		expect(classifyScore(70).color).toBe('#eab308');
		expect(classifyScore(50).color).toBe('#f97316');
		expect(classifyScore(20).color).toBe('#ef4444');
	});

	it('always returns a hex color regardless of input', () => {
		for (const s of [-50, 0, 39, 40, 59, 60, 79, 80, 100, 999]) {
			expect(classifyScore(s).color).toMatch(/^#[0-9a-f]{6}$/);
		}
	});
});

describe('getScoreLabel', () => {
	it('matches classifyScore.label across the range', () => {
		for (const score of [-1, 0, 39, 40, 59, 60, 79, 80, 100]) {
			expect(getScoreLabel(score)).toBe(classifyScore(score).label);
		}
	});
});

describe('getScoreColor', () => {
	it('matches classifyScore.color across the range', () => {
		for (const score of [-1, 0, 39, 40, 59, 60, 79, 80, 100]) {
			expect(getScoreColor(score)).toBe(classifyScore(score).color);
		}
	});
});
