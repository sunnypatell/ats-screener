// in-process throttle for csp-report logs.
// a misconfigured browser extension can fire the same violation thousands
// of times per session. without throttling, every report turns into a
// console.warn line in vercel logs, which is noisy and (at scale) starts
// approaching log-retention quotas.
//
// two layers of defense:
//   1. dedupe by (directive, blockedUri) over DEDUP_WINDOW_MS so we log
//      each unique (problem, source) pair at most once per window
//   2. a rolling per-minute hard cap so even fully-distinct reports cannot
//      flood the logs faster than RATE_CAP_PER_MIN
//
// both layers fail-open in the sense that a true new violation eventually
// gets logged once the window or cap rolls. fail-closed would mean we
// silence the only signal we have about real CSP problems.

const DEDUP_WINDOW_MS = 5 * 60_000;
const RATE_CAP_PER_MIN = 100;

interface ThrottleState {
	seen: Map<string, number>;
	lastMinuteWindowStart: number;
	logsThisMinute: number;
}

export function createThrottle(): ThrottleState {
	return {
		seen: new Map(),
		lastMinuteWindowStart: 0,
		logsThisMinute: 0
	};
}

// module-level instance for the route to share. tests use createThrottle()
// to get a fresh state.
const moduleState = createThrottle();

export function shouldLogReport(
	key: string,
	now: number = Date.now(),
	state: ThrottleState = moduleState
): boolean {
	// dedupe: same key within window? drop.
	const last = state.seen.get(key);
	if (last !== undefined && now - last < DEDUP_WINDOW_MS) return false;

	// rate cap: rolling 1-minute window, hard ceiling.
	if (now - state.lastMinuteWindowStart >= 60_000) {
		state.lastMinuteWindowStart = now;
		state.logsThisMinute = 0;
	}
	if (state.logsThisMinute >= RATE_CAP_PER_MIN) return false;

	// record and emit
	state.seen.set(key, now);
	state.logsThisMinute += 1;

	// best-effort gc: when the seen map grows past 4x the rate cap, drop
	// any entries older than the dedupe window. amortized O(1) per call.
	if (state.seen.size > RATE_CAP_PER_MIN * 4) {
		for (const [k, t] of state.seen) {
			if (now - t >= DEDUP_WINDOW_MS) state.seen.delete(k);
		}
	}

	return true;
}

// browser-extension prefixes that almost always indicate user-installed
// extensions firing CSP violations against our pages, not real problems
// with our own code. dropping these stops the log channel from filling
// up with noise from popular extensions (ad blockers, password managers,
// dev tools that inject content scripts).
const EXTENSION_PREFIXES = [
	'chrome-extension://',
	'moz-extension://',
	'safari-extension://',
	'safari-web-extension://'
];

// returns true if the report should be silently dropped before throttling.
// runs ahead of shouldLogReport so dropped reports do not consume any of the
// per-minute cap, leaving room for genuine violations.
export function isExtensionNoise(body: unknown): boolean {
	const r = extractReport(body);
	if (!r) return false;
	const sources = [r['blocked-uri'], r['source-file'], r['document-uri']];
	for (const s of sources) {
		if (typeof s === 'string') {
			for (const prefix of EXTENSION_PREFIXES) {
				if (s.startsWith(prefix)) return true;
			}
		}
	}
	return false;
}

// derive the dedupe key from a parsed csp report body. accepts both the
// legacy {csp-report: {...}} shape and the modern reporting api list shape.
export function reportKey(body: unknown): string {
	const r = extractReport(body);
	const directive = String(r?.['violated-directive'] ?? r?.['effective-directive'] ?? 'unknown');
	const blocked = String(r?.['blocked-uri'] ?? r?.['source-file'] ?? 'unknown');
	return `${directive}|${blocked}`;
}

function extractReport(body: unknown): Record<string, unknown> | null {
	if (!body || typeof body !== 'object') return null;
	const b = body as Record<string, unknown>;
	if (b['csp-report'] && typeof b['csp-report'] === 'object') {
		return b['csp-report'] as Record<string, unknown>;
	}
	if (Array.isArray(b)) {
		const first = b[0];
		if (first && typeof first === 'object') {
			const f = first as Record<string, unknown>;
			if (f.body && typeof f.body === 'object') return f.body as Record<string, unknown>;
			return f;
		}
	}
	return b;
}

// exported only for tests
export const _internals = { DEDUP_WINDOW_MS, RATE_CAP_PER_MIN };
