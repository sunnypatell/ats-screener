// pluggable server-side auth provider abstraction, mirroring the LLMProvider /
// buildProviders() pattern in api/analyze/providers.ts. today only LDAP is
// implemented; OIDC / SAML can be added as additional providers later without
// changing any caller. importing this module is cheap: the heavy ldapts client
// is loaded lazily inside the LDAP provider's authenticate() (see ./ldap), never
// at module-eval time.

import { resolveLdapConfig } from './config';
import { authenticateAgainstLdap } from './ldap';

export interface AuthenticatedUser {
	sub: string; // stable id used as the session subject + history namespace key
	name: string;
	email: string;
	groups: string[];
}

export type AuthResult = { ok: true; user: AuthenticatedUser } | { ok: false; message: string };

export interface ServerAuthProvider {
	id: 'ldap';
	authenticate(username: string, password: string): Promise<AuthResult>;
}

// returns null when no server-auth provider is configured (inert signal, like an
// unset OLLAMA_BASE_URL). throws LdapConfigError when LDAP_URL is set but the
// config is incomplete (the caller fails closed).
export function buildServerAuthProvider(
	env: Record<string, string | undefined>
): ServerAuthProvider | null {
	const cfg = resolveLdapConfig(env);
	if (!cfg) return null;
	return {
		id: 'ldap',
		authenticate: (username, password) => authenticateAgainstLdap(cfg, username, password)
	};
}
