import { browser } from '$app/environment';
import type { User } from 'firebase/auth';
import { firebaseConfigured, getFirebase } from '$lib/firebase';
import { logger } from '$lib/log';

// three mutually-exclusive auth modes, resolved server-side and surfaced via the
// root +layout.server.ts (see resolveAuthMode in $lib/server/auth/config). the
// type is duplicated here (not imported) because that module is server-only.
type AuthMode = 'ldap' | 'firebase' | 'none';

// the ldap session user shape mirrors App.Locals['user'] in app.d.ts.
interface LdapSessionUser {
	sub: string;
	name: string;
	email: string;
	groups: string[];
}

class AuthStore {
	// firebase user (firebase mode only); ldapUser (ldap mode only). kept separate
	// so the firebase code path is byte-for-byte unchanged.
	user = $state<User | null>(null);
	ldapUser = $state<LdapSessionUser | null>(null);
	loading = $state(true);
	error = $state<string | null>(null);

	// the active auth mode. seeded from firebaseConfigured in the constructor so
	// first paint matches the pre-feature behaviour exactly, then upgraded to
	// 'ldap' by hydrateFromServer() when the server says so (ldap is server-only
	// knowledge the client can't see at construction time).
	mode = $state<AuthMode>('none');

	// self-host 'none' mode reports disabled = true: no auth gate, no firestore,
	// anonymous localStorage history. firebase and ldap both report false.
	// preserved as a getter so every existing `authStore.disabled` reader keeps
	// working unchanged.
	get disabled(): boolean {
		return this.mode === 'none';
	}

	// true when the app should require sign-in (firebase OR ldap). the inverse of
	// disabled; used by the navbar auth slot and the scanner gate.
	get requiresAuth(): boolean {
		return this.mode !== 'none';
	}

	// stable subject for the signed-in ldap user (objectGUID), used to namespace
	// localStorage scan history per AD user. null outside ldap mode.
	get ldapSub(): string | null {
		return this.mode === 'ldap' ? (this.ldapUser?.sub ?? null) : null;
	}

	get isAuthenticated(): boolean {
		if (this.mode === 'ldap') return this.ldapUser !== null;
		if (this.mode === 'none') return false;
		return this.user !== null;
	}

	get displayName(): string {
		if (this.mode === 'ldap') {
			return this.ldapUser?.name ?? this.ldapUser?.email?.split('@')[0] ?? '';
		}
		return this.user?.displayName ?? this.user?.email?.split('@')[0] ?? '';
	}

	get photoURL(): string | null {
		// ldap users have no avatar; UserMenu falls back to initials.
		if (this.mode === 'ldap') return null;
		return this.user?.photoURL ?? null;
	}

	get email(): string {
		if (this.mode === 'ldap') return this.ldapUser?.email ?? '';
		return this.user?.email ?? '';
	}

	get initials(): string {
		const name = this.displayName;
		if (!name) return '?';
		const parts = name.split(' ').filter(Boolean);
		if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
		return name[0].toUpperCase();
	}

	constructor() {
		// ldap is server-only knowledge, so at construction we only know firebase
		// vs none. hydrateFromServer() upgrades to 'ldap' once the layout data lands.
		this.mode = firebaseConfigured ? 'firebase' : 'none';
		if (browser) {
			if (this.mode === 'firebase') {
				void this.setupAuthListener();
			} else {
				// none mode (and the pre-hydration state of ldap) has no client
				// listener. flip loading off so the render path completes.
				this.loading = false;
			}
		}
		// on SSR, loading stays true so the server renders the loading spinner.
		// the client also starts with loading=true until onAuthStateChanged fires
		// (or, in self-host mode, until the constructor flips it on first tick).
		// this ensures SSR and initial client output are identical, preventing
		// the hydration_mismatch warning that occurred when SSR rendered the
		// auth-gate (loading=false, user=null) while the client rendered the
		// loading spinner (loading=true).
	}

	// bridge the root +layout.server.ts data into the singleton. called from
	// +layout.svelte on both SSR and client so the resolved mode + ldap user are
	// reflected before first paint. idempotent. firebase/none modes leave the
	// firebase listener (and its loading/user) untouched.
	hydrateFromServer(data: { authMode: AuthMode; user: LdapSessionUser | null }): void {
		// browser-only: never write per-request server data into this module-level
		// singleton during SSR, or one request's identity could bleed into another
		// request's rendered html. on the server the store stays at its constructor
		// defaults and the client hydrates after mount; the firebase dns-prefetch
		// gate still works because the constructor seeds `mode` from firebaseConfigured.
		if (!browser) return;
		this.mode = data.authMode;
		// always clear ldapUser outside the ldap branch so no stale identity
		// survives a mode transition (the getters guard on mode anyway).
		this.ldapUser = data.authMode === 'ldap' ? data.user : null;
		// ldap/none have no async listener, so resolve loading here. firebase
		// leaves loading to onAuthStateChanged (flipping it early would flash the
		// Sign In button before a logged-in user's session resolves).
		if (data.authMode !== 'firebase') this.loading = false;
	}

