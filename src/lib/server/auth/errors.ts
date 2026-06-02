// AD bind sub-error mapping. Active Directory reports authentication failures as
// LDAP result 49 (invalidCredentials) with a "data <code>" token embedded in the
// diagnostic message, e.g.
//   "80090308: LdapErr: DSID-0C0903A9, comment: AcceptSecurityContext error, data 52e, v1db1"
// we parse that token and map it to a user-facing message.
//
// 525 (no such user) and 52e (bad password) deliberately collapse to ONE generic
// message so the login form cannot be used to enumerate valid usernames.
//
// sub-codes: https://learn.microsoft.com/en-us/troubleshoot/windows-server/active-directory/useraccountcontrol-manipulate-account-properties

const AD_SUBCODE_RE = /data\s+([0-9a-f]{3,4})/i;
const GENERIC_BAD_CREDENTIALS = 'Incorrect username or password.';
const CONNECTION_FAILED = 'Cannot reach the directory server. Check the LDAP configuration.';
const CONNECTION_HINT_RE =
	/(econnrefused|enotfound|etimedout|timeout|socket|tls|ssl|certificate|self[- ]signed|getaddrinfo|connect)/i;

function errorMessage(err: unknown): string {
	if (!err) return '';
	if (typeof err === 'string') return err;
	if (err instanceof Error) return err.message;
	if (typeof err === 'object') {
		const o = err as Record<string, unknown>;
		// ldapts errors carry .message; some AD diagnostics surface under lde_message
		return String(o.message ?? o.lde_message ?? '');
	}
	return String(err);
}

export function extractAdSubCode(err: unknown): string | null {
	const match = AD_SUBCODE_RE.exec(errorMessage(err));
	return match ? match[1].toLowerCase() : null;
}

export function mapAdBindError(err: unknown): string {
	switch (extractAdSubCode(err)) {
		case '525': // user not found
		case '52e': // invalid credentials
			return GENERIC_BAD_CREDENTIALS;
		case '530':
			return 'Sign-in is not permitted at this time.';
		case '531':
			return 'Sign-in is not permitted from this workstation.';
		case '532':
			return 'Your password has expired. Contact your administrator.';
		case '533':
			return 'Your account is disabled. Contact your administrator.';
		case '701':
			return 'Your account has expired. Contact your administrator.';
		case '773':
			return 'You must reset your password before signing in.';
		case '775':
			return 'Your account is locked. Contact your administrator.';
		default:
			break;
	}
	// no AD sub-code: most likely a connection / TLS / timeout failure
	if (CONNECTION_HINT_RE.test(errorMessage(err))) return CONNECTION_FAILED;
	return 'Sign-in failed. Please try again.';
}
