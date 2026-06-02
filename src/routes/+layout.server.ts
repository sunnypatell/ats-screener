import type { LayoutServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { resolveAuthMode } from '$lib/server/auth/config';

// surface the resolved auth mode + the server-validated user (ldap mode only)
// to the whole client tree. in firebase/none mode `user` is null and the client
// ignores it: firebase keeps using its client SDK, none stays anonymous. nothing
// in the app is prerendered, so reading locals here introduces no build conflict.
export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		authMode: resolveAuthMode({ ...env, ...publicEnv }),
		user: locals.user
	};
};
