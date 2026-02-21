<script lang="ts">
	import { scoresStore } from '$stores/scores.svelte';
	import ScoreCard from './ScoreCard.svelte';
	import ScoreBreakdown from './ScoreBreakdown.svelte';
	import KeywordAnalysis from './KeywordAnalysis.svelte';
	import WeakestAreas from './WeakestAreas.svelte';
	import ResumeStats from './ResumeStats.svelte';
	import type { Suggestion, StructuredSuggestion } from '$engine/scorer/types';

	// derived stats for the summary card header
	const avgScore = $derived(scoresStore.averageScore);
	const passCount = $derived(scoresStore.passingCount);
	const totalCount = $derived(scoresStore.results.length);

	// toggle between grid cards and detailed breakdown view
	let activeView = $state<'cards' | 'detailed'>('cards');

	// collapsible suggestion cards
	let expandedSuggestion = $state<number | null>(null);

	function toggleSuggestion(index: number) {
		expandedSuggestion = expandedSuggestion === index ? null : index;
	}

	function isStructured(s: Suggestion): s is StructuredSuggestion {
		return typeof s === 'object' && 'summary' in s;
	}

	const impactColorMap: Record<string, string> = {
		critical: '#ef4444',
		high: '#f97316',
		medium: '#eab308',
		low: '#22c55e'
	};

	// deduplicate suggestions across all platforms
	const allSuggestions = $derived.by(() => {
		const seen = new Set<string>();
		const suggestions: Suggestion[] = [];
		for (const r of scoresStore.results) {
			for (const s of r.suggestions) {
				const key = isStructured(s) ? s.summary : s;
				if (!seen.has(key)) {
					seen.add(key);
					suggestions.push(s);
				}
			}
		}
		return suggestions.slice(0, 5);
	});

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
				<div class="fallback-toast">
					<div class="fallback-toast-left">
						<svg
							class="fallback-warn-icon"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#eab308"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
							<line x1="12" y1="9" x2="12" y2="13" />
							<line x1="12" y1="17" x2="12.01" y2="17" />
						</svg>
						<p class="fallback-toast-msg">
							<strong>AI scoring temporarily unavailable</strong> &mdash; looks like too many of you
							want to check your resumes at the same time! i'm covering the API costs myself and
							things are a little overwhelmed right now. your scores below are still accurate
							(rule-based analysis), but the AI suggestions/accuracy won't be as specific. try again
							later, or if you want to help keep this free for everyone
							<span class="fallback-emoji">😅</span>
						</p>
					</div>
					<div class="fallback-toast-actions">
						<a
							href="https://buymeacoffee.com/sunnypatell"
							target="_blank"
							rel="noopener"
							class="fallback-pill coffee-pill"
						>
							<svg
								width="15"
								height="15"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M10 2v2" />
								<path d="M14 2v2" />
								<path
									d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"
								/>
								<path d="M6 2v2" />
							</svg>
							Coffee
						</a>
						<a
							href="https://github.com/sponsors/sunnypatell"
							target="_blank"
							rel="noopener"
							class="fallback-pill sponsor-pill"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path
									d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
								/>
							</svg>
							Sponsor
						</a>
					</div>
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

		<!-- priority focus areas + resume overview -->
		<div class="analysis-grid">
			<WeakestAreas results={scoresStore.results} />
			<ResumeStats />
		</div>

		<!-- keyword analysis (full-width) -->
		<KeywordAnalysis results={scoresStore.results} />

		<!-- deduplicated suggestions as collapsible cards -->
		{#if allSuggestions.length > 0}
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
					Actionable recommendations based on analysis across all 6 ATS platforms. Click to expand.
				</p>
				<div class="suggestions-cards">
					{#each allSuggestions as suggestion, i}
						{@const structured = isStructured(suggestion)}
						{@const impactColor = structured
							? (impactColorMap[suggestion.impact] ?? '#eab308')
							: impactColorMap[i === 0 ? 'critical' : i === 1 ? 'high' : i < 4 ? 'medium' : 'low']}
						{@const impactLabel = structured
							? suggestion.impact
							: i === 0
								? 'critical'
								: i === 1
									? 'high'
									: i < 4
										? 'medium'
										: 'low'}
						<button
							class="suggestion-card"
							class:expanded={expandedSuggestion === i}
							onclick={() => toggleSuggestion(i)}
						>
							<div class="suggestion-card-header">
								<div class="suggestion-card-left">
									<span class="suggestion-priority" style="background: {impactColor};">
										{i + 1}
									</span>
									<span class="suggestion-summary">
										{structured
											? suggestion.summary
											: typeof suggestion === 'string'
												? suggestion
												: ''}
									</span>
								</div>
								<div class="suggestion-card-right">
									{#if structured && suggestion.platforms.length > 0}
										<div class="suggestion-platforms">
											{#each suggestion.platforms.slice(0, 3) as platform}
												<span class="platform-chip">{platform}</span>
											{/each}
										</div>
									{/if}
									<span class="suggestion-impact" style="color: {impactColor};">
										{impactLabel}
									</span>
									<svg
										class="suggestion-chevron"
										class:rotated={expandedSuggestion === i}
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<polyline points="6,9 12,15 18,9" />
									</svg>
								</div>
							</div>
							{#if expandedSuggestion === i}
								<div class="suggestion-card-body">
									{#if structured && suggestion.details.length > 0}
										<ul class="suggestion-details">
											{#each suggestion.details as detail}
												<li>{detail}</li>
											{/each}
										</ul>
									{:else if !structured}
										<p>{suggestion}</p>
									{/if}
								</div>
							{/if}
						</button>
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

	/* compact toast-style fallback banner */
	.fallback-toast {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 0.75rem;
		padding: 0.75rem 1.25rem;
		background: rgba(234, 179, 8, 0.06);
		border: 1px solid rgba(234, 179, 8, 0.2);
		border-radius: var(--radius-lg);
		backdrop-filter: blur(var(--glass-blur));
		animation: toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes toastSlideIn {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.fallback-toast-left {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		flex: 1;
		min-width: 0;
	}

	.fallback-warn-icon {
		flex-shrink: 0;
		margin-top: 2px;
	}

	.fallback-toast-msg {
		font-size: 0.82rem;
		color: var(--text-secondary);
		line-height: 1.55;
		margin: 0;
	}

	.fallback-toast-msg strong {
		color: #eab308;
		font-weight: 600;
	}

	.fallback-emoji {
		font-size: 1rem;
		vertical-align: middle;
		line-height: 1;
	}

	.fallback-toast-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.fallback-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.4rem 0.85rem;
		font-size: 0.78rem;
		font-weight: 600;
		text-decoration: none;
		border-radius: 999px;
		white-space: nowrap;
		transition:
			transform 0.15s ease,
			background 0.15s ease,
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.fallback-pill:hover {
		transform: translateY(-1px);
	}

	.coffee-pill {
		background: rgba(255, 221, 0, 0.1);
		border: 1px solid rgba(255, 221, 0, 0.3);
		color: #ffdd00;
	}

	.coffee-pill:hover {
		background: rgba(255, 221, 0, 0.18);
		border-color: rgba(255, 221, 0, 0.5);
		box-shadow: 0 0 14px rgba(255, 221, 0, 0.08);
	}

	.sponsor-pill {
		background: rgba(219, 39, 119, 0.1);
		border: 1px solid rgba(219, 39, 119, 0.3);
		color: #ec4899;
	}

	.sponsor-pill:hover {
		background: rgba(219, 39, 119, 0.18);
		border-color: rgba(219, 39, 119, 0.5);
		box-shadow: 0 0 14px rgba(219, 39, 119, 0.08);
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

	.suggestions-cards {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.suggestion-card {
		width: 100%;
		text-align: left;
		padding: 0;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition:
			border-color 0.2s ease,
			background 0.2s ease;
		overflow: hidden;
		font-family: inherit;
	}

	.suggestion-card:hover {
		border-color: rgba(6, 182, 212, 0.25);
		background: rgba(6, 182, 212, 0.03);
	}

	.suggestion-card.expanded {
		border-color: rgba(6, 182, 212, 0.3);
	}

	.suggestion-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.85rem 1rem;
		gap: 0.75rem;
	}

	.suggestion-card-left {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		min-width: 0;
		flex: 1;
	}

	.suggestion-priority {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		color: #fff;
		font-size: 0.68rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.suggestion-summary {
		font-size: 0.88rem;
		color: var(--text-secondary);
		line-height: 1.4;
	}

	.suggestion-card.expanded .suggestion-summary {
		font-weight: 600;
		color: var(--text-primary);
	}

	.suggestion-platforms {
		display: flex;
		gap: 0.3rem;
	}

	.platform-chip {
		padding: 0.15rem 0.5rem;
		font-size: 0.6rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		background: rgba(6, 182, 212, 0.08);
		border: 1px solid rgba(6, 182, 212, 0.2);
		border-radius: 999px;
		color: var(--accent-cyan);
		white-space: nowrap;
	}

	.suggestion-card-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.suggestion-impact {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.suggestion-chevron {
		color: var(--text-tertiary);
		transition: transform 0.2s ease;
	}

	.suggestion-chevron.rotated {
		transform: rotate(180deg);
	}

	.suggestion-card-body {
		padding: 0 1rem 1rem 3rem;
		animation: cardExpand 0.25s ease;
	}

	.suggestion-card-body p {
		font-size: 0.88rem;
		color: var(--text-secondary);
		line-height: 1.7;
		margin: 0;
	}

	.suggestion-details {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.suggestion-details li {
		font-size: 0.85rem;
		color: var(--text-secondary);
		line-height: 1.6;
		padding-left: 1.1rem;
		position: relative;
	}

	.suggestion-details li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.55rem;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--accent-cyan);
		opacity: 0.6;
	}

	@keyframes cardExpand {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
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

		.fallback-toast {
			flex-direction: column;
			align-items: stretch;
		}

		.fallback-toast-actions {
			justify-content: center;
		}
	}
</style>
