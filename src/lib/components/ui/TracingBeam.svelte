<script lang="ts">
	import { onMount } from 'svelte';

	let {
		children,
		color = 'var(--accent-cyan)'
	}: {
		children: import('svelte').Snippet;
		color?: string;
	} = $props();

	let containerEl: HTMLDivElement;
	let scrollProgress = $state(0);
	let beamHeight = $state(0);

	onMount(() => {
		function updateScroll() {
			if (!containerEl) return;
			const rect = containerEl.getBoundingClientRect();
			const windowHeight = window.innerHeight;
			const totalHeight = rect.height;

			// how far the container top has scrolled past the viewport top
			const scrolled = -rect.top + windowHeight * 0.3;
			const progress = Math.max(0, Math.min(1, scrolled / totalHeight));
			scrollProgress = progress;
			beamHeight = progress * totalHeight;
		}

		window.addEventListener('scroll', updateScroll, { passive: true });
		updateScroll();

		return () => window.removeEventListener('scroll', updateScroll);
	});
</script>

<div class="tracing-beam-container" bind:this={containerEl}>
	<div class="beam-track">
		<div class="beam-track-line"></div>
		<div
			class="beam-fill"
			style="
				height: {beamHeight}px;
				background: linear-gradient(to bottom, transparent, {color});
			"
		></div>
		<div
			class="beam-dot"
			style="
				top: {beamHeight}px;
				background: {color};
				box-shadow: 0 0 12px {color}, 0 0 24px {color};
				opacity: {scrollProgress > 0.01 ? 1 : 0};
			"
		></div>
	</div>
	<div class="beam-content">
		{@render children()}
	</div>
</div>

<style>
	.tracing-beam-container {
		position: relative;
		display: flex;
		gap: 2rem;
	}

	.beam-track {
		position: relative;
		width: 2px;
		flex-shrink: 0;
	}

	.beam-track-line {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 1px;
	}

	.beam-fill {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		border-radius: 1px;
		transition: height 0.1s ease-out;
	}

	.beam-dot {
		position: absolute;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 8px;
		height: 8px;
		border-radius: 50%;
		transition:
			top 0.1s ease-out,
			opacity 0.3s ease;
	}

	.beam-content {
		flex: 1;
		min-width: 0;
	}
</style>
