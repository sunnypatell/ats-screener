// stateless session cookie signed with HMAC-SHA256 via the Web Crypto API
// (globalThis.crypto.subtle), which is available in every runtime SvelteKit
// targets (node serverless, edge, workerd). using Web Crypto rather than
// node:crypto keeps hooks.server.ts free of node built-ins, so the long-standing
// "no node built-ins in hooks" invariant (it could be bundled for edge) holds.
//
// there is NO server-side session store: the signed payload IS the session.
// it survives restarts/deploys and needs no shared state on multi-instance
// setups. rotating SESSION_SECRET invalidates every outstanding session.
// the token is `base64url(JSON payload).base64url(HMAC)`.

export const SESSION_COOKIE = 'ats_session';

export interface SessionPayload {
	sub: string; // stable user id (objectGUID hex, or a logon attribute fallback)
	name: string;
	email: string;
	groups: string[];
	iat: number; // issued-at (epoch seconds)
	exp: number; // expiry (epoch seconds)
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const b of bytes) binary += String.fromCharCode(b);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function stringToBase64Url(s: string): string {
	return bytesToBase64Url(encoder.encode(s));
}

function base64UrlToBytes(s: string): Uint8Array {
	const padded = s.length % 4 === 0 ? s : s + '='.repeat(4 - (s.length % 4));
	const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
	const out = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
	return out;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign', 'verify']
	);
}

export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
	if (!secret) throw new Error('a session secret is required to sign a session');
	const body = stringToBase64Url(JSON.stringify(payload));
	const key = await importHmacKey(secret);
	const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
	return `${body}.${bytesToBase64Url(new Uint8Array(sig))}`;
}

// returns the payload only if the signature verifies AND the token has not
// expired. crypto.subtle.verify is constant-time, so no manual comparison.
export async function verifySession(token: string, secret: string): Promise<SessionPayload | null> {
	if (!token || !secret) return null;
	const dot = token.indexOf('.');
	if (dot <= 0 || dot >= token.length - 1) return null;

	const body = token.slice(0, dot);
	const sigPart = token.slice(dot + 1);

	let signature: Uint8Array;
	try {
		signature = base64UrlToBytes(sigPart);
	} catch {
		return null;
	}

	let verified: boolean;
	try {
		const key = await importHmacKey(secret);
		// cast to BufferSource: TS 5.7's lib types the param as
		// ArrayBufferView<ArrayBuffer>, but a decoded Uint8Array is structurally a
		// valid BufferSource at runtime.
		verified = await crypto.subtle.verify(
			'HMAC',
			key,
			signature as BufferSource,
			encoder.encode(body)
		);
	} catch {
		return null;
	}
	if (!verified) return null;

	let payload: unknown;
	try {
		payload = JSON.parse(decoder.decode(base64UrlToBytes(body)));
	} catch {
		return null;
	}
	if (!isSessionPayload(payload)) return null;
	if (payload.exp <= Math.floor(Date.now() / 1000)) return null;

	return payload;
}

function isSessionPayload(v: unknown): v is SessionPayload {
	if (typeof v !== 'object' || v === null) return false;
	const p = v as Record<string, unknown>;
	return (
		typeof p.sub === 'string' &&
		typeof p.name === 'string' &&
		typeof p.email === 'string' &&
		Array.isArray(p.groups) &&
		typeof p.iat === 'number' &&
		typeof p.exp === 'number'
	);
}

export function makeSessionPayload(
	user: { sub: string; name: string; email: string; groups: string[] },
	maxAgeSec: number,
	nowSec: number = Math.floor(Date.now() / 1000)
): SessionPayload {
	return {
		sub: user.sub,
		name: user.name,
		email: user.email,
		groups: user.groups,
		iat: nowSec,
		exp: nowSec + maxAgeSec
	};
}

export function sessionCookieOptions(maxAgeSec: number, secure: boolean) {
	return {
		httpOnly: true as const,
		secure,
		sameSite: 'lax' as const,
		path: '/',
		maxAge: maxAgeSec
	};
}
