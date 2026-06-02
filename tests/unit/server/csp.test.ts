import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy } from '../../../src/lib/server/csp';

const FIREBASE_TOKENS = [
	'*.googleapis.com',
	'*.firebaseio.com',
	'*.firebaseapp.com',
	'*.firebase.com',
	'accounts.google.com'
];

describe('buildContentSecurityPolicy: firebase mode', () => {
	const csp = buildContentSecurityPolicy(true);

	it('includes the firebase / google-auth origins in connect-src and frame-src', () => {
		expect(csp).toContain('https://*.googleapis.com');
		expect(csp).toContain('https://*.firebaseio.com');
		expect(csp).toContain('https://*.firebaseapp.com');
		expect(csp).toContain('https://accounts.google.com');
	});
});

describe('buildContentSecurityPolicy: no-firebase self-host (#13)', () => {
	const csp = buildContentSecurityPolicy(false);

	it('contains ZERO firebase / google-auth references', () => {
		for (const token of FIREBASE_TOKENS) {
			expect(csp, `CSP should not mention ${token} in non-firebase mode`).not.toContain(token);
		}
	});

	it('keeps connect-src and frame-src locked to self', () => {
		expect(csp).toContain("connect-src 'self';");
		expect(csp).toContain("frame-src 'self';");
	});
});

describe('buildContentSecurityPolicy: invariants in every mode', () => {
	for (const allowFirebase of [true, false]) {
		const csp = buildContentSecurityPolicy(allowFirebase);
		const label = allowFirebase ? 'firebase' : 'self-host';

		it(`(${label}) keeps the report-uri, object-src none, and form-action self`, () => {
			expect(csp).toContain('report-uri /api/csp-report');
			expect(csp).toContain("object-src 'none'");
			expect(csp).toContain("form-action 'self'");
		});

		it(`(${label}) keeps google fonts (Geist loads from there regardless of auth)`, () => {
			expect(csp).toContain('https://fonts.googleapis.com');
			expect(csp).toContain('https://fonts.gstatic.com');
		});
	}
});
