// client-side error reporter. hooks window.onerror and unhandledrejection,
// samples at a low rate (default 5%), posts to /api/log-error.
//
// deliberately minimal:
//   - no third-party tooling
//   - no PII collected (ip is observed by the server only as the request ip,
//     not the body; we never read or send user state)
//   - no stack frames are remapped (we ship sourcemaps to vercel; stacks
//     are useful enough as-is for triage)
//   - no batching or retry: if the request fails, the report is dropped.
//     this is observability, not auditing.
//
// rate limits applied at the server (60/min hard cap per instance) plus
// the 5% sample here mean even a runaway error loop is bounded.

import { browser } from '$app/environment';
import { env as publicEnv } from '$env/dynamic/public';
import { parseSampleRate, shouldSample } from './sampling';

const ENDPOINT = '/api/log-error';

// default 0.05 (5%). dial up to 1.0 in dev to verify the path; dial down
// to 0.01 if even the sampled trickle gets noisy in production logs.
const SAMPLE_RATE = parseSampleRate(publicEnv.PUBLIC_ERROR_SAMPLE_RATE) || 0.05;

let installed = false;

interface ErrorReportInput {
	message: string;
	source?: string;
	line?: number;
	col?: number;
	stack?: string;
}

function postReport(input: ErrorReportInput): void {
	if (!browser) return;
	// content-addressed seed so the same recurring error from the same
	// page resolves the same sampling decision. drops noise from one
	// looping bug while still letting other errors through.
	const seed = `${input.message}|${input.source ?? ''}|${input.line ?? ''}`;
	if (!shouldSample(seed, SAMPLE_RATE)) return;

	const payload = {
		...input,
		url: window.location.href,
		ua: window.navigator.userAgent,
		at: new Date().toISOString()
	};

	// keepalive lets the request complete even if the user is navigating
	// away when the error fired (common case for unhandled rejections on
	// page unload). text/plain content-type avoids a CORS preflight and
	// keeps the request body small.
	try {
		fetch(ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
			keepalive: true
		}).catch(() => {
			// drop on the floor. observability must never raise.
		});
	} catch {
		// drop on the floor.
	}
}

// attach once. idempotent so multiple components can call install() safely.
export function installErrorReporter(): void {
	if (!browser || installed) return;
	installed = true;

	window.addEventListener('error', (event) => {
		postReport({
			message: event.message ?? String(event.error ?? 'unknown error'),
			source: event.filename,
			line: event.lineno,
			col: event.colno,
			stack: event.error instanceof Error ? event.error.stack : undefined
		});
	});

	window.addEventListener('unhandledrejection', (event) => {
		const reason = event.reason;
		const message =
			reason instanceof Error
				? reason.message
				: typeof reason === 'string'
					? reason
					: 'unhandled rejection';
		const stack = reason instanceof Error ? reason.stack : undefined;
		postReport({ message, stack });
	});
}
