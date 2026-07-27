<script lang="ts">
	import { getScoreColor } from '$engine/scorer/classification';
	import type { ScoreResult } from '$engine/scorer/types';
	import { localeStore } from '$stores/locale.svelte';

	let { result, previousScore }: { result: ScoreResult; previousScore?: number } = $props();
	const delta = $derived(previousScore === undefined ? null : result.overallScore - previousScore);
	const scoreColor = $derived(getScoreColor(result.overallScore));
	const circumference = 2 * Math.PI * 42;
	const offset = $derived(circumference - (result.overallScore / 100) * circumference);

	const breakdown = $derived([
		{
			label: localeStore.locale === 'pt-BR' ? 'Formatação' : 'Formatting',
			score: result.breakdown.formatting.score
		},
		{
			label: localeStore.locale === 'pt-BR' ? 'Palavras-chave' : 'Keywords',
			score: result.breakdown.keywordMatch.score,
			hide: result.breakdown.keywordMatch.matched.length === 0 && result.breakdown.keywordMatch.missing.length === 0
		},
		{
			label: localeStore.locale === 'pt-BR' ? 'Seções' : 'Sections',
			score: result.breakdown.sections.score
		},
		{
			label: localeStore.locale === 'pt-BR' ? 'Experiência' : 'Experience',
			score: result.breakdown.experience.score
		},
		{
			label: localeStore.locale === 'pt-BR' ? 'Formação' : 'Education',
			score: result.breakdown.education.score
		}
	]);

	function verdict(score: number): string {
		const pt = localeStore.locale === 'pt-BR';
		if (score >= 80) return pt ? 'Excelente' : 'Excellent';
		if (score >= 65) return pt ? 'Bom' : 'Good';
		if (score >= 50) return pt ? 'Precisa melhorar' : 'Needs work';
		return pt ? 'Fraco' : 'Poor';
	}
</script>

<article class="card" class:passing={result.passesFilter} style:--score-color={scoreColor}>
	<header>
		<div>
			<h3>{result.system}</h3>
			<p>{result.vendor}</p>
		</div>
		<div class="ring">
			<svg viewBox="0 0 100 100" width="72" height="72" aria-hidden="true">
				<circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="6" />
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
				/>
			</svg>
			<strong style:color={scoreColor}>{result.overallScore}</strong>
			{#if delta !== null && delta !== 0}
				<small class:positive={delta > 0} class:negative={delta < 0}>{delta > 0 ? '+' : ''}{delta}</small>
			{/if}
		</div>
	</header>

	<div class="status">
		<span class:pass={result.passesFilter} class:fail={!result.passesFilter}>
			{result.passesFilter
				? localeStore.locale === 'pt-BR' ? '✓ Provável aprovação' : '✓ Likely to pass'
				: localeStore.locale === 'pt-BR' ? '× Pode ser filtrado' : '× May be filtered'}
		</span>
		<b style:color={scoreColor}>{verdict(result.overallScore)}</b>
	</div>

	<div class="breakdown">
		{#each breakdown.filter((item) => !item.hide) as item}
			<div>
				<span>{item.label}</span>
				<i><b style:width={`${item.score}%`} style:background={getScoreColor(item.score)}></b></i>
				<strong style:color={getScoreColor(item.score)}>{item.score}</strong>
			</div>
		{/each}
	</div>

	{#if result.breakdown.keywordMatch.matched.length > 0 || result.breakdown.keywordMatch.missing.length > 0}
		<footer>
			<span class="matched">{result.breakdown.keywordMatch.matched.length} {localeStore.locale === 'pt-BR' ? 'encontradas' : 'matched'}</span>
			<span class="missing">{result.breakdown.keywordMatch.missing.length} {localeStore.locale === 'pt-BR' ? 'ausentes' : 'missing'}</span>
		</footer>
	{/if}
</article>

<style>
	.card {
		padding: 1.35rem;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		background: var(--glass-bg);
		transition: transform 0.2s ease, border-color 0.2s ease;
	}

	.card:hover {
		transform: translateY(-2px);
		border-color: color-mix(in srgb, var(--score-color) 35%, transparent);
	}

	header,
	.status,
	footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	h3 {
		color: var(--text-primary);
		font-size: 1.05rem;
	}

	header p {
		margin-top: 0.2rem;
		color: var(--text-tertiary);
		font-size: 0.7rem;
		text-transform: uppercase;
	}

	.ring {
		position: relative;
		display: grid;
		place-items: center;
		flex: 0 0 auto;
	}

	.ring svg,
	.ring > strong,
	.ring > small {
		grid-area: 1 / 1;
	}

	.ring > strong {
		font-size: 1.25rem;
	}

	.ring > small {
		align-self: end;
		justify-self: end;
		padding: 0.12rem 0.3rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.08);
		font-size: 0.62rem;
	}

	.ring > small.positive {
		color: #22c55e;
	}

	.ring > small.negative {
		color: #ef4444;
	}

	.status {
		margin: 0.75rem 0 1rem;
	}

	.status span,
	.status b {
		font-size: 0.7rem;
		text-transform: uppercase;
	}

	.status span {
		padding: 0.3rem 0.55rem;
		border-radius: 999px;
	}

	.status span.pass {
		background: rgba(34, 197, 94, 0.08);
		color: #22c55e;
	}

	.status span.fail {
		background: rgba(239, 68, 68, 0.08);
		color: #ef4444;
	}

	.breakdown {
		display: grid;
		gap: 0.55rem;
	}

	.breakdown > div {
		display: grid;
		grid-template-columns: 92px 1fr 30px;
		align-items: center;
		gap: 0.55rem;
	}

	.breakdown span,
	.breakdown strong {
		font-size: 0.7rem;
	}

	.breakdown span {
		color: var(--text-tertiary);
	}

	.breakdown i {
		display: block;
		height: 5px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.055);
		overflow: hidden;
	}

	.breakdown i b {
		display: block;
		height: 100%;
		border-radius: inherit;
	}

	footer {
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--glass-border);
		font-size: 0.7rem;
	}

	footer .matched {
		color: #22c55e;
	}

	footer .missing {
		color: #ef4444;
	}
</style>
