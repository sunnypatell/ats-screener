// pure geometry helper for the score-timeline svg chart on /history.
// extracted so the math is unit-testable without any DOM dependency.

export interface TimelinePoint {
	x: number;
	y: number;
	score: number;
	timestamp: string;
	fileName?: string;
	mode: 'general' | 'targeted';
	id: string;
}

export interface TimelineChart {
	width: number;
	height: number;
	innerLeft: number;
	innerRight: number;
	innerTop: number;
	innerBottom: number;
	points: TimelinePoint[];
	pathD: string;
	areaD: string;
	yMin: number;
	yMax: number;
}

interface InputEntry {
	id: string;
	timestamp: string;
	averageScore: number;
	fileName?: string;
	mode: 'general' | 'targeted';
}

const DEFAULTS = {
	width: 720,
	height: 220,
	padLeft: 32,
	padRight: 24,
	padTop: 16,
	padBottom: 32
};

// builds a left-to-right (oldest -> newest) time-axis chart from a list of
// scan entries (input order doesn't matter; we sort by timestamp ascending)
export function computeTimeline(
	entries: InputEntry[],
	viewBox: { width?: number; height?: number } = {}
): TimelineChart | null {
	if (entries.length < 2) return null;

	const width = viewBox.width ?? DEFAULTS.width;
	const height = viewBox.height ?? DEFAULTS.height;
	const innerLeft = DEFAULTS.padLeft;
	const innerRight = width - DEFAULTS.padRight;
	const innerTop = DEFAULTS.padTop;
	const innerBottom = height - DEFAULTS.padBottom;
	const innerWidth = innerRight - innerLeft;
	const innerHeight = innerBottom - innerTop;

	// sort ascending so leftmost point is the oldest scan
	const sorted = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

	// y scale spans [0, 100]; clamp the geometry input so anomalous out-of-range
	// scores still render INSIDE the chart instead of overflowing the padding box.
	// the unclamped value still goes on `point.score` for tooltip display.
	const yMin = 0;
	const yMax = 100;
	const yRange = yMax - yMin;
	const clampScore = (s: number) => Math.max(yMin, Math.min(yMax, s));

	const n = sorted.length;
	const points: TimelinePoint[] = sorted.map((entry, i) => ({
		x: innerLeft + (i * innerWidth) / Math.max(n - 1, 1),
		// invert because SVG y grows downward
		y: innerTop + (1 - (clampScore(entry.averageScore) - yMin) / yRange) * innerHeight,
		score: entry.averageScore,
		timestamp: entry.timestamp,
		fileName: entry.fileName,
		mode: entry.mode,
		id: entry.id
	}));

	const pathD = points
		.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
		.join(' ');
	// area below the line for the soft fill
	const areaD =
		`${pathD} ` +
		`L ${points[points.length - 1].x.toFixed(2)} ${innerBottom} ` +
		`L ${points[0].x.toFixed(2)} ${innerBottom} Z`;

	return {
		width,
		height,
		innerLeft,
		innerRight,
		innerTop,
		innerBottom,
		points,
		pathD,
		areaD,
		yMin,
		yMax
	};
}
