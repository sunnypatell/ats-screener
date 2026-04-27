import { describe, expect, it } from 'vitest';
import { djb2, parseSampleRate, shouldSample } from '$lib/sampling';

describe('djb2', () => {
	it('is deterministic for identical input', () => {
		expect(djb2('hello')).toBe(djb2('hello'));
	});

	it('produces different hashes for different input', () => {
		expect(djb2('hello')).not.toBe(djb2('world'));
	});

	it('returns an unsigned 32-bit integer', () => {
		const h = djb2('a long enough string with mixed contents 12345!@#');
		expect(h).toBeGreaterThanOrEqual(0);
		expect(h).toBeLessThan(2 ** 32);
		expect(Number.isInteger(h)).toBe(true);
	});
});

describe('shouldSample', () => {
	it('returns true for rate >= 1', () => {
		expect(shouldSample('seed', 1)).toBe(true);
		expect(shouldSample('seed', 1.5)).toBe(true);
	});

	it('returns false for rate <= 0', () => {
		expect(shouldSample('seed', 0)).toBe(false);
		expect(shouldSample('seed', -0.1)).toBe(false);
	});

	it('returns false for non-finite rate', () => {
		// non-finite includes both NaN and Infinity. fail-closed (drop) is the
		// safer default for a metric that controls cost.
		expect(shouldSample('seed', NaN)).toBe(false);
		expect(shouldSample('seed', Infinity)).toBe(false);
	});

	it('is deterministic for identical seed and rate', () => {
		const a = shouldSample('user-123:2026-04-25T12:00:00Z', 0.1);
		const b = shouldSample('user-123:2026-04-25T12:00:00Z', 0.1);
		expect(a).toBe(b);
	});

	it('approximates the requested rate over many distinct seeds', () => {
		// over 10k distinct seeds, the empirical sampling rate should land
		// within a generous tolerance of the configured rate. tolerance is
		// loose enough that a flake here means a real distribution problem.
		const rate = 0.1;
		const trials = 10_000;
		let hits = 0;
		for (let i = 0; i < trials; i++) {
			if (shouldSample(`user-${i}:event`, rate)) hits++;
		}
		const empirical = hits / trials;
		expect(empirical).toBeGreaterThan(rate - 0.03);
		expect(empirical).toBeLessThan(rate + 0.03);
	});
});

describe('parseSampleRate', () => {
	it('falls back to 1 on missing input', () => {
		expect(parseSampleRate(undefined)).toBe(1);
		expect(parseSampleRate('')).toBe(1);
	});

	it('falls back to 1 on garbage input', () => {
		expect(parseSampleRate('abc')).toBe(1);
		expect(parseSampleRate('NaN')).toBe(1);
	});

	it('clamps to [0, 1]', () => {
		expect(parseSampleRate('-0.2')).toBe(0);
		expect(parseSampleRate('2.0')).toBe(1);
	});

	it('parses valid decimal strings in range', () => {
		expect(parseSampleRate('0.1')).toBe(0.1);
		expect(parseSampleRate('0.5')).toBe(0.5);
		expect(parseSampleRate('1')).toBe(1);
		expect(parseSampleRate('0')).toBe(0);
	});
});
