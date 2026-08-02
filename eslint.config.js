import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				// inlined at build time via vite's `define` from package.json
				__APP_VERSION__: 'readonly'
			}
		}
	},
	{
		// rune modules need the svelte parser too, else v3 falls back to espree and can't parse them
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		}
	},
	{
		rules: {
			'no-console': ['warn', { allow: ['warn', 'error'] }],
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-explicit-any': 'warn',
			// new in v3, warn until migrated: keys change dom reuse and resolve() changes routing
			'svelte/require-each-key': 'warn',
			'svelte/no-navigation-without-resolve': 'warn'
		}
	},
	{
		ignores: [
			'build/',
			'.svelte-kit/',
			'dist/',
			'node_modules/',
			'.vercel/',
			'coverage/',
			'playwright-report/',
			'test-results/',
			'docs/',
			'static/docs/',
			'scripts/'
		]
	}
);
