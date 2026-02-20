import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
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
