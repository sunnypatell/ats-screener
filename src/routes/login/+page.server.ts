import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { resolveAuthMode, resolveLdapConfig } from '$lib/server/auth/config';
import { buildServerAuthProvider } from '$lib/server/auth/provider';
import {
	signSession,
	makeSessionPayload,
	sessionCookieOptions,
	SESSION_COOKIE
} from '$lib/server/auth/session';
import {
	checkLoginRateLimit,
	recordLoginFailure,
	resetLoginRateLimit
} from '$lib/server/auth/login-rate-limit';
import { logger } from '$lib/log';

// the LDAP sign-in action. firebase/none sign-in is client-side, so a POST here
// in those modes just bounces to the scanner. SvelteKit's built-in form-action
// origin check (csrf.checkOrigin, default true) covers CSRF.
export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress, url }) => {
		const merged = { ...env, ...publicEnv };
		if (resolveAuthMode(merged) !== 'ldap') throw redirect(303, '/scanner');

		const ip = getClientAddress();
		const gate = checkLoginRateLimit(ip);
		if (!gate.allowed) {
			return fail(429, {
				message: `Too many attempts. Try again in ${gate.retryAfterSec}s.`,
				username: ''
			});
		}

		const form = await request.formData();
		const username = String(form.get('username') ?? '').trim();
		const password = String(form.get('password') ?? '');
		if (!username || !password) {
			return fail(400, { message: 'Enter your username and password.', username });
		}

		let provider;
		try {
			provider = buildServerAuthProvider(merged);
		} catch (err) {
			// resolveLdapConfig throws on misconfig (missing companion var / weak
			// secret). fail closed with a server-side log; don't leak details.
			logger.error('ldap.misconfigured', {
				error: err instanceof Error ? err.message : String(err)
			});
			return fail(500, {
				message: 'Server authentication is misconfigured. Contact your administrator.',
				username
			});
		}
		if (!provider) throw redirect(303, '/scanner');

		const result = await provider.authenticate(username, password);
		if (!result.ok) {
			recordLoginFailure(ip);
			return fail(401, { message: result.message, username });
		}

		resetLoginRateLimit(ip);
		const cfg = resolveLdapConfig(merged)!;
		const token = await signSession(
			makeSessionPayload(result.user, cfg.sessionMaxAgeSec),
			cfg.sessionSecret
		);
		// mark the cookie Secure when the *original* request was https. behind a
		// TLS-terminating reverse proxy (the common ad self-host topology) the
		// internal request is http, so prefer x-forwarded-proto and fall back to
		// url.protocol for a direct connection. (the AD guide also documents
		// setting the adapter's proxy-trust env vars.)
		const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
		const secure = forwardedProto ? forwardedProto === 'https' : url.protocol === 'https:';
		cookies.set(SESSION_COOKIE, token, sessionCookieOptions(cfg.sessionMaxAgeSec, secure));
		logger.info('ldap.login_success', { sub: result.user.sub });
		throw redirect(303, '/scanner');
	}
};