	private async setupAuthListener() {
		try {
			const { auth } = await getFirebase();
			const { onAuthStateChanged, getRedirectResult, getAdditionalUserInfo } =
				await import('firebase/auth');
			onAuthStateChanged(auth, (user) => {
				this.user = user;
				this.loading = false;
			});
			// handle redirect result from signInWithRedirect fallback
			try {
				const result = await getRedirectResult(auth);
				if (result && getAdditionalUserInfo(result)?.isNewUser) {
					this.incrementUserCount();
				}
			} catch {
				// non-critical; redirect path is the fallback for popup blockers
			}
		} catch (err) {
			// firebase init failed even though firebaseConfigured was true.
			// rather than hang on loading=true forever (the bug that the
			// self-host flow was hitting before v0.3.2), flip to a safe
			// non-authenticated terminal state and log for visibility.
			this.loading = false;
			logger.error('auth.listener_init_failed', {
				error: err instanceof Error ? err.message : String(err)
			});
		}
	}

	async signInWithGoogle() {
		this.error = null;
		const { auth } = await getFirebase();
		const { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getAdditionalUserInfo } =
			await import('firebase/auth');
		const provider = new GoogleAuthProvider();
		try {
			const result = await signInWithPopup(auth, provider);
			if (getAdditionalUserInfo(result)?.isNewUser) {
				this.incrementUserCount();
			}
		} catch (err) {
			// if popup fails with an internal SDK error (not a Firebase auth error),
			// fall back to redirect-based sign-in
			const code = (err as { code?: string })?.code;
			if (!code || err instanceof TypeError) {
				logger.warn('auth.popup_fallback_to_redirect', {
					error: err instanceof Error ? err.message : String(err)
				});
				try {
					await signInWithRedirect(auth, provider);
					return; // redirect navigates away
				} catch (redirectErr) {
					this.error = this.getErrorMessage(redirectErr);
					throw redirectErr;
				}
			}
			this.error = this.getErrorMessage(err);
			throw err;
		}
	}

	async signInWithEmail(email: string, password: string) {
		this.error = null;
		const { auth } = await getFirebase();
		const { signInWithEmailAndPassword } = await import('firebase/auth');
		try {
			await signInWithEmailAndPassword(auth, email, password);
		} catch (err) {
			this.error = this.getErrorMessage(err);
			throw err;
		}
	}

	async signUpWithEmail(email: string, password: string, displayName: string) {
		this.error = null;
		const { auth } = await getFirebase();
		const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } =
			await import('firebase/auth');
		try {
			const credential = await createUserWithEmailAndPassword(auth, email, password);
			if (displayName) {
				await updateProfile(credential.user, { displayName });
			}
			// send verification email (non-blocking, don't fail signup if this errors)
			sendEmailVerification(credential.user).catch((err) => {
				logger.warn('auth.verification_email_failed', {
					error: err instanceof Error ? err.message : String(err)
				});
			});
			// new email sign-up is always a new user
			this.incrementUserCount();
		} catch (err) {
			this.error = this.getErrorMessage(err);
			throw err;
		}
	}

	async sendPasswordReset(email: string) {
		this.error = null;
		const { auth } = await getFirebase();
		const { sendPasswordResetEmail } = await import('firebase/auth');
		try {
			await sendPasswordResetEmail(auth, email);
		} catch (err) {
			this.error = this.getErrorMessage(err);
			throw err;
		}
	}

	async signOut() {
		this.error = null;
		// ldap: clear the server session cookie, then drop the local user so the
		// UI updates immediately. the caller (UserMenu) navigates afterwards.
		if (this.mode === 'ldap') {
			try {
				await fetch('/logout', { method: 'POST' });
			} catch (err) {
				logger.warn('auth.ldap_logout_failed', {
					error: err instanceof Error ? err.message : String(err)
				});
			}
			this.ldapUser = null;
			return;
		}
		const { auth } = await getFirebase();
		const { signOut: firebaseSignOut } = await import('firebase/auth');
		try {
			await firebaseSignOut(auth);
		} catch (err) {
			this.error = this.getErrorMessage(err);
		}
	}

	clearError() {
		this.error = null;
	}

	private async incrementUserCount() {
		const { db } = await getFirebase();
		const { doc, updateDoc, increment } = await import('firebase/firestore');
		updateDoc(doc(db, 'stats', 'public'), {
			userCount: increment(1)
		}).catch(() => {
			// non-critical, don't break auth flow
		});
	}

	private getErrorMessage(err: unknown): string {
		const code = (err as { code?: string })?.code ?? '';
		switch (code) {
			case 'auth/user-not-found':
				return 'No account found with this email.';
			case 'auth/wrong-password':
			case 'auth/invalid-credential':
				return 'Incorrect email or password.';
			case 'auth/email-already-in-use':
				return 'An account with this email already exists.';
			case 'auth/weak-password':
				return 'Password must be at least 6 characters.';
			case 'auth/invalid-email':
				return 'Please enter a valid email address.';
			case 'auth/too-many-requests':
				return 'Too many attempts. Please try again later.';
			case 'auth/popup-closed-by-user':
				return 'Sign-in popup was closed. Please try again.';
			case 'auth/popup-blocked':
				return 'Sign-in popup was blocked. Please allow popups for this site.';
			case 'auth/unauthorized-domain':
				return 'This domain is not authorized for sign-in. Add it to Firebase Console → Authentication → Settings → Authorized domains.';
			case 'auth/configuration-not-found':
				return 'Firebase auth is not configured. Check your environment variables.';
			case 'auth/internal-error':
				return 'Firebase internal error. Check that Google sign-in is enabled in Firebase Console.';
			default:
				logger.error('auth.unhandled_error', {
					code: code || 'unknown',
					error: err instanceof Error ? err.message : String(err)
				});
				return `Authentication error (${code || 'unknown'}). Please try again.`;
		}
	}
}

export const authStore = new AuthStore();
