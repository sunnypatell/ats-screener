import type { RequestHandler } from './$types';

// public, indexable routes only. excludes auth-gated pages (/history, /login)
// and API endpoints (covered by robots.txt Disallow rules). docs pages have
// their own sitemap that starlight emits at /docs/sitemap-index.xml; key docs
// landing pages are included here so they show up in the primary sitemap too.
const ROUTES: { path: string; changefreq: string; priority: number }[] = [
	// app pages
	{ path: '/', changefreq: 'weekly', priority: 1.0 },
	{ path: '/scanner', changefreq: 'weekly', priority: 0.9 },
	{ path: '/about', changefreq: 'monthly', priority: 0.7 },
	// high-priority docs landings (full docs sitemap also linked from robots.txt)
	{ path: '/docs/', changefreq: 'weekly', priority: 0.7 },
	{ path: '/docs/getting-started/introduction/', changefreq: 'monthly', priority: 0.6 },
	{ path: '/docs/scoring/methodology/', changefreq: 'monthly', priority: 0.6 },
	{ path: '/docs/platforms/overview/', changefreq: 'monthly', priority: 0.6 },
	{ path: '/docs/legal/privacy/', changefreq: 'monthly', priority: 0.4 }
];

export const GET: RequestHandler = ({ url }) => {
	const lastmod = new Date().toISOString().slice(0, 10);

	const urls = ROUTES.map(
		(r) => `	<url>
		<loc>${url.origin}${r.path}</loc>
		<lastmod>${lastmod}</lastmod>
		<changefreq>${r.changefreq}</changefreq>
		<priority>${r.priority.toFixed(1)}</priority>
	</url>`
	).join('\n');

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			// max-age = browser TTL (1h), s-maxage = vercel cdn TTL (1d),
			// stale-while-revalidate keeps serving cached content while a fresh
			// fetch happens in the background. lets the cdn absorb crawler hammer
			// without invoking the serverless function on every request.
			'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
		}
	});
};
