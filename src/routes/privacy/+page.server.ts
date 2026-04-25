import type { PageServerLoad } from './$types';

// privacy notice is fully static (no per-user state, no auth, no query params).
// caching aggressively at the vercel cdn pushes nearly all hits to the edge,
// which both reduces serverless function invocations and keeps the page fast
// for crawlers (the policy-quality signal we want google to pick up).
//
// stale-while-revalidate up to 7d is comfortable for legal copy that changes
// at most a few times a year. a real content change ships with a deploy,
// which invalidates the cache automatically.
export const load: PageServerLoad = ({ setHeaders }) => {
	setHeaders({
		'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
	});
	return {};
};
