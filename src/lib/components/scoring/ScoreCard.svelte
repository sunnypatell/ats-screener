<script lang="ts">
	import type { ScoreResult } from '$engine/scorer/types';

	let { result }: { result: ScoreResult } = $props();

	// mouse position in px for the spotlight hover effect
	let mouseX = $state(0);
	let mouseY = $state(0);

	function handleMouseMove(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;
	}

	// maps score ranges to colors: green/yellow/orange/red
	function getScoreColor(score: number): string {
		if (score >= 80) return '#22c55e';
		if (score >= 60) return '#eab308';
		if (score >= 40) return '#f97316';
		return '#ef4444';
	}

	// maps score to a label for accessibility
	function getScoreLabel(score: number): string {
		if (score >= 80) return 'Excellent';
		if (score >= 60) return 'Good';
		if (score >= 40) return 'Needs Work';
		return 'Poor';
	}

	const scoreColor = $derived(getScoreColor(result.overallScore));
	// svg circle math: circumference and dash offset for the ring progress
	const circumference = 2 * Math.PI * 42;
	const offset = $derived(circumference - (result.overallScore / 100) * circumference);

	// breakdown categories with proper display labels
	const breakdownItems = $derived([
		{ key: 'formatting', label: 'Formatting', score: result.breakdown.formatting.score },
		{ key: 'keywords', label: 'Keywords', score: result.breakdown.keywordMatch.score },
		{ key: 'sections', label: 'Sections', score: result.breakdown.sections.score },
		{ key: 'experience', label: 'Experience', score: result.breakdown.experience.score },
		{ key: 'education', label: 'Education', score: result.breakdown.education.score }
	]);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="score-card"
	class:passing={result.passesFilter}
	class:failing={!result.passesFilter}
	onmousemove={handleMouseMove}
	style="--spotlight-x: {mouseX}px; --spotlight-y: {mouseY}px; --score-color: {scoreColor};"
>
	<div class="card-spotlight"></div>

	<!-- header: system name + score ring -->
	<div class="card-header">
		<div class="system-info">
			<h3 class="system-name">{result.system}</h3>
			<p class="system-vendor">{result.vendor}</p>
		</div>
		<div class="score-ring">
			<svg viewBox="0 0 100 100" width="76" height="76">
				<!-- background track -->
				<circle
					cx="50"
					cy="50"
					r="42"
					fill="none"
					stroke="rgba(255,255,255,0.05)"
					stroke-width="6"
				/>
				<!-- colored progress arc -->
				<circle
					cx="50"
					cy="50"
					r="42"
					fill="none"
					stroke={scoreColor}
					stroke-width="6"
					stroke-dasharray={circumference}
					stroke-dashoffset={offset}
					stroke-linecap="round"
					transform="rotate(-90 50 50)"
					class="score-progress"
				/>
			</svg>
			<span class="score-value" style="color: {scoreColor}">
				{result.overallScore}
			</span>
		</div>
	</div>

	<!-- pass/fail status badge -->
	<div class="card-status">
		{#if result.passesFilter}
			<span class="status-badge pass">
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
				>
					<polyline points="20,6 9,17 4,12" />
				</svg>
				Likely to Pass
			</span>
		{:else}
			<span class="status-badge fail">
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
				>
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
				May Be Filtered
			</span>
		{/if}
		<span class="score-label" style="color: {scoreColor}">{getScoreLabel(result.overallScore)}</span
		>
	</div>

	<!-- category breakdown bars -->
	<div class="card-breakdown">
		{#each breakdownItems as item}
			<div class="breakdown-item">
				<span class="breakdown-label">{item.label}</span>
				<div class="breakdown-bar">
					<div
						class="breakdown-fill"
						style="width: {item.score}%; background: {getScoreColor(item.score)}"
					></div>
				</div>
				<span class="breakdown-value" style="color: {getScoreColor(item.score)}">{item.score}</span>
			</div>
		{/each}
	</div>

	<!-- keyword stats if available -->
	{#if result.breakdown.keywordMatch.matched.length > 0 || result.breakdown.keywordMatch.missing.length > 0}
		<div class="keyword-summary">
			<div class="keyword-stat matched">
				<span class="keyword-count">{result.breakdown.keywordMatch.matched.length}</span>
				<span class="keyword-label">Matched</span>
			</div>
			<div class="keyword-stat missing">
				<span class="keyword-count">{result.breakdown.keywordMatch.missing.length}</span>
				<span class="keyword-label">Missing</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.score-card {
		position: relative;
		padding: 1.75rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
		overflow: hidden;
		transition:
			border-color 0.3s ease,
			transform 0.25s ease,
			box-shadow 0.3s ease;
	}

	.score-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 16px 32px rgba(0, 0, 0, 0.25);
	}

	.score-card.passing:hover {
		border-color: rgba(34, 197, 94, 0.3);
	}

	.score-card.failing:hover {
		border-color: rgba(239, 68, 68, 0.3);
	}

	.card-spotlight {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			280px circle at var(--spotlight-x) var(--spotlight-y),
			rgba(6, 182, 212, 0.06),
			transparent 60%
		);
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.score-card:hover .card-spotlight {
		opacity: 1;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.25rem;
		position: relative;
		z-index: 1;
	}

	.system-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.system-name {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	.system-vendor {
		font-size: 0.78rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.score-ring {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.score-value {
		position: absolute;
		font-size: 1.35rem;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	.score-progress {
		transition: stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.card-status {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.25rem;
		position: relative;
		z-index: 1;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.3rem 0.75rem;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.status-badge.pass {
		background: rgba(34, 197, 94, 0.1);
		color: #22c55e;
		border: 1px solid rgba(34, 197, 94, 0.2);
	}

	.status-badge.fail {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	.score-label {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.card-breakdown {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		position: relative;
		z-index: 1;
	}

	.breakdown-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.breakdown-label {
		font-size: 0.78rem;
		color: var(--text-tertiary);
		width: 85px;
		flex-shrink: 0;
		font-weight: 500;
	}

	.breakdown-bar {
		flex: 1;
		height: 5px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 3px;
		overflow: hidden;
	}

	.breakdown-fill {
		height: 100%;
		border-radius: 3px;
		transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.breakdown-value {
		font-size: 0.78rem;
		font-weight: 600;
		width: 28px;
		text-align: right;
		flex-shrink: 0;
		font-variant-numeric: tabular-nums;
	}

	.keyword-summary {
		display: flex;
		gap: 1rem;
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid var(--glass-border);
		position: relative;
		z-index: 1;
	}

	.keyword-stat {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.keyword-count {
		font-size: 1rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.keyword-label {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-weight: 500;
	}

	.keyword-stat.matched .keyword-count {
		color: #22c55e;
	}

	.keyword-stat.matched .keyword-label {
		color: rgba(34, 197, 94, 0.7);
	}

	.keyword-stat.missing .keyword-count {
		color: #ef4444;
	}

	.keyword-stat.missing .keyword-label {
		color: rgba(239, 68, 68, 0.7);
	}
</style>
