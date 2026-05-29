import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// $env/dynamic/public is the boundary firebase.ts reads from. mocking it
// per-test lets us simulate both the hosted (firebase configured) and the
// self-host (no firebase env vars) paths without spinning up a real env.

beforeEach(() => {
	vi.resetModules();
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.resetModules();
});

describe('firebaseConfigured: presence detection', () => {
	it('is true when PUBLIC_FIREBASE_PROJECT_ID is a non-empty string', async () => {
		vi.doMock('$env/dynamic/public', () => ({
			env: {
				PUBLIC_FIREBASE_PROJECT_ID: 'real-project-id',
				PUBLIC_FIREBASE_API_KEY: 'real-key',
				PUBLIC_FIREBASE_AUTH_DOMAIN: 'real-project-id.firebaseapp.com',
				PUBLIC_FIREBASE_STORAGE_BUCKET: 'real-project-id.appspot.com',
				PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '1234567890',
				PUBLIC_FIREBASE_APP_ID: '1:1234567890:web:abc'
			}
		}));
		const { firebaseConfigured } = await import('../../../src/lib/firebase');
		expect(firebaseConfigured).toBe(true);
	});

	it('is false when PUBLIC_FIREBASE_PROJECT_ID is missing', async () => {
		vi.doMock('$env/dynamic/public', () => ({ env: {} }));
		const { firebaseConfigured } = await import('../../../src/lib/firebase');
		expect(firebaseConfigured).toBe(false);
	});

	it('is false when PUBLIC_FIREBASE_PROJECT_ID is empty string', async () => {
		vi.doMock('$env/dynamic/public', () => ({
			env: { PUBLIC_FIREBASE_PROJECT_ID: '' }
		}));
		const { firebaseConfigured } = await import('../../../src/lib/firebase');
		expect(firebaseConfigured).toBe(false);
	});

	it('is false when PUBLIC_FIREBASE_PROJECT_ID is whitespace-only', async () => {
		// a stray `PUBLIC_FIREBASE_PROJECT_ID=   ` in .env should NOT count
		// as configured. trimmed before the boolean coercion.
		vi.doMock('$env/dynamic/public', () => ({
			env: { PUBLIC_FIREBASE_PROJECT_ID: '   \t\n  ' }
		}));
		const { firebaseConfigured } = await import('../../../src/lib/firebase');
		expect(firebaseConfigured).toBe(false);
	});
});

describe('getFirebase: rejects cleanly when not configured', () => {
	it('rejects with a typed error message when firebaseConfigured is false', async () => {
		vi.doMock('$env/dynamic/public', () => ({ env: {} }));
		const { getFirebase } = await import('../../../src/lib/firebase');
		await expect(getFirebase()).rejects.toThrow(/firebase is not configured/i);
	});

	it('error message references PUBLIC_FIREBASE_PROJECT_ID so the fix is obvious', async () => {
		vi.doMock('$env/dynamic/public', () => ({ env: {} }));
		const { getFirebase } = await import('../../../src/lib/firebase');
		await expect(getFirebase()).rejects.toThrow(/PUBLIC_FIREBASE_PROJECT_ID/);
	});

	it('error message mentions firebaseConfigured guard so callers know how to fix', async () => {
		vi.doMock('$env/dynamic/public', () => ({ env: {} }));
		const { getFirebase } = await import('../../../src/lib/firebase');
		await expect(getFirebase()).rejects.toThrow(/firebaseConfigured/);
	});
});
