// per-IP in-memory rate limiter
// dies with the instance (no distributed lock); fine on Vercel hobby/single instance
// upgrade path: swap the Maps for a kv-backed adapter without changing the public API

const rateLimits = new Map<string, { count: number; resetAt: number }>();
const dailyLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_RPM = 10;
const MAX_RPD = 200;
const MAX_MAP_SIZE = 10_000;

export type RateLimitResult =
	| { allowed: true }
	| { allowed: false; reason: 'minute' | 'daily'; retryAfterSec: number };

export function checkRateLimit(ip: string): RateLimitResult {
	const now = Date.now();

	// periodically clean up expired entries to prevent unbounded memory growth
	if (rateLimits.size > MAX_MAP_SIZE) {
		for (const [key, val] of rateLimits) {
			if (now > val.resetAt) rateLimits.delete(key);
		}
	}
	if (dailyLimits.size > MAX_MAP_SIZE) {
		for (const [key, val] of dailyLimits) {
			if (now > val.resetAt) dailyLimits.delete(key);
		}
	}

	// check both windows BEFORE incrementing, so a daily-limit failure
	// doesn't also consume a minute slot
	const minute = rateLimits.get(ip);
	if (minute && now < minute.resetAt && minute.count >= MAX_RPM) {
		return {
			allowed: false,
			reason: 'minute',
			retryAfterSec: Math.ceil((minute.resetAt - now) / 1000)
		};
	}

	const day = dailyLimits.get(ip);
	if (day && now < day.resetAt && day.count >= MAX_RPD) {
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

	return { allowed: true };
}

// exported constants so tests can drive the limiter without magic numbers
export const RATE_LIMIT_CONFIG = {
	MAX_RPM,
	MAX_RPD
} as const;
