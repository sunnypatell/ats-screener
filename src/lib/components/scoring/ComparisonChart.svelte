<script lang="ts">
	import type { ScoreResult } from '$engine/scorer/types';

	let { results }: { results: ScoreResult[] } = $props();

	function getScoreColor(score: number): string {
		if (score >= 80) return '#22c55e';
		if (score >= 60) return '#eab308';
		if (score >= 40) return '#f97316';
		return '#ef4444';
	}

	// find the max score to normalize bar heights
	const maxScore = $derived(Math.max(...results.map((r) => r.overallScore), 100));

	// categories for the stacked breakdown view
	const categories = ['formatting', 'keywordMatch', 'sections', 'experience', 'education'] as const;
	const categoryLabels: Record<string, string> = {
		formatting: 'Format',
		keywordMatch: 'Keywords',
		sections: 'Sections',
		experience: 'Experience',
		education: 'Education'
	};
	const categoryColors: Record<string, string> = {
		formatting: '#06b6d4',
		keywordMatch: '#3b82f6',
		sections: '#8b5cf6',
		experience: '#ec4899',
		education: '#f97316'
	};
</script>

<div class="comparison-chart">
	<div class="chart-header">
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path d="M18 20V10" />
			<path d="M12 20V4" />
			<path d="M6 20v-6" />
		</svg>
		<h3>Score Comparison</h3>
	</div>

	<!-- overall score bar chart -->
	<div class="bar-chart">
		{#each results as result}
			<div class="bar-group">
				<div class="bar-label-top" style="color: {getScoreColor(result.overallScore)}">
					{result.overallScore}
				</div>
				<div class="bar-container">
					<div
						class="bar"
						style="height: {(result.overallScore / maxScore) * 100}%; background: {getScoreColor(
							result.overallScore
						)}"
					>
						<!-- glow effect on the bar -->
						<div class="bar-glow" style="background: {getScoreColor(result.overallScore)}"></div>
					</div>
				</div>
				<div class="bar-label">{result.system}</div>
				<div class="bar-vendor">{result.vendor}</div>
				<div class="bar-status">
					{#if result.passesFilter}
						<span class="status-dot pass"></span>
					{:else}
						<span class="status-dot fail"></span>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- category breakdown comparison -->
	<div class="category-breakdown">
		<h4>Category Breakdown</h4>
		<div class="legend">
			{#each categories as cat}
				<div class="legend-item">
					<span class="legend-dot" style="background: {categoryColors[cat]}"></span>
					<span>{categoryLabels[cat]}</span>
				</div>
			{/each}
		</div>
		<div class="category-grid">
			{#each results as result}
				<div class="category-col">
					<span class="col-label">{result.system}</span>
					<div class="category-bars">
						{#each categories as cat}
							{@const score =
								cat === 'keywordMatch'
									? result.breakdown.keywordMatch.score
									: cat === 'formatting'
										? result.breakdown.formatting.score
										: cat === 'sections'
											? result.breakdown.sections.score
											: cat === 'experience'
												? result.breakdown.experience.score
												: result.breakdown.education.score}
							<div class="cat-bar-row">
								<div class="cat-bar-bg">
									<div
										class="cat-bar-fill"
										style="width: {score}%; background: {categoryColors[cat]}"
									></div>
								</div>
								<span class="cat-bar-value">{score}</span>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.comparison-chart {
		padding: 1.75rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
	}

	.chart-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 2rem;
		color: var(--accent-cyan);
	}

	.chart-header h3 {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	/* overall score bar chart */
	.bar-chart {
		display: flex;
		justify-content: space-around;
		align-items: flex-end;
		gap: 1rem;
		height: 200px;
		padding: 0 1rem;
		margin-bottom: 2rem;
	}

	.bar-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
		height: 100%;
	}

	.bar-label-top {
		font-size: 1.1rem;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		margin-bottom: 0.5rem;
	}

	.bar-container {
		flex: 1;
		width: 100%;
		max-width: 48px;
		display: flex;
		align-items: flex-end;
		position: relative;
	}

	.bar {
		width: 100%;
		border-radius: 6px 6px 0 0;
		position: relative;
		transition: height 1.2s cubic-bezier(0.16, 1, 0.3, 1);
		min-height: 4px;
	}

	.bar-glow {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		opacity: 0.3;
		filter: blur(8px);
	}

	.bar-label {
		margin-top: 0.5rem;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--text-primary);
		text-align: center;
	}

	.bar-vendor {
		font-size: 0.65rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.bar-status {
		margin-top: 0.25rem;
	}

	.status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		display: inline-block;
	}

	.status-dot.pass {
		background: #22c55e;
		box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
	}

	.status-dot.fail {
		background: #ef4444;
		box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
	}

	/* category breakdown */
	.category-breakdown {
		padding-top: 1.5rem;
		border-top: 1px solid var(--glass-border);
	}

	.category-breakdown h4 {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.72rem;
		color: var(--text-tertiary);
	}

	.legend-dot {
		width: 8px;
		height: 8px;
		border-radius: 2px;
	}

	.category-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 1.25rem;
	}

	.category-col {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.col-label {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.category-bars {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.cat-bar-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.cat-bar-bg {
		flex: 1;
		height: 4px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 2px;
		overflow: hidden;
	}

	.cat-bar-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 1s ease;
	}

	.cat-bar-value {
		font-size: 0.68rem;
		color: var(--text-tertiary);
		width: 22px;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 640px) {
		.bar-chart {
			height: 150px;
			gap: 0.5rem;
		}

		.bar-label-top {
			font-size: 0.85rem;
		}

		.bar-label {
			font-size: 0.65rem;
		}

		.category-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
