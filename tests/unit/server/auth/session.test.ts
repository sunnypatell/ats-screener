// @vitest-environment node
// uses Node's webcrypto (globalThis.crypto.subtle); the node environment avoids
// any jsdom crypto-shim differences.
import { describe, expect, it } from 'vitest';
import {
	signSession,
	verifySession,
	makeSessionPayload,
	sessionCookieOptions,
	SESSION_COOKIE,
	type SessionPayload
} from '../../../../src/lib/server/auth/session';

const SECRET = 'a-very-long-session-secret-0123456789';
const USER = {
	sub: 'guid-abc-123',
	name: 'Jane Doe',
	email: 'jane@corp.local',
	groups: ['cn=ats']
};

describe('signSession + verifySession: round-trip', () => {
	it('verifies a freshly signed token and returns the exact payload', async () => {
		const payload = makeSessionPayload(USER, 3600);
		const token = await signSession(payload, SECRET);
		expect(await verifySession(token, SECRET)).toEqual(payload);
	});

	it('produces a two-part base64url token', () => {
		// shape check is synchronous-friendly via the payload roundtrip above;
		// here just assert the dot-separated structure.
		return signSession(makeSessionPayload(USER, 3600), SECRET).then((token) => {
			expect(token.split('.')).toHaveLength(2);
			expect(token).not.toMatch(/[+/=]/); // base64url, no standard-base64 chars
		});
	});
});

describe('verifySession: rejection paths', () => {
	it('rejects a tampered payload', async () => {
		const token = await signSession(makeSessionPayload(USER, 3600), SECRET);
		const [body, sig] = token.split('.');
		const tampered = `${body}x.${sig}`;
		expect(await verifySession(tampered, SECRET)).toBeNull();
	});

	it('rejects a tampered signature', async () => {
		const token = await signSession(makeSessionPayload(USER, 3600), SECRET);
		const [body, sig] = token.split('.');
		const flipped = sig[0] === 'a' ? `b${sig.slice(1)}` : `a${sig.slice(1)}`;
		expect(await verifySession(`${body}.${flipped}`, SECRET)).toBeNull();
	});

	it('rejects a token signed with a different secret', async () => {
		const token = await signSession(makeSessionPayload(USER, 3600), SECRET);
		expect(await verifySession(token, 'a-different-but-long-enough-secret-xyz')).toBeNull();
	});

	it('rejects an expired token', async () => {
		// nowSec far in the past so exp is also in the past
		const expired = makeSessionPayload(USER, 60, 1000);
		const token = await signSession(expired, SECRET);
		expect(await verifySession(token, SECRET)).toBeNull();
	});

	it('rejects when the secret is blank', async () => {
		const token = await signSession(makeSessionPayload(USER, 3600), SECRET);
		expect(await verifySession(token, '')).toBeNull();
	});

	it('rejects malformed tokens', async () => {
		expect(await verifySession('', SECRET)).toBeNull();
		expect(await verifySession('no-dot-here', SECRET)).toBeNull();
		expect(await verifySession('.onlysig', SECRET)).toBeNull();
		expect(await verifySession('onlybody.', SECRET)).toBeNull();
	});
});

describe('signSession: input guards', () => {
	it('throws when no secret is provided', async () => {
		await expect(signSession(makeSessionPayload(USER, 3600), '')).rejects.toThrow();
	});
});

describe('makeSessionPayload', () => {
	it('sets exp = iat + maxAgeSec', () => {
		const p: SessionPayload = makeSessionPayload(USER, 3600, 1_000_000);
		expect(p.iat).toBe(1_000_000);
		expect(p.exp).toBe(1_003_600);
		expect(p.sub).toBe(USER.sub);
		expect(p.groups).toEqual(USER.groups);
	});
});

describe('sessionCookieOptions', () => {
	it('is httpOnly, sameSite=lax, path=/ and carries maxAge', () => {
		expect(sessionCookieOptions(3600, true)).toEqual({
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			path: '/',
			maxAge: 3600
		});
	});

	it('passes secure through (false on plain-http dev)', () => {
		expect(sessionCookieOptions(3600, false).secure).toBe(false);
	});

	it('exposes a stable cookie name', () => {
		expect(SESSION_COOKIE).toBe('ats_session');
	});
});
