<script lang="ts">
	import { onMount } from 'svelte';
	import JobDescriptionInput from '$components/upload/JobDescriptionInput.svelte';
	import ResumeUploader from '$components/upload/ResumeUploader.svelte';
	import ResumeStats from '$components/scoring/ResumeStats.svelte';
	import ScanHistory from '$components/scoring/ScanHistory.svelte';
	import ScanningAnimation from '$components/scoring/ScanningAnimation.svelte';
	import ScoreDashboard from '$components/scoring/ScoreDashboard.svelte';
	import SeoHead from '$components/seo/SeoHead.svelte';
	import { authStore } from '$stores/auth.svelte';
	import { localeStore, type AppLocale } from '$stores/locale.svelte';
	import { resumeStore } from '$stores/resume.svelte';
	import { scoresStore } from '$stores/scores.svelte';
	import type { ScoringInput } from '$engine/scorer/types';

	let hasScanned = $state(false);
	let pastedText = $state('');

	onMount(() => localeStore.init());

	$effect(() => {
		if (authStore.disabled || authStore.isAuthenticated) scoresStore.loadHistory();
	});

	$effect(() => {
		if (scoresStore.hasResults) hasScanned = true;
	});

	$effect(() => {
		if (resumeStore.file && !resumeStore.isParsing && !resumeStore.parseResult) {
			handleFileReady();
		}
	});

	const canScan = $derived(resumeStore.isReady && !scoresStore.isScoring);
	const hasInput = $derived(resumeStore.file !== null || resumeStore.isReady);

	function setLocale(locale: AppLocale) {
		localeStore.set(locale);
	}

	async function handleFileReady() {
		if (!resumeStore.file) return;
		resumeStore.startParsing();
		try {
			const { parseResume } = await import('$engine/parser');
			resumeStore.finishParsing(await parseResume(resumeStore.file));
		} catch (error) {
			resumeStore.setError(error instanceof Error ? error.message : 'failed to parse resume');
		}
	}

	function buildScoringInput(): ScoringInput {
		const resume = resumeStore.resume!;
		return {
			resumeText: resume.rawText,
			resumeSkills: resume.skills,
			resumeSections: resume.sections.map((section) => section.type),
			experienceBullets: resume.experience.flatMap((entry) => entry.bullets),
			educationText: resume.education.map((entry) => entry.rawText).join('\n'),
			hasMultipleColumns: resume.metadata.hasMultipleColumns,
			hasTables: resume.metadata.hasTables,
			hasImages: resume.metadata.hasImages,
			pageCount: resume.metadata.pageCount,
			wordCount: resume.metadata.wordCount,
			jobDescription: scoresStore.hasJobDescription ? scoresStore.jobDescription : undefined,
			locale: resume.metadata.language,
			extractionQuality: resume.metadata.extractionQuality
		};
	}

	async function handleScan() {
		if (!resumeStore.isReady) return;
		hasScanned = true;
		const signal = scoresStore.startScoring();
		try {
			const { scoreResume } = await import('$engine/scorer/engine');
			const results = scoreResume(buildScoringInput());
			if (signal.aborted) return;
			scoresStore.finishScoring(results, resumeStore.file?.name);
			scoresStore.finishAnalyzing(null, false);
		} catch (error) {
			if (!signal.aborted) {
				scoresStore.setError(error instanceof Error ? error.message : 'scoring failed');
			}
		}
	}

	function usePastedText() {
		resumeStore.setText(pastedText);
		scoresStore.reset();
		hasScanned = false;
	}

	function handleReset() {
		resumeStore.reset();
		scoresStore.reset();
		pastedText = '';
		hasScanned = false;
	}

	const announcement = $derived.by(() => {
		const pt = localeStore.locale === 'pt-BR';
		if (scoresStore.error) return pt ? `Falha na análise: ${scoresStore.error}` : `Scan failed: ${scoresStore.error}`;
		if (scoresStore.isScoring) return pt ? 'Analisando currículo.' : 'Scanning resume.';
		if (scoresStore.hasResults && !scoresStore.isFromHistory) {
			const total = scoresStore.results.length;
			const passing = scoresStore.passingCount;
			const average = scoresStore.averageScore;
			return pt
				? `Análise concluída. Nota média ${average} de 100. ${passing} de ${total} sistemas aprovados.`
				: `Scan complete. Average score ${average} out of 100. ${passing} of ${total} systems passed.`;
		}
		return '';
	});
