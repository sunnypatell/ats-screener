import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// the localStorage fallback path for scan history is exercised when firebase
// is not configured. mock $env/dynamic/public to remove the project id so
// firebaseConfigured resolves to false at scores.svelte.ts module load.

vi.mock('$app/environment', () => ({ browser: true }));

vi.mock('../../../src/lib/log', () => ({
	logger: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	}
}));

vi.mock('$env/dynamic/public', () => ({ env: {} }));

const LOCAL_HISTORY_KEY = 'ats_local_scan_history_v1';

function clearStorage() {
	localStorage.removeItem(LOCAL_HISTORY_KEY);
}

function readStorage(): unknown[] {
	const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

// build a minimal ScoreResult-shaped object so saveToHistory's reducers
// (averageScore, passingCount) work without dragging the real scorer in.
type StubResult = {
	system: string;
	overallScore: number;
	passesFilter: boolean;
};

function stubResult(score: number, passes: boolean): StubResult {
	return { system: 'Workday', overallScore: score, passesFilter: passes };
}

async function freshStore() {
	vi.resetModules();
	const mod = await import('../../../src/lib/stores/scores.svelte');
	return mod.scoresStore;
}

beforeEach(() => {
	clearStorage();
});

afterEach(() => {
	clearStorage();
});

describe('self-host scan history: localStorage backed', () => {
	it('starts with an empty history when localStorage is empty', async () => {
		const store = await freshStore();
		await store.loadHistory();
		expect(store.history).toEqual([]);
	});

	it('reads pre-existing localStorage entries on loadHistory', async () => {
		const seeded = [
			{
				id: 'local-seed-1',
				timestamp: '2026-05-01T00:00:00.000Z',
				mode: 'general' as const,
				averageScore: 80,
				passingCount: 5,
				results: []
			}
		];
		localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(seeded));
		const store = await freshStore();
		await store.loadHistory();
		expect(store.history).toEqual(seeded);
	});

	it('saveToHistory writes a new entry to localStorage and prepends in memory', async () => {
		const store = await freshStore();
		store.finishScoring([stubResult(82, true), stubResult(76, true)] as never, 'resume.pdf');
		// finishScoring -> saveToHistory is sync on the self-host path; await a
		// microtask to let any state mutation settle.
		await Promise.resolve();
		const persisted = readStorage();
		expect(persisted).toHaveLength(1);
		expect(store.history).toHaveLength(1);
		expect(store.history[0].fileName).toBe('resume.pdf');
		expect(store.history[0].averageScore).toBe(79); // round((82+76)/2)
		expect(store.history[0].passingCount).toBe(2);
	});

	it('cap of 5 entries: oldest are evicted FIFO style', async () => {
		const store = await freshStore();
		// 6 sequential saves; each writes a single-result entry.
		for (let i = 0; i < 6; i++) {
			store.finishScoring([stubResult(60 + i, true)] as never, `r${i}.pdf`);
			await Promise.resolve();
		}
		expect(store.history).toHaveLength(5);
		// newest first: r5 (idx 0) ... r1 (idx 4). r0 evicted.
		expect(store.history[0].fileName).toBe('r5.pdf');
		expect(store.history[4].fileName).toBe('r1.pdf');
		expect(readStorage()).toHaveLength(5);
	});

	it('clearHistory wipes localStorage and the in-memory list', async () => {
		const store = await freshStore();
		store.finishScoring([stubResult(70, true)] as never, 'r.pdf');
		await Promise.resolve();
		expect(readStorage()).toHaveLength(1);

		await store.clearHistory();
		expect(store.history).toEqual([]);
		expect(readStorage()).toEqual([]);
	});

	it('persisted entries survive a fresh store instance (simulating reload)', async () => {
		const first = await freshStore();
		first.finishScoring([stubResult(88, true)] as never, 'first.pdf');
		await Promise.resolve();
		expect(readStorage()).toHaveLength(1);

		const second = await freshStore();
		await second.loadHistory();
		expect(second.history).toHaveLength(1);
		expect(second.history[0].fileName).toBe('first.pdf');
	});

	it('does not call firestore on the self-host path (no network attempts)', async () => {
		// if scoresStore tried to import firebase/firestore here we would get
		// the real SDK trying to reach a (mocked) firebase. instead the early
		// return on !firebaseConfigured should keep the path local.
		const store = await freshStore();
		// vi.spyOn on fetch to catch any network attempt
		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
		store.finishScoring([stubResult(70, true)] as never, 'r.pdf');
		await Promise.resolve();
		expect(fetchSpy).not.toHaveBeenCalled();
		fetchSpy.mockRestore();
	});

	it('jobDescriptionSnippet is truncated to 200 chars when present', async () => {
		const store = await freshStore();
		store.setJobDescription('x'.repeat(500));
		store.finishScoring([stubResult(70, true)] as never, 'r.pdf');
		await Promise.resolve();
		const snippet = store.history[0].jobDescriptionSnippet;
		expect(snippet?.length).toBe(200);
	});

	it('entry id is unique per save (collision unlikely under MAX_HISTORY cap)', async () => {
		const store = await freshStore();
		store.finishScoring([stubResult(70, true)] as never);
		await Promise.resolve();
		store.finishScoring([stubResult(80, true)] as never);
		await Promise.resolve();
		const ids = store.history.map((e) => e.id);
		expect(new Set(ids).size).toBe(ids.length);
		ids.forEach((id) => expect(id).toMatch(/^local-/));
	});
});
