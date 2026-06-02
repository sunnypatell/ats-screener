import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { resolveAuthMode } from '$lib/server/auth/config';

// server-side guard for ldap self-host mode: unauthenticated visitors are sent
// to /login before the page renders. no-op in firebase/none mode (history there
// is client-gated exactly as before).
export const load: PageServerLoad = async ({ locals }) => {
	if (resolveAuthMode({ ...env, ...publicEnv }) === 'ldap' && !locals.user) {
		throw redirect(303, '/login');
	}
	return {};
};
