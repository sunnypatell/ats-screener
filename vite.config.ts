import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// read package.json at config-load time so the client bundle can reference
// the version via the __APP_VERSION__ define. importing package.json from
// browser code triggers vite's fs.deny on package.json (403 in dev) and would
// otherwise inline the full manifest into the bundle.
const pkgUrl = new URL('./package.json', import.meta.url);
const pkg = JSON.parse(readFileSync(fileURLToPath(pkgUrl), 'utf-8')) as { version: string };

export default defineConfig({
	plugins: [sveltekit()],
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
		setupFiles: ['tests/setup.ts']
	},
	worker: {
		format: 'es'
	}
});
