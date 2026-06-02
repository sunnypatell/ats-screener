import { describe, expect, it } from 'vitest';
import {
	resolveAuthMode,
	resolveLdapConfig,
	LdapConfigError
} from '../../../../src/lib/server/auth/config';

// fully-populated ldap env, the minimum that resolveLdapConfig accepts.
const FULL = {
	LDAP_URL: 'ldaps://dc.corp.local:636',
	LDAP_BIND_DN: 'CN=svc-ats,OU=Service,DC=corp,DC=local',
	LDAP_BIND_PASSWORD: 'service-account-password',
	LDAP_SEARCH_BASE: 'DC=corp,DC=local',
	SESSION_SECRET: 'a-very-long-session-secret-0123456789'
};

describe('resolveAuthMode: precedence', () => {
	it('returns none when nothing is configured', () => {
		expect(resolveAuthMode({})).toBe('none');
	});

	it('returns firebase when PUBLIC_FIREBASE_PROJECT_ID is set', () => {
		expect(resolveAuthMode({ PUBLIC_FIREBASE_PROJECT_ID: 'my-project' })).toBe('firebase');
	});

	it('returns ldap when LDAP_URL is set', () => {
		expect(resolveAuthMode({ LDAP_URL: 'ldaps://dc.corp.local:636' })).toBe('ldap');
	});

	it('ldap takes precedence over firebase when both are set', () => {
		expect(
			resolveAuthMode({ LDAP_URL: 'ldaps://dc.corp.local:636', PUBLIC_FIREBASE_PROJECT_ID: 'p' })
		).toBe('ldap');
	});

	it('treats whitespace-only LDAP_URL as unset (matches firebaseConfigured trim semantics)', () => {
		expect(resolveAuthMode({ LDAP_URL: '   \t ' })).toBe('none');
	});

	it('treats whitespace-only project id as unset', () => {
		expect(resolveAuthMode({ PUBLIC_FIREBASE_PROJECT_ID: '  \n ' })).toBe('none');
	});
});

describe('resolveLdapConfig: inert + defaults', () => {
	it('returns null when LDAP_URL is unset (LDAP disabled)', () => {
		expect(resolveLdapConfig({})).toBeNull();
	});

	it('returns null when LDAP_URL is whitespace-only', () => {
		expect(resolveLdapConfig({ LDAP_URL: '   ' })).toBeNull();
	});

	it('returns a fully-defaulted config when the required vars are present', () => {
		const cfg = resolveLdapConfig(FULL)!;
		expect(cfg.url).toBe(FULL.LDAP_URL);
		expect(cfg.bindDN).toBe(FULL.LDAP_BIND_DN);
		expect(cfg.bindCredentials).toBe(FULL.LDAP_BIND_PASSWORD);
		expect(cfg.searchBase).toBe(FULL.LDAP_SEARCH_BASE);
		expect(cfg.usernameAttributes).toEqual(['sAMAccountName', 'userPrincipalName']);
		expect(cfg.nameAttribute).toBe('displayName');
		expect(cfg.emailAttribute).toBe('mail');
		expect(cfg.allowedGroupDN).toBeUndefined();
		expect(cfg.tlsRejectUnauthorized).toBe(true);
		expect(cfg.tlsCAPath).toBeUndefined();
		expect(cfg.sessionMaxAgeSec).toBe(28_800);
	});
});

describe('resolveLdapConfig: fail-closed validation', () => {
	it('throws LdapConfigError when LDAP_URL is set but companions are missing', () => {
		expect(() => resolveLdapConfig({ LDAP_URL: 'ldaps://dc.corp.local:636' })).toThrow(
			LdapConfigError
		);
	});

	it('names every missing companion var in the error message', () => {
		try {
			resolveLdapConfig({ LDAP_URL: 'ldaps://dc.corp.local:636' });
			throw new Error('expected resolveLdapConfig to throw');
		} catch (err) {
			const msg = (err as Error).message;
			expect(msg).toMatch(/LDAP_BIND_DN/);
			expect(msg).toMatch(/LDAP_BIND_PASSWORD/);
			expect(msg).toMatch(/LDAP_SEARCH_BASE/);
			expect(msg).toMatch(/SESSION_SECRET/);
		}
	});

	it('throws when SESSION_SECRET is shorter than 16 characters', () => {
		expect(() => resolveLdapConfig({ ...FULL, SESSION_SECRET: 'too-short' })).toThrow(
			/at least 16/
		);
	});
});

describe('resolveLdapConfig: optional overrides', () => {
	it('accepts LDAP_BIND_CREDENTIALS as an alias for LDAP_BIND_PASSWORD', () => {
		const { LDAP_BIND_PASSWORD: _omit, ...rest } = FULL;
		void _omit;
		const cfg = resolveLdapConfig({ ...rest, LDAP_BIND_CREDENTIALS: 'aliased-secret' })!;
		expect(cfg.bindCredentials).toBe('aliased-secret');
	});

	it('parses LDAP_USERNAME_ATTRIBUTES as a trimmed CSV', () => {
		const cfg = resolveLdapConfig({
			...FULL,
			LDAP_USERNAME_ATTRIBUTES: ' sAMAccountName , mail '
		})!;
		expect(cfg.usernameAttributes).toEqual(['sAMAccountName', 'mail']);
	});

	it('honors group allow-list, default domain, and custom name/email attributes', () => {
		const cfg = resolveLdapConfig({
			...FULL,
			LDAP_ALLOWED_GROUP_DN: 'CN=ATS Users,OU=Groups,DC=corp,DC=local',
			LDAP_DEFAULT_DOMAIN: 'corp.local',
			LDAP_NAME_ATTRIBUTE: 'cn',
			LDAP_EMAIL_ATTRIBUTE: 'userPrincipalName'
		})!;
		expect(cfg.allowedGroupDN).toBe('CN=ATS Users,OU=Groups,DC=corp,DC=local');
		expect(cfg.defaultDomain).toBe('corp.local');
		expect(cfg.nameAttribute).toBe('cn');
		expect(cfg.emailAttribute).toBe('userPrincipalName');
	});

	it('only an explicit "false" disables TLS cert verification', () => {
		expect(
			resolveLdapConfig({ ...FULL, LDAP_TLS_REJECT_UNAUTHORIZED: 'false' })!.tlsRejectUnauthorized
		).toBe(false);
		expect(
			resolveLdapConfig({ ...FULL, LDAP_TLS_REJECT_UNAUTHORIZED: 'true' })!.tlsRejectUnauthorized
		).toBe(true);
		expect(
			resolveLdapConfig({ ...FULL, LDAP_TLS_REJECT_UNAUTHORIZED: '0' })!.tlsRejectUnauthorized
		).toBe(true);
	});

	it('parses a valid SESSION_MAX_AGE and falls back to the default otherwise', () => {
		expect(resolveLdapConfig({ ...FULL, SESSION_MAX_AGE: '3600' })!.sessionMaxAgeSec).toBe(3600);
		expect(resolveLdapConfig({ ...FULL, SESSION_MAX_AGE: 'not-a-number' })!.sessionMaxAgeSec).toBe(
			28_800
		);
		expect(resolveLdapConfig({ ...FULL, SESSION_MAX_AGE: '-5' })!.sessionMaxAgeSec).toBe(28_800);
	});
});
