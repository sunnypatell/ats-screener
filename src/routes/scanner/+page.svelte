<script lang="ts">
	import ResumeUploader from '$components/upload/ResumeUploader.svelte';
	import JobDescriptionInput from '$components/upload/JobDescriptionInput.svelte';
	import ScoreDashboard from '$components/scoring/ScoreDashboard.svelte';
	import ResumeStats from '$components/scoring/ResumeStats.svelte';
	import { resumeStore } from '$stores/resume.svelte';
	import { scoresStore } from '$stores/scores.svelte';
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
			// dynamic import: pdfjs-dist + parser only loaded when user uploads a file
			const { parseResume } = await import('$engine/parser');
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

	// runs scoring: LLM-powered (primary) → rule-based (fallback)
	async function handleScan() {
		if (!resumeStore.isReady) return;

		hasScanned = true;
		scoresStore.startScoring();

		try {
			const resume = resumeStore.resume!;
			const jd = scoresStore.hasJobDescription ? scoresStore.jobDescription : undefined;

			// dynamic import: LLM client only loaded when scoring starts
			const { scoreLLM } = await import('$engine/llm');
			const llmResult = await scoreLLM(resume.rawText, jd);

			if (llmResult && llmResult.results.length > 0) {
				scoresStore.finishScoring(llmResult.results);
				scoresStore.finishAnalyzing(null, false);
				return;
			}

			// all LLM providers failed, fall back to deterministic rule-based scoring
			const { scoreResume } = await import('$engine/scorer/engine');
			const input = buildScoringInput();
			const results = scoreResume(input);
			scoresStore.finishScoring(results);
			scoresStore.finishAnalyzing(null, true);
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
	<title>Resume Scanner | ATS Screener</title>
	<meta
		name="description"
		content="Upload your resume and get scored by 6 real ATS platforms. See exactly how Workday, Taleo, iCIMS, Greenhouse, Lever, and SuccessFactors parse your resume."
	/>
</svelte:head>

<main class="scanner">
	<!-- subtle background mesh -->
	<div class="scanner-bg">
		<div class="bg-orb orb-1"></div>
		<div class="bg-orb orb-2"></div>
	</div>

	<div class="container">
		<div class="scanner-header">
			<div class="page-badge">
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
					<polyline points="14,2 14,8 20,8" />
					<path d="M12 18v-6" />
					<path d="M9 15l3 3 3-3" />
				</svg>
				<span>Resume Scanner</span>
			</div>
			<h1 class="page-title">
				Scan Your Resume Against
				<span class="gradient-text">Real ATS Systems</span>
			</h1>
			<p class="page-subtitle">
				Upload your resume and optionally paste a job description for targeted scoring. Everything
				is parsed client-side. Your data never leaves your browser.
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
							<div class="warning-item">
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
									/>
									<line x1="12" y1="9" x2="12" y2="13" />
									<line x1="12" y1="17" x2="12.01" y2="17" />
								</svg>
								<span>{warning}</span>
							</div>
						{/each}
					</div>
				{/if}

				<div class="actions">
					{#if scoresStore.hasResults}
						<button class="btn-secondary" onclick={handleReset}>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<polyline points="1,4 1,10 7,10" />
								<path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
							</svg>
							Start Over
						</button>
					{/if}

					<button class="btn-scan" disabled={!canScan} onclick={handleScan}>
						{#if scoresStore.isScoring}
							<span class="spinner-inline"></span>
							Scoring...
						{:else if scoresStore.hasResults}
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<polyline points="23,4 23,10 17,10" />
								<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
							</svg>
							Re-Scan
						{:else}
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
								<polyline points="14,2 14,8 20,8" />
								<path d="M12 18v-6" />
								<path d="M9 15l3 3 3-3" />
							</svg>
							Scan Resume
						{/if}
					</button>
				</div>

				{#if scoresStore.error}
					<div class="error">
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="15" y1="9" x2="9" y2="15" />
							<line x1="9" y1="9" x2="15" y2="15" />
						</svg>
						<span>{scoresStore.error}</span>
					</div>
				{/if}
			</section>

			<!-- resume overview: shows immediately after parsing, before scanning -->
			{#if resumeStore.isReady && !scoresStore.hasResults}
				<section class="preview-section">
					<div class="preview-header">
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<polyline points="20,6 9,17 4,12" />
						</svg>
						<span>Resume Parsed Successfully</span>
					</div>
					<ResumeStats />
				</section>
			{/if}

			<!-- results section: fades in smoothly after scanning -->
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
		position: relative;
		min-height: 100dvh;
		padding: 7rem 2rem 4rem;
		overflow: hidden;
	}

	/* subtle background gradient orbs */
	.scanner-bg {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.bg-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(120px);
	}

	.orb-1 {
		width: 500px;
		height: 500px;
		background: rgba(6, 182, 212, 0.06);
		top: 5%;
		right: -10%;
	}

	.orb-2 {
		width: 400px;
		height: 400px;
		background: rgba(139, 92, 246, 0.04);
		bottom: 10%;
		left: -10%;
	}

	.container {
		position: relative;
		max-width: 1200px;
		margin: 0 auto;
	}

	.scanner-header {
		margin-bottom: 3rem;
	}

	.page-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 1rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-full);
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
		backdrop-filter: blur(12px);
	}

	.page-badge svg {
		color: var(--accent-cyan);
	}

	.page-title {
		font-size: clamp(2rem, 5vw, 3.25rem);
		font-weight: 800;
		letter-spacing: -0.03em;
		margin-bottom: 0.75rem;
		color: var(--text-primary);
		line-height: 1.15;
	}

	.gradient-text {
		background: var(--gradient-primary);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.page-subtitle {
		font-size: clamp(1rem, 2vw, 1.15rem);
		color: var(--text-secondary);
		line-height: 1.6;
		max-width: 640px;
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
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: #eab308;
		padding: 0.6rem 1rem;
		background: rgba(234, 179, 8, 0.06);
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
		gap: 0.6rem;
		padding: 0.9rem 2.25rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-bg-primary);
		background: var(--gradient-primary);
		border: none;
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition:
			transform 0.25s ease,
			box-shadow 0.25s ease,
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
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.9rem 1.5rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-secondary);
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		cursor: pointer;
		backdrop-filter: blur(var(--glass-blur));
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
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 1rem;
		color: #ef4444;
		font-size: 0.9rem;
		padding: 0.6rem 1rem;
		background: rgba(239, 68, 68, 0.06);
		border: 1px solid rgba(239, 68, 68, 0.15);
		border-radius: var(--radius-md);
	}

	.preview-section {
		margin-top: 3rem;
		animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.preview-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		font-weight: 600;
		color: #22c55e;
	}

	.results-section {
		margin-top: 4rem;
		/* fade in smoothly when results appear */
		animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 640px) {
		.scanner {
			padding: 5rem 1.5rem 3rem;
		}

		.actions {
			flex-direction: column;
		}
	}
</style>
