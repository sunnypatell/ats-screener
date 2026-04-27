<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import SeoHead from '$components/seo/SeoHead.svelte';

	// --- 404-specific state ---

	// glitch animation state for the giant numerals
	let glitchText = $state('404');
	let glitchActive = $state(false);

	// parallax orbs follow the mouse (404 only)
	let mouseX = $state(50);
	let mouseY = $state(50);

	// prefers-reduced-motion guard
	let reducedMotion = $state(false);

	const glitchChars = '0123456789!#$%&?@\\|/[]{}';

	function runGlitch() {
		if (reducedMotion) return;
		const target = '404';
		const totalMs = 800;
		const fps = 20;
		const intervalMs = 1000 / fps;
		const steps = Math.floor(totalMs / intervalMs);
		let tick = 0;

		glitchActive = true;
		const id = setInterval(() => {
			tick++;
			// progressively settle: early ticks are fully scrambled,
			// later ticks converge back to "404"
			const chaos = 1 - tick / steps;
			glitchText = target
				.split('')
				.map((ch) =>
					Math.random() < chaos * 0.8
						? glitchChars[Math.floor(Math.random() * glitchChars.length)]
						: ch
				)
				.join('');
			if (tick >= steps) {
				clearInterval(id);
				glitchText = target;
				glitchActive = false;
			}
		}, intervalMs);
	}

	function handleMouseMove(e: MouseEvent) {
		if (reducedMotion) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		mouseX = ((e.clientX - rect.left) / rect.width) * 100;
		mouseY = ((e.clientY - rect.top) / rect.height) * 100;
	}

	onMount(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (!reducedMotion) {
			// initial glitch after a short paint delay
			const t1 = setTimeout(runGlitch, 400);
			// repeat glitch every ~5 seconds to keep it alive
			const interval = setInterval(runGlitch, 5000);
			return () => {
				clearTimeout(t1);
				clearInterval(interval);
			};
		}
	});

	const suggestedLinks = [
		{ href: '/', label: 'Home', icon: 'home' },
		{ href: '/scanner', label: 'Scanner', icon: 'scan' },
		{ href: '/docs', label: 'Docs', icon: 'book' },
		{ href: '/about', label: 'About', icon: 'info' }
	] as const;
</script>

<SeoHead
	title="404, page not found | ATS Screener"
	description="The page you're looking for doesn't exist or has moved."
	noIndex
/>

