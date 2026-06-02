// See https://svelte.dev/docs/kit/types#app.d.ts

declare global {
	namespace App {
		// interface Error {}
		// populated by hooks.server.ts ONLY in ldap self-host mode (server-side
		// session). null in firebase/none mode and on the hosted deploy, so
		// nothing that reads locals.user changes behaviour there.
		interface Locals {
			user: {
				sub: string;
				name: string;
				email: string;
				groups: string[];
			} | null;
		}
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