</script>

<SeoHead
	title={localeStore.locale === 'pt-BR' ? 'Analisador ATS determinístico' : 'Deterministic ATS Scanner'}
	description={localeStore.t('scanner.subtitle')}
/>

<main class="scanner">
	<div class="sr-only" role="status">{announcement}</div>
	<div class="background" aria-hidden="true"></div>

	{#if authStore.loading}
		<div class="gate"><div class="loader"></div></div>
	{:else if !authStore.disabled && !authStore.isAuthenticated}
		<div class="gate card">
			<h2>{localeStore.locale === 'pt-BR' ? 'Entre para analisar' : 'Sign in to scan'}</h2>
			<p>{localeStore.locale === 'pt-BR' ? 'Acesse sua conta para salvar o histórico.' : 'Access your account to save scan history.'}</p>
			<a href="/login">{localeStore.locale === 'pt-BR' ? 'Entrar' : 'Sign in'}</a>
		</div>
	{:else}
		<div class="container">
			<header class="hero">
				<div class="topline">
					<span class="badge">{localeStore.t('scanner.badge')}</span>
					<div class="language" aria-label={localeStore.t('language.label')}>
						<button class:active={localeStore.locale === 'pt-BR'} onclick={() => setLocale('pt-BR')}>PT</button>
						<button class:active={localeStore.locale === 'en'} onclick={() => setLocale('en')}>EN</button>
					</div>
				</div>
				<h1>{localeStore.t('scanner.title')}</h1>
				<p>{localeStore.t('scanner.subtitle')}</p>
				<div class="steps" aria-label="progress">
					<div class:done={hasInput}><strong>1</strong><span>{localeStore.t('scanner.upload')}</span></div>
					<div class:done={resumeStore.isReady}><strong>2</strong><span>{localeStore.t('scanner.parse')}</span></div>
					<div class:done={hasScanned}><strong>3</strong><span>{localeStore.t('scanner.scan')}</span></div>
					<div class:done={scoresStore.hasResults}><strong>4</strong><span>{localeStore.t('scanner.results')}</span></div>
				</div>
			</header>

			<section class="workspace">
				<ResumeUploader />

				<details class="paste">
					<summary>{localeStore.t('scanner.pasteToggle')}</summary>
					<textarea
						rows="9"
						bind:value={pastedText}
						placeholder={localeStore.t('scanner.pastePlaceholder')}
						aria-label="Paste resume text"
					></textarea>
					<div class="paste-actions">
						<span>{pastedText.length} {localeStore.t('scanner.characters')}</span>
						<button disabled={pastedText.trim().length < 50} onclick={usePastedText}>
							{localeStore.t('scanner.useText')}
						</button>
					</div>
				</details>

				<JobDescriptionInput />

				{#if resumeStore.warnings.length > 0}
					<div class="warnings">
						{#each resumeStore.warnings as warning}<p>⚠ {warning}</p>{/each}
					</div>
				{/if}

				<div class="actions">
					{#if scoresStore.hasResults}
						<button class="secondary" onclick={handleReset}>{localeStore.t('scanner.startOver')}</button>
					{/if}
					<button class="primary" disabled={!canScan} onclick={handleScan}>
						{scoresStore.isScoring
							? localeStore.t('scanner.scoring')
							: scoresStore.hasResults
								? localeStore.t('scanner.rescan')
								: localeStore.t('scanner.scanResume')}
					</button>
				</div>

				{#if scoresStore.error}<p class="error">{scoresStore.error}</p>{/if}
			</section>

			<ScanHistory />

			{#if resumeStore.isReady && !scoresStore.hasResults}
				<section class="preview">
					<h2>✓ {localeStore.t('scanner.parsed')}</h2>
					<ResumeStats />
				</section>
			{/if}

			{#if scoresStore.isScoring}
				<section class="results"><ScanningAnimation /></section>
			{/if}

			{#if hasScanned && scoresStore.hasResults}
				<section class="results"><ScoreDashboard /></section>
			{/if}
		</div>
	{/if}
</main>

<style>
	.scanner {
		position: relative;
		min-height: 100vh;
		padding: 5rem 1rem 4rem;
		overflow: hidden;
	}

	.background {
		position: fixed;
		inset: 0;
		z-index: -1;
		background:
			radial-gradient(circle at 15% 10%, rgba(6, 182, 212, 0.08), transparent 34%),
			radial-gradient(circle at 85% 15%, rgba(124, 58, 237, 0.08), transparent 34%);
	}

	.container {
		width: min(1080px, 100%);
		margin: 0 auto;
	}

	.hero {
		margin-bottom: 2rem;
	}

	.topline {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.badge {
		padding: 0.35rem 0.7rem;
		border: 1px solid rgba(6, 182, 212, 0.25);
		border-radius: 999px;
		background: rgba(6, 182, 212, 0.06);
		color: var(--accent-cyan);
		font-size: 0.75rem;
	}

	.language {
		display: flex;
		padding: 0.2rem;
		border: 1px solid var(--glass-border);
		border-radius: 999px;
		background: var(--glass-bg);
	}

	.language button {
		padding: 0.35rem 0.65rem;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		font-weight: 700;
	}

	.language button.active {
		background: var(--accent-cyan);
		color: #07111f;
	}

	h1 {
		max-width: 820px;
		margin-top: 1.2rem;
		font-size: clamp(2rem, 6vw, 4rem);
		line-height: 1.05;
		color: var(--text-primary);
	}

	.hero > p {
		max-width: 760px;
		margin-top: 1rem;
		color: var(--text-secondary);
		line-height: 1.65;
	}

	.steps {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.7rem;
		margin-top: 1.5rem;
	}

	.steps div {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		color: var(--text-tertiary);
		font-size: 0.75rem;
	}

	.steps div.done {
		border-color: rgba(34, 197, 94, 0.35);
		color: #22c55e;
	}

	.steps strong {
		display: grid;
		place-items: center;
		width: 23px;
		height: 23px;
		border: 1px solid currentColor;
		border-radius: 50%;
	}

	.workspace,
	.preview,
	.results {
		margin-top: 1.2rem;
	}

	.paste {
		margin-top: 0.8rem;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		background: var(--glass-bg);
	}

	.paste summary {
		padding: 0.85rem 1rem;
		color: var(--accent-cyan);
		cursor: pointer;
	}

	.paste textarea {
		width: calc(100% - 2rem);
		margin: 0 1rem;
		padding: 0.9rem;
		resize: vertical;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		background: rgba(0, 0, 0, 0.18);
		color: var(--text-primary);
		font: inherit;
		line-height: 1.5;
	}

	.paste-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.8rem 1rem 1rem;
		color: var(--text-tertiary);
		font-size: 0.75rem;
	}

	.paste-actions button,
	.actions button,
	.gate a {
		padding: 0.65rem 1rem;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		cursor: pointer;
		font-weight: 700;
		text-decoration: none;
	}

	.paste-actions button,
	.actions .primary {
		border: 0;
		background: linear-gradient(135deg, var(--accent-cyan), #7c3aed);
		color: white;
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.45;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.actions .secondary {
		background: transparent;
		color: var(--text-secondary);
	}

	.warnings,
	.error {
		margin-top: 0.9rem;
		padding: 0.8rem 1rem;
		border: 1px solid rgba(234, 179, 8, 0.25);
		border-radius: var(--radius-md);
		background: rgba(234, 179, 8, 0.05);
		color: #eab308;
		font-size: 0.82rem;
	}

	.error {
		border-color: rgba(239, 68, 68, 0.3);
		background: rgba(239, 68, 68, 0.06);
		color: #ef4444;
	}

	.preview h2 {
		margin-bottom: 0.65rem;
		color: #22c55e;
		font-size: 0.9rem;
	}

	.gate {
		display: grid;
		place-items: center;
		min-height: 50vh;
		text-align: center;
	}

	.gate.card {
		width: min(480px, 100%);
		min-height: auto;
		margin: 10vh auto;
		padding: 2rem;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		background: var(--glass-bg);
	}

	.gate.card p {
		margin: 0.75rem 0 1.2rem;
		color: var(--text-secondary);
	}

	.gate.card a {
		background: var(--accent-cyan);
		color: #07111f;
	}

	.loader {
		width: 42px;
		height: 42px;
		border: 3px solid rgba(6, 182, 212, 0.15);
		border-top-color: var(--accent-cyan);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 650px) {
		.scanner {
			padding-top: 4rem;
		}

		.steps {
			grid-template-columns: repeat(2, 1fr);
		}

		.actions {
			flex-direction: column-reverse;
		}

		.actions button {
			width: 100%;
		}
	}
</style>
