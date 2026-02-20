<script lang="ts">
	const steps = [
		{
			number: '01',
			title: 'Upload Your Resume',
			description:
				'PDF or DOCX. Everything is parsed client-side in a Web Worker. Your file never leaves your browser.',
			icon: 'upload'
		},
		{
			number: '02',
			title: 'Add a Job Description',
			description:
				'Optionally paste the JD for targeted scoring. Without it, you get a general ATS-readiness score across all systems.',
			icon: 'clipboard'
		},
		{
			number: '03',
			title: 'Get Scored by 6 Systems',
			description:
				'Workday, Taleo, iCIMS, Greenhouse, Lever, and SuccessFactors. Each with researched weights and parsing strategies.',
			icon: 'zap'
		},
		{
			number: '04',
			title: 'See What to Fix',
			description:
				'Detailed breakdown per system: formatting, keywords, sections, experience, and education. Plus actionable suggestions.',
			icon: 'check'
		}
	];
</script>

<section class="how-it-works">
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

	<div class="steps-container">
		<!-- vertical connecting line -->
		<div class="timeline-line"></div>

		{#each steps as step, i}
			<div class="step" style="--delay: {i * 0.1}s">
				<!-- glowing step number -->
				<div class="step-marker">
					<div class="step-number-ring">
						<span class="step-number">{step.number}</span>
					</div>
					<!-- glow pulse behind the marker -->
					<div class="step-glow"></div>
				</div>

				<!-- step content card -->
				<div class="step-card">
					<div class="step-icon">
						{#if step.icon === 'upload'}
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
								<polyline points="17,8 12,3 7,8" />
								<line x1="12" y1="3" x2="12" y2="15" />
							</svg>
						{:else if step.icon === 'clipboard'}
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
								/>
								<rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
							</svg>
						{:else if step.icon === 'zap'}
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
							</svg>
						{:else if step.icon === 'check'}
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
								<polyline points="22,4 12,14.01 9,11.01" />
							</svg>
						{/if}
					</div>
					<div class="step-text">
						<h3>{step.title}</h3>
						<p>{step.description}</p>
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>

<style>
	.how-it-works {
		padding: 8rem 2rem;
		max-width: 1100px;
		margin: 0 auto;
	}

	.section-header {
		text-align: center;
		margin-bottom: 5rem;
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

	.steps-container {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	/* vertical timeline connector */
	.timeline-line {
		position: absolute;
		left: 28px;
		top: 32px;
		bottom: 32px;
		width: 2px;
		background: linear-gradient(
			to bottom,
			rgba(6, 182, 212, 0.4),
			rgba(59, 130, 246, 0.4),
			rgba(139, 92, 246, 0.4),
			rgba(6, 182, 212, 0.1)
		);
		border-radius: 1px;
	}

	.step {
		position: relative;
		display: flex;
		gap: 2rem;
		padding: 1.5rem 0;
		align-items: flex-start;
	}

	.step-marker {
		position: relative;
		flex-shrink: 0;
		z-index: 2;
	}

	.step-number-ring {
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: rgba(6, 182, 212, 0.1);
		border: 2px solid rgba(6, 182, 212, 0.3);
		position: relative;
		z-index: 2;
	}

	.step-number {
		font-size: 1rem;
		font-weight: 800;
		background: var(--gradient-primary);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.step-glow {
		position: absolute;
		inset: -4px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(6, 182, 212, 0.15), transparent 70%);
		z-index: 1;
	}

	.step-card {
		flex: 1;
		display: flex;
		gap: 1.25rem;
		padding: 1.75rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
		transition:
			border-color 0.3s ease,
			transform 0.2s ease;
	}

	.step-card:hover {
		border-color: rgba(6, 182, 212, 0.2);
		transform: translateX(4px);
	}

	.step-icon {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-md);
		background: rgba(6, 182, 212, 0.1);
		color: var(--accent-cyan);
	}

	.step-text h3 {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.4rem;
		letter-spacing: -0.01em;
	}

	.step-text p {
		font-size: 0.92rem;
		color: var(--text-secondary);
		line-height: 1.6;
	}

	@media (max-width: 640px) {
		.how-it-works {
			padding: 5rem 1.5rem;
		}

		.timeline-line {
			left: 20px;
		}

		.step-number-ring {
			width: 40px;
			height: 40px;
		}

		.step-number {
			font-size: 0.85rem;
		}

		.step-card {
			flex-direction: column;
			gap: 1rem;
		}

		.step {
			gap: 1.25rem;
		}
	}
</style>