{#if page.status === 404}
	<!-- fun themed 404: parallax orbs + glitch numerals + suggested links -->
	<main
		class="page-404"
		style="--mx: {mouseX}%; --my: {mouseY}%;"
		onmousemove={handleMouseMove}
		aria-label="404 - page not found"
	>
		<!-- parallax background orbs (disabled for prefers-reduced-motion) -->
		<div class="orb-layer" aria-hidden="true">
			<div
				class="orb orb-cyan"
				style={reducedMotion
					? ''
					: `transform: translate(calc((${mouseX}% - 50%) * -0.04), calc((${mouseY}% - 50%) * -0.04));`}
			></div>
			<div
				class="orb orb-purple"
				style={reducedMotion
					? ''
					: `transform: translate(calc((${mouseX}% - 50%) * 0.06), calc((${mouseY}% - 50%) * 0.06));`}
			></div>
			<div
				class="orb orb-blue"
				style={reducedMotion
					? ''
					: `transform: translate(calc((${mouseX}% - 50%) * -0.02), calc((${mouseY}% - 50%) * 0.03));`}
			></div>
		</div>

		<!-- grid overlay for depth -->
		<div class="grid-overlay" aria-hidden="true"></div>

		<!-- thinking bitmoji parked in the corner, gentle bob, hidden for reduced motion -->
		<img
			src="/thinking-bitmoji.png"
			alt=""
			width="180"
			height="180"
			class="bitmoji"
			class:still={reducedMotion}
			aria-hidden="true"
			decoding="async"
			loading="lazy"
		/>

		<div class="content">
			<!-- giant glitch numerals -->
			<div class="numeral-wrap" aria-label="404">
				<span class="numeral" class:glitch={glitchActive} aria-hidden="true">{glitchText}</span>
			</div>

			<p class="tagline">signal lost. resume not found.</p>

			<p class="sub">
				The page you were scanning for doesn't exist or has moved. Double-check the URL or use one
				of the links below.
			</p>

			<!-- suggested navigation links -->
			<nav class="suggested-nav" aria-label="suggested pages">
				{#each suggestedLinks as link}
					<a href={link.href} class="nav-chip">
						{#if link.icon === 'home'}
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								aria-hidden="true"
								><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline
									points="9,22 9,12 15,12 15,22"
								/></svg
							>
						{:else if link.icon === 'scan'}
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								aria-hidden="true"
								><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline
									points="14,2 14,8 20,8"
								/></svg
							>
						{:else if link.icon === 'book'}
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								aria-hidden="true"
								><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path
									d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
								/></svg
							>
						{:else}
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								aria-hidden="true"
								><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line
									x1="12"
									y1="16"
									x2="12.01"
									y2="16"
								/></svg
							>
						{/if}
						{link.label}
					</a>
				{/each}
			</nav>
		</div>
	</main>
{:else}
	<!-- professional card for 429, 500, and all other status codes -->
	<main class="error-page">
		<div class="error-bg">
			<div class="bg-orb orb-1"></div>
			<div class="bg-orb orb-2"></div>
		</div>

		<div class="error-card">
			<div class="error-status">{page.status}</div>
			<h1 class="error-title">
				{#if page.status === 429}
					Too many requests
				{:else if page.status >= 500}
					Something went wrong
				{:else}
					Unexpected error
				{/if}
			</h1>
			<p class="error-message">
				{#if page.error?.message && page.status !== 500}
					{page.error.message}
				{:else if page.status === 429}
					You've hit the rate limit. Please wait a minute and try again.
				{:else}
					An unexpected error occurred. Refreshing usually helps.
				{/if}
			</p>
			<div class="error-actions">
				<a href="/" class="btn-primary">Back to home</a>
				<a href="/scanner" class="btn-secondary">Open scanner</a>
			</div>
		</div>
	</main>
{/if}

<style>
	/* -------------------------------------------------------
	   404 fun page
	------------------------------------------------------- */
	.page-404 {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100dvh;
		padding: 6rem 1.5rem 4rem;
		overflow: hidden;
		background: var(--color-bg-primary);
	}

	.orb-layer {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}

	.orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(110px);
		transition: transform 0.12s ease-out;
		will-change: transform;
	}

	.orb-cyan {
		width: 520px;
		height: 520px;
		background: rgba(6, 182, 212, 0.1);
		top: -8%;
		left: -8%;
	}

	.orb-purple {
		width: 420px;
		height: 420px;
		background: rgba(139, 92, 246, 0.1);
		bottom: -10%;
		right: -10%;
	}

	.orb-blue {
		width: 300px;
		height: 300px;
		background: rgba(59, 130, 246, 0.08);
		top: 55%;
		left: 40%;
	}

	.grid-overlay {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
		background-size: 56px 56px;
		mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent);
		pointer-events: none;
	}

	/* thinking bitmoji parked in the bottom-right corner with a slow bob.
	   stays out of the click area on the suggested-nav chips. */
	.bitmoji {
		position: absolute;
		right: clamp(1rem, 4vw, 3rem);
		bottom: clamp(1rem, 4vw, 3rem);
		width: clamp(120px, 18vw, 200px);
		height: auto;
		filter: drop-shadow(0 12px 30px rgba(0, 0, 0, 0.45));
		animation: bitmoji-bob 4s ease-in-out infinite;
		pointer-events: none;
		user-select: none;
		z-index: 1;
	}

	.bitmoji.still {
		animation: none;
	}

	@keyframes bitmoji-bob {
		0%,
		100% {
			transform: translateY(0) rotate(-2deg);
		}
		50% {
			transform: translateY(-10px) rotate(2deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.bitmoji {
			animation: none;
		}
	}

	@media (max-width: 640px) {
		.bitmoji {
			right: 0.75rem;
			bottom: 0.75rem;
			opacity: 0.85;
		}
	}

	.content {
		position: relative;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
		max-width: 680px;
	}

	/* giant glitch numerals rendered in geist mono */
	.numeral-wrap {
		line-height: 1;
		/* visible label provided via aria-label on the wrapper */
	}

	.numeral {
		display: block;
		font-family: 'Geist Mono', 'JetBrains Mono', monospace;
		font-size: clamp(7rem, 22vw, 14rem);
		font-weight: 800;
		letter-spacing: -0.06em;
		/* gradient fill for the numerals: meets 4.5:1 on dark bg because
		   the cyan endpoint (#06b6d4) has contrast 5.1:1 against #0a0a0f */
		background: linear-gradient(135deg, #06b6d4 0%, #818cf8 55%, #a78bfa 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		user-select: none;
	}

	.numeral.glitch {
		/* brief horizontal jitter on glitch frames */
		animation: glitch-jitter 0.05s steps(1) infinite;
	}

	@keyframes glitch-jitter {
		0% {
			text-shadow:
				2px 0 rgba(6, 182, 212, 0.5),
				-2px 0 rgba(167, 139, 250, 0.5);
			transform: translateX(0);
		}
		25% {
			text-shadow:
				-3px 0 rgba(6, 182, 212, 0.6),
				3px 0 rgba(167, 139, 250, 0.4);
			transform: translateX(2px);
		}
		50% {
			text-shadow:
				3px 0 rgba(6, 182, 212, 0.4),
				-1px 0 rgba(167, 139, 250, 0.6);
			transform: translateX(-1px);
		}
		75% {
			text-shadow:
				-2px 0 rgba(6, 182, 212, 0.5),
				2px 0 rgba(167, 139, 250, 0.5);
			transform: translateX(1px);
		}
		100% {
			text-shadow: none;
			transform: translateX(0);
		}
	}

	/* text-shadow does not affect -webkit-text-fill-color; the jitter is
	   still visible as a subtle chromatic-aberration halo around the edges */
	@media (prefers-reduced-motion: reduce) {
		.numeral.glitch {
			animation: none;
		}
	}

	.tagline {
		font-family: 'Geist Mono', 'JetBrains Mono', monospace;
		font-size: clamp(0.8rem, 1.8vw, 1rem);
		color: var(--accent-cyan);
		text-transform: uppercase;
		letter-spacing: 0.18em;
		font-weight: 600;
		opacity: 0.85;
		margin: 0;
	}

	.sub {
		font-size: clamp(0.9rem, 1.6vw, 1rem);
		color: var(--text-secondary);
		line-height: 1.65;
		max-width: 480px;
		margin: 0;
	}

	/* suggested navigation chips */
	.suggested-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		justify-content: center;
		margin-top: 0.5rem;
	}

	.nav-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.55rem 1.1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-full);
		text-decoration: none;
		transition:
			color 0.2s ease,
			border-color 0.2s ease,
			transform 0.2s ease,
			box-shadow 0.2s ease;
		backdrop-filter: blur(12px);
	}

	.nav-chip:hover,
	.nav-chip:focus-visible {
		color: var(--text-primary);
		border-color: var(--accent-cyan);
		transform: translateY(-2px);
		box-shadow: 0 0 16px rgba(6, 182, 212, 0.2);
		outline: none;
	}

	.nav-chip:focus-visible {
		outline: 2px solid var(--accent-cyan);
		outline-offset: 2px;
	}

	/* -------------------------------------------------------
	   professional error card (non-404)
	------------------------------------------------------- */
	.error-page {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100dvh;
		padding: 6rem 1.5rem 4rem;
		overflow: hidden;
	}

	.error-bg {
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
		width: 480px;
		height: 480px;
		background: rgba(239, 68, 68, 0.06);
		top: -10%;
		right: -15%;
	}

	.orb-2 {
		width: 380px;
		height: 380px;
		background: rgba(139, 92, 246, 0.05);
		bottom: -10%;
		left: -15%;
	}

	.error-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: 520px;
		padding: 3rem 2.5rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(20px);
	}

	.error-status {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		color: var(--text-tertiary);
		margin-bottom: 1.25rem;
	}

	.error-title {
		font-size: clamp(1.6rem, 4vw, 2.25rem);
		font-weight: 800;
		letter-spacing: -0.02em;
		color: var(--text-primary);
		margin-bottom: 0.85rem;
		line-height: 1.2;
	}

	.error-message {
		font-size: 0.95rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin-bottom: 1.85rem;
		max-width: 420px;
	}

	.error-actions {
		display: flex;
		gap: 0.85rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.btn-primary,
	.btn-secondary {
		display: inline-flex;
		align-items: center;
		padding: 0.65rem 1.35rem;
		font-size: 0.9rem;
		font-weight: 600;
		border-radius: var(--radius-full);
		text-decoration: none;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease;
	}

	.btn-primary {
		color: var(--color-bg-primary);
		background: var(--gradient-primary);
	}

	.btn-primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
	}

	.btn-secondary {
		color: var(--text-secondary);
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
	}

	.btn-secondary:hover {
		border-color: var(--accent-cyan);
		color: var(--text-primary);
	}
</style>
