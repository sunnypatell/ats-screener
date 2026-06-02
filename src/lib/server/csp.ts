// Content-Security-Policy builder. pure (no env, no node built-ins) so it stays
// edge-safe for hooks.server.ts and unit-testable in isolation.
//
// the firebase / google-auth origins are only needed when firebase auth is the
// active mode. a self-hoster who runs without firebase (the ldap or anonymous
// modes) gets a CSP with NO firebase references at all, so the directory-only
// deployment never advertises or reports firebase hosts (closes #13). google
// fonts stay in every mode because the Geist typeface loads from there
// regardless of auth.

const FIREBASE_CONNECT_SRC = [
	'https://*.googleapis.com',
	'https://*.firebaseio.com',
	'https://*.firebaseapp.com',
	'https://*.firebase.com'
];
const FIREBASE_FRAME_SRC = ['https://*.firebaseapp.com', 'https://accounts.google.com'];

export function buildContentSecurityPolicy(allowFirebase: boolean): string {
	const connectSrc = ["'self'", ...(allowFirebase ? FIREBASE_CONNECT_SRC : [])];
	const frameSrc = ["'self'", ...(allowFirebase ? FIREBASE_FRAME_SRC : [])];

	return [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src 'self' https://fonts.gstatic.com",
		"img-src 'self' data: https:",
		`connect-src ${connectSrc.join(' ')}`,
		`frame-src ${frameSrc.join(' ')}`,
		"worker-src 'self' blob:",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		'report-uri /api/csp-report'
	].join('; ');
}
