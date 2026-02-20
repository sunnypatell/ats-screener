<script lang="ts">
	import type { ScoreResult } from '$engine/scorer/types';

	let { results }: { results: ScoreResult[] } = $props();

	interface AreaInsight {
		dimension: string;
		label: string;
		avgScore: number;
		lowestPlatform: string;
		lowestScore: number;
		issues: string[];
	}

	const dimensions = ['formatting', 'keywordMatch', 'sections', 'experience', 'education'] as const;
	const dimensionLabels: Record<string, string> = {
		formatting: 'Formatting & Parsing',
		keywordMatch: 'Keyword Coverage',
		sections: 'Section Structure',
		experience: 'Experience Quality',
		education: 'Education'
	};
	const dimensionIcons: Record<string, string> = {
		formatting: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
		keywordMatch: 'M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
		sections: 'M3 12h18M3 6h18M3 18h18',
		experience: 'M22 12h-4l-3 9L9 3l-3 9H2',
		education: 'M22 10v6M2 10l10-5 10 5-10 5z'
	};

	function getScore(result: ScoreResult, dim: string): number {
		switch (dim) {
			case 'formatting': return result.breakdown.formatting.score;
			case 'keywordMatch': return result.breakdown.keywordMatch.score;
			case 'sections': return result.breakdown.sections.score;
			case 'experience': return result.breakdown.experience.score;
			case 'education': return result.breakdown.education.score;
			default: return 0;
		}
	}

	function getIssues(result: ScoreResult, dim: string): string[] {
		switch (dim) {
			case 'formatting': return result.breakdown.formatting.issues;
			case 'keywordMatch': return result.breakdown.keywordMatch.missing.slice(0, 3).map(k => `Missing: "${k}"`);
			case 'sections': return result.breakdown.sections.missing.map(s => `Missing: ${s}`);
			case 'experience': return result.breakdown.experience.highlights;
			case 'education': return result.breakdown.education.notes;
			default: return [];
		}
	}

	// find the weakest areas across all platforms
	const insights = $derived.by(() => {
		const areas: AreaInsight[] = dimensions.map(dim => {
			const scores = results.map(r => ({ platform: r.system, score: getScore(r, dim) }));
			const avg = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length);
			const lowest = scores.reduce((min, s) => s.score < min.score ? s : min, scores[0]);
			const allIssues = [...new Set(results.flatMap(r => getIssues(r, dim)))];
			return {
				dimension: dim,
				label: dimensionLabels[dim],
				avgScore: avg,
				lowestPlatform: lowest.platform,
				lowestScore: lowest.score,
				issues: allIssues.slice(0, 3)
			};
		});
		// sort by average score ascending (weakest first)
		return areas.sort((a, b) => a.avgScore - b.avgScore);
	});

	function getScoreColor(score: number): string {
		if (score >= 80) return '#22c55e';
		if (score >= 60) return '#eab308';
		if (score >= 40) return '#f97316';
		return '#ef4444';
	}

	// platforms at risk of filtering out this resume
	const atRiskPlatforms = $derived(
		results.filter(r => !r.passesFilter).map(r => r.system)
	);
</script>

<div class="weakest-areas">
	<div class="wa-header">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
			<line x1="12" y1="9" x2="12" y2="13" />
			<line x1="12" y1="17" x2="12.01" y2="17" />
		</svg>
		<h3>Priority Focus Areas</h3>
	</div>

	{#if atRiskPlatforms.length > 0}
		<div class="risk-banner">
			<span class="risk-label">Filtered out by:</span>
			{#each atRiskPlatforms as platform}
				<span class="risk-chip">{platform}</span>
			{/each}
		</div>
	{/if}

	<div class="areas-list">
		{#each insights as area, i}
			{@const isWeak = area.avgScore < 70}
			<div class="area-item" class:weak={isWeak} class:strong={area.avgScore >= 80}>
				<div class="area-left">
					<div class="area-rank" style="background: {getScoreColor(area.avgScore)}20; color: {getScoreColor(area.avgScore)};">
						{i + 1}
					</div>
					<div class="area-info">
						<div class="area-name">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d={dimensionIcons[area.dimension]} />
							</svg>
							{area.label}
						</div>
						{#if area.issues.length > 0 && isWeak}
							<div class="area-issues">
								{#each area.issues as issue}
									<span class="area-issue">{issue}</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>
				<div class="area-right">
					<div class="area-score-bar">
						<div class="area-bar-bg">
							<div class="area-bar-fill" style="width: {area.avgScore}%; background: {getScoreColor(area.avgScore)}"></div>
						</div>
					</div>
					<span class="area-score" style="color: {getScoreColor(area.avgScore)}">{area.avgScore}</span>
					{#if area.lowestScore < area.avgScore - 5}
						<span class="area-worst">
							{area.lowestPlatform}: {area.lowestScore}
						</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.weakest-areas {
		padding: 1.75rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
	}

	.wa-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.25rem;
		color: var(--accent-cyan);
	}

	.wa-header h3 {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.risk-banner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		padding: 0.6rem 1rem;
		background: rgba(239, 68, 68, 0.06);
		border: 1px solid rgba(239, 68, 68, 0.15);
		border-radius: var(--radius-md);
		margin-bottom: 1.25rem;
	}

	.risk-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: #ef4444;
	}

	.risk-chip {
		padding: 0.15rem 0.5rem;
		font-size: 0.7rem;
		font-weight: 600;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.25);
		border-radius: 999px;
		color: #ef4444;
	}

	.areas-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.area-item {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md);
		background: rgba(255, 255, 255, 0.015);
		border: 1px solid transparent;
		transition: background 0.15s ease, border-color 0.15s ease;
	}

	.area-item.weak {
		border-color: rgba(239, 68, 68, 0.1);
		background: rgba(239, 68, 68, 0.02);
	}

	.area-item.strong {
		border-color: rgba(34, 197, 94, 0.08);
	}

	.area-left {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
		min-width: 0;
		flex: 1;
	}

	.area-rank {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		font-size: 0.68rem;
		font-weight: 700;
		flex-shrink: 0;
		margin-top: 1px;
	}

	.area-info {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: 0;
	}

	.area-name {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.area-name svg {
		flex-shrink: 0;
		color: var(--text-tertiary);
	}

	.area-issues {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.area-issue {
		font-size: 0.72rem;
		color: var(--text-tertiary);
		padding: 0.1rem 0.5rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: var(--radius-full);
		border: 1px solid var(--glass-border);
	}

	.area-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.area-score-bar {
		width: 60px;
	}

	.area-bar-bg {
		height: 4px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 2px;
		overflow: hidden;
	}

	.area-bar-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 1s ease;
	}

	.area-score {
		font-size: 0.9rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		width: 28px;
		text-align: right;
	}

	.area-worst {
		font-size: 0.65rem;
		color: var(--text-tertiary);
		white-space: nowrap;
	}

	@media (max-width: 640px) {
		.area-right {
			flex-direction: column;
			align-items: flex-end;
			gap: 0.2rem;
		}

		.area-score-bar {
			display: none;
		}
	}
</style>
