<script lang="ts">
	import type { ScoreResult } from '$engine/scorer/types';

	let { result }: { result: ScoreResult } = $props();

	// toggles the expanded state for this breakdown
	let expanded = $state(false);

	function getScoreColor(score: number): string {
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

<div class="breakdown" class:expanded>
	<button class="breakdown-toggle" onclick={() => (expanded = !expanded)}>
		<div class="toggle-left">
			<span class="toggle-system">{result.system}</span>
			<span class="toggle-vendor">{result.vendor}</span>
		</div>
		<div class="toggle-right">
			<span class="toggle-score" style="color: {getScoreColor(result.overallScore)}">
				{result.overallScore}
			</span>
			<svg
				class="toggle-chevron"
				class:rotated={expanded}
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<polyline points="6,9 12,15 18,9" />
			</svg>
		</div>
	</button>

	{#if expanded}
		<div class="breakdown-content">
			<!-- formatting section -->
			<div class="section">
				<div class="section-header">
					<h4>Formatting</h4>
					<span
						class="section-score"
						style="color: {getScoreColor(result.breakdown.formatting.score)}"
					>
						{result.breakdown.formatting.score}/100 - {getScoreLabel(
							result.breakdown.formatting.score
						)}
					</span>
				</div>
				{#if result.breakdown.formatting.issues.length > 0}
					<div class="issues">
						{#each result.breakdown.formatting.issues as issue}
							<div class="issue-item">
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
								<span>{issue}</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="no-issues">No formatting issues detected.</p>
				{/if}
			</div>

			<!-- keywords section -->
			<div class="section">
				<div class="section-header">
					<h4>Keywords</h4>
					<span
						class="section-score"
						style="color: {getScoreColor(result.breakdown.keywordMatch.score)}"
					>
						{result.breakdown.keywordMatch.score}/100
					</span>
				</div>
				{#if result.breakdown.keywordMatch.matched.length > 0}
					<div class="chip-group">
						<span class="chip-label">Matched:</span>
						{#each result.breakdown.keywordMatch.matched as keyword}
							<span class="chip matched">{keyword}</span>
						{/each}
					</div>
				{/if}
				{#if result.breakdown.keywordMatch.missing.length > 0}
					<div class="chip-group">
						<span class="chip-label">Missing:</span>
						{#each result.breakdown.keywordMatch.missing as keyword}
							<span class="chip missing">{keyword}</span>
						{/each}
					</div>
				{/if}
				{#if result.breakdown.keywordMatch.matched.length === 0 && result.breakdown.keywordMatch.missing.length === 0}
					<p class="no-issues">Add a job description for targeted keyword analysis.</p>
				{/if}
			</div>

			<!-- sections -->
			<div class="section">
				<div class="section-header">
					<h4>Sections</h4>
					<span
						class="section-score"
						style="color: {getScoreColor(result.breakdown.sections.score)}"
					>
						{result.breakdown.sections.score}/100
					</span>
				</div>
				<div class="section-lists">
					{#if result.breakdown.sections.present.length > 0}
						<div class="chip-group">
							<span class="chip-label">Present:</span>
							{#each result.breakdown.sections.present as section}
								<span class="chip present">{section}</span>
							{/each}
						</div>
					{/if}
					{#if result.breakdown.sections.missing.length > 0}
						<div class="chip-group">
							<span class="chip-label">Missing:</span>
							{#each result.breakdown.sections.missing as section}
								<span class="chip missing">{section}</span>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- experience -->
			<div class="section">
				<div class="section-header">
					<h4>Experience</h4>
					<span
						class="section-score"
						style="color: {getScoreColor(result.breakdown.experience.score)}"
					>
						{result.breakdown.experience.score}/100
					</span>
				</div>
				{#if result.breakdown.experience.highlights.length > 0}
					<ul class="highlights">
						{#each result.breakdown.experience.highlights as highlight}
							<li>{highlight}</li>
						{/each}
					</ul>
				{:else}
					<p class="no-issues">No specific experience highlights detected.</p>
				{/if}
			</div>

			<!-- education -->
			<div class="section">
				<div class="section-header">
					<h4>Education</h4>
					<span
						class="section-score"
						style="color: {getScoreColor(result.breakdown.education.score)}"
					>
						{result.breakdown.education.score}/100
					</span>
				</div>
				{#if result.breakdown.education.notes.length > 0}
					<ul class="highlights">
						{#each result.breakdown.education.notes as note}
							<li>{note}</li>
						{/each}
					</ul>
				{:else}
					<p class="no-issues">Education section looks good.</p>
				{/if}
			</div>

			<!-- suggestions for this specific system -->
			{#if result.suggestions.length > 0}
				<div class="section suggestions">
					<h4>Suggestions for {result.system}</h4>
					<ul class="suggestion-list">
						{#each result.suggestions as suggestion}
							<li>{suggestion}</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.breakdown {
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
		overflow: hidden;
		transition: border-color 0.2s ease;
	}

	.breakdown.expanded {
		border-color: rgba(6, 182, 212, 0.2);
	}

	.breakdown-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-primary);
	}

	.breakdown-toggle:hover {
		background: rgba(255, 255, 255, 0.02);
	}

	.toggle-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.toggle-system {
		font-size: 1rem;
		font-weight: 600;
	}

	.toggle-vendor {
		font-size: 0.78rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.toggle-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.toggle-score {
		font-size: 1.25rem;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	.toggle-chevron {
		color: var(--text-tertiary);
		transition: transform 0.2s ease;
	}

	.toggle-chevron.rotated {
		transform: rotate(180deg);
	}

	.breakdown-content {
		padding: 0 1.5rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		animation: expandIn 0.3s ease;
	}

	@keyframes expandIn {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.section {
		padding-top: 1rem;
		border-top: 1px solid var(--glass-border);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.section-header h4 {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.section-score {
		font-size: 0.8rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.issues {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.issue-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.issue-item svg {
		flex-shrink: 0;
		color: #eab308;
	}

	.no-issues {
		font-size: 0.85rem;
		color: var(--text-tertiary);
		font-style: italic;
	}

	.chip-group {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
		margin-bottom: 0.5rem;
	}

	.chip-label {
		font-size: 0.78rem;
		color: var(--text-tertiary);
		font-weight: 500;
		margin-right: 0.25rem;
	}

	.chip {
		padding: 0.2rem 0.6rem;
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 500;
	}

	.chip.matched,
	.chip.present {
		background: rgba(34, 197, 94, 0.1);
		color: #22c55e;
		border: 1px solid rgba(34, 197, 94, 0.2);
	}

	.chip.missing {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	.highlights {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.highlights li {
		font-size: 0.85rem;
		color: var(--text-secondary);
		padding-left: 1rem;
		position: relative;
	}

	.highlights li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.55rem;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--accent-cyan);
	}

	.suggestions h4 {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--accent-cyan);
		margin-bottom: 0.5rem;
	}

	.suggestion-list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.suggestion-list li {
		font-size: 0.85rem;
		color: var(--text-secondary);
		padding-left: 1rem;
		position: relative;
		line-height: 1.5;
	}

	.suggestion-list li::before {
		content: '>';
		position: absolute;
		left: 0;
		color: var(--accent-cyan);
		font-weight: bold;
	}
</style>
