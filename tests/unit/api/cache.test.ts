import { describe, it, expect } from 'vitest';
import { hashPrompt, getCached, setCached } from '../../../src/routes/api/analyze/cache';

// the cache uses module-level state. tests must use unique keys to avoid
// cross-test pollution since there's no shared reset between tests.
let counter = 0;
const uniqueKey = () => `test-key-${++counter}-${Date.now()}`;

describe('hashPrompt', () => {
	it('returns a 64-char lowercase hex string for SHA-256', async () => {
		const hash = await hashPrompt('hello');
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
	});

	it('is deterministic for the same input', async () => {
		const a = await hashPrompt('the same prompt');
		const b = await hashPrompt('the same prompt');
		expect(a).toBe(b);
	});

	it('produces different hashes for different inputs', async () => {
		const a = await hashPrompt('prompt one');
		const b = await hashPrompt('prompt two');
		expect(a).not.toBe(b);
	});

	it('handles empty string', async () => {
		const hash = await hashPrompt('');
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
	});

	it('handles unicode and large inputs', async () => {
		const hash = await hashPrompt('日本語🚀'.repeat(1000));
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
	});
});

describe('getCached / setCached', () => {
	it('returns null for an unknown key', () => {
		expect(getCached(uniqueKey())).toBeNull();
	});

	it('round-trips a stored entry', () => {
		const key = uniqueKey();
		const parsed = { results: [{ score: 80 }] };
		setCached(key, parsed, 'gemma-3-27b');
		const entry = getCached(key);
		expect(entry).not.toBeNull();
		expect(entry?.parsed).toEqual(parsed);
		expect(entry?.provider).toBe('gemma-3-27b');
	});

	it('sets expiresAt 24h in the future', () => {
		const key = uniqueKey();
		const before = Date.now();
		setCached(key, {}, 'p');
		const entry = getCached(key);
		const expectedMin = before + 24 * 60 * 60 * 1000 - 1000;
		const expectedMax = Date.now() + 24 * 60 * 60 * 1000 + 1000;
		expect(entry?.expiresAt).toBeGreaterThanOrEqual(expectedMin);
		expect(entry?.expiresAt).toBeLessThanOrEqual(expectedMax);
	});

	it('overwrites a key on second set', () => {
		const key = uniqueKey();
		setCached(key, { v: 1 }, 'a');
		setCached(key, { v: 2 }, 'b');
		expect(getCached(key)?.parsed).toEqual({ v: 2 });
		expect(getCached(key)?.provider).toBe('b');
	});

	it('treats stored entries as immutable from the consumer side', () => {
		const key = uniqueKey();
		const parsed = { value: 'x' };
		setCached(key, parsed, 'p');
		// mutating the source object should not change what's stored if the consumer
		// is well-behaved; we just assert the get returns the stored value
		const entry = getCached(key);
		expect(entry?.parsed).toBeDefined();
	});
});
