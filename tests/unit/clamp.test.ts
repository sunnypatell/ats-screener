import { describe, expect, it } from 'vitest';
import { clamp, parseInt0 } from '../../src/lib/clamp';

describe('clamp', () => {
	it('returns the value unchanged when inside range', () => {
		expect(clamp(50, 0, 100)).toBe(50);
	});

	it('clamps below min', () => {
		expect(clamp(-10, 0, 100)).toBe(0);
	});

	it('clamps above max', () => {
		expect(clamp(150, 0, 100)).toBe(100);
	});

	it('returns min when input equals min', () => {
		expect(clamp(0, 0, 100)).toBe(0);
	});

	it('returns max when input equals max', () => {
		expect(clamp(100, 0, 100)).toBe(100);
	});

	it('handles negative ranges', () => {
		expect(clamp(-50, -100, -10)).toBe(-50);
		expect(clamp(0, -100, -10)).toBe(-10);
		expect(clamp(-200, -100, -10)).toBe(-100);
	});
});

describe('parseInt0', () => {
	it('returns the parsed integer when valid and within range', () => {
		expect(parseInt0('42', 0, 0, 100)).toBe(42);
	});

	it('returns the fallback when input is null', () => {
		expect(parseInt0(null, 7, 0, 100)).toBe(7);
	});

	it('returns the fallback when input is empty string', () => {
		expect(parseInt0('', 7, 0, 100)).toBe(7);
	});

	it('returns the fallback for non-numeric input', () => {
		expect(parseInt0('abc', 7, 0, 100)).toBe(7);
		expect(parseInt0('NaN', 7, 0, 100)).toBe(7);
	});

	it('clamps a parsed value above max', () => {
		expect(parseInt0('99999', 0, 0, 100)).toBe(100);
	});

	it('clamps a parsed value below min', () => {
		expect(parseInt0('-50', 0, 0, 100)).toBe(0);
	});

	it('parses negative ranges correctly (e.g. delta)', () => {
		expect(parseInt0('-25', 0, -100, 100)).toBe(-25);
		expect(parseInt0('-200', 0, -100, 100)).toBe(-100);
	});

	it('parses leading-int strings (Number.parseInt semantics)', () => {
		// "12abc" parses to 12 per parseInt; we accept this since it cannot
		// land outside the clamp range and the alternative (rejecting trailing
		// junk) costs more code than it saves
		expect(parseInt0('12abc', 0, 0, 100)).toBe(12);
	});

	it('treats float strings by truncating to int', () => {
		expect(parseInt0('42.7', 0, 0, 100)).toBe(42);
	});
});
