import type { RequestHandler } from './$types';

// receives violation reports from the Content-Security-Policy-Report-Only header
// in src/hooks.server.ts. logs to stdout only (no storage) so vercel's log
// aggregation surfaces them without spending a single firestore write
export const POST: RequestHandler = async ({ request }) => {
	try {
		const ct = request.headers.get('content-type') ?? '';
		// browsers send either Content-Type: application/csp-report (legacy)
		// or application/reports+json (modern Reporting API)
		const body = await request.json().catch(() => null);
		if (body) {
			console.warn('[csp-violation]', ct, JSON.stringify(body).slice(0, 1000));
		}
	} catch {
		// swallow; reporting must never break the request path
	}
	return new Response(null, { status: 204 });
};
