<script lang="ts">
	import { onMount } from 'svelte';
	import FlipWords from '$components/ui/FlipWords.svelte';
	import SparklesText from '$components/ui/SparklesText.svelte';
	import NumberTicker from '$components/ui/NumberTicker.svelte';
	import TextGenerateEffect from '$components/ui/TextGenerateEffect.svelte';
	import MovingBorder from '$components/ui/MovingBorder.svelte';

	// delays fade-in until hydrated to prevent flash
	let mounted = $state(false);
	// mouse position as % for the radial glow gradient
	let mouseX = $state(50);
	let mouseY = $state(50);

	onMount(() => {
		mounted = true;
	});

	// converts pixel coords to percentage of hero bounds for the glow
	function handleMouseMove(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		mouseX = ((e.clientX - rect.left) / rect.width) * 100;
		mouseY = ((e.clientY - rect.top) / rect.height) * 100;
	}

	// ATS system names for the FlipWords component
	const systems = ['Workday', 'Taleo', 'iCIMS', 'Greenhouse', 'Lever', 'SuccessFactors'];
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<section class="hero" class:mounted onmousemove={handleMouseMove}>
	<!-- animated mesh gradient background orbs -->
	<div class="hero-bg">
		<div class="mesh-orb orb-1"></div>
		<div class="mesh-orb orb-2"></div>
		<div class="mesh-orb orb-3"></div>
	</div>

	<!-- mouse-following glow -->
	<div class="hero-glow" style="--mx: {mouseX}%; --my: {mouseY}%;"></div>

	<!-- grid pattern overlay for depth -->
	<div class="grid-overlay"></div>

	<!-- floating particles -->
	<div class="particles" aria-hidden="true">
		{#each Array(6) as _, i}
			<div class="particle" style="--i: {i}"></div>
		{/each}
	</div>

	<div class="hero-content">
		<!-- trust badge -->
		<div class="badge">
			<span class="badge-dot"></span>
			<span>Free Forever &bull; No Sign-Up &bull; No Limits</span>
		</div>

		<!-- main heading with sparkles effect on the gradient text -->
		<h1 class="hero-title">
			Your Resume vs.
			<br />
			<SparklesText>
				<span class="gradient-text animated-gradient">Real ATS Systems</span>
			</SparklesText>
		</h1>

		<!-- description with FlipWords cycling through ATS names -->
		<p class="hero-description">
			<TextGenerateEffect
				text="See exactly how"
				delay={400}
			/>
			<strong class="flip-system"><FlipWords words={systems} interval={2200} /></strong>
			<TextGenerateEffect
				text="and 5 other enterprise platforms parse, filter, and score your resume. Powered by researched ATS profiles, not generic algorithms."
				delay={600}
			/>
		</p>

		<!-- CTA buttons -->
		<div class="hero-actions">
			<a href="/scanner" class="btn-primary">
				<span class="btn-shimmer"></span>
				<svg
					width="20"
					height="20"
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
				Scan Your Resume
			</a>
			<a href="#features" class="btn-secondary-link">
				Learn How It Works
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M6 9l6 6 6-6" />
				</svg>
			</a>
		</div>

		<!-- floating score preview cards with MovingBorder and NumberTicker -->
		<div class="score-preview">
			<MovingBorder borderRadius="12px" duration={4000}>
				<div class="preview-card-inner">
					<span class="preview-system">Workday</span>
					<span class="preview-score score-high">
						<NumberTicker value={92} delay={800} duration={1500} />
					</span>
				</div>
			</MovingBorder>
			<MovingBorder borderRadius="12px" duration={5000}>
				<div class="preview-card-inner">
					<span class="preview-system">Taleo</span>
					<span class="preview-score score-mid">
						<NumberTicker value={74} delay={1200} duration={1500} />
					</span>
				</div>
			</MovingBorder>
			<MovingBorder borderRadius="12px" duration={3500}>
				<div class="preview-card-inner">
					<span class="preview-system">Greenhouse</span>
					<span class="preview-score score-high">
						<NumberTicker value={88} delay={1000} duration={1500} />
					</span>
				</div>
			</MovingBorder>
		</div>

		<!-- stats strip with animated number tickers -->
		<div class="hero-stats">
			<div class="stat">
				<span class="stat-number">
					<NumberTicker value={6} delay={1400} duration={800} />
				</span>
				<span class="stat-label">ATS Platforms</span>
			</div>
			<div class="stat-divider"></div>
			<div class="stat">
				<span class="stat-number">
					<NumberTicker value={100} delay={1600} duration={1000} suffix="%" />
				</span>
				<span class="stat-label">Free & Open Source</span>
			</div>
			<div class="stat-divider"></div>
			<div class="stat">
				<span class="stat-number">Any</span>
				<span class="stat-label">Industry or Role</span>
			</div>
			<div class="stat-divider"></div>
			<div class="stat">
				<span class="stat-number">
					<NumberTicker value={0} delay={1800} duration={600} />
				</span>
				<span class="stat-label">Data Sent to Servers</span>
			</div>
		</div>
	</div>
</section>

<style>
	.hero {
		position: relative;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 7rem 2rem 4rem;
		overflow: hidden;
	}

	/* animated mesh gradient orbs for the background */
	.hero-bg {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.mesh-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(100px);
		animation: float 20s ease-in-out infinite;
	}

	.orb-1 {
		width: 600px;
		height: 600px;
		background: rgba(6, 182, 212, 0.12);
		top: -10%;
		left: -10%;
		animation-delay: 0s;
	}

	.orb-2 {
		width: 500px;
		height: 500px;
		background: rgba(59, 130, 246, 0.1);
		top: 40%;
		right: -15%;
		animation-delay: -7s;
	}

	.orb-3 {
		width: 400px;
		height: 400px;
		background: rgba(139, 92, 246, 0.08);
		bottom: -10%;
		left: 30%;
		animation-delay: -14s;
	}

	@keyframes float {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		25% {
			transform: translate(30px, -40px) scale(1.05);
		}
		50% {
			transform: translate(-20px, 20px) scale(0.95);
		}
		75% {
			transform: translate(15px, 30px) scale(1.02);
		}
	}

	/* floating particles for ambient depth */
	.particles {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.particle {
		position: absolute;
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: rgba(6, 182, 212, 0.3);
		animation: particle-float 15s ease-in-out infinite;
		animation-delay: calc(var(--i) * -2.5s);
		left: calc(15% + var(--i) * 12%);
		top: calc(20% + var(--i) * 8%);
	}

	@keyframes particle-float {
		0%, 100% {
			transform: translateY(0) translateX(0);
			opacity: 0;
		}
		10% {
			opacity: 1;
		}
		50% {
			transform: translateY(-80px) translateX(30px);
			opacity: 0.5;
		}
		90% {
			opacity: 0;
		}
	}

	/* subtle grid pattern for enterprise depth */
	.grid-overlay {
		position: absolute;
		inset: 0;
		background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
		background-size: 60px 60px;
		mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent);
		pointer-events: none;
	}

	.hero-glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			800px circle at var(--mx, 50%) var(--my, 50%),
			rgba(6, 182, 212, 0.06),
			transparent 50%
		);
		transition: background 0.3s ease;
		pointer-events: none;
	}

	.hero-content {
		position: relative;
		max-width: 900px;
		text-align: center;
		opacity: 0;
		transform: translateY(40px);
		transition:
			opacity 1s cubic-bezier(0.16, 1, 0.3, 1),
			transform 1s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.mounted .hero-content {
		opacity: 1;
		transform: translateY(0);
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem 1.25rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-full);
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin-bottom: 2.5rem;
		backdrop-filter: blur(12px);
		letter-spacing: 0.02em;
	}

	.badge-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--accent-green);
		box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
			box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
		}
		50% {
			opacity: 0.7;
			box-shadow: 0 0 16px rgba(16, 185, 129, 0.3);
		}
	}

	.hero-title {
		font-size: clamp(2.75rem, 8vw, 5.5rem);
		font-weight: 800;
		line-height: 1.05;
		margin-bottom: 1.75rem;
		letter-spacing: -0.035em;
		color: var(--text-primary);
	}

	.gradient-text {
		background: var(--gradient-primary);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.animated-gradient {
		background-size: 200% auto;
		animation: gradient-shift 4s ease infinite;
	}

	@keyframes gradient-shift {
		0% {
			background-position: 0% center;
		}
		50% {
			background-position: 100% center;
		}
		100% {
			background-position: 0% center;
		}
	}

	.hero-description {
		font-size: clamp(1.05rem, 2vw, 1.3rem);
		color: var(--text-secondary);
		max-width: 640px;
		margin: 0 auto 2.5rem;
		line-height: 1.7;
	}

	.flip-system {
		color: var(--accent-cyan);
		font-weight: 700;
	}

	.hero-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		margin-bottom: 3.5rem;
	}

	.btn-primary {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		padding: 1rem 2.25rem;
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--color-bg-primary);
		background: var(--gradient-primary);
		border: none;
		border-radius: var(--radius-lg);
		cursor: pointer;
		text-decoration: none;
		overflow: hidden;
		transition:
			transform 0.25s ease,
			box-shadow 0.25s ease;
	}

	.btn-primary:hover {
		transform: translateY(-3px);
		box-shadow:
			0 0 40px rgba(6, 182, 212, 0.35),
			0 0 80px rgba(59, 130, 246, 0.15);
		color: var(--color-bg-primary);
	}

	.btn-shimmer {
		position: absolute;
		inset: 0;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		animation: shimmer 3s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	.btn-secondary-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 1rem 1.5rem;
		font-size: 1rem;
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		border-radius: var(--radius-lg);
		transition: color 0.2s ease;
	}

	.btn-secondary-link:hover {
		color: var(--text-primary);
	}

	/* floating score preview cards with moving border effect */
	.score-preview {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.preview-card-inner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.85rem 1.5rem;
		backdrop-filter: blur(16px);
	}

	.preview-system {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.preview-score {
		font-size: 1.35rem;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	.score-high {
		color: #22c55e;
	}

	.score-mid {
		color: #eab308;
	}

	.hero-stats {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2.5rem;
		padding: 1.5rem 2.5rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.stat-number {
		font-size: 1.5rem;
		font-weight: 800;
		background: var(--gradient-primary);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.stat-label {
		font-size: 0.78rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 500;
	}

	.stat-divider {
		width: 1px;
		height: 2.5rem;
		background: var(--glass-border);
	}

	@media (max-width: 768px) {
		.hero {
			padding: 5rem 1.5rem 3rem;
		}

		.hero-actions {
			flex-direction: column;
			gap: 1rem;
		}

		.score-preview {
			flex-direction: column;
			align-items: center;
			gap: 0.75rem;
		}

		.hero-stats {
			flex-direction: column;
			gap: 1.25rem;
			padding: 1.5rem;
		}

		.stat-divider {
			width: 3rem;
			height: 1px;
		}

		.particles {
			display: none;
		}
	}
</style>
