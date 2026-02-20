<script lang="ts">
	import { scoresStore } from '$stores/scores.svelte';
	import ScoreCard from './ScoreCard.svelte';
	import ScoreBreakdown from './ScoreBreakdown.svelte';
	import KeywordAnalysis from './KeywordAnalysis.svelte';
	import ComparisonChart from './ComparisonChart.svelte';
	import ResumeStats from './ResumeStats.svelte';
	// derived stats for the summary card header
	const avgScore = $derived(scoresStore.averageScore);
	const passCount = $derived(scoresStore.passingCount);
	const totalCount = $derived(scoresStore.results.length);

	// toggle between grid cards and detailed breakdown view
	let activeView = $state<'cards' | 'detailed'>('cards');

	// exports results as a JSON file download
	function exportResults() {
		const data = {
			exportedAt: new Date().toISOString(),
			mode: scoresStore.mode,
			averageScore: avgScore,
			passingCount: passCount,
			totalSystems: totalCount,
			results: scoresStore.results
		};
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `ats-scores-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	// color based on average score
	function getAvgColor(score: number): string {
		if (score >= 80) return '#22c55e';
		if (score >= 60) return '#eab308';
		if (score >= 40) return '#f97316';
		return '#ef4444';
	}

	function getScoreLabel(score: number): string {
		if (score >= 80) return 'Excellent';
		if (score >= 60) return 'Good';
		if (score >= 40) return 'Needs Work';
		return 'Poor';
	}
</script>

{#if scoresStore.hasResults}
	<div class="dashboard">
		<!-- summary header card -->
		<div class="dashboard-header">
			<div class="summary-card">
				<div class="summary-left">
					<div class="summary-score">
						<span class="score-number" style="color: {getAvgColor(avgScore)}">
							{avgScore}
						</span>
						<span class="score-verdict" style="color: {getAvgColor(avgScore)}">
							{getScoreLabel(avgScore)}
						</span>
						<span class="score-label">Average Score</span>
					</div>
				</div>
				<div class="summary-center">
					<div class="mini-bars">
						{#each scoresStore.results as result}
							<div class="mini-bar-item">
								<div class="mini-bar-track">
									<div
										class="mini-bar-fill"
										style="width: {result.overallScore}%; background: {getAvgColor(
											result.overallScore
										)}"
									></div>
								</div>
								<span class="mini-bar-label">{result.system}</span>
							</div>
						{/each}
					</div>
				</div>
				<div class="summary-right">
					<div class="summary-stat">
						<span class="stat-value">{passCount}/{totalCount}</span>
						<span class="stat-label">Systems Passed</span>
					</div>
					<div class="mode-badge">
						{#if scoresStore.mode === 'targeted'}
							<svg
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="12" cy="12" r="10" />
								<circle cx="12" cy="12" r="6" />
								<circle cx="12" cy="12" r="2" />
							</svg>
							Targeted Scoring
						{:else}
							<svg
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
							</svg>
							General Readiness
						{/if}
					</div>
				</div>
			</div>

			{#if scoresStore.llmFallback}
				<div class="fallback-notice">
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="8" x2="12" y2="12" />
						<line x1="12" y1="16" x2="12.01" y2="16" />
					</svg>
					<span
						>Using rule-based analysis (LLM unavailable). Results are still accurate but suggestions
						may be less specific.</span
					>
				</div>
			{/if}
		</div>

		<!-- view toggle + export -->
		<div class="toolbar">
			<div class="view-toggle">
				<button
					class="toggle-btn"
					class:active={activeView === 'cards'}
					onclick={() => (activeView = 'cards')}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<rect x="3" y="3" width="7" height="7" />
						<rect x="14" y="3" width="7" height="7" />
						<rect x="3" y="14" width="7" height="7" />
						<rect x="14" y="14" width="7" height="7" />
					</svg>
					Card View
				</button>
				<button
					class="toggle-btn"
					class:active={activeView === 'detailed'}
					onclick={() => (activeView = 'detailed')}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="8" y1="6" x2="21" y2="6" />
						<line x1="8" y1="12" x2="21" y2="12" />
						<line x1="8" y1="18" x2="21" y2="18" />
						<line x1="3" y1="6" x2="3.01" y2="6" />
						<line x1="3" y1="12" x2="3.01" y2="12" />
						<line x1="3" y1="18" x2="3.01" y2="18" />
					</svg>
					Detailed View
				</button>
			</div>

			<button class="export-btn" onclick={exportResults} title="Export results as JSON">
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="7,10 12,15 17,10" />
					<line x1="12" y1="15" x2="12" y2="3" />
				</svg>
				Export
			</button>
		</div>

		<!-- card view: 6 ATS score cards in a grid -->
		{#if activeView === 'cards'}
			<div class="scores-grid">
				{#each scoresStore.results as result (result.system)}
					<ScoreCard {result} />
				{/each}
			</div>
		{:else}
			<!-- detailed view: expandable breakdown per system -->
			<div class="breakdowns-list">
				{#each scoresStore.results as result (result.system)}
					<ScoreBreakdown {result} />
				{/each}
			</div>
		{/if}

		<!-- two-column layout: comparison chart + resume stats -->
		<div class="analysis-grid">
			<ComparisonChart results={scoresStore.results} />
			<ResumeStats />
		</div>

		<!-- keyword analysis (full-width) -->
		<KeywordAnalysis results={scoresStore.results} />

		<!-- deduplicated suggestions from all 6 ATS profiles -->
		{#if scoresStore.results.some((r) => r.suggestions.length > 0)}
			<div class="suggestions-section">
				<div class="suggestions-header">
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
						/>
					</svg>
					<h3 class="suggestions-title">Optimization Suggestions</h3>
				</div>
				<p class="suggestions-subtitle">
					Actionable recommendations based on analysis across all 6 ATS platforms.
				</p>
				<div class="suggestions-list">
					{#each [...new Set(scoresStore.results.flatMap((r) => r.suggestions))].slice(0, 8) as suggestion, i}
						<div class="suggestion-item">
							<span class="suggestion-number">{i + 1}</span>
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
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.dashboard-header {
		margin-bottom: 0;
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
		gap: 2rem;
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

	.score-verdict {
		font-size: 0.9rem;
		font-weight: 700;
		margin-top: 0.35rem;
	}

	.score-label {
		font-size: 0.78rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 500;
		margin-top: 0.15rem;
	}

	/* mini bar chart in summary header */
	.summary-center {
		flex: 1;
		max-width: 360px;
	}

	.mini-bars {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.mini-bar-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.mini-bar-track {
		flex: 1;
		height: 4px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 2px;
		overflow: hidden;
	}

	.mini-bar-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.mini-bar-label {
		font-size: 0.65rem;
		color: var(--text-tertiary);
		width: 80px;
		text-align: right;
		font-weight: 500;
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

	/* toolbar: toggle + export */
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.export-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 1rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		backdrop-filter: blur(var(--glass-blur));
		transition:
			border-color 0.2s ease,
			color 0.2s ease,
			background 0.2s ease;
	}

	.export-btn:hover {
		border-color: rgba(6, 182, 212, 0.3);
		color: var(--accent-cyan);
		background: rgba(6, 182, 212, 0.05);
	}

	/* view toggle tabs */
	.view-toggle {
		display: flex;
		gap: 0.5rem;
		padding: 0.25rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		width: fit-content;
		backdrop-filter: blur(var(--glass-blur));
	}

	.toggle-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 1rem;
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--text-tertiary);
		cursor: pointer;
		transition:
			background 0.2s ease,
			color 0.2s ease;
	}

	.toggle-btn:hover {
		color: var(--text-secondary);
	}

	.toggle-btn.active {
		background: rgba(6, 182, 212, 0.1);
		color: var(--accent-cyan);
		border: 1px solid rgba(6, 182, 212, 0.2);
	}

	.scores-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: 1.5rem;
	}

	.breakdowns-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* two-column analysis grid for chart + stats */
	.analysis-grid {
		display: grid;
		grid-template-columns: 1.4fr 1fr;
		gap: 1.5rem;
	}

	.suggestions-section {
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
		margin-bottom: 0.5rem;
		color: var(--accent-cyan);
	}

	.suggestions-title {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.suggestions-subtitle {
		font-size: 0.85rem;
		color: var(--text-tertiary);
		margin-bottom: 1.25rem;
	}

	.suggestions-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.suggestion-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		font-size: 0.9rem;
		color: var(--text-secondary);
		line-height: 1.6;
		padding: 0.6rem 0.85rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		transition: border-color 0.2s ease;
	}

	.suggestion-item:hover {
		border-color: rgba(6, 182, 212, 0.2);
	}

	.suggestion-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: rgba(6, 182, 212, 0.1);
		color: var(--accent-cyan);
		font-size: 0.72rem;
		font-weight: 700;
		flex-shrink: 0;
		margin-top: 0.1rem;
	}

	@media (max-width: 900px) {
		.analysis-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.summary-card {
			flex-direction: column;
			text-align: center;
			gap: 1.5rem;
			padding: 1.5rem;
		}

		.summary-center {
			max-width: 100%;
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

		.view-toggle {
			width: 100%;
		}

		.toggle-btn {
			flex: 1;
			justify-content: center;
		}
	}
</style>
