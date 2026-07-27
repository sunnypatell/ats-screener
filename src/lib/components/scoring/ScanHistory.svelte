<script lang="ts">
	import { scrollBehavior } from '$lib/a11y';
	import { localeStore } from '$stores/locale.svelte';
	import { scoresStore, type ScanHistoryEntry } from '$stores/scores.svelte';

	let expanded = $state(false);
	const history = $derived(scoresStore.history);
	const hasHistory = $derived(history.length > 0);

	function deltaFor(index: number): number | null {
		const previous = history[index + 1];
		return previous ? history[index].averageScore - previous.averageScore : null;
	}

	function formatDate(iso: string): string {
		const date = new Date(iso);
		const difference = Date.now() - date.getTime();
		const minutes = Math.floor(difference / 60_000);
		const hours = Math.floor(difference / 3_600_000);
		const days = Math.floor(difference / 86_400_000);
		const pt = localeStore.locale === 'pt-BR';
		if (minutes < 1) return pt ? 'agora' : 'just now';
		if (minutes < 60) return pt ? `há ${minutes} min` : `${minutes}m ago`;
		if (hours < 24) return pt ? `há ${hours} h` : `${hours}h ago`;
		if (days < 7) return pt ? `há ${days} d` : `${days}d ago`;
		return date.toLocaleDateString(pt ? 'pt-BR' : 'en-US', {
			day: '2-digit',
			month: 'short'
		});
	}

	function scoreColor(score: number): string {
		if (score >= 80) return '#22c55e';
		if (score >= 60) return '#eab308';
		return '#ef4444';
	}

	function load(entry: ScanHistoryEntry) {
		scoresStore.loadFromHistory(entry);
		requestAnimationFrame(() => {
			document
				.querySelector('.results')
				?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
		});
	}
</script>

{#if hasHistory}
	<section class="history">
		<button class="toggle" type="button" onclick={() => (expanded = !expanded)} aria-expanded={expanded}>
			<span>◷ {localeStore.locale === 'pt-BR' ? 'Histórico de análises' : 'Scan history'}</span>
			<small>{history.length}</small>
			<b aria-hidden="true">{expanded ? '⌃' : '⌄'}</b>
		</button>

		{#if expanded}
			<div class="list">
				{#each history as entry, index (entry.id)}
					{@const delta = deltaFor(index)}
					<button class="entry" type="button" onclick={() => load(entry)}>
						<div class="score" style:color={scoreColor(entry.averageScore)}>
							<strong>{entry.averageScore}</strong>
							{#if delta !== null && delta !== 0}
								<small class:positive={delta > 0} class:negative={delta < 0}>
									{delta > 0 ? '+' : ''}{delta}
								</small>
							{/if}
						</div>
						<div class="details">
							<strong>{entry.fileName || (localeStore.locale === 'pt-BR' ? 'Texto colado' : 'Pasted text')}</strong>
							<span>
								{entry.mode === 'targeted'
									? localeStore.locale === 'pt-BR' ? 'vaga direcionada' : 'targeted'
									: localeStore.locale === 'pt-BR' ? 'geral' : 'general'}
								· {entry.passingCount}/{entry.results.length}
							</span>
						</div>
						<time>{formatDate(entry.timestamp)}</time>
					</button>
				{/each}
				<button class="clear" type="button" onclick={() => scoresStore.clearHistory()}>
					{localeStore.locale === 'pt-BR' ? 'Limpar histórico' : 'Clear history'}
				</button>
			</div>
		{/if}
	</section>
{/if}

<style>
	.history {
		margin-top: 1rem;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		background: var(--glass-bg);
		overflow: hidden;
	}

	.toggle,
	.entry,
	.clear {
		width: 100%;
		border: 0;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		font: inherit;
	}

	.toggle {
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: center;
		gap: 0.6rem;
		padding: 0.8rem 1rem;
		text-align: left;
	}

	.toggle small {
		display: grid;
		place-items: center;
		min-width: 22px;
		height: 22px;
		border-radius: 999px;
		background: rgba(6, 182, 212, 0.1);
		color: var(--accent-cyan);
	}

	.list {
		display: grid;
		gap: 0.35rem;
		padding: 0.55rem;
		border-top: 1px solid var(--glass-border);
	}

	.entry {
		display: grid;
		grid-template-columns: 52px 1fr auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.7rem;
		border-radius: var(--radius-md);
		text-align: left;
	}

	.entry:hover {
		background: rgba(6, 182, 212, 0.04);
	}

	.score {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.score strong {
		font-size: 1.1rem;
	}

	.score small {
		font-size: 0.65rem;
	}

	.score small.positive {
		color: #22c55e;
	}

	.score small.negative {
		color: #ef4444;
	}

	.details {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 0.2rem;
	}

	.details strong {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-secondary);
		font-size: 0.78rem;
	}

	.details span,
	time {
		color: var(--text-tertiary);
		font-size: 0.7rem;
	}

	time {
		white-space: nowrap;
	}

	.clear {
		padding: 0.6rem;
		color: #ef4444;
		font-size: 0.72rem;
	}

	@media (max-width: 520px) {
		.entry {
			grid-template-columns: 46px 1fr;
		}

		time {
			display: none;
		}
	}
</style>
