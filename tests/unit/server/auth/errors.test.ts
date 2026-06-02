import { describe, expect, it } from 'vitest';
import { extractAdSubCode, mapAdBindError } from '../../../../src/lib/server/auth/errors';

// representative AcceptSecurityContext diagnostic AD returns on a failed bind.
function adError(subCode: string): Error {
	return new Error(
		`80090308: LdapErr: DSID-0C0903A9, comment: AcceptSecurityContext error, data ${subCode}, v1db1`
	);
}

describe('extractAdSubCode', () => {
	it('parses the "data <code>" token out of an AD error 49 message', () => {
		expect(extractAdSubCode(adError('52e'))).toBe('52e');
		expect(extractAdSubCode(adError('525'))).toBe('525');
	});

	it('reads the message off an ldapts-style error object', () => {
		expect(extractAdSubCode({ message: 'comment: ..., data 533, v1db1' })).toBe('533');
	});

	it('returns null when there is no sub-code', () => {
		expect(extractAdSubCode(new Error('ECONNREFUSED 10.0.0.1:636'))).toBeNull();
		expect(extractAdSubCode(null)).toBeNull();
	});
});

describe('mapAdBindError: anti-enumeration', () => {
	it('maps both 525 (no such user) and 52e (bad password) to the SAME generic message', () => {
		const generic = mapAdBindError(adError('52e'));
		expect(mapAdBindError(adError('525'))).toBe(generic);
		expect(generic).toMatch(/incorrect username or password/i);
	});
});

describe('mapAdBindError: account-state messages', () => {
	const cases: Array<[string, RegExp]> = [
		['530', /not permitted at this time/i],
		['531', /not permitted from this workstation/i],
		['532', /password has expired/i],
		['533', /account is disabled/i],
		['701', /account has expired/i],
		['773', /must reset your password/i],
		['775', /account is locked/i]
	];
	for (const [code, pattern] of cases) {
		it(`maps sub-code ${code} to its specific message`, () => {
			expect(mapAdBindError(adError(code))).toMatch(pattern);
		});
	}
});

describe('mapAdBindError: fallbacks', () => {
	it('maps connection / TLS failures to the reachability message', () => {
		expect(mapAdBindError(new Error('connect ECONNREFUSED 10.0.0.1:636'))).toMatch(
			/cannot reach the directory server/i
		);
		expect(mapAdBindError(new Error('unable to verify the first certificate'))).toMatch(
			/cannot reach the directory server/i
		);
	});

	it('falls back to a generic retry message for unknown errors', () => {
		expect(mapAdBindError(new Error('something unexpected'))).toMatch(/sign-in failed/i);
	});
});
