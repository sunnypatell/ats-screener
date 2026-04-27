import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// guard test that fails the build if anyone ever adds raw-html rendering
// to user-or-LLM-derived content. svelte's `{@html ...}` and direct
// innerHTML / outerHTML assignment are the obvious xss vectors here.
//
// the invariant we hold: every place we render scoring suggestions, resume
// snippets, job description text, error messages, or any other string that
// could carry attacker-controlled bytes uses svelte text interpolation
// (`{value}`) or DOM textContent. if a future change needs to render rich
// html, it must be reviewed and added to ALLOWED_HTML_FILES below explicitly.
//
// rationale: the LLM payload contains free-form strings that, even after
// our normalization in src/lib/engine/llm/client.ts, are not sanitized
// for html. a regression here would be a 1-line change with a real cve.

const SRC_ROOT = join(process.cwd(), 'src');
const SCAN_EXTENSIONS = ['.svelte', '.ts', '.js'];
// each entry must justify why the html source is trusted. anything that
// flows from a network request, the LLM, or user input belongs in the
// failing path, not here.
const ALLOWED_HTML_FILES = new Set<string>([
	// JSON-LD script for the landing page. ldJson is built from a literal
	// object in the same file (no user input), and '<' is already escaped to
	// its unicode form before interpolation, so a future user-controlled
	// field cannot close the surrounding <script> tag.
	'src/routes/+page.svelte',
	// Person JSON-LD on the about page. same threat model as the landing:
	// personLd is built from a literal object in the same file (no user
	// input), and '<' is escaped to its unicode form before interpolation.
	'src/routes/about/+page.svelte',
	// pagefind excerpts are generated at build time from our own /docs
	// source and pre-sanitized by pagefind. no runtime user input flows in.
	'src/lib/components/ui/SearchModal.svelte'
]);
const RAW_HTML_PATTERN = /\{@html\b/;
const INNER_HTML_PATTERN = /\.\s*innerHTML\s*=/;
const OUTER_HTML_PATTERN = /\.\s*outerHTML\s*=/;

function walk(dir: string): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		const st = statSync(full);
		if (st.isDirectory()) {
			out.push(...walk(full));
		} else if (SCAN_EXTENSIONS.some((ext) => name.endsWith(ext))) {
			out.push(full);
		}
	}
	return out;
}

describe('xss guard: no raw-html rendering of user or llm content', () => {
	it('src/ has no {@html}, innerHTML, or outerHTML assignments outside the allowlist', () => {
		const files = walk(SRC_ROOT);
		const offenders: string[] = [];

		for (const file of files) {
			const rel = relative(process.cwd(), file).replaceAll('\\', '/');
			if (ALLOWED_HTML_FILES.has(rel)) continue;
			const content = readFileSync(file, 'utf-8');
			if (RAW_HTML_PATTERN.test(content)) offenders.push(`${rel} (uses {@html})`);
			if (INNER_HTML_PATTERN.test(content)) offenders.push(`${rel} (uses innerHTML=)`);
			if (OUTER_HTML_PATTERN.test(content)) offenders.push(`${rel} (uses outerHTML=)`);
		}

		expect(offenders).toEqual([]);
	});
});
