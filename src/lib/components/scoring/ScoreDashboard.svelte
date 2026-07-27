<script lang="ts">
	import { generatePDF } from '$engine/scorer/report';
	import type { Suggestion, StructuredSuggestion } from '$engine/scorer/types';
	import { getScoreColor } from '$engine/scorer/classification';
	import { localeStore } from '$stores/locale.svelte';
	import { scoresStore } from '$stores/scores.svelte';
	import ResumeStats from './ResumeStats.svelte';
	import ScoreCard from './ScoreCard.svelte';

	let isExporting = $state(false);
	let expanded = $state<number | null>(null);
	const average = $derived(scoresStore.averageScore);
	const passing = $derived(scoresStore.passingCount);
	const total = $derived(scoresStore.results.length);

	function isStructured(value: Suggestion): value is StructuredSuggestion {
		return typeof value === 'object' && value !== null && 'summary' in value;
	}

	const suggestions = $derived.by(() => {
		const seen = new Set<string>();
		const values: Suggestion[] = [];
		for (const result of scoresStore.results) {
			for (const suggestion of result.suggestions) {
				const key = isStructured(suggestion) ? suggestion.summary : suggestion;
				if (seen.has(key)) continue;
				seen.add(key);
				values.push(suggestion);
			}
		}
		return values.slice(0, 8);
	});

	async function exportResults() {
		if (isExporting) return;
		isExporting = true;
		try {
			await generatePDF();
		} finally {
			isExporting = false;
		}
	}

	function label(score: number): string {
		const pt = localeStore.locale === 'pt-BR';
		if (score >= 80) return pt ? 'Excelente' : 'Excellent';
		if (score >= 65) return pt ? 'Bom' : 'Good';
		if (score >= 50) return pt ? 'Precisa melhorar' : 'Needs work';
		return pt ? 'Fraco' : 'Poor';
	}
</script>

