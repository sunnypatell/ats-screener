<script lang="ts">
	import { onMount } from 'svelte';

	// delays fade-in until hydrated to prevent flash
	let mounted = $state(false);
	// mouse position as % for the radial glow gradient
	let mouseX = $state(0);
	let mouseY = $state(0);

	onMount(() => {
		mounted = true;
	});

	// converts pixel coords to percentage of hero bounds for the glow
	function handleMouseMove(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		mouseX = ((e.clientX - rect.left) / rect.width) * 100;
		mouseY = ((e.clientY - rect.top) / rect.height) * 100;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<section class="hero" class:mounted onmousemove={handleMouseMove}>
	<div class="hero-glow" style="--mx: {mouseX}%; --my: {mouseY}%;"></div>

	<div class="hero-content">
		<div class="badge">
			<span class="badge-dot"></span>
			free forever. no sign-up. no limits.
		</div>

		<h1 class="hero-title">
			<span class="gradient-text">Beat the ATS.</span>
			<br />
			Get Interviewed.
		</h1>

		<p class="hero-description">
			simulate how Workday, Taleo, iCIMS, Greenhouse, Lever, and SuccessFactors actually parse your
			resume. get a real score, not a made-up number.
		</p>

		<div class="hero-actions">
			<a href="/scanner" class="btn-primary">
				<span class="btn-shimmer"></span>
				scan your resume
			</a>
		</div>

		<div class="hero-stats">
			<div class="stat">
				<span class="stat-number">6</span>
				<span class="stat-label">ATS systems</span>
			</div>
			<div class="stat-divider"></div>
			<div class="stat">
				<span class="stat-number">100%</span>
				<span class="stat-label">free</span>
			</div>
			<div class="stat-divider"></div>
			<div class="stat">
				<span class="stat-number">any</span>
				<span class="stat-label">industry</span>
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
		padding: 6rem 2rem 4rem;
		overflow: hidden;
	}

	.hero-glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			600px circle at var(--mx, 50%) var(--my, 50%),
			rgba(6, 182, 212, 0.08),
			transparent 60%
		);
		transition: background 0.3s ease;
		pointer-events: none;
	}

	.hero-content {
		position: relative;
		max-width: 800px;
		text-align: center;
		opacity: 0;
		transform: translateY(30px);
		transition:
			opacity 0.8s ease,
			transform 0.8s ease;
	}

	.mounted .hero-content {
		opacity: 1;
		transform: translateY(0);
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: 999px;
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin-bottom: 2rem;
		backdrop-filter: blur(12px);
	}

	.badge-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent-cyan);
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
			box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4);
		}
		50% {
			opacity: 0.8;
			box-shadow: 0 0 0 6px rgba(6, 182, 212, 0);
		}
	}

	.hero-title {
		font-size: clamp(2.5rem, 8vw, 5rem);
		font-weight: 800;
		line-height: 1.1;
		margin-bottom: 1.5rem;
		letter-spacing: -0.03em;
		color: var(--text-primary);
	}

	.gradient-text {
		background: var(--gradient-primary);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-description {
		font-size: clamp(1rem, 2vw, 1.25rem);
		color: var(--text-secondary);
		max-width: 600px;
		margin: 0 auto 2.5rem;
		line-height: 1.6;
	}

	.hero-actions {
		margin-bottom: 3rem;
	}

	.btn-primary {
		position: relative;
		display: inline-flex;
		align-items: center;
		padding: 1rem 2.5rem;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-bg-primary);
		background: var(--gradient-primary);
		border: none;
		border-radius: var(--radius-lg);
		cursor: pointer;
		text-decoration: none;
		overflow: hidden;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow:
			0 0 30px rgba(6, 182, 212, 0.3),
			0 0 60px rgba(59, 130, 246, 0.15);
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

	.hero-stats {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		padding: 1.5rem 2rem;
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
		font-weight: 700;
		color: var(--accent-cyan);
	}

	.stat-label {
		font-size: 0.8rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-divider {
		width: 1px;
		height: 2.5rem;
		background: var(--glass-border);
	}

	@media (max-width: 640px) {
		.hero {
			padding: 4rem 1.5rem 3rem;
		}

		.hero-stats {
			flex-direction: column;
			gap: 1rem;
		}

		.stat-divider {
			width: 3rem;
			height: 1px;
		}
	}
</style>
