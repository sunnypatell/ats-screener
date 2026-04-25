import type { RequestHandler } from './$types';

// dynamic robots.txt so the sitemap URL tracks whatever domain we deploy to
export const GET: RequestHandler = ({ url }) => {
	const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /history
Disallow: /login

Sitemap: ${url.origin}/sitemap.xml
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};

export const prerender = true;
