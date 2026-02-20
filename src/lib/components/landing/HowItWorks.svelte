<script lang="ts">
	const steps = [
		{
			number: '01',
			title: 'upload your resume',
			description:
				'PDF or DOCX. everything is parsed client-side. your file never leaves your browser.'
		},
		{
			number: '02',
			title: 'optionally add a job description',
			description:
				'paste the JD for targeted scoring. without it, you get a general ATS-readiness score.'
		},
		{
			number: '03',
			title: 'get scored by 6 systems',
			description:
				'Workday, Taleo, iCIMS, Greenhouse, Lever, SuccessFactors. each with different weights and strategies.'
		},
		{
			number: '04',
			title: 'see what to fix',
			description:
				'detailed breakdown per system: formatting, keywords, sections, experience, education. plus actionable suggestions.'
		}
	];
</script>

<section class="how-it-works">
	<div class="section-header">
		<h2 class="section-title">how it works</h2>
	</div>

	<div class="steps">
		{#each steps as step, i}
			<div class="step" style="--delay: {i * 0.1}s">
				<div class="step-number">{step.number}</div>
				<div class="step-content">
					<h3>{step.title}</h3>
					<p>{step.description}</p>
				</div>
				{#if i < steps.length - 1}
					<div class="step-connector"></div>
				{/if}
			</div>
		{/each}
	</div>
</section>

<style>
	.how-it-works {
		padding: 6rem 2rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.section-header {
		text-align: center;
		margin-bottom: 4rem;
	}

	.section-title {
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		font-weight: 700;
		color: var(--text-primary);
	}

	.steps {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.step {
		position: relative;
		display: flex;
		gap: 1.5rem;
		padding: 2rem 0;
	}

	.step-number {
		flex-shrink: 0;
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		font-weight: 700;
		color: var(--accent-cyan);
		background: rgba(6, 182, 212, 0.1);
		border: 1px solid rgba(6, 182, 212, 0.2);
		border-radius: var(--radius-md);
	}

	.step-content h3 {
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.step-content p {
		font-size: 0.95rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.step-connector {
		position: absolute;
		left: 1.5rem;
		top: 5rem;
		width: 1px;
		height: calc(100% - 5rem + 2rem);
		background: linear-gradient(to bottom, rgba(6, 182, 212, 0.3), transparent);
	}

	@media (max-width: 640px) {
		.how-it-works {
			padding: 4rem 1.5rem;
		}
	}
</style>
