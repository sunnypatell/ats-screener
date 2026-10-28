import { sveltekit } from '@sveltejs/kit/vite';
import type { Plugin } from 'vite';
// vitest 4 dropped `test` from vite's UserConfig type, so defineConfig comes from vitest
import { defineConfig } from 'vitest/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// read package.json at config-load time so the client bundle can reference
// the version via the __APP_VERSION__ define. importing package.json from
// browser code triggers vite's fs.deny on package.json (403 in dev) and would
// otherwise inline the full manifest into the bundle.
const pkgUrl = new URL('./package.json', import.meta.url);
const pkg = JSON.parse(readFileSync(fileURLToPath(pkgUrl), 'utf-8')) as { version: string };

// firebase only ever runs in the browser, but its dynamic imports survive in the ssr build and
// vercel's file tracer then ships firebase's node sdk (and grpc-js) inside every function
function firebaseClientOnly(): Plugin {
	const stub = '\0firebase-ssr-stub';
	return {
		name: 'firebase-client-only',
		apply: 'build',
		enforce: 'pre',
		resolveId(id, _importer, opts) {
			if (opts?.ssr && (id === 'firebase' || id.startsWith('firebase/'))) return stub;
		},
		load(id) {
			if (id === stub) return 'export {};';
		}
	};
}

export default defineConfig({
	plugins: [firebaseClientOnly(), sveltekit()],
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version)
	},
	ssr: {
		// @number-flow/svelte ships .svelte files in dist/ that Node can't import directly
		// force Vite to bundle it so the svelte plugin processes those files during SSR
		noExternal: ['@number-flow/svelte']
	},
	test: {
		include: ['tests/unit/**/*.test.ts'],
		environment: 'jsdom',
		globals: true,
		// vitest 4 stopped resetting vi.fn() mocks in restoreAllMocks, so call history leaks between tests
		clearMocks: true,
		setupFiles: ['tests/setup.ts']
	},
	worker: {
		format: 'es'
	}
});
