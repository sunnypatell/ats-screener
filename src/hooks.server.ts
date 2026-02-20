import type { Handle } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	// serve static docs (Astro Starlight build output)
	if (path.startsWith('/docs')) {
		const staticBase = join(process.cwd(), 'static');
		// try path/index.html for directory-style URLs
		const withIndex = join(staticBase, path, 'index.html');
		if (existsSync(withIndex)) {
			const html = readFileSync(withIndex, 'utf-8');
			return new Response(html, {
				headers: { 'Content-Type': 'text/html; charset=utf-8' }
			});
		}
	}

	return resolve(event);
};
