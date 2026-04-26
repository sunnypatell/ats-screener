import type { RequestHandler } from './$types';
import { logger } from '$lib/log';

// receives sampled client-side error reports from $lib/error-reporter.
// logs to stdout only (no storage), so vercel log aggregation surfaces
// the trickle without spending a firestore write or a paid telemetry seat.
//
// the client samples before posting, so we trust whatever it sends and
// just focus on shape validation and a hard cap to defend against a
// runaway error loop. the cap is per instance and rolls each minute.

interface ErrorReport {
	message?: unknown;
	source?: unknown;
	line?: unknown;
	col?: unknown;
	stack?: unknown;
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

function clip(v: unknown, max: number): string {
	if (typeof v !== 'string') return '';
	return v.length > max ? v.slice(0, max) : v;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json().catch(() => null)) as ErrorReport | null;
		if (body && shouldLog(Date.now())) {
			// payload is intentionally truncated. message and stack are the
			// load-bearing fields; url/ua/source/line/col help triage; everything
			// else is dropped to keep log lines small and out of the way of
			// other diagnostics.
			logger.warn('client.error', {
				message: clip(body.message, 500),
				source: clip(body.source, 200),
				line: typeof body.line === 'number' ? body.line : null,
				col: typeof body.col === 'number' ? body.col : null,
				stack: clip(body.stack, 1500),
				url: clip(body.url, 300),
				ua: clip(body.ua, 200)
			});
		}
	} catch {
		// reporting must never break the request path
	}
	return new Response(null, { status: 204 });
};
