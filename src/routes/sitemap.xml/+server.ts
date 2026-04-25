import type { RequestHandler } from './$types';

// public, indexable routes only - excludes auth-gated pages and API endpoints
const ROUTES: { path: string; changefreq: string; priority: number }[] = [
	{ path: '/', changefreq: 'weekly', priority: 1.0 },
	{ path: '/scanner', changefreq: 'weekly', priority: 0.9 },
	{ path: '/about', changefreq: 'monthly', priority: 0.7 }
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
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
