import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// regression guards for Core Web Vitals readiness.
// these tests lock in the LCP/CLS improvements shipped in this iteration
// so future changes cannot silently undo them.
//
// invariants held:
// 1. app.html preloads the critical Geist font stylesheet (LCP: reduces
//    font-swap jank by fetching @font-face rules sooner)
// 2. app.html has no remote @import url(https:) in CSS (all font loading
//    goes through explicit <link> elements that the browser can see and
//    prioritise, not through late-discovered CSS @imports)
// 3. firebase dns-prefetch hints are present (regression net for the
//    dns-prefetch work already in place)
// 4. every <img> in .svelte files that has static dimensions must have
//    both width AND height attrs (CLS: explicit dimensions prevent layout
//    shift while the image loads)

const PROJECT_ROOT = process.cwd();
const SRC_ROOT = join(PROJECT_ROOT, 'src');
const APP_HTML = join(PROJECT_ROOT, 'src', 'app.html');
const LAYOUT_PATH = join(PROJECT_ROOT, 'src', 'routes', '+layout.svelte');

// extensions to scan for img tags
const SCAN_EXTS = ['.svelte', '.html'];

function walk(dir: string): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		const st = statSync(full);
		if (st.isDirectory()) {
			out.push(...walk(full));
		} else if (SCAN_EXTS.some((ext) => name.endsWith(ext))) {
			out.push(full);
		}
	}
	return out;
}

describe('lcp/cls readiness guards', () => {
	it('app.html preloads the google fonts stylesheet (critical font for LCP)', () => {
		const html = readFileSync(APP_HTML, 'utf-8');
		// must have a <link rel="preload" as="style"> pointing at the fonts
		// googleapis css (which contains the @font-face rules with display=swap)
		expect(html).toMatch(/rel="preload"\s[^>]*as="style"[^>]*fonts\.googleapis\.com/);
	});

	it('app.html has no remote @import url(https:) patterns (no late-discovered css font loads)', () => {
		const html = readFileSync(APP_HTML, 'utf-8');
		// @import url(https: inside a <style> block would hide font fetches from
		// the preload scanner and delay LCP
		expect(html).not.toMatch(/@import\s+url\s*\(\s*https:/i);
	});

	it('root layout retains dns-prefetch hints for firebase auth hosts (firebase mode only)', () => {
		// the hints moved out of app.html (where they fired for every visitor,
		// including no-firebase self-hosters, see #13) into a firebase-mode-gated
		// block in the root layout. they must still be present there so the firebase
		// deployment keeps the optimization.
		const layout = readFileSync(LAYOUT_PATH, 'utf-8');
		expect(layout).toMatch(/authStore\.mode === 'firebase'/);
		const requiredHosts = [
			'//accounts.google.com',
			'//apis.google.com',
			'//securetoken.googleapis.com',
			'//identitytoolkit.googleapis.com',
			'//firestore.googleapis.com'
		];
		for (const host of requiredHosts) {
			expect(layout, `missing dns-prefetch for ${host}`).toContain(host);
		}
	});

	it('app.html no longer hard-codes firebase dns-prefetch (no-firebase self-host stays firebase-free)', () => {
		const html = readFileSync(APP_HTML, 'utf-8');
		expect(html).not.toContain('//identitytoolkit.googleapis.com');
		expect(html).not.toContain('//firestore.googleapis.com');
	});

	it('app.html retains preconnect to fonts.googleapis.com and fonts.gstatic.com', () => {
		const html = readFileSync(APP_HTML, 'utf-8');
		expect(html).toMatch(/rel="preconnect"[^>]*fonts\.googleapis\.com/);
		expect(html).toMatch(/rel="preconnect"[^>]*fonts\.gstatic\.com/);
	});

	it('every static <img> in src/ has both width and height attributes (prevents CLS)', () => {
		// a "static" img is one whose src is not a dynamic svelte expression and
		// does not contain a bare {expression} as the src value. we scan for any
		// <img that exists as a literal html element (not template-only dynamic).
		//
		// known dynamic-only img: UserMenu.svelte avatar, whose src is always
		// authStore.photoURL (a runtime google account url) but we still require
		// explicit width/height on it to hint the browser to reserve space.
		//
		// the pattern: any <img tag that does NOT have both width="..." or
		// width={...} AND height="..." or height={...} is an offender.

		const files = walk(SRC_ROOT);
		const offenders: string[] = [];

		// regex that matches an <img opening tag (up to the closing > or />)
		// note: this is a best-effort structural match, not a full html parser.
		// it is sufficient for the codebase patterns we have (single-line or
		// multi-line attribute lists, no embedded > in attribute values).
		const imgTagPattern = /<img\b([^>]*(?:>[^<]*<[^>]*)*?)(?:\/?>)/gs;

		for (const file of files) {
			const content = readFileSync(file, 'utf-8');
			const rel = relative(PROJECT_ROOT, file).replaceAll('\\', '/');

			// reset lastIndex on each file
			imgTagPattern.lastIndex = 0;
			let match: RegExpExecArray | null;
			while ((match = imgTagPattern.exec(content)) !== null) {
				const attrs = match[1];
				// check for width and height attrs (covers both width="N" and width={N})
				const hasWidth = /\bwidth\s*[={\s]/.test(attrs);
				const hasHeight = /\bheight\s*[={\s]/.test(attrs);
				if (!hasWidth || !hasHeight) {
					// find approximate line number for the match
					const upTo = content.slice(0, match.index);
					const line = upTo.split('\n').length;
					const missing = [!hasWidth && 'width', !hasHeight && 'height']
						.filter(Boolean)
						.join(' and ');
					offenders.push(`${rel}:${line} (missing ${missing})`);
				}
			}
		}

		expect(offenders, `<img> tags missing dimension attrs:\n${offenders.join('\n')}`).toEqual([]);
	});
});
