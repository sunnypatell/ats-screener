import { error } from '@sveltejs/kit';
import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import type { RequestHandler } from './$types';

// node-runtime catchall: serves directory-style URLs from the Astro Starlight
// build output in static/docs (e.g. /docs/intro -> static/docs/intro/index.html).
// Vercel's static handler already serves files with explicit extensions
// (.html/.css/.js/etc), so this only fires when no file matched.
//
// fs/path live ONLY here so they don't leak into the edge bundle for /api/og.
// Note: path.join('/foo', '/bar') returns '/foo/bar' (Node concatenates absolute
// segments after the first), so a leading slash on url.pathname doesn't drop
// staticBase. The real risk is path traversal via "/docs/../../etc/passwd";
// resolve()+startsWith on the docsRoot blocks that.
export const GET: RequestHandler = ({ url }) => {
	const docsRoot = resolve(process.cwd(), 'static', 'docs');
	// strip the leading "/docs" since docsRoot already points there
	const slug = url.pathname.replace(/^\/docs\/?/, '');
	const candidate = resolve(docsRoot, slug, 'index.html');

	// path-traversal guard: candidate must stay under docsRoot
	const rooted = candidate === docsRoot || candidate.startsWith(docsRoot + sep);
	if (!rooted || !existsSync(candidate)) {
		throw error(404, 'docs page not found');
	}

	// realpath check defends against symlink escapes
	const realCandidate = realpathSync(candidate);
	const realRoot = realpathSync(docsRoot);
	if (realCandidate !== realRoot && !realCandidate.startsWith(realRoot + sep)) {
		throw error(404, 'docs page not found');
	}

	const html = readFileSync(realCandidate, 'utf-8');
	return new Response(html, {
		headers: { 'Content-Type': 'text/html; charset=utf-8' }
	});
};
