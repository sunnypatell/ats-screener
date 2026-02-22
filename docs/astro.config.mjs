// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://astro.build/config
export default defineConfig({
	site: 'https://ats-screener.vercel.app',
	base: '/docs',
	markdown: {
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex]
	},
	integrations: [
		starlight({
			title: 'ATS Screener',
			description:
				'Free, open-source resume scanner that simulates how real enterprise ATS platforms parse and score resumes.',
			logo: {
				light: './src/assets/logo-light.svg',
				dark: './src/assets/logo-dark.svg',
				replacesTitle: false
			},
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/sunnypatell/ats-screener'
				},
				{
					icon: 'external',
					label: 'Launch Scanner',
					href: 'https://ats-screener.vercel.app/scanner'
				}
			],
			customCss: ['./src/styles/custom.css'],
			editLink: {
				baseUrl: 'https://github.com/sunnypatell/ats-screener/edit/main/docs/'
			},
			head: [
				{
					tag: 'link',
					attrs: {
						rel: 'stylesheet',
						href: 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css',
						crossorigin: 'anonymous'
					}
				},
				{
					tag: 'meta',
					attrs: {
						property: 'og:image',
						content: 'https://ats-screener.vercel.app/og-image.png'
					}
				},
				{
					tag: 'script',
					content:
						"document.addEventListener('DOMContentLoaded',function(){var a=document.querySelector('.site-title');if(a)a.href='/';});"
				}
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
						{ label: 'How It Works', slug: 'getting-started/how-it-works' }
					]
				},
				{
					label: 'ATS Platforms',
					items: [
						{ label: 'Overview', slug: 'platforms/overview' },
						{ label: 'Workday', slug: 'platforms/workday' },
						{ label: 'Taleo (Oracle)', slug: 'platforms/taleo' },
						{ label: 'iCIMS', slug: 'platforms/icims' },
						{ label: 'Greenhouse', slug: 'platforms/greenhouse' },
						{ label: 'Lever', slug: 'platforms/lever' },
						{ label: 'SuccessFactors (SAP)', slug: 'platforms/successfactors' }
					]
				},
				{
					label: 'Scoring',
					items: [
						{ label: 'Methodology', slug: 'scoring/methodology' },
						{ label: 'Dimensions', slug: 'scoring/dimensions' },
						{ label: 'Pass/Fail Thresholds', slug: 'scoring/thresholds' }
					]
				},
				{
					label: 'API Reference',
					items: [
						{ label: 'Endpoints', slug: 'api/endpoints' },
						{ label: 'Rate Limits', slug: 'api/rate-limits' },
						{ label: 'Error Handling', slug: 'api/errors' }
					]
				},
				{
					label: 'Self-Hosting',
					items: [
						{ label: 'Setup Guide', slug: 'self-hosting/setup' },
						{ label: 'Configuration', slug: 'self-hosting/configuration' },
						{ label: 'Deployment', slug: 'self-hosting/deployment' }
					]
				}
			],
			lastUpdated: true,
			pagination: true
		})
	]
});
