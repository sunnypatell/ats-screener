<script lang="ts">
	// landing page - will be built out in feature/ui-landing
</script>

<main class="landing">
	<section class="hero">
		<div class="container">
			<h1 class="hero-title">
				stop guessing your
				<span class="gradient-text">ATS score</span>
			</h1>
			<p class="hero-subtitle">
				free resume screener that simulates real HCMS platforms.
				accurate scores for Workday, Taleo, Greenhouse, iCIMS, Lever, and SuccessFactors.
			</p>
			<a href="/scanner" class="cta-button">
				scan your resume
			</a>
		</div>
	</section>
</main>

<style>
	.landing {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.hero {
		text-align: center;
		padding: var(--space-16) 0;
	}

	.hero-title {
		font-size: var(--text-6xl);
		font-weight: var(--weight-bold);
		letter-spacing: -0.03em;
		margin-bottom: var(--space-6);
	}

	.gradient-text {
		background: var(--gradient-primary);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-subtitle {
		font-size: var(--text-xl);
		color: var(--text-secondary);
		max-width: 600px;
		margin: 0 auto var(--space-10);
		line-height: var(--leading-relaxed);
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		padding: var(--space-4) var(--space-8);
		background: var(--gradient-primary);
		color: white;
		font-weight: var(--weight-semibold);
		font-size: var(--text-lg);
		border-radius: var(--radius-lg);
		transition: all var(--duration-normal) var(--ease-out-expo);
		box-shadow: var(--glow-accent);
	}

	.cta-button:hover {
		transform: translateY(-2px);
		box-shadow: var(--glow-accent), var(--shadow-lg);
		color: white;
	}

	@media (max-width: 768px) {
		.hero-title {
			font-size: var(--text-4xl);
		}

		.hero-subtitle {
			font-size: var(--text-base);
		}
	}
</style>
