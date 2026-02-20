import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			routes: {
				include: ['/*'],
				exclude: ['<all>']
			}
		}),
		alias: {
			$components: 'src/lib/components',
			$engine: 'src/lib/engine',
			$stores: 'src/lib/stores',
			$styles: 'src/lib/styles',
			$utils: 'src/lib/utils'
		}
	}
};

export default config;
