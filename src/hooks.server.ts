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

// CSP in report-only mode: violations are reported to /api/csp-report but
// nothing is blocked. lets us observe what would break before enforcing.
// directives are sized for: SvelteKit hydration (inline scripts/styles),
// Google Fonts, Firebase Auth (popup + APIs), Firestore, and the LLM proxies
// the api/analyze route uses (groq + gemini are server-side, not in client connect-src)
const CSP_REPORT_ONLY = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
	"font-src 'self' https://fonts.gstatic.com",
	"img-src 'self' data: https:",
	"connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://*.firebase.com",
	"frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
	"worker-src 'self' blob:",
	"object-src 'none'",
	"base-uri 'self'",
	"form-action 'self'",
	'report-uri /api/csp-report'
].join('; ');

function applySecurityHeaders(response: Response, path: string): Response {
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		if (!response.headers.has(name)) response.headers.set(name, value);
	}
	// don't apply CSP to the csp-report endpoint itself (avoid feedback loops on
	// any future violation in error responses) or to non-html responses where it's irrelevant
	if (path !== '/api/csp-report' && !response.headers.has('Content-Security-Policy-Report-Only')) {
		response.headers.set('Content-Security-Policy-Report-Only', CSP_REPORT_ONLY);
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
				}),
				path
			);
		}
	}

	return applySecurityHeaders(await resolve(event), path);
};
