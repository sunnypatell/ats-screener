<script lang="ts">
	import type { ScoreResult } from '$engine/scorer/types';

	let { results }: { results: ScoreResult[] } = $props();

	// aggregate keywords across all 6 systems
	const allMatched = $derived([
		...new Set(results.flatMap((r) => r.breakdown.keywordMatch.matched))
	]);
	const allMissing = $derived([
		...new Set(results.flatMap((r) => r.breakdown.keywordMatch.missing))
	]);
	// percentage of keywords matched across all systems
	const matchRate = $derived(
		allMatched.length + allMissing.length > 0
			? Math.round((allMatched.length / (allMatched.length + allMissing.length)) * 100)
			: 0
	);

	function getMatchColor(rate: number): string {
		if (rate >= 80) return '#22c55e';
		if (rate >= 60) return '#eab308';
		if (rate >= 40) return '#f97316';
		return '#ef4444';
	}

	// count how many ATS systems found each keyword
	function getKeywordSystemCount(keyword: string): number {
		return results.filter(
			(r) =>
				r.breakdown.keywordMatch.matched.includes(keyword) ||
				r.breakdown.keywordMatch.missing.includes(keyword)
		).length;
	}

	// collapsible sections
	let matchedExpanded = $state(true);
	let missingExpanded = $state(true);

	// show counts for collapsed state
	const matchedPreviewCount = 12;
	const missingPreviewCount = 8;
</script>

{#if allMatched.length > 0 || allMissing.length > 0}
	<div class="keyword-analysis">
		<div class="analysis-header">
			<div class="header-left">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.35-4.35" />
				</svg>
				<h3>Keyword Analysis</h3>
			</div>
			<div class="match-rate" style="color: {getMatchColor(matchRate)}">
				{matchRate}% Match Rate
			</div>
		</div>

		<!-- visual progress bar for match rate -->
		<div class="rate-bar">
			<div
				class="rate-fill"
				style="width: {matchRate}%; background: {getMatchColor(matchRate)}"
			></div>
		</div>

		<div class="keyword-sections">
			<!-- matched keywords -->
			{#if allMatched.length > 0}
				<div class="keyword-section">
					<button class="section-toggle" onclick={() => (matchedExpanded = !matchedExpanded)}>
						<div class="section-label">
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="#22c55e"
								stroke-width="2.5"
							>
								<polyline points="20,6 9,17 4,12" />
							</svg>
							<span>Matched Keywords ({allMatched.length})</span>
						</div>
						<svg
							class="toggle-chevron"
							class:open={matchedExpanded}
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<polyline points="6,9 12,15 18,9" />
						</svg>
					</button>
					<div class="chips-container" class:collapsed={!matchedExpanded}>
						<div class="chips">
							{#each matchedExpanded ? allMatched : allMatched.slice(0, matchedPreviewCount) as keyword}
								<span class="chip matched">
									{keyword}
									<span class="chip-count">{getKeywordSystemCount(keyword)}</span>
								</span>
							{/each}
							{#if !matchedExpanded && allMatched.length > matchedPreviewCount}
								<span class="chip more-chip">+{allMatched.length - matchedPreviewCount} more</span>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- missing keywords -->
			{#if allMissing.length > 0}
				<div class="keyword-section">
					<button class="section-toggle" onclick={() => (missingExpanded = !missingExpanded)}>
						<div class="section-label">
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="#ef4444"
								stroke-width="2.5"
							>
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
							<span>Missing Keywords ({allMissing.length})</span>
						</div>
						<svg
							class="toggle-chevron"
							class:open={missingExpanded}
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<polyline points="6,9 12,15 18,9" />
						</svg>
					</button>
					<div class="chips-container" class:collapsed={!missingExpanded}>
						<div class="chips">
							{#each missingExpanded ? allMissing : allMissing.slice(0, missingPreviewCount) as keyword}
								<span class="chip missing">
									{keyword}
									<span class="chip-count">{getKeywordSystemCount(keyword)}</span>
								</span>
							{/each}
							{#if !missingExpanded && allMissing.length > missingPreviewCount}
								<span class="chip more-chip">+{allMissing.length - missingPreviewCount} more</span>
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.keyword-analysis {
		padding: 1.75rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
	}

	.analysis-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--accent-cyan);
	}

	.header-left h3 {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.match-rate {
		font-size: 0.9rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.rate-bar {
		height: 6px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 3px;
		overflow: hidden;
		margin-bottom: 1.5rem;
	}

	.rate-fill {
		height: 100%;
		border-radius: 3px;
		transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.keyword-sections {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.section-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0;
		margin-bottom: 0.5rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-secondary);
	}

	.section-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.toggle-chevron {
		transition: transform 0.2s ease;
		opacity: 0.5;
	}

	.toggle-chevron.open {
		transform: rotate(180deg);
	}

	.chips-container {
		max-height: 400px;
		overflow-y: auto;
		transition: max-height 0.3s ease;
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
	}

	.chips-container.collapsed {
		max-height: 60px;
		overflow: hidden;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.25rem 0.7rem;
		border-radius: var(--radius-full);
		font-size: 0.78rem;
		font-weight: 500;
		cursor: default;
		transition:
			transform 0.15s ease,
			border-color 0.15s ease;
	}

	.chip:hover {
		transform: scale(1.03);
	}

	.chip-count {
		font-size: 0.6rem;
		opacity: 0.6;
		font-weight: 700;
	}

	.chip.matched {
		background: rgba(34, 197, 94, 0.1);
		color: #22c55e;
		border: 1px solid rgba(34, 197, 94, 0.2);
	}

	.chip.matched:hover {
		border-color: rgba(34, 197, 94, 0.4);
	}

	.chip.missing {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	.chip.missing:hover {
		border-color: rgba(239, 68, 68, 0.4);
	}

	.more-chip {
		background: var(--glass-bg);
		color: var(--text-tertiary);
		border: 1px dashed var(--glass-border);
		font-style: italic;
	}
</style>
