<script lang="ts">
	const features = [
		{
			icon: '🎯',
			title: 'real ATS simulation',
			description:
				'scores your resume against 6 actual ATS systems used by Fortune 500 companies. not a generic algorithm.'
		},
		{
			icon: '🔍',
			title: 'keyword intelligence',
			description:
				'exact, fuzzy, and semantic matching strategies that mirror how each system actually filters resumes.'
		},
		{
			icon: '📊',
			title: 'detailed breakdown',
			description:
				'see exactly why each system scores you the way it does. formatting, keywords, sections, experience, education.'
		},
		{
			icon: '🤖',
			title: 'AI-powered suggestions',
			description:
				'Gemini-powered analysis gives you specific, actionable tips. falls back to rule-based when offline.'
		},
		{
			icon: '🌍',
			title: 'any industry',
			description:
				'works for tech, finance, healthcare, marketing, legal, operations, education, and more. not just software.'
		},
		{
			icon: '💰',
			title: 'actually free',
			description:
				'no sign-up, no paywall, no "premium tier". everything runs client-side or on free infrastructure.'
		}
	];

	// per-card mouse position for independent spotlight effects
	let mousePositions = $state<Record<number, { x: number; y: number }>>({});

	function handleCardMouseMove(e: MouseEvent, index: number) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		mousePositions[index] = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
	}
</script>

<section class="features" id="features">
	<div class="features-header">
		<h2 class="section-title">not another fake ATS score</h2>
		<p class="section-description">
			most ATS screeners use arbitrary algorithms with no connection to real systems. this one
			simulates what actually happens to your resume.
		</p>
	</div>

	<div class="features-grid">
		{#each features as feature, i}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="feature-card"
				onmousemove={(e) => handleCardMouseMove(e, i)}
				style="--spotlight-x: {mousePositions[i]?.x ?? 0}px; --spotlight-y: {mousePositions[i]?.y ??
					0}px;"
			>
				<div class="feature-spotlight"></div>
				<div class="feature-content">
					<span class="feature-icon">{feature.icon}</span>
					<h3>{feature.title}</h3>
					<p>{feature.description}</p>
				</div>
			</div>
		{/each}
	</div>
</section>

<style>
	.features {
		padding: 6rem 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.features-header {
		text-align: center;
		margin-bottom: 4rem;
	}

	.section-title {
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.section-description {
		font-size: 1.1rem;
		color: var(--text-secondary);
		max-width: 600px;
		margin: 0 auto;
		line-height: 1.6;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.feature-card {
		position: relative;
		padding: 2rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
		overflow: hidden;
		transition:
			border-color 0.3s ease,
			transform 0.2s ease;
	}

	.feature-card:hover {
		border-color: rgba(6, 182, 212, 0.2);
		transform: translateY(-2px);
	}

	.feature-spotlight {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			300px circle at var(--spotlight-x) var(--spotlight-y),
			rgba(6, 182, 212, 0.06),
			transparent 60%
		);
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.feature-card:hover .feature-spotlight {
		opacity: 1;
	}

	.feature-content {
		position: relative;
		z-index: 1;
	}

	.feature-icon {
		font-size: 2rem;
		display: block;
		margin-bottom: 1rem;
	}

	.feature-content h3 {
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.feature-content p {
		font-size: 0.95rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	@media (max-width: 640px) {
		.features {
			padding: 4rem 1.5rem;
		}

		.features-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