{#if scoresStore.hasResults}
	<div class="dashboard">
		<section class="summary">
			<div class="score" style:color={getScoreColor(average)}>
				<strong>{average}</strong>
				<span>{label(average)}</span>
			</div>
			<div class="bars">
				{#each scoresStore.results as result}
					<div>
						<span>{result.system}</span>
						<i><b style:width={`${result.overallScore}%`} style:background={getScoreColor(result.overallScore)}></b></i>
					</div>
				{/each}
			</div>
			<div class="passing">
				<strong>{passing}/{total}</strong>
				<span>{localeStore.locale === 'pt-BR' ? 'Sistemas aprovados' : 'Systems passed'}</span>
				<small>{scoresStore.mode === 'targeted'
					? localeStore.locale === 'pt-BR' ? 'Análise por vaga' : 'Targeted scoring'
					: localeStore.locale === 'pt-BR' ? 'Prontidão geral' : 'General readiness'}</small>
			</div>
		</section>

		<div class="toolbar">
			<p>
				{localeStore.locale === 'pt-BR'
					? 'Pontuação determinística, explicável e sem IA generativa.'
					: 'Deterministic, explainable scoring without generative AI.'}
			</p>
			<button type="button" onclick={exportResults} disabled={isExporting}>
				{isExporting
					? localeStore.locale === 'pt-BR' ? 'Gerando...' : 'Generating...'
					: localeStore.locale === 'pt-BR' ? 'Exportar PDF' : 'Export PDF'}
			</button>
		</div>

		<div class="cards">
			{#each scoresStore.results as result}
				<ScoreCard {result} />
			{/each}
		</div>

		<div class="analysis-grid">
			<section class="suggestions-panel">
				<header>
					<h2>{localeStore.locale === 'pt-BR' ? 'Prioridades de melhoria' : 'Improvement priorities'}</h2>
					<p>{localeStore.locale === 'pt-BR'
						? 'Recomendações geradas por regras e evidências do currículo.'
						: 'Recommendations generated from rules and resume evidence.'}</p>
				</header>

				{#if suggestions.length === 0}
					<p class="empty">{localeStore.locale === 'pt-BR' ? 'Nenhuma recomendação crítica.' : 'No critical recommendations.'}</p>
				{:else}
					<ol>
						{#each suggestions as suggestion, index}
							{@const structured = isStructured(suggestion)}
							<li>
								<button type="button" onclick={() => (expanded = expanded === index ? null : index)}>
									<span class="number">{index + 1}</span>
									<span>{structured ? suggestion.summary : suggestion}</span>
									<span aria-hidden="true">{expanded === index ? '−' : '+'}</span>
								</button>
								{#if expanded === index && structured && suggestion.details.length > 0}
									<ul>{#each suggestion.details as detail}<li>{detail}</li>{/each}</ul>
								{/if}
							</li>
						{/each}
					</ol>
				{/if}
			</section>

			<ResumeStats />
		</div>

		<section class="disclaimer">
			<strong>Gupy-like</strong>
			<p>{localeStore.locale === 'pt-BR'
				? 'Simulação transparente baseada apenas em orientações públicas da Gupy. Não reproduz nem afirma conhecer o algoritmo proprietário.'
				: 'Transparent simulation based only on Gupy public guidance. It does not reproduce or claim knowledge of the proprietary algorithm.'}</p>
		</section>
	</div>
{/if}

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}

	.summary {
		display: grid;
		grid-template-columns: 150px 1fr 180px;
		align-items: center;
		gap: 1.2rem;
		padding: 1.4rem;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		background: var(--glass-bg);
	}

	.score,
	.passing {
		display: flex;
		flex-direction: column;
	}

	.score strong {
		font-size: 3rem;
		line-height: 1;
	}

	.score span,
	.passing span {
		margin-top: 0.3rem;
		color: var(--text-secondary);
		font-size: 0.8rem;
		text-transform: uppercase;
	}

	.bars {
		display: grid;
		gap: 0.45rem;
	}

	.bars div {
		display: grid;
		grid-template-columns: 110px 1fr;
		align-items: center;
		gap: 0.65rem;
	}

	.bars span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-tertiary);
		font-size: 0.7rem;
	}

	.bars i {
		display: block;
		height: 5px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.06);
		overflow: hidden;
	}

	.bars b {
		display: block;
		height: 100%;
		border-radius: inherit;
	}

	.passing {
		align-items: center;
		text-align: center;
	}

	.passing strong {
		color: var(--text-primary);
		font-size: 1.7rem;
	}

	.passing small {
		margin-top: 0.65rem;
		padding: 0.3rem 0.55rem;
		border: 1px solid rgba(6, 182, 212, 0.25);
		border-radius: 999px;
		color: var(--accent-cyan);
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.85rem 1rem;
		border: 1px solid rgba(34, 197, 94, 0.2);
		border-radius: var(--radius-lg);
		background: rgba(34, 197, 94, 0.035);
		color: var(--text-secondary);
		font-size: 0.82rem;
	}

	.toolbar button {
		padding: 0.55rem 0.75rem;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--accent-cyan);
		cursor: pointer;
		white-space: nowrap;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.analysis-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		align-items: start;
	}

	.suggestions-panel,
	.disclaimer {
		padding: 1.4rem;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		background: var(--glass-bg);
	}

	.suggestions-panel h2 {
		color: var(--text-primary);
		font-size: 1.1rem;
	}

	.suggestions-panel header p,
	.empty,
	.disclaimer p {
		margin-top: 0.35rem;
		color: var(--text-tertiary);
		font-size: 0.8rem;
		line-height: 1.5;
	}

	ol {
		display: grid;
		gap: 0.55rem;
		margin-top: 1rem;
		list-style: none;
	}

	ol > li {
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		background: rgba(255, 255, 255, 0.02);
		overflow: hidden;
	}

	ol button {
		display: grid;
		grid-template-columns: 26px 1fr auto;
		align-items: center;
		gap: 0.65rem;
		width: 100%;
		padding: 0.75rem;
		border: 0;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		text-align: left;
	}

	.number {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: rgba(6, 182, 212, 0.1);
		color: var(--accent-cyan);
		font-weight: 700;
	}

	ol ul {
		padding: 0 1rem 0.8rem 3.2rem;
		color: var(--text-tertiary);
		font-size: 0.78rem;
	}

	.disclaimer {
		border-color: rgba(6, 182, 212, 0.2);
	}

	.disclaimer strong {
		color: var(--accent-cyan);
	}

	@media (max-width: 850px) {
		.summary {
			grid-template-columns: 100px 1fr;
		}

		.passing {
			grid-column: 1 / -1;
		}

		.analysis-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 650px) {
		.cards {
			grid-template-columns: 1fr;
		}

		.summary {
			grid-template-columns: 1fr;
		}

		.score {
			align-items: center;
		}

		.bars div {
			grid-template-columns: 100px 1fr;
		}

		.toolbar {
			align-items: stretch;
			flex-direction: column;
		}
	}
</style>
