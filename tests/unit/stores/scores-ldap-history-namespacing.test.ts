import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ldap self-host mode reuses the localStorage history path (firebase is not
// configured) but namespaces the bucket by the signed-in AD user's stable
// subject. mocks mirror scores-local-history.test.ts.

vi.mock('$app/environment', () => ({ browser: true }));

vi.mock('../../../src/lib/log', () => ({
	logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

vi.mock('$env/dynamic/public', () => ({ env: {} }));

const BARE_KEY = 'ats_local_scan_history_v1';
const SUB = 'guid-deadbeef';
const NS_KEY = `${BARE_KEY}__${SUB}`;

type StubResult = { system: string; overallScore: number; passesFilter: boolean };
function stubResult(score: number, passes: boolean): StubResult {
	return { system: 'Workday', overallScore: score, passesFilter: passes };
}

function readKey(key: string): unknown[] {
	const raw = localStorage.getItem(key);
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

async function freshGraph() {
	vi.resetModules();
	const { authStore } = await import('../../../src/lib/stores/auth.svelte');
	const { scoresStore } = await import('../../../src/lib/stores/scores.svelte');
	return { authStore, scoresStore };
}

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	localStorage.clear();
});

describe('ldap mode: scan history namespaced by AD subject', () => {
	it('writes history under a per-user key, leaving the anonymous bucket untouched', async () => {
		const { authStore, scoresStore } = await freshGraph();
		authStore.hydrateFromServer({
			authMode: 'ldap',
			user: { sub: SUB, name: 'Jane Doe', email: 'jane@corp.local', groups: [] }
		});
		scoresStore.finishScoring([stubResult(82, true)] as never, 'resume.pdf');
		await Promise.resolve();

		expect(readKey(NS_KEY)).toHaveLength(1);
		expect(readKey(BARE_KEY)).toEqual([]);
	});

	it('keeps two AD users on the same browser in separate buckets', async () => {
		const { authStore, scoresStore } = await freshGraph();

		authStore.hydrateFromServer({
			authMode: 'ldap',
			user: { sub: 'guid-aaa', name: 'A', email: '', groups: [] }
		});
		scoresStore.finishScoring([stubResult(70, true)] as never, 'a.pdf');
		await Promise.resolve();

		authStore.hydrateFromServer({
			authMode: 'ldap',
			user: { sub: 'guid-bbb', name: 'B', email: '', groups: [] }
		});
		scoresStore.finishScoring([stubResult(90, true)] as never, 'b.pdf');
		await Promise.resolve();

		expect(readKey(`${BARE_KEY}__guid-aaa`)).toHaveLength(1);
		expect(readKey(`${BARE_KEY}__guid-bbb`)).toHaveLength(1);
		expect(readKey(BARE_KEY)).toEqual([]);
	});

	it('anonymous (none) mode still uses the bare legacy key', async () => {
		const { authStore, scoresStore } = await freshGraph();
		expect(authStore.mode).toBe('none');
		scoresStore.finishScoring([stubResult(65, true)] as never, 'anon.pdf');
		await Promise.resolve();

		expect(readKey(BARE_KEY)).toHaveLength(1);
	});
});
