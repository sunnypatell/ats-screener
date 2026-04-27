import type { RequestHandler } from './$types';
import { logger } from '$lib/log';
import { isExtensionNoise, reportKey, shouldLogReport } from './throttle';

// receives violation reports from the Content-Security-Policy-Report-Only
// header in src/hooks.server.ts. logs to stdout only (no storage) so
// vercel's log aggregation surfaces them without spending a firestore write.
// throttle prevents a single misconfigured browser extension from flooding
// logs: same (directive, blocked-uri) pair is logged at most once per
// 5-minute window, with a hard cap of 100 logs per rolling minute.
export const POST: RequestHandler = async ({ request }) => {
	try {
		const ct = request.headers.get('content-type') ?? '';
		// browsers send either Content-Type: application/csp-report (legacy)
		// or application/reports+json (modern Reporting API)
		const body = await request.json().catch(() => null);
		// drop browser-extension noise before the throttle so its rate-cap
		// budget is reserved for genuine CSP violations from our own code.
		if (body && !isExtensionNoise(body) && shouldLogReport(reportKey(body))) {
			logger.warn('csp.violation', {
				contentType: ct,
				body: JSON.stringify(body).slice(0, 1000)
			});
		}
	} catch {
		// swallow; reporting must never break the request path
	}
	return new Response(null, { status: 204 });
};
