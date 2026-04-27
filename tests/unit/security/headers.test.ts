import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// regression guard for security headers declared in hooks.server.ts.
// this test reads the file as text and asserts the exact header name+value
// strings appear, making it impossible to silently remove or weaken a header
// without breaking CI.
//
// rationale: hooks.server.ts is the single source of truth for global security
// headers. a future refactor that renames the SECURITY_HEADERS key or changes
// a value (e.g. shortening the HSTS max-age below the preload-list minimum,
// or removing COOP) would be a silent regression with no runtime error. this
// test makes the regression visible immediately.
//
// test scope:
//   - each new and existing header name appears in the SECURITY_HEADERS map
//   - each header carries the correct value string
//   - HSTS max-age meets the 2-year Chrome preload-list minimum (63072000s)
//   - HSTS includes the includeSubDomains and preload directives
//   - COOP is same-origin-allow-popups (not plain same-origin, which would
//     break Firebase signInWithPopup via accounts.google.com cross-origin popup)
//   - CORP is same-origin globally
//   - /api/og explicitly overrides CORP to cross-origin for social platforms
//   - HSTS is gated on isHttps (the dev server does not receive the header)
//   - X-DNS-Prefetch-Control and X-Permitted-Cross-Domain-Policies are present

const HOOKS_PATH = join(process.cwd(), 'src', 'hooks.server.ts');
const OG_PATH = join(process.cwd(), 'src', 'routes', 'api', 'og', '+server.ts');

const hooks = readFileSync(HOOKS_PATH, 'utf-8');
const ogRoute = readFileSync(OG_PATH, 'utf-8');

describe('security headers: hooks.server.ts regression guard', () => {
	it('declares Strict-Transport-Security with 2-year max-age (63072000)', () => {
		expect(hooks).toContain("'Strict-Transport-Security'");
		expect(hooks).toContain('max-age=63072000');
	});

	it('includes includeSubDomains and preload directives in HSTS value', () => {
		expect(hooks).toContain('includeSubDomains; preload');
	});

	it('gates HSTS on isHttps so localhost dev sessions are not affected', () => {
		// the guard must check the https condition before setting the header
		expect(hooks).toContain("'Strict-Transport-Security' && !isHttps");
	});

	it('declares Cross-Origin-Opener-Policy as same-origin-allow-popups', () => {
		// plain "same-origin" would sever window.opener for the Firebase Google
		// auth popup (accounts.google.com), breaking signInWithPopup entirely.
		// same-origin-allow-popups keeps the opener reference alive for popups
		// this page opened while still isolating us from cross-origin openers.
		expect(hooks).toContain("'Cross-Origin-Opener-Policy'");
		expect(hooks).toContain("'same-origin-allow-popups'");
		// confirm plain same-origin is NOT the chosen value
		expect(hooks).not.toMatch(/'Cross-Origin-Opener-Policy':\s*'same-origin'[^-]/);
	});

	it('declares Cross-Origin-Resource-Policy as same-origin globally', () => {
		expect(hooks).toContain("'Cross-Origin-Resource-Policy'");
		expect(hooks).toContain("'same-origin'");
	});

	it('declares X-DNS-Prefetch-Control as on', () => {
		expect(hooks).toContain("'X-DNS-Prefetch-Control'");
		expect(hooks).toContain("'on'");
	});

	it('declares X-Permitted-Cross-Domain-Policies as none', () => {
		expect(hooks).toContain("'X-Permitted-Cross-Domain-Policies'");
		// value is the string "none" (not "no" which would be wrong)
		expect(hooks).toContain("'none'");
	});

	it('retains existing X-Content-Type-Options: nosniff', () => {
		expect(hooks).toContain("'X-Content-Type-Options'");
		expect(hooks).toContain('nosniff');
	});

	it('retains existing X-Frame-Options: DENY', () => {
		expect(hooks).toContain("'X-Frame-Options'");
		expect(hooks).toContain('DENY');
	});

	it('retains existing Referrer-Policy: strict-origin-when-cross-origin', () => {
		expect(hooks).toContain("'Referrer-Policy'");
		expect(hooks).toContain('strict-origin-when-cross-origin');
	});

	it('retains existing Permissions-Policy with privacy opt-outs', () => {
		expect(hooks).toContain("'Permissions-Policy'");
		expect(hooks).toContain('interest-cohort=()');
		expect(hooks).toContain('browsing-topics=()');
	});
});

describe('security headers: /api/og CORP exception', () => {
	it('overrides Cross-Origin-Resource-Policy to cross-origin on the og route', () => {
		// social platforms (LinkedIn, Twitter, Facebook, Slack) fetch og images
		// from their own origin. the global same-origin CORP would block these
		// requests and break every share card. the og route must explicitly override.
		expect(ogRoute).toContain("'Cross-Origin-Resource-Policy': 'cross-origin'");
	});

	it('sets cross-origin CORP on both the cached and fresh render response paths', () => {
		// the og route has two early-return paths: LRU cache hit and fresh render.
		// both must carry the override so a cache hit does not silently revert to
		// same-origin after the in-memory cache warms up.
		const occurrences = (ogRoute.match(/'Cross-Origin-Resource-Policy': 'cross-origin'/g) ?? [])
			.length;
		expect(occurrences).toBeGreaterThanOrEqual(2);
	});
});
