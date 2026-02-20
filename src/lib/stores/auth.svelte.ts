import { browser } from '$app/environment';
import {
	onAuthStateChanged,
	signInWithPopup,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	sendPasswordResetEmail,
	signOut as firebaseSignOut,
	GoogleAuthProvider,
	updateProfile,
	type User
} from 'firebase/auth';
import { auth } from '$lib/firebase';

const googleProvider = new GoogleAuthProvider();

class AuthStore {
	user = $state<User | null>(null);
	loading = $state(true);
	error = $state<string | null>(null);

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
			onAuthStateChanged(auth, (user) => {
				this.user = user;
				this.loading = false;
			});
		} else {
			this.loading = false;
		}
	}

	async signInWithGoogle() {
		this.error = null;
		try {
			await signInWithPopup(auth, googleProvider);
		} catch (err) {
			this.error = this.getErrorMessage(err);
			throw err;
		}
	}

	async signInWithEmail(email: string, password: string) {
		this.error = null;
		try {
			await signInWithEmailAndPassword(auth, email, password);
		} catch (err) {
			this.error = this.getErrorMessage(err);
			throw err;
		}
	}

	async signUpWithEmail(email: string, password: string, displayName: string) {
		this.error = null;
		try {
			const credential = await createUserWithEmailAndPassword(auth, email, password);
			if (displayName) {
				await updateProfile(credential.user, { displayName });
			}
		} catch (err) {
			this.error = this.getErrorMessage(err);
			throw err;
		}
	}

	async sendPasswordReset(email: string) {
		this.error = null;
		try {
			await sendPasswordResetEmail(auth, email);
		} catch (err) {
			this.error = this.getErrorMessage(err);
			throw err;
		}
	}

	async signOut() {
		this.error = null;
		try {
			await firebaseSignOut(auth);
		} catch (err) {
			this.error = this.getErrorMessage(err);
		}
	}

	clearError() {
		this.error = null;
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
			default:
				return 'An error occurred. Please try again.';
		}
	}
}

export const authStore = new AuthStore();
