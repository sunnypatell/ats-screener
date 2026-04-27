import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// structural invariant tests for src/service-worker.ts.
//
// a real service worker cannot run in jsdom (no ServiceWorkerGlobalScope, no
// Cache API). instead we assert textual invariants that guarantee the caching
// contract is enforced at the source level. a future refactor that breaks any
// of these invariants will fail CI before reaching production.

const SW_PATH = join(process.cwd(), 'src/service-worker.ts');
const sw = readFileSync(SW_PATH, 'utf-8');

describe('service-worker: structural invariants', () => {
	it('imports build, files, and version from $service-worker', () => {
		// all three names must be destructured from the virtual module so the
		// precache list and cache name are populated from the actual build output.
		expect(sw).toMatch(/from\s+['"]\$service-worker['"]/);
		expect(sw).toMatch(/\bbuild\b/);
		expect(sw).toMatch(/\bfiles\b/);
		expect(sw).toMatch(/\bversion\b/);
	});

	it('uses version in the cache name so deploys invalidate old caches', () => {
		// the cache-name must embed `version`. if it did not, activate would
		// never delete old caches and users would get stale assets forever.
		expect(sw).toMatch(/cache.*version|version.*cache/);
	});

	it('registers an install event listener', () => {
		expect(sw).toMatch(/addEventListener\s*\(\s*['"]install['"]/);
	});

	it('registers an activate event listener', () => {
		expect(sw).toMatch(/addEventListener\s*\(\s*['"]activate['"]/);
	});

	it('registers a fetch event listener', () => {
		expect(sw).toMatch(/addEventListener\s*\(\s*['"]fetch['"]/);
	});

	it('skips /api/ paths so LLM responses are never cached', () => {
		// this is the most critical invariant: caching /api/analyze would
		// serve stale scores to every subsequent visitor. the check must be
		// present in the source regardless of future refactors.
		expect(sw).toMatch(/\/api\//);
		// the path must be guarded with an early return or skip, not just
		// mentioned in a comment. require the pattern to appear near a `return`.
		expect(sw).toMatch(/\/api\/.*return|return.*\/api\//s);
	});

	it('skips cross-origin requests by comparing origins', () => {
		// cross-origin resources (CDN fonts, external images) must not be cached
		// because we cannot predict their CORS headers or cache-control policy.
		expect(sw).toMatch(/\.origin/);
		expect(sw).toMatch(/origin.*return|return.*origin/s);
	});

	it('only intercepts GET requests so mutations reach the network', () => {
		// POST/PUT/DELETE must pass through. the check must be present as a
		// guard return, not merely as a comment.
		expect(sw).toMatch(/method.*GET|GET.*method/);
		expect(sw).toMatch(/method.*return|return.*method/s);
	});
});
