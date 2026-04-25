import { error } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { RequestHandler } from './$types';

// node-runtime catchall: serves directory-style URLs from the Astro Starlight
// build output in static/docs (e.g. /docs/intro -> static/docs/intro/index.html).
// Vercel's static handler already serves files with explicit extensions
// (.html/.css/.js/etc), so this only fires when no file matched.
//
// fs/path live ONLY here so they don't leak into the edge bundle for /api/og
export const GET: RequestHandler = ({ url }) => {
	const path = url.pathname;
	const staticBase = join(process.cwd(), 'static');
	const withIndex = join(staticBase, path, 'index.html');

	if (!existsSync(withIndex)) {
		throw error(404, 'docs page not found');
	}

	const html = readFileSync(withIndex, 'utf-8');
	return new Response(html, {
		headers: { 'Content-Type': 'text/html; charset=utf-8' }
	});
};
