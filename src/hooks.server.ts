import type { Handle } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// applied as defaults: routes that already set a header keep their value
const SECURITY_HEADERS: Record<string, string> = {
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY'
};

function applySecurityHeaders(response: Response): Response {
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		if (!response.headers.has(name)) response.headers.set(name, value);
	}
	return response;
}

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	// serve static docs (Astro Starlight build output)
	if (path.startsWith('/docs')) {
		const staticBase = join(process.cwd(), 'static');
		// try path/index.html for directory-style URLs
		const withIndex = join(staticBase, path, 'index.html');
		if (existsSync(withIndex)) {
			const html = readFileSync(withIndex, 'utf-8');
			return applySecurityHeaders(
				new Response(html, {
					headers: { 'Content-Type': 'text/html; charset=utf-8' }
				})
			);
		}
	}

	return applySecurityHeaders(await resolve(event));
};
