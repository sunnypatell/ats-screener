import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// the store reads browser from $app/environment. force it true so the
// localStorage path runs instead of bailing at the browser guard.
vi.mock('$app/environment', () => ({ browser: true }));

// silence $lib/log warn calls so test output stays clean
vi.mock('../../../src/lib/log', () => ({
	logger: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	}
}));

// we reimport the store fresh per describe block that needs isolation by
// resetting the module registry. shared helpers live outside any describe.

function makeStore() {
	// each call returns a new JDLibrary instance by re-executing the module.
	// vi.resetModules() must be called before each import.
	return import('../../../src/lib/stores/jd-library.svelte').then((m) => m.jdLibrary);
}

// helper: seed localStorage with a serialised array of entries
function seedStorage(entries: object[]): void {
	localStorage.setItem('ats_jd_library', JSON.stringify(entries));
}

function clearStorage(): void {
	localStorage.removeItem('ats_jd_library');
}

beforeEach(() => {
	clearStorage();
	vi.resetModules();
});

afterEach(() => {
	clearStorage();
	vi.restoreAllMocks();
});

// -----------------------------------------------------------------------
// save
// -----------------------------------------------------------------------
describe('save', () => {
	it('adds an entry with id, ISO savedAt, and trimmed content', async () => {
		const store = await makeStore();
		store.save('My Label', '  Senior Engineer at Acme Corp  ');
		const entries = store.list;
		expect(entries).toHaveLength(1);
		expect(entries[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
		expect(entries[0].label).toBe('My Label');
		expect(entries[0].content).toBe('Senior Engineer at Acme Corp');
		expect(new Date(entries[0].savedAt).toISOString()).toBe(entries[0].savedAt);
	});

	it('rejects empty content (empty string)', async () => {
		const store = await makeStore();
		store.save('Label', '');
		expect(store.list).toHaveLength(0);
	});

	it('rejects whitespace-only content', async () => {
		const store = await makeStore();
		store.save('Label', '   \n\t  ');
		expect(store.list).toHaveLength(0);
	});

	it('falls back to "untitled" when label is empty', async () => {
		const store = await makeStore();
		store.save('', 'Some job description content here');
		expect(store.list[0].label).toBe('untitled');
	});

	it('prepends newest entry so list is newest-first', async () => {
		const store = await makeStore();
		store.save('First', 'first content for test');
		store.save('Second', 'second content for test');
		expect(store.list[0].label).toBe('Second');
		expect(store.list[1].label).toBe('First');
	});
});

// -----------------------------------------------------------------------
// cap eviction
// -----------------------------------------------------------------------
describe('cap of 10', () => {
	it('evicts the oldest entry when the 11th is saved', async () => {
		const store = await makeStore();
		for (let i = 1; i <= 10; i++) {
			store.save(`Label ${i}`, `Content for entry ${i} which is long enough`);
		}
		expect(store.list).toHaveLength(10);
		// the oldest is now at the end because we prepend
		expect(store.list[9].label).toBe('Label 1');

		store.save('Label 11', 'Content for the eleventh entry to trigger eviction');
		expect(store.list).toHaveLength(10);
		// oldest (Label 1) should be gone; newest at index 0
		expect(store.list[0].label).toBe('Label 11');
		expect(store.list.find((e) => e.label === 'Label 1')).toBeUndefined();
	});
});

// -----------------------------------------------------------------------
// remove
// -----------------------------------------------------------------------
describe('remove', () => {
	it('deletes the entry with the matching id', async () => {
		const store = await makeStore();
		store.save('A', 'Content A long enough');
		store.save('B', 'Content B long enough');
		const idA = store.list.find((e) => e.label === 'A')!.id;
		store.remove(idA);
		expect(store.list.find((e) => e.label === 'A')).toBeUndefined();
		expect(store.list.find((e) => e.label === 'B')).toBeDefined();
	});

	it('is a no-op for an unknown id', async () => {
		const store = await makeStore();
		store.save('A', 'Content A long enough');
		store.remove('non-existent-id');
		expect(store.list).toHaveLength(1);
	});
});

// -----------------------------------------------------------------------
// clear
// -----------------------------------------------------------------------
describe('clear', () => {
	it('empties the list', async () => {
		const store = await makeStore();
		store.save('A', 'Content A long enough');
		store.save('B', 'Content B long enough');
		store.clear();
		expect(store.list).toHaveLength(0);
	});
});

// -----------------------------------------------------------------------
// localStorage persistence
// -----------------------------------------------------------------------
describe('localStorage persistence', () => {
	it('saves to localStorage on save()', async () => {
		const store = await makeStore();
		store.save('Persist Me', 'Job description content that is long enough to persist');
		const raw = localStorage.getItem('ats_jd_library');
		expect(raw).not.toBeNull();
		const parsed = JSON.parse(raw!) as { label: string }[];
		expect(parsed[0].label).toBe('Persist Me');
	});

	it('re-instantiated store reads from existing localStorage', async () => {
		// seed localStorage directly (simulating a previous session)
		seedStorage([
			{
				id: 'abc-123',
				label: 'Seeded Entry',
				content: 'Seeded content long enough',
				savedAt: new Date().toISOString()
			}
		]);
		// fresh import sees the pre-existing data
		vi.resetModules();
		const fresh = await makeStore();
		expect(fresh.list).toHaveLength(1);
		expect(fresh.list[0].label).toBe('Seeded Entry');
	});

	it('persists removal to localStorage', async () => {
		const store = await makeStore();
		store.save('To Remove', 'Content that will be removed from storage');
		const id = store.list[0].id;
		store.remove(id);
		const raw = localStorage.getItem('ats_jd_library');
		const parsed = JSON.parse(raw!) as { id: string }[];
		expect(parsed.find((e) => e.id === id)).toBeUndefined();
	});
});

// -----------------------------------------------------------------------
// localStorage failure: graceful in-memory fallback
// -----------------------------------------------------------------------
describe('localStorage failure', () => {
	it('does not crash and still holds entries in memory when localStorage throws', async () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('QuotaExceededError');
		});
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new DOMException('SecurityError');
		});

		const store = await makeStore();
		// should not throw
		expect(() => store.save('Fallback', 'In-memory content that should survive')).not.toThrow();
		// entry still in memory
		expect(store.list).toHaveLength(1);
		expect(store.list[0].label).toBe('Fallback');
	});

	it('emits at most one logger.warn per session on storage failure', async () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new DOMException('SecurityError');
		});
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('QuotaExceededError');
		});

		const { logger } = await import('../../../src/lib/log');
		const store = await makeStore();
		store.save('One', 'content one enough');
		store.save('Two', 'content two enough');
		store.save('Three', 'content three enough');

		// warn should have been called exactly once regardless of how many
		// operations failed
		expect((logger.warn as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
	});
});
