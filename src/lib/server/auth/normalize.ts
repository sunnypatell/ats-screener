// pure username normalization + LDAP search-filter building. no ldapts import,
// so it unit-tests in isolation. Active Directory accepts three logon formats;
// we normalize each to a lookup value and build an ESCAPED filter so a value
// like "*)(uid=*" can neither broaden the search nor break out of the filter.
//
// escaping follows the LDAP search-filter special-character table from RFC 4515
// and the Microsoft "Search Filter Syntax" doc:
//   https://learn.microsoft.com/en-us/windows/win32/adsi/search-filter-syntax
// and the OWASP LDAP Injection Prevention Cheat Sheet:
//   https://cheatsheetseries.owasp.org/cheatsheets/LDAP_Injection_Prevention_Cheat_Sheet.html

export interface NormalizedLogon {
	format: 'upn' | 'downlevel' | 'bare';
	// the resolved lookup value: domain stripped for down-level, UPN synthesized
	// for bare + defaultDomain. callers escape this before putting it in a filter.
	value: string;
	raw: string;
}

// escape the five filter-breaking characters per RFC 4515: \ * ( ) and NUL.
// applied to untrusted user input (the submitted username) before it enters a
// search filter. char codes are used for NUL so the source stays printable.
export function escapeFilterValue(value: string): string {
	let out = '';
	for (const ch of value) {
		if (ch === '\\') out += '\\5c';
		else if (ch === '*') out += '\\2a';
		else if (ch === '(') out += '\\28';
		else if (ch === ')') out += '\\29';
		else if (ch.charCodeAt(0) === 0) out += '\\00';
		else out += ch;
	}
	return out;
}

export function normalizeUsername(
	input: string,
	opts?: { usernameAttributes?: string[]; defaultDomain?: string }
): NormalizedLogon | null {
	const raw = (input ?? '').trim();
	if (!raw) return null;
	// defensive upper bound; a sane logon is never this long. also rejects
	// payloads designed to blow up the directory server.
	if (raw.length > 256) return null;
	// reject embedded control characters (NUL, CR, LF, tab, etc.) outright.
	for (const ch of raw) {
		if (ch.charCodeAt(0) < 0x20) return null;
	}

	// UPN: user@domain.com -> match userPrincipalName
	if (raw.includes('@')) {
		const parts = raw.split('@');
		if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
		return { format: 'upn', value: raw, raw };
	}

	// down-level: DOMAIN\sAMAccountName -> strip the domain, match sAMAccountName.
	// single-forest assumption: the domain segment is informational; the user is
	// located within searchBase.
	if (raw.includes('\\')) {
		const sam = raw.slice(raw.indexOf('\\') + 1);
		if (!sam || sam.includes('\\')) return null;
		return { format: 'downlevel', value: sam, raw };
	}

	// bare sAMAccountName, or synthesize a UPN when a default domain is configured.
	if (opts?.defaultDomain) {
		return { format: 'upn', value: `${raw}@${opts.defaultDomain}`, raw };
	}
	return { format: 'bare', value: raw, raw };
}

// build the user-lookup filter: match the (escaped) logon value against every
// configured username attribute, OR'd together, scoped to user objects.
export function buildUserSearchFilter(
	logon: NormalizedLogon,
	usernameAttributes: string[]
): string {
	const esc = escapeFilterValue(logon.value);
	const attrs =
		usernameAttributes.length > 0 ? usernameAttributes : ['sAMAccountName', 'userPrincipalName'];
	const clauses = attrs.map((a) => `(${a}=${esc})`).join('');
	const inner = attrs.length > 1 ? `(|${clauses})` : clauses;
	return `(&(objectClass=user)${inner})`;
}

// membership test (incl. NESTED groups) via the matching-rule-in-chain OID
// 1.2.840.113556.1.4.1941. per the Microsoft doc, set the search base to the
// user's DN with scope 'base' and use this filter. spaces are NOT allowed
// inside the rule string.
//
// groupDN is trusted admin config (LDAP_ALLOWED_GROUP_DN), so this only guards
// against filter-breaking literals (e.g. a group named "App (Prod) Users").
// backslashes are left intact so already-escaped DN components are not
// double-encoded.
export function buildGroupMembershipFilter(groupDN: string): string {
	const safe = groupDN.replace(/\*/g, '\\2a').replace(/\(/g, '\\28').replace(/\)/g, '\\29');
	return `(memberOf:1.2.840.113556.1.4.1941:=${safe})`;
}
