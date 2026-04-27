// client-side job-description library. lets users save and recall JDs
// across sessions without any server infrastructure.
//
// persists to localStorage under 'ats_jd_library'. capped at 10 entries
// with FIFO eviction (oldest dropped first when the cap is exceeded).
// graceful fallback to in-memory-only when localStorage is unavailable
// (incognito, sandboxed iframes). one warn log per session on first failure.

import { browser } from '$app/environment';
import { logger } from '$lib/log';

const KEY = 'ats_jd_library';
const CAP = 10;

export interface JDEntry {
	id: string;
	label: string;
	content: string;
	savedAt: string;
}

class JDLibrary {
	entries = $state<JDEntry[]>([]);

	// whether localStorage has already been loaded this session
	private loaded = false;
	// whether we have already warned about a storage failure this session
	private warnedAboutStorage = false;

	// lazy-load from localStorage on first access
	private load() {
		if (this.loaded || !browser) return;
		this.loaded = true;
		try {
			const raw = localStorage.getItem(KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as JDEntry[];
				if (Array.isArray(parsed)) {
					this.entries = parsed;
				}
			}
		} catch (err) {
			if (!this.warnedAboutStorage) {
				this.warnedAboutStorage = true;
				logger.warn('jd_library.storage_failed', {
					error: err instanceof Error ? err.message : String(err)
				});
			}
		}
	}

	private persist() {
		if (!browser) return;
		try {
			localStorage.setItem(KEY, JSON.stringify(this.entries));
		} catch (err) {
			if (!this.warnedAboutStorage) {
				this.warnedAboutStorage = true;
				logger.warn('jd_library.storage_failed', {
					error: err instanceof Error ? err.message : String(err)
				});
			}
		}
	}

	get list(): JDEntry[] {
		this.load();
		return this.entries;
	}

	save(label: string, content: string): void {
		this.load();
		const trimmedLabel = label.trim();
		const trimmedContent = content.trim();
		if (!trimmedContent) return;

		const entry: JDEntry = {
			id: crypto.randomUUID(),
			label: trimmedLabel || 'untitled',
			content: trimmedContent,
			savedAt: new Date().toISOString()
		};

		// prepend newest; evict oldest when over cap
		const updated = [entry, ...this.entries];
		this.entries = updated.slice(0, CAP);
		this.persist();
	}

	remove(id: string): void {
		this.load();
		this.entries = this.entries.filter((e) => e.id !== id);
		this.persist();
	}

	clear(): void {
		this.load();
		this.entries = [];
		this.persist();
	}
}

export const jdLibrary = new JDLibrary();
