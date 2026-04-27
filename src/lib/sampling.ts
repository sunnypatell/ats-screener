// deterministic per-event sampling.
// given a seed string and a rate in [0, 1], shouldSample returns the same
// boolean for the same seed every time. used to thin high-volume logging
// (admin scan_logs) without losing the ability to reproduce a decision
// from the seed alone.
//
// hash is djb2 truncated to a 32-bit unsigned int. fast, no deps, no crypto
// guarantees needed (this is sampling, not security). uniformity is good
// enough for the rates we care about (0.01 to 1.0).

export function djb2(s: string): number {
	let h = 5381;
	for (let i = 0; i < s.length; i++) {
		h = ((h << 5) + h + s.charCodeAt(i)) | 0;
	}
	// shift into unsigned 32-bit space so the modulo distribution is uniform
	return h >>> 0;
}

export function shouldSample(seed: string, rate: number): boolean {
	if (!Number.isFinite(rate) || rate <= 0) return false;
	if (rate >= 1) return true;
	// 10000 buckets gives us 0.01% granularity, far finer than we need
	const bucket = djb2(seed) % 10000;
	return bucket < Math.floor(rate * 10000);
}

// parses an env-supplied rate string into a clean number in [0, 1].
// invalid or missing input falls back to 1 (always sample, current behavior).
export function parseSampleRate(raw: string | undefined): number {
	if (raw === undefined || raw === '') return 1;
	const n = Number.parseFloat(raw);
	if (!Number.isFinite(n)) return 1;
	if (n < 0) return 0;
	if (n > 1) return 1;
	return n;
}
