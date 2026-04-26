import { describe, expect, it } from 'vitest';
import {
	createThrottle,
	isExtensionNoise,
	reportKey,
	shouldLogReport
} from '../../../src/routes/api/csp-report/throttle';

describe('reportKey', () => {
	it('derives a stable key from the legacy csp-report wrapper', () => {
		const body = {
			'csp-report': {
				'violated-directive': 'script-src',
				'blocked-uri': 'https://evil.example/inject.js'
			}
		};
		expect(reportKey(body)).toBe('script-src|https://evil.example/inject.js');
	});

	it('derives a stable key from the modern reporting-api list shape', () => {
		const body = [
			{
				type: 'csp-violation',
				body: {
					'effective-directive': 'connect-src',
					'blocked-uri': 'https://api.bad.example/'
				}
			}
		];
		expect(reportKey(body)).toBe('connect-src|https://api.bad.example/');
	});

	it('falls back to "unknown" when fields are missing', () => {
		expect(reportKey({})).toBe('unknown|unknown');
		expect(reportKey(null)).toBe('unknown|unknown');
	});
});

describe('isExtensionNoise', () => {
	it('flags chrome-extension blocked-uri', () => {
		const body = {
			'csp-report': {
				'violated-directive': 'script-src',
				'blocked-uri': 'chrome-extension://abc/script.js'
			}
		};
		expect(isExtensionNoise(body)).toBe(true);
	});

	it('flags moz-extension source-file', () => {
		const body = {
			'csp-report': {
				'violated-directive': 'script-src',
				'blocked-uri': 'inline',
				'source-file': 'moz-extension://xyz/inject.js'
			}
		};
		expect(isExtensionNoise(body)).toBe(true);
	});

	it('flags safari-web-extension document-uri', () => {
		const body = {
			'csp-report': {
				'violated-directive': 'connect-src',
				'blocked-uri': 'https://x',
				'document-uri': 'safari-web-extension://abc/page.html'
			}
		};
		expect(isExtensionNoise(body)).toBe(true);
	});

	it('lets a real https violation through', () => {
		const body = {
			'csp-report': {
				'violated-directive': 'script-src',
				'blocked-uri': 'https://evil.example/inject.js',
				'document-uri': 'https://ats-screener.vercel.app/scanner'
			}
		};
		expect(isExtensionNoise(body)).toBe(false);
	});

	it('returns false for an empty body', () => {
		expect(isExtensionNoise({})).toBe(false);
		expect(isExtensionNoise(null)).toBe(false);
	});
});

describe('shouldLogReport', () => {
	it('logs the first occurrence and dedupes repeats inside the window', () => {
		const state = createThrottle();
		const now = 1_000_000;
		expect(shouldLogReport('a|x', now, state)).toBe(true);
		expect(shouldLogReport('a|x', now + 1000, state)).toBe(false);
		expect(shouldLogReport('a|x', now + 60_000, state)).toBe(false);
	});

	it('re-logs a key after the dedupe window has fully rolled', () => {
		const state = createThrottle();
		const t0 = 1_000_000;
		expect(shouldLogReport('a|x', t0, state)).toBe(true);
		// just inside the window: still suppressed
		expect(shouldLogReport('a|x', t0 + 5 * 60_000 - 1, state)).toBe(false);
		// fully past the window: emits again
		expect(shouldLogReport('a|x', t0 + 5 * 60_000, state)).toBe(true);
	});

	it('lets distinct keys through independently', () => {
		const state = createThrottle();
		const now = 1_000_000;
		expect(shouldLogReport('a|x', now, state)).toBe(true);
		expect(shouldLogReport('b|y', now, state)).toBe(true);
		expect(shouldLogReport('a|x', now, state)).toBe(false);
	});

	it('caps logs to 100 per rolling minute even with all-distinct keys', () => {
		const state = createThrottle();
		const t0 = 1_000_000;
		let logged = 0;
		for (let i = 0; i < 200; i++) {
			if (shouldLogReport(`k${i}|x`, t0, state)) logged++;
		}
		expect(logged).toBe(100);
	});

	it('resets the per-minute cap once the next minute window starts', () => {
		const state = createThrottle();
		const t0 = 1_000_000;
		for (let i = 0; i < 100; i++) shouldLogReport(`k${i}|x`, t0, state);
		// 101st distinct key inside the same minute is dropped
		expect(shouldLogReport('k100|x', t0 + 30_000, state)).toBe(false);
		// past the minute boundary, the cap resets
		expect(shouldLogReport('k101|x', t0 + 60_000, state)).toBe(true);
	});

	it('fails open: a true new violation eventually logs after the cap rolls', () => {
		const state = createThrottle();
		const t0 = 1_000_000;
		for (let i = 0; i < 100; i++) shouldLogReport(`flood${i}|x`, t0, state);
		expect(shouldLogReport('legit|y', t0 + 30_000, state)).toBe(false);
		// minute later: legit signal lands
		expect(shouldLogReport('legit|y', t0 + 60_000, state)).toBe(true);
	});
});
