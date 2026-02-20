<script lang="ts">
	import { onMount } from 'svelte';

	let sectionEl: HTMLElement;
	let scrollProgress = $state(0);
	let mounted = $state(false);

	onMount(() => {
		mounted = true;

		const onScroll = () => {
			if (!sectionEl) return;
			const rect = sectionEl.getBoundingClientRect();
			const viewH = window.innerHeight;
			const raw = (viewH - rect.top) / (viewH + rect.height * 0.5);
			scrollProgress = Math.min(Math.max(raw, 0), 1);
		};

		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener('scroll', onScroll);
	});

	function lerp(start: number, end: number, t: number): number {
		return start + (end - start) * Math.min(Math.max(t, 0), 1);
	}

	// map scroll to lid rotation (closed = -30deg, open = 0deg)
	const lidRotate = $derived(lerp(-30, 0, (scrollProgress - 0.05) / 0.35));
	// scale up as it enters
	const scale = $derived(lerp(0.7, 1, scrollProgress / 0.4));
	// fade in
	const opacity = $derived(lerp(0, 1, scrollProgress / 0.15));
	// glow intensity increases as lid opens
	const glowOpacity = $derived(lerp(0, 0.4, (scrollProgress - 0.2) / 0.3));
</script>

<section bind:this={sectionEl} class="macbook-section" class:mounted>
	<div class="macbook-sticky">
		<div class="macbook-wrapper" style="transform: scale({scale}); opacity: {opacity};">
			<!-- screen glow behind laptop -->
			<div class="screen-glow" style="opacity: {glowOpacity};"></div>

			<!-- lid (screen) -->
			<div class="macbook-lid" style="transform: perspective(1200px) rotateX({lidRotate}deg);">
				<div class="lid-screen">
					<!-- mock scanner UI inside the screen -->
					<div class="screen-content">
						<div class="mock-header">
							<div class="mock-dots">
								<span class="dot red"></span>
								<span class="dot yellow"></span>
								<span class="dot green"></span>
							</div>
							<span class="mock-url">ats-screener.pages.dev/scanner</span>
						</div>
						<div class="mock-body">
							<div class="mock-title-bar">
								<div class="mock-badge"></div>
								<div class="mock-title-text"></div>
							</div>
							<div class="mock-scores">
								<div class="mock-score-card" style="--score-color: #06b6d4;">
									<span class="mock-system">Workday</span>
									<span class="mock-value" style="color: #22c55e;">92</span>
								</div>
								<div class="mock-score-card" style="--score-color: #ef4444;">
									<span class="mock-system">Taleo</span>
									<span class="mock-value" style="color: #eab308;">68</span>
								</div>
								<div class="mock-score-card" style="--score-color: #3b82f6;">
									<span class="mock-system">iCIMS</span>
									<span class="mock-value" style="color: #22c55e;">87</span>
								</div>
								<div class="mock-score-card" style="--score-color: #22c55e;">
									<span class="mock-system">Greenhouse</span>
									<span class="mock-value" style="color: #22c55e;">84</span>
								</div>
								<div class="mock-score-card" style="--score-color: #8b5cf6;">
									<span class="mock-system">Lever</span>
									<span class="mock-value" style="color: #22c55e;">81</span>
								</div>
								<div class="mock-score-card" style="--score-color: #f59e0b;">
									<span class="mock-system">SAP SF</span>
									<span class="mock-value" style="color: #eab308;">76</span>
								</div>
							</div>
							<div class="mock-bars">
								{#each [85, 68, 92, 80, 78, 73] as val, i}
									<div class="mock-bar">
										<div
											class="mock-bar-fill"
											style="width: {val}%; animation-delay: {i * 0.1}s;"
										></div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
				<!-- screen bezel bottom with notch -->
				<div class="lid-chin">
					<div class="camera-notch"></div>
				</div>
			</div>

			<!-- base (keyboard area) -->
			<div class="macbook-base">
				<div class="base-surface">
					<div class="keyboard-area"></div>
					<div class="trackpad"></div>
				</div>
				<div class="base-front-edge"></div>
			</div>
		</div>
	</div>
</section>

<style>
	.macbook-section {
		position: relative;
		height: 140vh;
		margin-top: -2rem;
	}

	.macbook-sticky {
		position: sticky;
		top: 10vh;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding: 0 2rem;
	}

	.macbook-wrapper {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		will-change: transform, opacity;
	}

	/* glow behind the screen */
	.screen-glow {
		position: absolute;
		width: 80%;
		height: 60%;
		top: -20%;
		left: 10%;
		background: radial-gradient(
			ellipse,
			rgba(6, 182, 212, 0.3),
			rgba(59, 130, 246, 0.1),
			transparent 70%
		);
		filter: blur(60px);
		pointer-events: none;
		z-index: 0;
	}

	/* lid */
	.macbook-lid {
		position: relative;
		z-index: 2;
		width: min(680px, 85vw);
		transform-origin: bottom center;
		transform-style: preserve-3d;
		will-change: transform;
		backface-visibility: hidden;
	}

	.lid-screen {
		background: #0a0a0f;
		border: 2px solid #1a1a25;
		border-bottom: none;
		border-radius: 12px 12px 0 0;
		padding: 6px;
		overflow: hidden;
	}

	.lid-chin {
		height: 12px;
		background: linear-gradient(180deg, #1a1a25, #141420);
		border-radius: 0 0 4px 4px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.camera-notch {
		width: 48px;
		height: 4px;
		background: #222233;
		border-radius: 2px;
	}

	/* mock screen content */
	.screen-content {
		background: #08080d;
		border-radius: 8px;
		overflow: hidden;
	}

	.mock-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.03);
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.mock-dots {
		display: flex;
		gap: 4px;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}

	.dot.red {
		background: #ff5f57;
	}
	.dot.yellow {
		background: #febc2e;
	}
	.dot.green {
		background: #28c840;
	}

	.mock-url {
		font-size: 0.5rem;
		color: var(--text-tertiary);
		opacity: 0.5;
		font-family: monospace;
	}

	.mock-body {
		padding: 1rem;
	}

	.mock-title-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.mock-badge {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent-cyan);
		opacity: 0.5;
	}

	.mock-title-text {
		width: 120px;
		height: 8px;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 4px;
	}

	.mock-scores {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.4rem;
		margin-bottom: 0.75rem;
	}

	.mock-score-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		padding: 0.4rem 0.2rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 6px;
	}

	.mock-system {
		font-size: 0.4rem;
		color: var(--text-tertiary);
		opacity: 0.5;
	}

	.mock-value {
		font-size: 0.8rem;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	.mock-bars {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.mock-bar {
		height: 3px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 2px;
		overflow: hidden;
	}

	.mock-bar-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--accent-cyan), rgba(59, 130, 246, 0.6));
		border-radius: 2px;
		opacity: 0.4;
	}

	/* base */
	.macbook-base {
		position: relative;
		z-index: 1;
		width: min(720px, 90vw);
	}

	.base-surface {
		background: linear-gradient(180deg, #1a1a25 0%, #141420 100%);
		border-radius: 0 0 8px 8px;
		padding: 0.5rem 2rem 0.75rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
	}

	.keyboard-area {
		width: 90%;
		height: 4px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 2px;
	}

	.trackpad {
		width: 30%;
		height: 6px;
		background: rgba(255, 255, 255, 0.04);
		border-radius: 3px;
	}

	.base-front-edge {
		height: 3px;
		background: linear-gradient(180deg, #111118, #0d0d14);
		border-radius: 0 0 12px 12px;
	}

	@media (max-width: 640px) {
		.macbook-section {
			height: 120vh;
		}

		.mock-scores {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
