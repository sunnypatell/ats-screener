import type { RequestHandler } from './$types';
import { logger } from '$lib/log';

// receives sampled core-web-vitals reports from $lib/web-vitals.
// emits structured logs only (via $lib/log), no storage. mirrors the
// /api/log-error pattern so vercel log aggregation surfaces the trickle
// without spending a firestore write or a paid telemetry seat.
//
// the client samples before posting; we focus on shape clamping plus a
// per-instance hard cap so a runaway client cannot flood logs.

interface VitalsReport {
	lcp?: unknown;
	cls?: unknown;
	url?: unknown;
	ua?: unknown;
	at?: unknown;
}

const RATE_CAP_PER_MIN = 60;
let windowStart = 0;
let logsThisWindow = 0;

function shouldLog(now: number): boolean {
	if (now - windowStart >= 60_000) {
		windowStart = now;
		logsThisWindow = 0;
	}
	if (logsThisWindow >= RATE_CAP_PER_MIN) return false;
	logsThisWindow += 1;
	return true;
}

function clipString(v: unknown, max: number): string {
	if (typeof v !== 'string') return '';
	return v.length > max ? v.slice(0, max) : v;
}

// finite numbers in a sane vitals range. anything else gets nulled out.
function clipNumber(v: unknown, max: number): number | null {
	if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > max) return null;
	// round to one decimal so logs stay readable
	return Math.round(v * 10) / 10;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json().catch(() => null)) as VitalsReport | null;
		if (body && shouldLog(Date.now())) {
			logger.info('vitals.report', {
				// LCP is wall-clock ms since navigation start; cap at 60s to
				// drop pathological outliers (a wedged page that never resolved).
				lcp: clipNumber(body.lcp, 60_000),
				// CLS is unitless cumulative layout shift; healthy < 0.1, poor > 0.25,
				// cap at 5 to catch only the truly broken pages.
				cls: clipNumber(body.cls, 5),
				url: clipString(body.url, 300),
				ua: clipString(body.ua, 200),
				at: clipString(body.at, 50)
			});
		}
	} catch {
		// observability must never raise
	}
	return new Response(null, { status: 204 });
};
