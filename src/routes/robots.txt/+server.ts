import type { RequestHandler } from './$types';

// dynamic robots.txt so the sitemap URL tracks whatever domain we deploy to
export const GET: RequestHandler = ({ url }) => {
	const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /history
Disallow: /login

Sitemap: ${url.origin}/sitemap.xml
Sitemap: ${url.origin}/docs/sitemap-index.xml
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			// browser holds for 1h; vercel cdn holds for 1d so badly-behaved
			// crawlers cannot keep waking the function. stale-while-revalidate
			// lets the cdn serve a cached copy for up to 7d while it refreshes.
			'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
		}
	});
};

// keep dynamic; prerender would bake the request origin at build time and
// preview deploys would ship a Sitemap URL pointing at production
