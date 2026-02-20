import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
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
