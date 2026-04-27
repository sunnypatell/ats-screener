// shared numeric clamp + safe-parse helpers used by user-facing routes
// that accept query parameters (currently /api/og and /share). centralised
// so the same clamping behaviour is enforced across every consumer of
// share-link query strings.
//
// pure, no side effects. fully unit-tested (see tests/unit/clamp.test.ts).

export function clamp(n: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, n));
}

// parses a query-string value to an integer. clamps to [min, max] when valid,
// returns fallback when the input is null, empty, or non-numeric. used by
// every share-URL surface so a tampered URL like ?score=99999 cannot push
// values out of the safe range that downstream renderers expect.
export function parseInt0(v: string | null, fallback: number, min: number, max: number): number {
	const n = v ? Number.parseInt(v, 10) : NaN;
	return Number.isFinite(n) ? clamp(n, min, max) : fallback;
}
