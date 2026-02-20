<script lang="ts">
	const steps = [
		{
			number: '01',
			title: 'Upload Your Resume',
			description:
				'PDF or DOCX. Parsed client-side in a Web Worker. Your file never leaves your browser.',
			icon: 'upload',
			accent: '#06b6d4'
		},
		{
			number: '02',
			title: 'Add a Job Description',
			description:
				'Optional. Paste a JD for targeted scoring, or skip for general ATS-readiness analysis.',
			icon: 'clipboard',
			accent: '#3b82f6'
		},
		{
			number: '03',
			title: 'Get Scored by 6 Systems',
			description:
				'Each platform scores differently. Workday, Taleo, iCIMS, Greenhouse, Lever, SuccessFactors.',
			icon: 'zap',
			accent: '#8b5cf6'
		},
		{
			number: '04',
			title: 'See What to Fix',
			description:
				'Per-system breakdown: formatting, keywords, sections, experience, education. Plus tips.',
			icon: 'check',
			accent: '#22c55e'
		}
	];
</script>

<section id="how-it-works" class="how-it-works">
	<div class="section-header">
		<div class="section-badge">
			<span class="badge-icon">
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
					/>
				</svg>
			</span>
			<span>How It Works</span>
		</div>
		<h2 class="section-title">
			Four Steps to
			<span class="gradient-text">Real Scores</span>
		</h2>
	</div>

	<div class="steps-grid">
		{#each steps as step, i}
			<div class="step-card" style="--accent: {step.accent}; --delay: {i * 0.1}s">
				<!-- step number badge -->
				<div class="step-number">{step.number}</div>

				<!-- icon -->
				<div class="step-icon">
					{#if step.icon === 'upload'}
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="17,8 12,3 7,8" />
							<line x1="12" y1="3" x2="12" y2="15" />
						</svg>
					{:else if step.icon === 'clipboard'}
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
						>
							<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
							<rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
						</svg>
					{:else if step.icon === 'zap'}
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
						>
							<polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
						</svg>
					{:else if step.icon === 'check'}
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
						>
							<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
							<polyline points="22,4 12,14.01 9,11.01" />
						</svg>
					{/if}
				</div>

				<h3 class="step-title">{step.title}</h3>
				<p class="step-description">{step.description}</p>

				<!-- connecting arrow (not on last card) -->
				{#if i < steps.length - 1}
					<div class="step-arrow">
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
						>
							<line x1="5" y1="12" x2="19" y2="12" />
							<polyline points="12,5 19,12 12,19" />
						</svg>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</section>

<style>
	.how-it-works {
		padding: 8rem 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.section-header {
		text-align: center;
		margin-bottom: 4rem;
	}

	.section-badge {
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
		letter-spacing: 0.02em;
	}

	.badge-icon {
		display: inline-flex;
		color: var(--accent-cyan);
	}

	.section-title {
		font-size: clamp(2rem, 5vw, 3.25rem);
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.03em;
		line-height: 1.15;
	}

	.gradient-text {
		background: var(--gradient-primary);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	/* horizontal card grid */
	.steps-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1.25rem;
	}

	.step-card {
		position: relative;
		padding: 1.75rem 1.5rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
		transition:
			border-color 0.3s ease,
			transform 0.25s ease,
			box-shadow 0.3s ease;
		animation: card-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
		animation-delay: var(--delay);
	}

	@keyframes card-in {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
	}

	.step-card:hover {
		border-color: color-mix(in srgb, var(--accent) 30%, transparent);
		transform: translateY(-4px);
		box-shadow: 0 8px 32px color-mix(in srgb, var(--accent) 8%, transparent);
	}

	.step-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		color: var(--accent);
		font-size: 0.7rem;
		font-weight: 800;
		margin-bottom: 1.25rem;
	}

	.step-icon {
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--accent) 8%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 15%, transparent);
		color: var(--accent);
		margin-bottom: 1rem;
	}

	.step-title {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
		letter-spacing: -0.01em;
	}

	.step-description {
		font-size: 0.85rem;
		color: var(--text-secondary);
		line-height: 1.6;
	}

	/* connecting arrow between cards */
	.step-arrow {
		position: absolute;
		right: -20px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--glass-border);
		z-index: 2;
		opacity: 0.4;
	}

	@media (max-width: 900px) {
		.steps-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 1rem;
		}

		.step-arrow {
			display: none;
		}
	}

	@media (max-width: 500px) {
		.steps-grid {
			grid-template-columns: 1fr;
		}

		.how-it-works {
			padding: 5rem 1.5rem;
		}
	}
</style>
