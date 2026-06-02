// auth mode + LDAP config resolution. pure: takes a plain env record so it
// unit-tests in isolation exactly like buildProviders() in
// api/analyze/providers.ts (pass a {} object, assert the result).
//
// three mutually-exclusive auth modes, resolved server-side:
//   ldap     - LDAP_URL set: server-side AD/LDAP sign-in + signed session cookie
//   firebase - PUBLIC_FIREBASE_PROJECT_ID set: the existing hosted client path
//   none     - neither set: anonymous self-host (localStorage history)
//
// precedence is ldap > firebase > none. the hosted deploy never sets LDAP_URL,
// so it always resolves 'firebase' and every new server-side path stays inert.
// this is the single source of truth, mirroring the `firebaseConfigured` flag.

export type AuthMode = 'ldap' | 'firebase' | 'none';

export interface LdapConfig {
	url: string;
	bindDN: string;
	bindCredentials: string;
	searchBase: string;
	// logon attributes the supplied username is matched against (OR'd in the
	// search filter). default covers all three AD logon formats.
	usernameAttributes: string[];
	// when set, a bare "jdoe" is also tried as the UPN "jdoe@<defaultDomain>".
	defaultDomain?: string;
	nameAttribute: string;
	emailAttribute: string;
	// optional allow-list: only members of this group DN (incl. nested) may sign in.
	allowedGroupDN?: string;
	tlsRejectUnauthorized: boolean;
	tlsCAPath?: string;
	sessionSecret: string;
	sessionMaxAgeSec: number;
}

// raised when LDAP_URL is set but the configuration is incomplete or unsafe.
// the login action catches this and fails closed (500 + server log), matching
// the ADMIN_TOKEN fail-closed precedent rather than silently degrading.
export class LdapConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'LdapConfigError';
	}
}

const DEFAULT_USERNAME_ATTRIBUTES = ['sAMAccountName', 'userPrincipalName'];
const DEFAULT_NAME_ATTRIBUTE = 'displayName';
const DEFAULT_EMAIL_ATTRIBUTE = 'mail';
const DEFAULT_SESSION_MAX_AGE_SEC = 28_800; // 8 hours
const MIN_SESSION_SECRET_LENGTH = 16;

type Env = Record<string, string | undefined>;

// trim and treat empty / whitespace-only as unset, matching the
// firebaseConfigured semantics so a stray `LDAP_URL= ` line reads as disabled.
function val(env: Env, key: string): string | undefined {
	const v = env[key];
	if (typeof v !== 'string') return undefined;
	const t = v.trim();
	return t.length > 0 ? t : undefined;
}

export function resolveAuthMode(env: Env): AuthMode {
	if (val(env, 'LDAP_URL')) return 'ldap';
	if (val(env, 'PUBLIC_FIREBASE_PROJECT_ID')) return 'firebase';
	return 'none';
}

// returns null when LDAP is disabled (inert signal, like an unset OLLAMA_BASE_URL).
// when LDAP_URL is set, returns a fully-defaulted config or throws LdapConfigError
// if a required companion var is missing / the session secret is too weak.
export function resolveLdapConfig(env: Env): LdapConfig | null {
	const url = val(env, 'LDAP_URL');
	if (!url) return null;

	const bindDN = val(env, 'LDAP_BIND_DN');
	const bindCredentials = val(env, 'LDAP_BIND_PASSWORD') ?? val(env, 'LDAP_BIND_CREDENTIALS');
	const searchBase = val(env, 'LDAP_SEARCH_BASE');
	const sessionSecret = val(env, 'SESSION_SECRET');

	const missing: string[] = [];
	if (!bindDN) missing.push('LDAP_BIND_DN');
	if (!bindCredentials) missing.push('LDAP_BIND_PASSWORD');
	if (!searchBase) missing.push('LDAP_SEARCH_BASE');
	if (!sessionSecret) missing.push('SESSION_SECRET');
	if (missing.length > 0) {
		throw new LdapConfigError(
			`LDAP_URL is set but required companion vars are missing: ${missing.join(', ')}. ` +
				`set them in your environment, or unset LDAP_URL to disable LDAP auth.`
		);
	}
	if (sessionSecret!.length < MIN_SESSION_SECRET_LENGTH) {
		throw new LdapConfigError(
			`SESSION_SECRET must be at least ${MIN_SESSION_SECRET_LENGTH} characters ` +
				`(32+ recommended). generate one with: openssl rand -base64 32`
		);
	}

	const usernameAttributes = (val(env, 'LDAP_USERNAME_ATTRIBUTES') ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);

	const maxAgeRaw = val(env, 'SESSION_MAX_AGE');
	const parsedMaxAge = maxAgeRaw ? Number.parseInt(maxAgeRaw, 10) : Number.NaN;
	const sessionMaxAgeSec =
		Number.isFinite(parsedMaxAge) && parsedMaxAge > 0 ? parsedMaxAge : DEFAULT_SESSION_MAX_AGE_SEC;

	return {
		url,
		bindDN: bindDN!,
		bindCredentials: bindCredentials!,
		searchBase: searchBase!,
		usernameAttributes:
			usernameAttributes.length > 0 ? usernameAttributes : DEFAULT_USERNAME_ATTRIBUTES,
		defaultDomain: val(env, 'LDAP_DEFAULT_DOMAIN'),
		nameAttribute: val(env, 'LDAP_NAME_ATTRIBUTE') ?? DEFAULT_NAME_ATTRIBUTE,
		emailAttribute: val(env, 'LDAP_EMAIL_ATTRIBUTE') ?? DEFAULT_EMAIL_ATTRIBUTE,
		allowedGroupDN: val(env, 'LDAP_ALLOWED_GROUP_DN'),
		// rejectUnauthorized defaults to true; only an explicit "false" disables it.
		tlsRejectUnauthorized: val(env, 'LDAP_TLS_REJECT_UNAUTHORIZED') !== 'false',
		tlsCAPath: val(env, 'LDAP_TLS_CA_PATH'),
		sessionSecret: sessionSecret!,
		sessionMaxAgeSec
	};
}
