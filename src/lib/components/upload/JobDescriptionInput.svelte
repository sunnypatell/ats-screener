<script lang="ts">
	import { scoresStore } from '$stores/scores.svelte';

	let expanded = $state(false);
</script>

<div class="jd-input">
	<button class="jd-toggle" onclick={() => (expanded = !expanded)}>
		<span class="toggle-icon" class:expanded>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<polyline points="6,9 12,15 18,9" />
			</svg>
		</span>
		{#if expanded}
			hide job description (optional)
		{:else}
			add job description for targeted scoring
		{/if}
	</button>

	{#if expanded}
		<div class="jd-textarea-wrapper">
			<textarea
				class="jd-textarea"
				placeholder="paste the job description here for targeted keyword matching and industry-specific scoring..."
				rows="8"
				value={scoresStore.jobDescription}
				oninput={(e) => scoresStore.setJobDescription((e.target as HTMLTextAreaElement).value)}
			></textarea>
			{#if scoresStore.hasJobDescription}
				<p class="jd-status">
					targeted mode active. your resume will be scored against this specific job.
				</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.jd-input {
		margin-top: 1.5rem;
	}

	.jd-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: none;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.9rem;
		width: 100%;
		transition:
			border-color 0.2s ease,
			color 0.2s ease;
	}

	.jd-toggle:hover {
		border-color: var(--accent-cyan);
		color: var(--text-primary);
	}

	.toggle-icon {
		transition: transform 0.2s ease;
		display: inline-flex;
	}

	.toggle-icon.expanded {
		transform: rotate(180deg);
	}

	.jd-textarea-wrapper {
		margin-top: 1rem;
	}

	.jd-textarea {
		width: 100%;
		padding: 1rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		color: var(--text-primary);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		line-height: 1.5;
		resize: vertical;
		backdrop-filter: blur(var(--glass-blur));
		transition: border-color 0.2s ease;
	}

	.jd-textarea:focus {
		outline: none;
		border-color: var(--accent-cyan);
	}

	.jd-textarea::placeholder {
		color: var(--text-tertiary);
	}

	.jd-status {
		margin-top: 0.5rem;
		font-size: 0.85rem;
		color: var(--accent-cyan);
	}
</style>
