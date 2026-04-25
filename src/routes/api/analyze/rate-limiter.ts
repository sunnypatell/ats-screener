// per-IP in-memory rate limiter
// dies with the instance (no distributed lock); fine on Vercel hobby/single instance
// upgrade path: swap the Maps for a kv-backed adapter without changing the public API

const rateLimits = new Map<string, { count: number; resetAt: number }>();
const dailyLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_RPM = 10;
const MAX_RPD = 200;
const MAX_MAP_SIZE = 10_000;
// throttle the O(n) cleanup so we don't pay it on every request once size > 10k.
// at 50k unique users/day the daily map exceeds the threshold continuously, and
// without throttling each request would walk the entire map. running it at most
// once per CLEANUP_INTERVAL_MS bounds the cost regardless of size
const CLEANUP_INTERVAL_MS = 30_000;
let lastMinuteCleanupAt = 0;
let lastDailyCleanupAt = 0;

// in-memory counters surfaced by /api/admin/rate-limit-stats. zero storage,
// per-instance only (lost on cold start), but enough to spot abuse patterns
// in the hot loop without paying for any external observability service.
const stats = {
	totalChecks: 0,
	totalAllowed: 0,
	totalBlockedMinute: 0,
	totalBlockedDaily: 0,
	startedAt: Date.now()
};

export type RateLimitResult =
	| { allowed: true }
	| { allowed: false; reason: 'minute' | 'daily'; retryAfterSec: number };

export function checkRateLimit(ip: string): RateLimitResult {
	stats.totalChecks += 1;
	const now = Date.now();

	// periodically clean up expired entries to prevent unbounded memory growth.
	// throttled so the O(n) sweep can't fire on every request when the map sits
	// above MAX_MAP_SIZE (which becomes steady-state at high traffic)
	if (rateLimits.size > MAX_MAP_SIZE && now - lastMinuteCleanupAt > CLEANUP_INTERVAL_MS) {
		for (const [key, val] of rateLimits) {
			if (now > val.resetAt) rateLimits.delete(key);
		}
		lastMinuteCleanupAt = now;
	}
	if (dailyLimits.size > MAX_MAP_SIZE && now - lastDailyCleanupAt > CLEANUP_INTERVAL_MS) {
		for (const [key, val] of dailyLimits) {
			if (now > val.resetAt) dailyLimits.delete(key);
		}
		lastDailyCleanupAt = now;
	}

	// check both windows BEFORE incrementing, so a daily-limit failure
	// doesn't also consume a minute slot
	const minute = rateLimits.get(ip);
	if (minute && now < minute.resetAt && minute.count >= MAX_RPM) {
		stats.totalBlockedMinute += 1;
		return {
			allowed: false,
			reason: 'minute',
			retryAfterSec: Math.ceil((minute.resetAt - now) / 1000)
		};
	}

	const day = dailyLimits.get(ip);
	if (day && now < day.resetAt && day.count >= MAX_RPD) {
		stats.totalBlockedDaily += 1;
		return {
			allowed: false,
			reason: 'daily',
			retryAfterSec: Math.ceil((day.resetAt - now) / 1000)
		};
	}

	// both windows have headroom - increment both
	if (minute && now < minute.resetAt) minute.count++;
	else rateLimits.set(ip, { count: 1, resetAt: now + 60_000 });

	if (day && now < day.resetAt) day.count++;
	else dailyLimits.set(ip, { count: 1, resetAt: now + 86_400_000 });

	stats.totalAllowed += 1;
	return { allowed: true };
}

// observability surface for /api/admin/rate-limit-stats. returns the
// in-process counters plus current map sizes so an admin can spot abuse
// patterns without paying for external observability tooling. per-instance
// only (lost on cold start), so this is best-effort, not authoritative.
export function getRateLimitStats() {
	return {
		startedAt: new Date(stats.startedAt).toISOString(),
		uptimeSec: Math.round((Date.now() - stats.startedAt) / 1000),
		totalChecks: stats.totalChecks,
		totalAllowed: stats.totalAllowed,
		totalBlockedMinute: stats.totalBlockedMinute,
		totalBlockedDaily: stats.totalBlockedDaily,
		minuteMapSize: rateLimits.size,
		dailyMapSize: dailyLimits.size,
		config: { maxRpm: MAX_RPM, maxRpd: MAX_RPD, maxMapSize: MAX_MAP_SIZE }
	};
}

// exported constants so tests can drive the limiter without magic numbers
export const RATE_LIMIT_CONFIG = {
	MAX_RPM,
	MAX_RPD
} as const;
