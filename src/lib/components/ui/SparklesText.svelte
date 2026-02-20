<script lang="ts">
	let {
		children,
		class: className = ''
	}: {
		children: import('svelte').Snippet;
		class?: string;
	} = $props();

	// static sparkle positions - no intervals, no re-renders, pure CSS animation
	const sparkles = Array.from({ length: 5 }, (_, i) => ({
		id: i,
		x: 10 + Math.random() * 80,
		y: 10 + Math.random() * 80,
		size: 2 + Math.random() * 2,
		delay: i * 0.4
	}));
</script>

<span class="sparkles-text {className}">
	<span class="sparkles-content">{@render children()}</span>
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
		animation: sparkle-pulse 3s ease-in-out infinite;
		will-change: opacity, transform;
	}

	@keyframes sparkle-pulse {
		0%,
		100% {
			opacity: 0;
			transform: scale(0);
		}
		50% {
			opacity: 0.8;
			transform: scale(1);
		}
	}
</style>
