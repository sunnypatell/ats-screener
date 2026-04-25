// in-memory LRU result cache keyed by SHA-256 of the full prompt
// dies with the instance and is per-region, but warm hits skip the LLM call entirely
// hashing the prompt (not the raw inputs) means prompt-template edits auto-bust stale entries

interface CacheEntry {
	parsed: Record<string, unknown>;
	provider: string;
	expiresAt: number;
}

const resultCache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 200;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function hashPrompt(prompt: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(prompt));
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export function getCached(key: string): CacheEntry | null {
	const entry = resultCache.get(key);
	if (!entry) return null;
	if (Date.now() > entry.expiresAt) {
		resultCache.delete(key);
		return null;
	}
	// bump to most-recent on hit (Map preserves insertion order)
	resultCache.delete(key);
	resultCache.set(key, entry);
	return entry;
}

export function setCached(key: string, parsed: Record<string, unknown>, provider: string): void {
	if (resultCache.size >= MAX_CACHE_SIZE) {
		const oldest = resultCache.keys().next().value;
		if (oldest !== undefined) resultCache.delete(oldest);
	}
	resultCache.set(key, { parsed, provider, expiresAt: Date.now() + CACHE_TTL_MS });
}

// exposed only so tests can introspect; do NOT call from request paths
export function _cacheSize(): number {
	return resultCache.size;
}
