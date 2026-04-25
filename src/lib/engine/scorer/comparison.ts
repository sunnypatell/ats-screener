import type { ScoreResult } from './types';

// pure comparison between two ATS scan result sets
// used by the dashboard to show "you went from X to Y" deltas
// kept side-effect free so unit tests can drive every branch deterministically

export interface PlatformDelta {
	system: string;
	previous: number;
	current: number;
	delta: number;
}

export interface ScanComparison {
	previousAverage: number;
	currentAverage: number;
	deltaAverage: number;
	previousPassing: number;
	currentPassing: number;
	deltaPassing: number;
	platforms: PlatformDelta[];
	improved: number;
	regressed: number;
	unchanged: number;
}

function average(results: ScoreResult[]): number {
	if (results.length === 0) return 0;
	const sum = results.reduce((acc, r) => acc + r.overallScore, 0);
	return Math.round(sum / results.length);
}

function passingCount(results: ScoreResult[]): number {
	return results.filter((r) => r.passesFilter).length;
}

export function computeScanComparison(
	current: ScoreResult[],
	previous: ScoreResult[]
): ScanComparison | null {
	if (current.length === 0 || previous.length === 0) return null;

	const currentAverage = average(current);
	const previousAverage = average(previous);
	const currentPassing = passingCount(current);
	const previousPassing = passingCount(previous);

	const previousBySystem = new Map(previous.map((r) => [r.system, r.overallScore]));

	const platforms: PlatformDelta[] = [];
	let improved = 0;
	let regressed = 0;
	let unchanged = 0;

	for (const curr of current) {
		const prevScore = previousBySystem.get(curr.system);
		if (prevScore === undefined) continue;
		const delta = curr.overallScore - prevScore;
		platforms.push({
			system: curr.system,
			previous: prevScore,
			current: curr.overallScore,
			delta
		});
		if (delta > 0) improved++;
		else if (delta < 0) regressed++;
		else unchanged++;
	}

	return {
		previousAverage,
		currentAverage,
		deltaAverage: currentAverage - previousAverage,
		previousPassing,
		currentPassing,
		deltaPassing: currentPassing - previousPassing,
		platforms,
		improved,
		regressed,
		unchanged
	};
}
