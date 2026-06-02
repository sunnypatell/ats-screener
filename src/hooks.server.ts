import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { resolveAuthMode } from '$lib/server/auth/config';
import { verifySession, SESSION_COOKIE } from '$lib/server/auth/session';
import { buildContentSecurityPolicy } from '$lib/server/csp';
// no node built-ins here - hooks.server.ts is bundled into BOTH node and edge
// route functions, and edge bundling fails on fs/path/node:crypto. docs serving
// (which used fs) lives in a node-runtime catchall route at /docs/[...slug].
// the auth-session imports above stay edge-safe on purpose: config.ts is pure
// string work and session.ts verifies the cookie with Web Crypto (not node:crypto).

// applied as defaults: routes that already set a header keep their value.
// headers that are conditional (e.g. HSTS) are applied in applySecurityHeaders
// rather than here so the logic can inspect the request protocol.
const SECURITY_HEADERS: Record<string, string> = {
	// HSTS: 2 years (63072000s) is the minimum for the Chrome preload list.
	// "preload" signals intent to appear on the hardcoded browser preload list.
	// "includeSubDomains" covers *.ats-screener.vercel.app preview deploys.
	// only emitted on HTTPS (see applySecurityHeaders) - localhost is excluded.
	'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
	// strict-origin-when-cross-origin: sends the full URL as Referer to same-origin
	// requests and only the bare origin to cross-origin, suppressing it entirely on
	// downgrade (HTTPS -> HTTP). prevents leaking path/query details to third parties.
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	// deny-list for browser APIs we never use. also opts out of FLoC (interest-cohort)
	// and its replacement Topics API (browsing-topics) to block ad-tracking signals.
	'Permissions-Policy':
		'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()',
	// prevents MIME-type sniffing: browsers must respect the declared Content-Type.
	// mitigates content-injection attacks where an attacker uploads a file the
	// browser re-interprets as HTML or JS.
	'X-Content-Type-Options': 'nosniff',
	// prevents this site from being embedded in an <iframe> or <frame> on any other
	// origin, blocking classic clickjacking attacks.
	'X-Frame-Options': 'DENY',
	// COOP: same-origin-allow-popups isolates our browsing context from cross-origin
	// window references (Spectre side-channel mitigation) while still allowing
	// window.opener communication from cross-origin popups WE opened. using plain
	// "same-origin" would break Firebase signInWithPopup because the Google accounts
	// popup (accounts.google.com) communicates back to the opener via window.opener,
	// and that opener reference is severed by same-origin. same-origin-allow-popups
	// keeps the reference alive for popups this page opened while blocking
	// cross-origin pages from referencing us.
	'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
	// CORP: prevents other origins from loading our resources cross-origin (fetch,
	// XHR, <img>, <script>, etc.) without an explicit CORS grant. mitigates
	// Spectre-class cross-origin information leaks and CSRF-via-resource attacks.
	// EXCEPTION: /api/og sets Cross-Origin-Resource-Policy: cross-origin explicitly
	// so social platforms (LinkedIn, Twitter, Facebook) can fetch the og image.
	// the hook skips headers already set by the route, so the og route wins.
	'Cross-Origin-Resource-Policy': 'same-origin',
	// tells browsers to respect our explicit <link rel="dns-prefetch"> hints
	// (already in app.html for Firebase/Google hosts) rather than doing their
	// own speculative prefetching. "on" = enable browser-level prefetching of
	// subresources on this page, consistent with the explicit hints we already ship.
	'X-DNS-Prefetch-Control': 'on',
	// disables Adobe Flash and PDF cross-domain policy file loading, which would
	// allow third-party SWFs or PDFs to make cross-domain requests as if they
	// were same-origin. legacy surface but zero cost to close.
	'X-Permitted-Cross-Domain-Policies': 'none'
};

// CSP in report-only mode: violations are reported to /api/csp-report but
// nothing is blocked. lets us observe what would break before enforcing. the
// firebase / google-auth origins are mode-aware (see $lib/server/csp): a
// self-host without firebase gets a CSP with zero firebase references, so the
// directory-only or anonymous deployment never advertises firebase hosts (#13).
function applySecurityHeaders(
	response: Response,
	path: string,
	isHttps: boolean,
	csp: string
): Response {
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		// HSTS must only be sent on HTTPS responses. sending it on HTTP (e.g. localhost
		// dev server) would instruct the browser to upgrade all future requests to HTTPS,
		// which breaks the local dev workflow permanently until the HSTS entry expires.
		if (name === 'Strict-Transport-Security' && !isHttps) continue;
		if (!response.headers.has(name)) response.headers.set(name, value);
	}
	// emit CSP-Report-Only on every response except the report endpoint itself
	// (avoids feedback loops on its own error responses). browsers apply CSP
	// directives only on document/iframe contexts so the header is benign on
	// JSON / image / svg responses, just unread bytes on the wire
	if (path !== '/api/csp-report' && !response.headers.has('Content-Security-Policy-Report-Only')) {
		response.headers.set('Content-Security-Policy-Report-Only', csp);
	}
	return response;
}

export const handle: Handle = async ({ event, resolve }) => {
	// server-side session, ldap self-host mode ONLY. inert in firebase/none mode
	// and on the hosted deploy: resolveAuthMode returns 'ldap' only when LDAP_URL
	// is set (which the hosted instance never does), so no cookie is read and
	// locals.user stays null - exactly as before this feature existed.
	const mode = resolveAuthMode({ ...env, ...publicEnv });

	event.locals.user = null;
	if (mode === 'ldap') {
		const token = event.cookies.get(SESSION_COOKIE);
		if (token) {
			const payload = await verifySession(token, env.SESSION_SECRET ?? '');
			if (payload) {
				event.locals.user = {
					sub: payload.sub,
					name: payload.name,
					email: payload.email,
					groups: payload.groups
				};
			}
		}
	}

	// firebase origins appear in the CSP only when firebase is the active auth
	// mode, so a self-host without firebase never advertises them (#13).
	const csp = buildContentSecurityPolicy(mode === 'firebase');
	const path = event.url.pathname;
	const isHttps = event.url.protocol === 'https:';
	return applySecurityHeaders(await resolve(event), path, isHttps, csp);
};
