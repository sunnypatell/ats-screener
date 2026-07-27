<script lang="ts">
	import { onMount } from 'svelte';
	import { localeStore } from '$stores/locale.svelte';

	const platforms = ['Gupy-like', 'Workday', 'Taleo', 'SuccessFactors', 'iCIMS', 'Greenhouse', 'Lever'];
	let active = $state(0);

	onMount(() => {
		const timer = setInterval(() => {
			active = (active + 1) % platforms.length;
		}, 220);
		return () => clearInterval(timer);
	});
</script>

<div class="scanning" role="status">
	<div class="spinner" aria-hidden="true"></div>
	<h3>{localeStore.locale === 'pt-BR' ? 'Calculando pontuações determinísticas' : 'Computing deterministic scores'}</h3>
	<p>{localeStore.locale === 'pt-BR'
		? 'Aplicando regras, requisitos da vaga e perfis ATS locais.'
		: 'Applying local rules, job requirements and ATS profiles.'}</p>
	<div class="platforms">
		{#each platforms as platform, index}
			<span class:active={index === active} class:done={index < active}>{platform}</span>
		{/each}
	</div>
</div>

<style>
	.scanning {
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 680px;
		margin: 2rem auto;
		padding: 2rem;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		background: var(--glass-bg);
		text-align: center;
	}

	.spinner {
		width: 46px;
		height: 46px;
		border: 3px solid rgba(6, 182, 212, 0.15);
		border-top-color: var(--accent-cyan);
		border-radius: 50%;
		animation: spin 0.75s linear infinite;
	}

	h3 {
		margin-top: 1rem;
		color: var(--text-primary);
		font-size: 1.1rem;
	}

	p {
		margin-top: 0.45rem;
		color: var(--text-tertiary);
		font-size: 0.82rem;
	}

	.platforms {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.45rem;
		margin-top: 1.2rem;
	}

	.platforms span {
		padding: 0.3rem 0.55rem;
		border: 1px solid var(--glass-border);
		border-radius: 999px;
		color: var(--text-tertiary);
		font-size: 0.7rem;
		transition: 0.2s ease;
	}

	.platforms span.active {
		border-color: var(--accent-cyan);
		color: var(--accent-cyan);
		transform: translateY(-1px);
	}

	.platforms span.done {
		border-color: rgba(34, 197, 94, 0.35);
		color: #22c55e;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
