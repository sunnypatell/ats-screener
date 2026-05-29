import { browser } from '$app/environment';
import type { User } from 'firebase/auth';
import { firebaseConfigured, getFirebase } from '$lib/firebase';
import { logger } from '$lib/log';

class AuthStore {
	user = $state<User | null>(null);
	loading = $state(true);
	error = $state<string | null>(null);

	// self-host mode: when firebase is not configured the store reports
	// `disabled = true`, never attempts a network call, and the rest of the
	// app treats the user as having full access (no auth gate, no firestore).
	// hosted production with firebase set up sees `disabled = false` and
	// the existing behaviour is unchanged.
	readonly disabled: boolean = !firebaseConfigured;

	get isAuthenticated(): boolean {
		return this.user !== null;
	}

	get displayName(): string {
		return this.user?.displayName ?? this.user?.email?.split('@')[0] ?? '';
	}

	get photoURL(): string | null {
		return this.user?.photoURL ?? null;
	}

	get email(): string {
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
		if (browser) {
			// self-host mode short-circuits the firebase listener entirely. flip
			// loading off so the auth gate render path completes, and leave
			// user=null. the disabled getter is read directly downstream;
			// canScan returns true because disabled is true.
			if (this.disabled) {
				this.loading = false;
			} else {
				void this.setupAuthListener();
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
