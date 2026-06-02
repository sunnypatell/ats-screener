// per-IP failed-login lockout, mirroring api/analyze/rate-limiter.ts: in-memory
// Map, throttled O(n) cleanup, dies with the instance. single-node self-host is
// the target, so per-instance state is acceptable (documented). only FAILED
// binds count toward the limit; a successful sign-in resets the counter.
//
// kept separate from the analyze rate-limiter so the scan hot path is untouched.

const failures = new Map<string, { count: number; firstAt: number; lockedUntil: number }>();
const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60_000; // rolling window in which failures accumulate
const LOCKOUT_MS = 15 * 60_000; // lockout duration once MAX_FAILS is reached
const MAX_MAP_SIZE = 10_000;
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanupAt = 0;

export type LoginGate = { allowed: true } | { allowed: false; retryAfterSec: number };

function cleanup(now: number): void {
	if (failures.size <= MAX_MAP_SIZE || now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
	for (const [ip, rec] of failures) {
		if (now > rec.lockedUntil && now - rec.firstAt > WINDOW_MS) failures.delete(ip);
	}
	lastCleanupAt = now;
}

export function checkLoginRateLimit(ip: string): LoginGate {
	const now = Date.now();
	cleanup(now);
	const rec = failures.get(ip);
	if (rec && now < rec.lockedUntil) {
		return { allowed: false, retryAfterSec: Math.ceil((rec.lockedUntil - now) / 1000) };
	}
	return { allowed: true };
}

export function recordLoginFailure(ip: string): void {
	const now = Date.now();
	const rec = failures.get(ip);
	// start a fresh window if there's no record or the previous one has aged out
	if (!rec || now - rec.firstAt > WINDOW_MS) {
		failures.set(ip, { count: 1, firstAt: now, lockedUntil: 0 });
		return;
	}
	rec.count += 1;
	if (rec.count >= MAX_FAILS) rec.lockedUntil = now + LOCKOUT_MS;
}

export function resetLoginRateLimit(ip: string): void {
	failures.delete(ip);
}

// exported so tests can drive the limiter without magic numbers
export const LOGIN_RATE_LIMIT_CONFIG = { MAX_FAILS, WINDOW_MS, LOCKOUT_MS } as const;
