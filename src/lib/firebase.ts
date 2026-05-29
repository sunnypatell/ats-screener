// firebase initialization is deferred behind a dynamic import so the SDK
// (~480kb minified) is only fetched once a consumer actually needs auth or
// firestore. landing-page visitors who never sign in pay zero.
//
// using $env/dynamic/public (not /static/public) so the build does not fail
// on Vercel preview deployments where the PUBLIC_FIREBASE_* vars are scoped
// to Production only. on a preview deploy the values come back undefined,
// firebase init throws at runtime, and the auth-aware code paths swallow it
// gracefully (auth simply does not work on preview, which is the expectation).
//
// self-host mode: when no PUBLIC_FIREBASE_PROJECT_ID is configured we treat
// firebase as disabled across the entire app. auth bypasses entirely, the
// scanner unlocks for anonymous use, and scan history falls back to
// localStorage. see `firebaseConfigured` below.
import { env } from '$env/dynamic/public';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: env.PUBLIC_FIREBASE_API_KEY,
	authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: env.PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: env.PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: env.PUBLIC_FIREBASE_APP_ID
};

// projectId is the only field strictly required by both firebase/auth and
// firebase/firestore. checking it (rather than the full config) keeps the
// self-host detection tolerant of partial configs while still being a strong
// signal: if you have a projectId you almost certainly have the rest.
// trimmed so a stray `PUBLIC_FIREBASE_PROJECT_ID= ` in .env reads as unset.
export const firebaseConfigured: boolean = !!firebaseConfig.projectId?.trim();

let appPromise: Promise<{ auth: Auth; db: Firestore }> | null = null;

// resolves to initialized auth + firestore handles, memoized so repeat callers
// don't re-trigger the import or the initializeApp call. throws if firebase
// is not configured; callers MUST guard with `firebaseConfigured` first so
// the self-host path never reaches the firebase SDK at all.
export function getFirebase(): Promise<{ auth: Auth; db: Firestore }> {
	if (!firebaseConfigured) {
		return Promise.reject(
			new Error(
				'firebase is not configured (PUBLIC_FIREBASE_PROJECT_ID is empty). ' +
					'this is expected for self-hosted instances. guard with `firebaseConfigured` ' +
					'from $lib/firebase before calling getFirebase().'
			)
		);
	}
	if (appPromise) return appPromise;
	appPromise = (async () => {
		const [{ initializeApp, getApps }, { getAuth }, { getFirestore }] = await Promise.all([
			import('firebase/app'),
			import('firebase/auth'),
			import('firebase/firestore')
		]);
		const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
		// database was created as 'default' (not '(default)'), must specify explicitly
		return { auth: getAuth(app), db: getFirestore(app, 'default') };
	})();
	return appPromise;
}
