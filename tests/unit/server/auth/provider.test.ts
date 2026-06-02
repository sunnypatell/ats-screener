import { describe, expect, it, vi } from 'vitest';
import { buildServerAuthProvider } from '../../../../src/lib/server/auth/provider';

// provider.ts -> ldap.ts statically imports $lib/log (which reads
// $app/environment). mock it so the test stays a pure factory check; the live
// ldapts bind is exercised by manual integration, not unit tests (mirroring how
// the analyze route's actual HTTP calls aren't unit-tested, only buildProviders).
vi.mock('$lib/log', () => ({
	logger: { debug() {}, info() {}, warn() {}, error() {} },
	log() {}
}));

const FULL = {
	LDAP_URL: 'ldaps://dc.corp.local:636',
	LDAP_BIND_DN: 'CN=svc-ats,OU=Service,DC=corp,DC=local',
	LDAP_BIND_PASSWORD: 'service-account-password',
	LDAP_SEARCH_BASE: 'DC=corp,DC=local',
	SESSION_SECRET: 'a-very-long-session-secret-0123456789'
};

describe('buildServerAuthProvider', () => {
	it('returns null when nothing is configured (inert)', () => {
		expect(buildServerAuthProvider({})).toBeNull();
	});

	it('returns null when only firebase is configured', () => {
		expect(buildServerAuthProvider({ PUBLIC_FIREBASE_PROJECT_ID: 'my-project' })).toBeNull();
	});

	it('builds an ldap provider when fully configured', () => {
		const provider = buildServerAuthProvider(FULL);
		expect(provider).not.toBeNull();
		expect(provider!.id).toBe('ldap');
		expect(typeof provider!.authenticate).toBe('function');
	});

	it('propagates the config error when LDAP_URL is set but incomplete', () => {
		expect(() => buildServerAuthProvider({ LDAP_URL: 'ldaps://dc.corp.local:636' })).toThrow();
	});
});
