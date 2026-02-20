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
			Hide Job Description (Optional)
		{:else}
			Add Job Description for Targeted Scoring
		{/if}
	</button>

	{#if expanded}
		<div class="jd-textarea-wrapper">
			<textarea
				class="jd-textarea"
				placeholder="Paste the job description here for targeted keyword matching and industry-specific scoring..."
				rows="8"
				value={scoresStore.jobDescription}
				oninput={(e) => scoresStore.setJobDescription((e.target as HTMLTextAreaElement).value)}
			></textarea>
			{#if scoresStore.hasJobDescription}
				<div class="jd-status">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
						<polyline points="22,4 12,14.01 9,11.01" />
					</svg>
					<span>Targeted mode active. Your resume will be scored against this specific job.</span>
				</div>
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
		padding: 0.8rem 1.25rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		width: 100%;
		backdrop-filter: blur(var(--glass-blur));
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
		color: var(--accent-cyan);
	}

	.toggle-icon.expanded {
		transform: rotate(180deg);
	}

	.jd-textarea-wrapper {
		margin-top: 1rem;
	}

	.jd-textarea {
		width: 100%;
		padding: 1.25rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		color: var(--text-primary);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		line-height: 1.6;
		resize: vertical;
		backdrop-filter: blur(var(--glass-blur));
		transition: border-color 0.2s ease;
	}

	.jd-textarea:focus {
		outline: none;
		border-color: var(--accent-cyan);
		box-shadow: 0 0 20px rgba(6, 182, 212, 0.08);
	}

	.jd-textarea::placeholder {
		color: var(--text-tertiary);
	}

	.jd-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.75rem;
		font-size: 0.85rem;
		color: var(--accent-cyan);
		padding: 0.5rem 0.75rem;
		background: rgba(6, 182, 212, 0.05);
		border: 1px solid rgba(6, 182, 212, 0.15);
		border-radius: var(--radius-md);
	}
</style>
