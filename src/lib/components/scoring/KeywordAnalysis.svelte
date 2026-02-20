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
					<div class="chips">
						{#each allMatched as keyword}
							<span class="chip matched" title="Found in {getKeywordSystemCount(keyword)} systems">
								{keyword}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- missing keywords -->
			{#if allMissing.length > 0}
				<div class="keyword-section">
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
					<div class="chips">
						{#each allMissing as keyword}
							<span
								class="chip missing"
								title="Expected by {getKeywordSystemCount(keyword)} systems"
							>
								{keyword}
							</span>
						{/each}
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

	.section-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.chip {
		padding: 0.25rem 0.7rem;
		border-radius: var(--radius-full);
		font-size: 0.78rem;
		font-weight: 500;
		cursor: default;
		transition: transform 0.15s ease;
	}

	.chip:hover {
		transform: scale(1.05);
	}

	.chip.matched {
		background: rgba(34, 197, 94, 0.1);
		color: #22c55e;
		border: 1px solid rgba(34, 197, 94, 0.2);
	}

	.chip.missing {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.2);
	}
</style>
