// firebase initialization is deferred behind a dynamic import so the SDK
// (~480kb minified) is only fetched once a consumer actually needs auth or
// firestore - landing-page visitors who never sign in pay zero
import {
	PUBLIC_FIREBASE_API_KEY,
	PUBLIC_FIREBASE_AUTH_DOMAIN,
	PUBLIC_FIREBASE_PROJECT_ID,
	PUBLIC_FIREBASE_STORAGE_BUCKET,
	PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	PUBLIC_FIREBASE_APP_ID
} from '$env/static/public';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: PUBLIC_FIREBASE_API_KEY,
	authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: PUBLIC_FIREBASE_APP_ID
};

let appPromise: Promise<{ auth: Auth; db: Firestore }> | null = null;

// resolves to initialized auth + firestore handles, memoized so repeat callers
// don't re-trigger the import or the initializeApp call
export function getFirebase(): Promise<{ auth: Auth; db: Firestore }> {
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
