import { json, error } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { getRateLimitStats } from '../../analyze/rate-limiter';
import type { RequestHandler } from './$types';

// admin-only observability surface for the in-process rate-limiter.
// gated by ADMIN_TOKEN: no token configured server-side returns 503 so
// the endpoint cannot be exposed by accident, mismatched token returns
// 401. successful requests return the counter snapshot from rate-limiter.ts.
//
// the counters are per-instance and disappear on cold start, so this is
// best-effort, not authoritative. enough to spot abuse spikes in real
// time without spending a single byte of paid observability storage.
//
// rate-limiter itself is not exercised on this path; the request never
// reaches checkRateLimit, so admin polling does not consume an IP slot.
export const GET: RequestHandler = ({ request }) => {
	const expected = privateEnv.ADMIN_TOKEN;
	if (!expected || expected.length < 16) {
		// fail-closed when no strong token is configured. surface an explicit
		// 503 rather than 200 with stats, so a misconfigured deploy is loud.
		throw error(503, 'admin token not configured');
	}

	const provided = request.headers.get('x-admin-token') ?? '';
	// constant-time-ish comparison: short strings, no timing-attack stake here,
	// but use a length-checked equality anyway so a wrong-length probe does
	// not even touch the secret bytes.
	if (provided.length !== expected.length || provided !== expected) {
		throw error(401, 'unauthorized');
	}

	return json(getRateLimitStats(), {
		headers: { 'Cache-Control': 'no-store' }
	});
};
