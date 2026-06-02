import type { RequestHandler } from './$types';
import { SESSION_COOKIE } from '$lib/server/auth/session';

// POST-only so a prefetch, <img>, or cross-site GET can never force a sign-out.
// clears the session cookie; the client then navigates. inert in firebase/none
// mode (no such cookie is ever set there).
export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete(SESSION_COOKIE, { path: '/' });
	return new Response(null, { status: 204 });
};
