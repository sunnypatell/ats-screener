// See https://svelte.dev/docs/kit/types#app.d.ts

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env?: {
				GEMINI_API_KEY?: string;
			};
		}
	}

	// inlined at build time via vite's `define` from package.json
	const __APP_VERSION__: string;
}

export {};
