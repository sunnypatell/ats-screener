<script lang="ts">
	import { scoresStore } from '$stores/scores.svelte';
	import ScoreCard from './ScoreCard.svelte';

	// derived stats for the summary card header
	const avgScore = $derived(scoresStore.averageScore);
	const passCount = $derived(scoresStore.passingCount);
	const totalCount = $derived(scoresStore.results.length);

	// color based on average score
	function getAvgColor(score: number): string {
		if (score >= 80) return '#22c55e';
		if (score >= 60) return '#eab308';
		if (score >= 40) return '#f97316';
		return '#ef4444';
	}
</script>

{#if scoresStore.hasResults}
	<div class="dashboard">
		<!-- summary header card -->
		<div class="dashboard-header">
			<div class="summary-card">
				<div class="summary-left">
					<div class="summary-score">
						<span class="score-number" style="color: {getAvgColor(avgScore)}">{avgScore}</span>
						<span class="score-label">Average Score</span>
					</div>
				</div>
				<div class="summary-right">
					<div class="summary-stat">
						<span class="stat-value">{passCount}/{totalCount}</span>
						<span class="stat-label">Systems Passed</span>
					</div>
					<div class="mode-badge">
						{#if scoresStore.mode === 'targeted'}
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10" />
								<circle cx="12" cy="12" r="6" />
								<circle cx="12" cy="12" r="2" />
							</svg>
							Targeted Scoring
						{:else}
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
							</svg>
							General Readiness
						{/if}
					</div>
				</div>
			</div>

			{#if scoresStore.llmFallback}
				<div class="fallback-notice">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="8" x2="12" y2="12" />
						<line x1="12" y1="16" x2="12.01" y2="16" />
					</svg>
					<span>Using rule-based analysis (LLM unavailable). Results are still accurate but suggestions may be less specific.</span>
				</div>
			{/if}
		</div>

		<!-- 6 ATS score cards in a grid -->
		<div class="scores-grid">
			{#each scoresStore.results as result (result.system)}
				<ScoreCard {result} />
			{/each}
		</div>

		<!-- deduplicated suggestions from all 6 ATS profiles -->
		{#if scoresStore.results.some((r) => r.suggestions.length > 0)}
			<div class="suggestions-section">
				<div class="suggestions-header">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
					</svg>
					<h3 class="suggestions-title">Suggestions</h3>
				</div>
				<div class="suggestions-list">
					{#each [...new Set(scoresStore.results.flatMap((r) => r.suggestions))] as suggestion}
						<div class="suggestion-item">
							<span class="suggestion-bullet">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="9,18 15,12 9,6" />
								</svg>
							</span>
							<span>{suggestion}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.dashboard {
		margin-top: 2rem;
	}

	.dashboard-header {
		margin-bottom: 2rem;
	}

	.summary-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 2rem 2.5rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
	}

	.summary-score {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.score-number {
		font-size: 3.5rem;
		font-weight: 800;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}

	.score-label {
		font-size: 0.78rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 500;
		margin-top: 0.25rem;
	}

	.summary-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.75rem;
	}

	.summary-stat {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.stat-label {
		font-size: 0.82rem;
		color: var(--text-tertiary);
	}

	.mode-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.85rem;
		background: rgba(6, 182, 212, 0.08);
		border: 1px solid rgba(6, 182, 212, 0.2);
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--accent-cyan);
	}

	.fallback-notice {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-top: 0.75rem;
		font-size: 0.85rem;
		color: var(--text-tertiary);
		padding: 0.6rem 1rem;
		background: rgba(234, 179, 8, 0.05);
		border: 1px solid rgba(234, 179, 8, 0.15);
		border-radius: var(--radius-md);
	}

	.fallback-notice svg {
		flex-shrink: 0;
		color: #eab308;
	}

	.scores-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: 1.5rem;
	}

	.suggestions-section {
		margin-top: 2rem;
		padding: 1.75rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
	}

	.suggestions-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.25rem;
		color: var(--accent-cyan);
	}

	.suggestions-title {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.suggestions-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.suggestion-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: var(--text-secondary);
		line-height: 1.6;
	}

	.suggestion-bullet {
		color: var(--accent-cyan);
		flex-shrink: 0;
		margin-top: 0.15rem;
	}

	@media (max-width: 640px) {
		.summary-card {
			flex-direction: column;
			text-align: center;
			gap: 1.5rem;
			padding: 1.5rem;
		}

		.summary-right {
			align-items: center;
		}

		.summary-score {
			align-items: center;
		}

		.scores-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
