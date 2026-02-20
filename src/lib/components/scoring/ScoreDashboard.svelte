<script lang="ts">
	import { scoresStore } from '$stores/scores.svelte';
	import ScoreCard from './ScoreCard.svelte';

	// derived stats for the summary card header
	const avgScore = $derived(scoresStore.averageScore);
	const passCount = $derived(scoresStore.passingCount);
	const totalCount = $derived(scoresStore.results.length);
</script>

{#if scoresStore.hasResults}
	<div class="dashboard">
		<div class="dashboard-header">
			<div class="summary-card">
				<div class="summary-score">
					<span class="score-number">{avgScore}</span>
					<span class="score-label">avg score</span>
				</div>
				<div class="summary-stats">
					<div class="pass-rate">
						<span class="pass-count">{passCount}/{totalCount}</span>
						<span class="pass-label">systems passed</span>
					</div>
					<div class="mode-badge">
						{scoresStore.mode === 'targeted' ? 'targeted scoring' : 'general readiness'}
					</div>
				</div>
			</div>

			{#if scoresStore.llmFallback}
				<p class="fallback-notice">
					using rule-based analysis (LLM unavailable). results are still accurate but suggestions
					may be less specific.
				</p>
			{/if}
		</div>

		<div class="scores-grid">
			{#each scoresStore.results as result (result.system)}
				<ScoreCard {result} />
			{/each}
		</div>

		<!-- deduplicated suggestions from all 6 ATS profiles -->
		{#if scoresStore.results.some((r) => r.suggestions.length > 0)}
			<div class="suggestions-section">
				<h3 class="suggestions-title">suggestions</h3>
				<div class="suggestions-list">
					{#each [...new Set(scoresStore.results.flatMap((r) => r.suggestions))] as suggestion}
						<div class="suggestion-item">
							<span class="suggestion-bullet">&#8250;</span>
							{suggestion}
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
		gap: 2rem;
		padding: 1.5rem 2rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
	}

	.summary-score {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.score-number {
		font-size: 3rem;
		font-weight: 800;
		background: var(--gradient-primary);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		line-height: 1;
	}

	.score-label {
		font-size: 0.8rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.summary-stats {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.pass-rate {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.pass-count {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.pass-label {
		font-size: 0.85rem;
		color: var(--text-tertiary);
	}

	.mode-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		background: rgba(6, 182, 212, 0.1);
		border: 1px solid rgba(6, 182, 212, 0.2);
		border-radius: 999px;
		font-size: 0.75rem;
		color: var(--accent-cyan);
		width: fit-content;
	}

	.fallback-notice {
		margin-top: 0.75rem;
		font-size: 0.85rem;
		color: var(--text-tertiary);
		padding: 0.5rem 1rem;
		background: rgba(234, 179, 8, 0.05);
		border: 1px solid rgba(234, 179, 8, 0.15);
		border-radius: var(--radius-md);
	}

	.scores-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: 1.5rem;
	}

	.suggestions-section {
		margin-top: 2rem;
		padding: 1.5rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
	}

	.suggestions-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.suggestions-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.suggestion-item {
		display: flex;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.suggestion-bullet {
		color: var(--accent-cyan);
		flex-shrink: 0;
		font-weight: bold;
	}

	@media (max-width: 640px) {
		.summary-card {
			flex-direction: column;
			text-align: center;
		}

		.scores-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
