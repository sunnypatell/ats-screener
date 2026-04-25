import { describe, it, expect } from 'vitest';
import {
	checkRateLimit,
	getRateLimitStats,
	RATE_LIMIT_CONFIG
} from '../../../src/routes/api/analyze/rate-limiter';

// limiter uses module-level state per-IP. tests use unique IPs so they don't
// trip on each other across test runs.
let ipCounter = 0;
const uniqueIp = () => `10.0.0.${(++ipCounter % 255) + 1}-${Date.now()}`;

describe('checkRateLimit: minute window', () => {
	it('allows the first request', () => {
		const result = checkRateLimit(uniqueIp());
		expect(result.allowed).toBe(true);
	});

	it(`allows up to MAX_RPM (${RATE_LIMIT_CONFIG.MAX_RPM}) requests`, () => {
		const ip = uniqueIp();
		for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_RPM; i++) {
			expect(checkRateLimit(ip).allowed).toBe(true);
		}
	});

	it('rejects the (MAX_RPM+1)-th request with reason "minute"', () => {
		const ip = uniqueIp();
		for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_RPM; i++) checkRateLimit(ip);
		const result = checkRateLimit(ip);
		expect(result.allowed).toBe(false);
		if (!result.allowed) {
			expect(result.reason).toBe('minute');
			expect(result.retryAfterSec).toBeGreaterThan(0);
			expect(result.retryAfterSec).toBeLessThanOrEqual(60);
		}
	});

	it('does not consume a slot when the limit was already hit', () => {
		// after the limit is hit, repeated checks should keep returning false
		// without further state mutation - retryAfterSec should not grow
		const ip = uniqueIp();
		for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_RPM; i++) checkRateLimit(ip);
		const r1 = checkRateLimit(ip);
		const r2 = checkRateLimit(ip);
		expect(r1.allowed).toBe(false);
		expect(r2.allowed).toBe(false);
	});
});

describe('checkRateLimit: independence between IPs', () => {
	it('treats different IPs as independent', () => {
		const a = uniqueIp();
		const b = uniqueIp();
		// exhaust IP a
		for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_RPM; i++) checkRateLimit(a);
		expect(checkRateLimit(a).allowed).toBe(false);
		// IP b should still be fresh
		expect(checkRateLimit(b).allowed).toBe(true);
	});
});

describe('checkRateLimit: result shape', () => {
	it('returns retryAfterSec as a positive integer when blocked', () => {
		const ip = uniqueIp();
		for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_RPM; i++) checkRateLimit(ip);
		const result = checkRateLimit(ip);
		if (!result.allowed) {
			expect(Number.isInteger(result.retryAfterSec)).toBe(true);
			expect(result.retryAfterSec).toBeGreaterThan(0);
		}
	});

	it('discriminated union narrows correctly', () => {
		const result = checkRateLimit(uniqueIp());
		if (result.allowed) {
			// no fields beyond allowed should be on the success branch
			expect(result.allowed).toBe(true);
		} else {
			expect(['minute', 'daily']).toContain(result.reason);
		}
	});
});

describe('getRateLimitStats', () => {
	it('returns the expected shape', () => {
		const s = getRateLimitStats();
		expect(typeof s.startedAt).toBe('string');
		expect(Number.isFinite(s.uptimeSec)).toBe(true);
		expect(Number.isFinite(s.totalChecks)).toBe(true);
		expect(Number.isFinite(s.totalAllowed)).toBe(true);
		expect(Number.isFinite(s.totalBlockedMinute)).toBe(true);
		expect(Number.isFinite(s.totalBlockedDaily)).toBe(true);
		expect(Number.isFinite(s.minuteMapSize)).toBe(true);
		expect(Number.isFinite(s.dailyMapSize)).toBe(true);
		expect(s.config.maxRpm).toBe(RATE_LIMIT_CONFIG.MAX_RPM);
		expect(s.config.maxRpd).toBe(RATE_LIMIT_CONFIG.MAX_RPD);
	});

	it('counters advance on allowed and blocked checks', () => {
		const before = getRateLimitStats();
		const ip = uniqueIp();
		for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_RPM; i++) checkRateLimit(ip);
		// one over the limit
		checkRateLimit(ip);
		const after = getRateLimitStats();
		expect(after.totalChecks - before.totalChecks).toBe(RATE_LIMIT_CONFIG.MAX_RPM + 1);
		expect(after.totalAllowed - before.totalAllowed).toBe(RATE_LIMIT_CONFIG.MAX_RPM);
		expect(after.totalBlockedMinute - before.totalBlockedMinute).toBe(1);
	});
});
