/**
 * Score classification tiers used across the app.
 * Single source of truth for score-to-label/color mapping.
 */

export type ScoreTier = 'excellent' | 'good' | 'fair' | 'poor';

export interface ScoreClassification {
	tier: ScoreTier;
	label: string;
	color: string;
}

const tiers: { min: number; tier: ScoreTier; label: string; color: string }[] = [
	{ min: 80, tier: 'excellent', label: 'Excellent', color: '#22c55e' },
	{ min: 60, tier: 'good', label: 'Good', color: '#eab308' },
	{ min: 40, tier: 'fair', label: 'Needs Work', color: '#f97316' },
	{ min: 0, tier: 'poor', label: 'Poor', color: '#ef4444' }
];

export function classifyScore(score: number): ScoreClassification {
	for (const t of tiers) {
		if (score >= t.min) return { tier: t.tier, label: t.label, color: t.color };
	}
	return { tier: 'poor', label: 'Poor', color: '#ef4444' };
}

export function getScoreLabel(score: number): string {
	return classifyScore(score).label;
}

export function getScoreColor(score: number): string {
	return classifyScore(score).color;
}
