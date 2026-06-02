import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	checkLoginRateLimit,
	recordLoginFailure,
	resetLoginRateLimit,
	LOGIN_RATE_LIMIT_CONFIG
} from '../../../../src/lib/server/auth/login-rate-limit';

// the limiter holds module-level state keyed by ip; each test uses a distinct ip
// so they don't interfere (mirrors the analyze rate-limiter test approach).
let ipCounter = 0;
function freshIp(): string {
	ipCounter += 1;
	return `10.0.0.${ipCounter}`;
}

afterEach(() => {
	vi.useRealTimers();
});

describe('checkLoginRateLimit', () => {
	it('allows a brand-new ip', () => {
		expect(checkLoginRateLimit(freshIp())).toEqual({ allowed: true });
	});

	it('allows up to MAX_FAILS failures, then blocks', () => {
		const ip = freshIp();
		for (let i = 0; i < LOGIN_RATE_LIMIT_CONFIG.MAX_FAILS - 1; i++) {
			recordLoginFailure(ip);
			expect(checkLoginRateLimit(ip).allowed).toBe(true);
		}
		// the MAX_FAILS-th failure trips the lockout
		recordLoginFailure(ip);
		const gate = checkLoginRateLimit(ip);
		expect(gate.allowed).toBe(false);
		if (!gate.allowed) expect(gate.retryAfterSec).toBeGreaterThan(0);
	});

	it('reset clears the lockout', () => {
		const ip = freshIp();
		for (let i = 0; i < LOGIN_RATE_LIMIT_CONFIG.MAX_FAILS; i++) recordLoginFailure(ip);
		expect(checkLoginRateLimit(ip).allowed).toBe(false);
		resetLoginRateLimit(ip);
		expect(checkLoginRateLimit(ip).allowed).toBe(true);
	});

	it('keeps distinct ips independent', () => {
		const a = freshIp();
		const b = freshIp();
		for (let i = 0; i < LOGIN_RATE_LIMIT_CONFIG.MAX_FAILS; i++) recordLoginFailure(a);
		expect(checkLoginRateLimit(a).allowed).toBe(false);
		expect(checkLoginRateLimit(b).allowed).toBe(true);
	});
});

describe('lockout expiry', () => {
	it('clears the lockout after LOCKOUT_MS elapses', () => {
		vi.useFakeTimers();
		const ip = freshIp();
		for (let i = 0; i < LOGIN_RATE_LIMIT_CONFIG.MAX_FAILS; i++) recordLoginFailure(ip);
		expect(checkLoginRateLimit(ip).allowed).toBe(false);

		vi.advanceTimersByTime(LOGIN_RATE_LIMIT_CONFIG.LOCKOUT_MS + 1000);
		expect(checkLoginRateLimit(ip).allowed).toBe(true);
	});

	it('starts a fresh window once the rolling window passes', () => {
		vi.useFakeTimers();
		const ip = freshIp();
		// a couple of failures, then let the window age out
		recordLoginFailure(ip);
		recordLoginFailure(ip);
		vi.advanceTimersByTime(LOGIN_RATE_LIMIT_CONFIG.WINDOW_MS + 1000);
		// these failures count against a fresh window, so we're still under the cap
		recordLoginFailure(ip);
		expect(checkLoginRateLimit(ip).allowed).toBe(true);
	});
});
