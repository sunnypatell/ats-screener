import type { ScoreResult } from './types';

// derived insights across all of a user's scans. pure function so it's easy to
// unit-test - no live store, no side effects, no async.

interface JourneyInputEntry {
	id: string;
	timestamp: string;
	averageScore: number;
	results: ScoreResult[];
}

export interface JourneyStats {
	totalScans: number;
	firstScore: number;
	latestScore: number;
	totalDelta: number;
	bestScore: number;
	bestPlatformDelta: { system: string; delta: number } | null;
	daysSpan: number;
}

export function computeJourneyStats(entries: JourneyInputEntry[]): JourneyStats | null {
	if (entries.length === 0) return null;

	// sort ascending by timestamp so [0] is oldest, [-1] is newest
	const sorted = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
	const first = sorted[0];
	const latest = sorted[sorted.length - 1];

	const bestScore = Math.max(...sorted.map((e) => e.averageScore));

	// per-platform delta: latest minus first, only for platforms present in BOTH
	let bestPlatformDelta: { system: string; delta: number } | null = null;
	if (sorted.length >= 2) {
		const firstBySystem = new Map(first.results.map((r) => [r.system, r.overallScore]));
		for (const r of latest.results) {
			const prev = firstBySystem.get(r.system);
			if (prev === undefined) continue;
			const delta = r.overallScore - prev;
			if (!bestPlatformDelta || delta > bestPlatformDelta.delta) {
				bestPlatformDelta = { system: r.system, delta };
			}
		}
	}

	const daysSpan = Math.max(
		0,
		Math.floor((Date.parse(latest.timestamp) - Date.parse(first.timestamp)) / 86_400_000)
	);

	return {
		totalScans: sorted.length,
		firstScore: first.averageScore,
		latestScore: latest.averageScore,
		totalDelta: latest.averageScore - first.averageScore,
		bestScore,
		bestPlatformDelta,
		daysSpan
	};
}
