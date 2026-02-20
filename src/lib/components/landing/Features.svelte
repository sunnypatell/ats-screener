<script lang="ts">
	// SVG icon paths for each feature card
	const features = [
		{
			icon: 'target',
			title: 'Real ATS Simulation',
			description:
				'Scores your resume against 6 actual ATS platforms used by Fortune 500 companies. Researched profiles, not generic algorithms.',
			gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)'
		},
		{
			icon: 'search',
			title: 'Keyword Intelligence',
			description:
				'Exact, fuzzy, and semantic matching strategies that mirror how each system actually filters and ranks resumes.',
			gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
		},
		{
			icon: 'chart',
			title: 'Detailed Breakdown',
			description:
				'See exactly why each system scores you the way it does. Formatting, keywords, sections, experience, and education.',
			gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)'
		},
		{
			icon: 'sparkles',
			title: 'AI-Powered Suggestions',
			description:
				'Gemini-powered analysis gives you specific, actionable tips tailored to each ATS. Rule-based fallback when offline.',
			gradient: 'linear-gradient(135deg, #ec4899, #f97316)'
		},
		{
			icon: 'globe',
			title: 'Any Industry, Any Role',
			description:
				'Works for tech, finance, healthcare, marketing, legal, operations, education, and more. Not just software engineers.',
			gradient: 'linear-gradient(135deg, #f97316, #eab308)'
		},
		{
			icon: 'shield',
			title: 'Privacy First',
			description:
				'Everything runs client-side. Your resume never leaves your browser. No sign-up, no paywall, no data collection.',
			gradient: 'linear-gradient(135deg, #22c55e, #06b6d4)'
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
					<polygon
						points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
					/>
				</svg>
			</span>
			<span>Why ATS Screener</span>
		</div>
		<h2 class="section-title">
			Not Another Fake
			<span class="gradient-text">ATS Score</span>
		</h2>
		<p class="section-description">
			Most ATS screeners use arbitrary algorithms with no connection to real systems. This one
			simulates what actually happens to your resume inside enterprise HCMS platforms.
		</p>
	</div>

	<div class="features-grid">
		{#each features as feature, i}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="feature-card"
				onmousemove={(e) => handleCardMouseMove(e, i)}
				style="--spotlight-x: {mousePositions[i]?.x ?? 0}px; --spotlight-y: {mousePositions[i]?.y ??
					0}px; --card-gradient: {feature.gradient}; --delay: {i * 0.08}s;"
			>
				<!-- animated border glow on hover -->
				<div class="card-border-glow"></div>
				<div class="card-spotlight"></div>

				<div class="feature-content">
					<!-- SVG icon with gradient background -->
					<div class="feature-icon-wrapper">
						{#if feature.icon === 'target'}
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
							>
								<circle cx="12" cy="12" r="10" />
								<circle cx="12" cy="12" r="6" />
								<circle cx="12" cy="12" r="2" />
							</svg>
						{:else if feature.icon === 'search'}
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
							>
								<circle cx="11" cy="11" r="8" />
								<path d="m21 21-4.35-4.35" />
								<path d="M11 8v6" />
								<path d="M8 11h6" />
							</svg>
						{:else if feature.icon === 'chart'}
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
							>
								<path d="M18 20V10" />
								<path d="M12 20V4" />
								<path d="M6 20v-6" />
							</svg>
						{:else if feature.icon === 'sparkles'}
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
							>
								<path
									d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
								/>
								<path d="M5 3v4" />
								<path d="M19 17v4" />
								<path d="M3 5h4" />
								<path d="M17 19h4" />
							</svg>
						{:else if feature.icon === 'globe'}
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
							>
								<circle cx="12" cy="12" r="10" />
								<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
								<path d="M2 12h20" />
							</svg>
						{:else if feature.icon === 'shield'}
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
							>
								<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
								<path d="m9 12 2 2 4-4" />
							</svg>
						{/if}
					</div>

					<h3 class="feature-title">{feature.title}</h3>
					<p class="feature-desc">{feature.description}</p>
				</div>
			</div>
		{/each}
	</div>
</section>

<style>
	.features {
		padding: 8rem 2rem;
		max-width: 1200px;
		margin: 0 auto;
		position: relative;
	}

	.features-header {
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
		margin-bottom: 1.25rem;
		letter-spacing: -0.03em;
		line-height: 1.15;
	}

	.gradient-text {
		background: var(--gradient-primary);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.section-description {
		font-size: clamp(1rem, 2vw, 1.2rem);
		color: var(--text-secondary);
		max-width: 640px;
		margin: 0 auto;
		line-height: 1.7;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
	}

	.feature-card {
		position: relative;
		padding: 2.25rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
		overflow: hidden;
		transition:
			border-color 0.3s ease,
			transform 0.25s ease,
			box-shadow 0.3s ease;
	}

	.feature-card:hover {
		border-color: rgba(6, 182, 212, 0.25);
		transform: translateY(-4px);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
	}

	/* animated border glow on hover */
	.card-border-glow {
		position: absolute;
		inset: -1px;
		border-radius: inherit;
		background: var(--card-gradient);
		opacity: 0;
		transition: opacity 0.3s ease;
		z-index: 0;
		mask:
			linear-gradient(#fff 0 0) content-box,
			linear-gradient(#fff 0 0);
		mask-composite: exclude;
		padding: 1px;
	}

	.feature-card:hover .card-border-glow {
		opacity: 0.4;
	}

	.card-spotlight {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			350px circle at var(--spotlight-x) var(--spotlight-y),
			rgba(6, 182, 212, 0.07),
			transparent 60%
		);
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.3s ease;
		z-index: 1;
	}

	.feature-card:hover .card-spotlight {
		opacity: 1;
	}

	.feature-content {
		position: relative;
		z-index: 2;
	}

	.feature-icon-wrapper {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-lg);
		background: var(--card-gradient);
		color: white;
		margin-bottom: 1.25rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.feature-title {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.6rem;
		letter-spacing: -0.01em;
	}

	.feature-desc {
		font-size: 0.92rem;
		color: var(--text-secondary);
		line-height: 1.6;
	}

	@media (max-width: 1024px) {
		.features-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 640px) {
		.features {
			padding: 5rem 1.5rem;
		}

		.features-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
