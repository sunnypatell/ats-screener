<script lang="ts">
	import ResumeUploader from '$components/upload/ResumeUploader.svelte';
	import JobDescriptionInput from '$components/upload/JobDescriptionInput.svelte';
	import ScoreDashboard from '$components/scoring/ScoreDashboard.svelte';
	import { resumeStore } from '$stores/resume.svelte';
	import { scoresStore } from '$stores/scores.svelte';
	import { parseResume } from '$engine/parser';
	import { scoreResume } from '$engine/scorer/engine';
	import type { ScoringInput } from '$engine/scorer/types';

	// tracks whether the scan button has been clicked at least once
	let hasScanned = $state(false);

	// re-derive readiness from stores so the scan button reacts to changes
	const canScan = $derived(resumeStore.isReady && !scoresStore.isScoring);

	// triggered when the user uploads a file via ResumeUploader
	// runs the parser immediately so results are ready when they hit "scan"
	async function handleFileReady() {
		if (!resumeStore.file) return;

		resumeStore.startParsing();
		try {
			const result = await parseResume(resumeStore.file);
			resumeStore.finishParsing(result);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'failed to parse resume';
			resumeStore.setError(msg);
		}
	}

	// builds the ScoringInput from parsed resume data
	function buildScoringInput(): ScoringInput {
		const resume = resumeStore.resume!;
		return {
			resumeText: resume.rawText,
			resumeSkills: resume.skills,
			resumeSections: resume.sections.map((s) => s.type),
			experienceBullets: resume.experience.flatMap((e) => e.bullets),
			// join all education entries into one string for the scorer
			educationText: resume.education.map((e) => e.rawText).join('\n'),
			hasMultipleColumns: resume.metadata.hasMultipleColumns,
			hasTables: resume.metadata.hasTables,
			hasImages: resume.metadata.hasImages,
			pageCount: resume.metadata.pageCount,
			wordCount: resume.metadata.wordCount,
			// only pass JD if user actually typed something
			jobDescription: scoresStore.hasJobDescription ? scoresStore.jobDescription : undefined
		};
	}

	// runs the scoring engine against all 6 ATS profiles
	async function handleScan() {
		if (!resumeStore.isReady) return;

		hasScanned = true;
		scoresStore.startScoring();

		try {
			const input = buildScoringInput();
			const results = scoreResume(input);
			scoresStore.finishScoring(results);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'scoring failed';
			scoresStore.setError(msg);
		}
	}

	// resets everything so the user can start fresh
	function handleReset() {
		resumeStore.reset();
		scoresStore.reset();
		hasScanned = false;
	}

	// auto-parse whenever a new file is set
	$effect(() => {
		if (resumeStore.file && !resumeStore.isParsing && !resumeStore.parseResult) {
			handleFileReady();
		}
	});
</script>

<svelte:head>
	<title>Resume Scanner - ATS Screener</title>
</svelte:head>

<main class="scanner">
	<div class="container">
		<div class="scanner-header">
			<h1 class="page-title">resume scanner</h1>
			<p class="page-subtitle">
				upload your resume and optionally paste a job description for targeted scoring
			</p>
		</div>

		<div class="scanner-body">
			<!-- upload section -->
			<section class="upload-section">
				<ResumeUploader />
				<JobDescriptionInput />

				{#if resumeStore.warnings.length > 0}
					<div class="warnings">
						{#each resumeStore.warnings as warning}
							<p class="warning-item">⚠ {warning}</p>
						{/each}
					</div>
				{/if}

				<div class="actions">
					{#if scoresStore.hasResults}
						<button class="btn-secondary" onclick={handleReset}> start over </button>
					{/if}

					<button class="btn-scan" disabled={!canScan} onclick={handleScan}>
						{#if scoresStore.isScoring}
							<span class="spinner-inline"></span>
							scoring...
						{:else if scoresStore.hasResults}
							re-scan
						{:else}
							scan resume
						{/if}
					</button>
				</div>

				{#if scoresStore.error}
					<p class="error">{scoresStore.error}</p>
				{/if}
			</section>

			<!-- results section - only shows after scanning -->
			{#if hasScanned}
				<section class="results-section">
					<ScoreDashboard />
				</section>
			{/if}
		</div>
	</div>
</main>

<style>
	.scanner {
		min-height: 100dvh;
		padding: 6rem 2rem 4rem;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
	}

	.scanner-header {
		margin-bottom: 2.5rem;
	}

	.page-title {
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 800;
		letter-spacing: -0.02em;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
	}

	.page-subtitle {
		font-size: 1.1rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.upload-section {
		max-width: 640px;
	}

	.warnings {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.warning-item {
		font-size: 0.85rem;
		color: #eab308;
		padding: 0.5rem 1rem;
		background: rgba(234, 179, 8, 0.05);
		border: 1px solid rgba(234, 179, 8, 0.15);
		border-radius: var(--radius-md);
	}

	.actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
	}

	.btn-scan {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 2rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-bg-primary);
		background: var(--gradient-primary);
		border: none;
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease,
			opacity 0.2s ease;
	}

	.btn-scan:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow:
			0 0 30px rgba(6, 182, 212, 0.3),
			0 0 60px rgba(59, 130, 246, 0.15);
	}

	.btn-scan:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn-secondary {
		padding: 0.875rem 1.5rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-secondary);
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition:
			border-color 0.2s ease,
			color 0.2s ease;
	}

	.btn-secondary:hover {
		border-color: var(--accent-cyan);
		color: var(--text-primary);
	}

	/* small inline spinner for the scoring state */
	.spinner-inline {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(0, 0, 0, 0.2);
		border-top-color: var(--color-bg-primary);
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error {
		margin-top: 1rem;
		color: #ef4444;
		font-size: 0.9rem;
	}

	.results-section {
		margin-top: 3rem;
		/* fade in smoothly when results appear */
		animation: fadeIn 0.4s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 640px) {
		.scanner {
			padding: 4rem 1.5rem 3rem;
		}

		.actions {
			flex-direction: column;
		}
	}
</style>
