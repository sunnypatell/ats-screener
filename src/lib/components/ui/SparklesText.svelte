<script lang="ts">
	import { onMount } from 'svelte';

	let { class: className = '' }: { class?: string } = $props();

	// generates random sparkle positions that animate continuously
	let sparkles = $state<Array<{ id: number; x: number; y: number; size: number; delay: number }>>(
		[]
	);

	onMount(() => {
		// create initial sparkles
		for (let i = 0; i < 10; i++) {
			sparkles.push({
				id: i,
				x: Math.random() * 100,
				y: Math.random() * 100,
				size: Math.random() * 3 + 1,
				delay: Math.random() * 2
			});
		}

		// continuously randomize sparkle positions
		const interval = setInterval(() => {
			sparkles = sparkles.map((s) => ({
				...s,
				x: Math.random() * 100,
				y: Math.random() * 100,
				size: Math.random() * 3 + 1
			}));
		}, 3000);

		return () => clearInterval(interval);
	});
</script>

<span class="sparkles-text {className}">
	<span class="sparkles-content"><slot /></span>
	<span class="sparkles-container" aria-hidden="true">
		{#each sparkles as sparkle (sparkle.id)}
			<svg
				class="sparkle"
				style="left: {sparkle.x}%; top: {sparkle.y}%; width: {sparkle.size *
					4}px; height: {sparkle.size * 4}px; animation-delay: {sparkle.delay}s;"
				viewBox="0 0 24 24"
				fill="currentColor"
			>
				<path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41Z" />
			</svg>
		{/each}
	</span>
</span>

<style>
	.sparkles-text {
		position: relative;
		display: inline-block;
	}

	.sparkles-content {
		position: relative;
		z-index: 1;
	}

	.sparkles-container {
		position: absolute;
		inset: -8px;
		pointer-events: none;
		overflow: hidden;
	}

	.sparkle {
		position: absolute;
		color: var(--accent-cyan);
		animation: sparkle-pulse 2s ease-in-out infinite;
		transition:
			left 1.5s ease,
			top 1.5s ease;
	}

	@keyframes sparkle-pulse {
		0%,
		100% {
			opacity: 0;
			transform: scale(0) rotate(0deg);
		}
		50% {
			opacity: 1;
			transform: scale(1) rotate(180deg);
		}
	}
</style>
