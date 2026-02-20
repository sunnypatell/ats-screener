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

	const scoreColor = $derived(getScoreColor(result.overallScore));
	// svg circle math: circumference and dash offset for the ring progress
	const circumference = 2 * Math.PI * 42;
	const offset = $derived(circumference - (result.overallScore / 100) * circumference);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="score-card"
	class:passing={result.passesFilter}
	class:failing={!result.passesFilter}
	onmousemove={handleMouseMove}
	style="--spotlight-x: {mouseX}px; --spotlight-y: {mouseY}px;"
>
	<div class="card-spotlight"></div>

	<div class="card-header">
		<div>
			<h3 class="system-name">{result.system}</h3>
			<p class="system-vendor">{result.vendor}</p>
		</div>
		<div class="score-ring">
			<svg viewBox="0 0 100 100" width="72" height="72">
				<circle cx="50" cy="50" r="42" fill="none" stroke="var(--glass-border)" stroke-width="6" />
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

	<div class="card-status">
		{#if result.passesFilter}
			<span class="status-badge pass">likely to pass</span>
		{:else}
			<span class="status-badge fail">may be filtered</span>
		{/if}
	</div>

	<div class="card-breakdown">
		<div class="breakdown-item">
			<span class="breakdown-label">formatting</span>
			<div class="breakdown-bar">
				<div
					class="breakdown-fill"
					style="width: {result.breakdown.formatting.score}%; background: {getScoreColor(
						result.breakdown.formatting.score
					)}"
				></div>
			</div>
			<span class="breakdown-value">{result.breakdown.formatting.score}</span>
		</div>
		<div class="breakdown-item">
			<span class="breakdown-label">keywords</span>
			<div class="breakdown-bar">
				<div
					class="breakdown-fill"
					style="width: {result.breakdown.keywordMatch.score}%; background: {getScoreColor(
						result.breakdown.keywordMatch.score
					)}"
				></div>
			</div>
			<span class="breakdown-value">{result.breakdown.keywordMatch.score}</span>
		</div>
		<div class="breakdown-item">
			<span class="breakdown-label">sections</span>
			<div class="breakdown-bar">
				<div
					class="breakdown-fill"
					style="width: {result.breakdown.sections.score}%; background: {getScoreColor(
						result.breakdown.sections.score
					)}"
				></div>
			</div>
			<span class="breakdown-value">{result.breakdown.sections.score}</span>
		</div>
		<div class="breakdown-item">
			<span class="breakdown-label">experience</span>
			<div class="breakdown-bar">
				<div
					class="breakdown-fill"
					style="width: {result.breakdown.experience.score}%; background: {getScoreColor(
						result.breakdown.experience.score
					)}"
				></div>
			</div>
			<span class="breakdown-value">{result.breakdown.experience.score}</span>
		</div>
		<div class="breakdown-item">
			<span class="breakdown-label">education</span>
			<div class="breakdown-bar">
				<div
					class="breakdown-fill"
					style="width: {result.breakdown.education.score}%; background: {getScoreColor(
						result.breakdown.education.score
					)}"
				></div>
			</div>
			<span class="breakdown-value">{result.breakdown.education.score}</span>
		</div>
	</div>
</div>

<style>
	.score-card {
		position: relative;
		padding: 1.5rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
		overflow: hidden;
		transition:
			border-color 0.3s ease,
			transform 0.2s ease;
	}

	.score-card:hover {
		transform: translateY(-2px);
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
			250px circle at var(--spotlight-x) var(--spotlight-y),
			rgba(6, 182, 212, 0.05),
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
		margin-bottom: 1rem;
		position: relative;
		z-index: 1;
	}

	.system-name {
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.system-vendor {
		font-size: 0.8rem;
		color: var(--text-tertiary);
		margin-top: 0.25rem;
	}

	.score-ring {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.score-value {
		position: absolute;
		font-size: 1.25rem;
		font-weight: 700;
	}

	.score-progress {
		transition: stroke-dashoffset 1s ease;
	}

	.card-status {
		margin-bottom: 1rem;
		position: relative;
		z-index: 1;
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
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

	.card-breakdown {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		position: relative;
		z-index: 1;
	}

	.breakdown-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.breakdown-label {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		width: 80px;
		flex-shrink: 0;
	}

	.breakdown-bar {
		flex: 1;
		height: 4px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 2px;
		overflow: hidden;
	}

	.breakdown-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 1s ease;
	}

	.breakdown-value {
		font-size: 0.75rem;
		color: var(--text-secondary);
		width: 24px;
		text-align: right;
		flex-shrink: 0;
	}
</style>
