// the ONLY module that talks to ldapts. service-account search-then-bind:
//   1. bind as the read-only service account
//   2. search for the user by their logon (escaped filter over the configured
//      username attributes)
//   3. bind AS the user with the supplied password to verify it
//   4. optionally require membership (incl. nested groups) of an allow-list group
//
// ldapts is imported lazily via `await import('ldapts')` so it only loads on the
// node login route, never in the client/edge bundles (and this module lives
// under $lib/server, which SvelteKit forbids client code from importing at all).
// node:fs reads the optional internal-CA PEM for LDAPS validation.

import { readFileSync } from 'node:fs';
import type { Client } from 'ldapts';
import type { LdapConfig } from './config';
import type { AuthResult, AuthenticatedUser } from './provider';
import { normalizeUsername, buildUserSearchFilter, buildGroupMembershipFilter } from './normalize';
import { mapAdBindError } from './errors';
import { logger } from '$lib/log';

const GENERIC_FAIL = 'Incorrect username or password.';
const CONNECTION_FAIL = 'Cannot reach the directory server. Check the LDAP configuration.';
const CLIENT_TIMEOUT_MS = 10_000;

export async function authenticateAgainstLdap(
	cfg: LdapConfig,
	username: string,
	password: string
): Promise<AuthResult> {
	// AD treats a bind with an empty password as an "unauthenticated bind" that
	// SUCCEEDS, so an empty password must be rejected BEFORE any bind. otherwise
	// anyone could sign in as any user by leaving the password blank.
	if (!password) return { ok: false, message: GENERIC_FAIL };

	const logon = normalizeUsername(username, {
		usernameAttributes: cfg.usernameAttributes,
		defaultDomain: cfg.defaultDomain
	});
	if (!logon) return { ok: false, message: GENERIC_FAIL };

	let ClientCtor: typeof Client;
	try {
		({ Client: ClientCtor } = await import('ldapts'));
	} catch (err) {
		logger.error('ldap.module_missing', { error: errMsg(err) });
		return { ok: false, message: 'LDAP support is not installed on this server.' };
	}

	const tlsOptions = buildTlsOptions(cfg);
	const clientOpts = {
		url: cfg.url,
		timeout: CLIENT_TIMEOUT_MS,
		connectTimeout: CLIENT_TIMEOUT_MS,
		...(tlsOptions ? { tlsOptions } : {})
	};

	// phase 1: service bind + user search. userDN and user are assigned inside the
	// try; the returning catch means reaching past it implies they were set.
	const serviceClient = new ClientCtor(clientOpts);
	let userDN: string;
	let user: AuthenticatedUser;
	try {
		try {
			await serviceClient.bind(cfg.bindDN, cfg.bindCredentials);
		} catch (err) {
			logger.error('ldap.service_bind_failed', { error: errMsg(err) });
			return { ok: false, message: CONNECTION_FAIL };
		}

		const filter = buildUserSearchFilter(logon, cfg.usernameAttributes);
		const { searchEntries } = await serviceClient.search(cfg.searchBase, {
			scope: 'sub',
			filter,
			attributes: [
				'distinguishedName',
				cfg.nameAttribute,
				cfg.emailAttribute,
				'objectGUID',
				'sAMAccountName',
				'userPrincipalName'
			],
			sizeLimit: 2
		});

		// 0 = no such user; >1 = ambiguous. both collapse to the generic message
		// so the form can't enumerate accounts.
		if (searchEntries.length !== 1) return { ok: false, message: GENERIC_FAIL };

		const entry = searchEntries[0];
		userDN =
			typeof entry.dn === 'string' && entry.dn ? entry.dn : firstString(entry.distinguishedName);
		if (!userDN) return { ok: false, message: GENERIC_FAIL };

		user = {
			sub: stableSubject(entry, logon.value),
			name:
				firstString(entry[cfg.nameAttribute]) || firstString(entry.sAMAccountName) || logon.value,
			email: firstString(entry[cfg.emailAttribute]),
			groups: []
		};
	} catch (err) {
		logger.error('ldap.search_failed', { error: errMsg(err) });
		return { ok: false, message: 'Sign-in failed. Please try again.' };
	} finally {
		await safeUnbind(serviceClient);
	}

	// phase 2: bind AS the user to verify the password
	const userClient = new ClientCtor(clientOpts);
	try {
		try {
			await userClient.bind(userDN, password);
		} catch (err) {
			return { ok: false, message: mapAdBindError(err) };
		}

		// phase 3: optional group allow-list (nested via matching-rule-in-chain).
		// checked AFTER password verification so a non-member who supplies a wrong
		// password still only sees the generic credentials message.
		if (cfg.allowedGroupDN) {
			let inGroup = false;
			try {
				const { searchEntries } = await userClient.search(userDN, {
					scope: 'base',
					filter: buildGroupMembershipFilter(cfg.allowedGroupDN),
					attributes: ['distinguishedName']
				});
				inGroup = searchEntries.length > 0;
			} catch (err) {
				logger.error('ldap.group_check_failed', { error: errMsg(err) });
				return { ok: false, message: 'Sign-in failed during authorization. Please try again.' };
			}
			if (!inGroup) {
				return { ok: false, message: 'You are not authorized to access this application.' };
			}
		}
	} finally {
		await safeUnbind(userClient);
	}

	return { ok: true, user };
}

function buildTlsOptions(
	cfg: LdapConfig
): { rejectUnauthorized: boolean; ca?: Buffer } | undefined {
	const isLdaps = cfg.url.toLowerCase().startsWith('ldaps://');
	if (!isLdaps && !cfg.tlsCAPath) return undefined;
	const ca = cfg.tlsCAPath ? readCA(cfg.tlsCAPath) : undefined;
	return { rejectUnauthorized: cfg.tlsRejectUnauthorized, ...(ca ? { ca } : {}) };
}

function readCA(path: string): Buffer | undefined {
	try {
		return readFileSync(path);
	} catch (err) {
		logger.error('ldap.ca_read_failed', { path, error: errMsg(err) });
		return undefined;
	}
}

// prefer the immutable objectGUID (binary) for a stable subject; fall back to a
// lowercased text attribute. a string-decoded objectGUID is a lossy decode, so
// only a Buffer/Uint8Array counts as a real GUID.
function stableSubject(entry: Record<string, unknown>, fallback: string): string {
	const raw = Array.isArray(entry.objectGUID) ? entry.objectGUID[0] : entry.objectGUID;
	if (Buffer.isBuffer(raw)) return raw.toString('hex');
	if (raw instanceof Uint8Array) return Buffer.from(raw).toString('hex');
	return (
		firstString(entry.userPrincipalName) ||
		firstString(entry.sAMAccountName) ||
		fallback
	).toLowerCase();
}

function firstString(v: unknown): string {
	if (Array.isArray(v)) return v.length > 0 ? firstString(v[0]) : '';
	if (Buffer.isBuffer(v)) return v.toString('utf8');
	if (typeof v === 'string') return v;
	return v == null ? '' : String(v);
}

function errMsg(err: unknown): string {
	return err instanceof Error ? err.message : String(err);
}

async function safeUnbind(client: Client): Promise<void> {
	try {
		await client.unbind();
	} catch {
		// unbind failures are non-fatal: the auth result is already decided.
	}
}
