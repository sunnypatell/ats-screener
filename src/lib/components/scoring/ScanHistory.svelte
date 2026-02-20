<script lang="ts">
	import { scoresStore } from '$stores/scores.svelte';

	let expanded = $state(false);

	const history = $derived(scoresStore.history);
	const hasHistory = $derived(history.length > 0);

	function formatDate(iso: string): string {
		const d = new Date(iso);
		const now = new Date();
		const diff = now.getTime() - d.getTime();
		const mins = Math.floor(diff / 60_000);
		const hours = Math.floor(diff / 3_600_000);
		const days = Math.floor(diff / 86_400_000);

		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function scoreColor(score: number): string {
		if (score >= 80) return '#22c55e';
		if (score >= 60) return '#eab308';
		return '#ef4444';
	}

	function handleClear() {
		scoresStore.clearHistory();
	}
</script>

{#if hasHistory}
	<div class="history-section">
		<button class="history-toggle" onclick={() => (expanded = !expanded)}>
			<div class="toggle-left">
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="10" />
					<polyline points="12,6 12,12 16,14" />
				</svg>
				<span>Scan History</span>
				<span class="history-count">{history.length}</span>
			</div>
			<svg
				class="chevron"
				class:open={expanded}
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

		{#if expanded}
			<div class="history-list">
				{#each history as entry (entry.id)}
					<div class="history-entry">
						<div class="entry-score" style="color: {scoreColor(entry.averageScore)}">
							{entry.averageScore}
						</div>
						<div class="entry-details">
							<div class="entry-meta">
								<span class="entry-mode">{entry.mode}</span>
								<span class="entry-sep">&middot;</span>
								<span class="entry-passing">{entry.passingCount}/6 passing</span>
							</div>
							<span class="entry-time">{formatDate(entry.timestamp)}</span>
						</div>
					</div>
				{/each}

				<button class="clear-btn" onclick={handleClear}>
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polyline points="3,6 5,6 21,6" />
						<path
							d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
						/>
					</svg>
					Clear History
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.history-section {
		margin-top: 1.5rem;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		background: var(--glass-bg);
		backdrop-filter: blur(var(--glass-blur));
		overflow: hidden;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}

	.history-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-secondary);
		font-size: 0.8rem;
		font-weight: 600;
		transition: color 0.2s ease;
	}

	.history-toggle:hover {
		color: var(--text-primary);
	}

	.toggle-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.toggle-left svg {
		color: var(--accent-cyan);
		opacity: 0.7;
	}

	.history-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		border-radius: var(--radius-full);
		background: rgba(6, 182, 212, 0.1);
		color: var(--accent-cyan);
		font-size: 0.65rem;
		font-weight: 700;
	}

	.chevron {
		transition: transform 0.2s ease;
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.history-list {
		border-top: 1px solid var(--glass-border);
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		animation: slideDown 0.2s ease;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
	}

	.history-entry {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.75rem;
		border-radius: var(--radius-sm);
		transition: background 0.15s ease;
	}

	.history-entry:hover {
		background: rgba(255, 255, 255, 0.02);
	}

	.entry-score {
		font-size: 1.1rem;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		min-width: 2.5rem;
		text-align: center;
	}

	.entry-details {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.entry-meta {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	.entry-mode {
		text-transform: capitalize;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.entry-sep {
		opacity: 0.4;
	}

	.entry-time {
		font-size: 0.7rem;
		color: var(--text-tertiary);
		white-space: nowrap;
	}

	.clear-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.5rem;
		margin-top: 0.25rem;
		background: none;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		color: var(--text-tertiary);
		font-size: 0.7rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			color 0.2s ease,
			border-color 0.2s ease;
	}

	.clear-btn:hover {
		color: #ef4444;
		border-color: rgba(239, 68, 68, 0.2);
	}
</style>
