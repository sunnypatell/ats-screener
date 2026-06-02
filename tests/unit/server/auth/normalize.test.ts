import { describe, expect, it } from 'vitest';
import {
	normalizeUsername,
	escapeFilterValue,
	buildUserSearchFilter,
	buildGroupMembershipFilter
} from '../../../../src/lib/server/auth/normalize';

const NUL = String.fromCharCode(0);

describe('normalizeUsername: logon formats', () => {
	it('UPN (user@domain) keeps the full value, format upn', () => {
		expect(normalizeUsername('jdoe@corp.local')).toEqual({
			format: 'upn',
			value: 'jdoe@corp.local',
			raw: 'jdoe@corp.local'
		});
	});

	it('down-level (DOMAIN\\user) strips the domain, format downlevel', () => {
		expect(normalizeUsername('CORP\\jdoe')).toEqual({
			format: 'downlevel',
			value: 'jdoe',
			raw: 'CORP\\jdoe'
		});
	});

	it('bare username stays as-is, format bare', () => {
		expect(normalizeUsername('jdoe')).toEqual({ format: 'bare', value: 'jdoe', raw: 'jdoe' });
	});

	it('bare username synthesizes a UPN when a default domain is configured', () => {
		expect(normalizeUsername('jdoe', { defaultDomain: 'corp.local' })).toEqual({
			format: 'upn',
			value: 'jdoe@corp.local',
			raw: 'jdoe'
		});
	});

	it('trims surrounding whitespace before classifying', () => {
		expect(normalizeUsername('  jdoe@corp.local  ')?.value).toBe('jdoe@corp.local');
	});
});

describe('normalizeUsername: rejected input', () => {
	it('returns null for empty / whitespace-only input', () => {
		expect(normalizeUsername('')).toBeNull();
		expect(normalizeUsername('   ')).toBeNull();
	});

	it('returns null for a malformed UPN (empty local or domain part)', () => {
		expect(normalizeUsername('@corp.local')).toBeNull();
		expect(normalizeUsername('jdoe@')).toBeNull();
	});

	it('returns null for a UPN with more than one @', () => {
		expect(normalizeUsername('a@b@corp.local')).toBeNull();
	});

	it('returns null for a down-level value with an empty sAMAccountName', () => {
		expect(normalizeUsername('CORP\\')).toBeNull();
	});

	it('returns null when control characters are embedded', () => {
		expect(normalizeUsername(`jdoe${NUL}`)).toBeNull();
		expect(normalizeUsername('jd\noe')).toBeNull();
	});

	it('returns null for absurdly long input', () => {
		expect(normalizeUsername('a'.repeat(257))).toBeNull();
	});
});

describe('escapeFilterValue: RFC 4515 special characters', () => {
	it('escapes the five filter-breaking characters', () => {
		expect(escapeFilterValue('\\')).toBe('\\5c');
		expect(escapeFilterValue('*')).toBe('\\2a');
		expect(escapeFilterValue('(')).toBe('\\28');
		expect(escapeFilterValue(')')).toBe('\\29');
		expect(escapeFilterValue(NUL)).toBe('\\00');
	});

	it('neutralizes an injection payload so it cannot broaden the filter', () => {
		expect(escapeFilterValue('*)(uid=*')).toBe('\\2a\\29\\28uid=\\2a');
	});

	it('leaves ordinary characters untouched', () => {
		expect(escapeFilterValue('jdoe@corp.local')).toBe('jdoe@corp.local');
	});
});

describe('buildUserSearchFilter', () => {
	it('ORs the escaped value across multiple username attributes, scoped to users', () => {
		const logon = normalizeUsername('jdoe')!;
		expect(buildUserSearchFilter(logon, ['sAMAccountName', 'userPrincipalName'])).toBe(
			'(&(objectClass=user)(|(sAMAccountName=jdoe)(userPrincipalName=jdoe)))'
		);
	});

	it('omits the OR wrapper for a single username attribute', () => {
		const logon = normalizeUsername('jdoe')!;
		expect(buildUserSearchFilter(logon, ['sAMAccountName'])).toBe(
			'(&(objectClass=user)(sAMAccountName=jdoe))'
		);
	});

	it('escapes the value so an injection payload cannot break out of the filter', () => {
		const logon = normalizeUsername('CORP\\*)(uid=*')!; // down-level -> value "*)(uid=*"
		const filter = buildUserSearchFilter(logon, ['sAMAccountName']);
		expect(filter).toBe('(&(objectClass=user)(sAMAccountName=\\2a\\29\\28uid=\\2a))');
		expect(filter).not.toContain('*)(');
	});
});

describe('buildGroupMembershipFilter', () => {
	it('uses the matching-rule-in-chain OID for nested-group membership', () => {
		expect(buildGroupMembershipFilter('CN=ATS Users,OU=Groups,DC=corp,DC=local')).toBe(
			'(memberOf:1.2.840.113556.1.4.1941:=CN=ATS Users,OU=Groups,DC=corp,DC=local)'
		);
	});

	it('escapes parentheses in a group name so the filter still parses', () => {
		expect(buildGroupMembershipFilter('CN=App (Prod),DC=corp,DC=local')).toBe(
			'(memberOf:1.2.840.113556.1.4.1941:=CN=App \\28Prod\\29,DC=corp,DC=local)'
		);
	});
});
