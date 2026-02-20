<script lang="ts">
	// renders a container with an animated gradient border that traces around the edge
	let {
		borderRadius = '16px',
		duration = 4000,
		class: className = ''
	}: {
		borderRadius?: string;
		duration?: number;
		class?: string;
	} = $props();
</script>

<div
	class="moving-border-wrapper {className}"
	style="--border-radius: {borderRadius}; --duration: {duration}ms;"
>
	<!-- the animated gradient that rotates around the border -->
	<div class="border-animation"></div>
	<!-- the inner content with background that masks the border -->
	<div class="border-content">
		<slot />
	</div>
</div>

<style>
	.moving-border-wrapper {
		position: relative;
		border-radius: var(--border-radius);
		padding: 1px;
		overflow: hidden;
	}

	.border-animation {
		position: absolute;
		inset: -50%;
		background: conic-gradient(
			from 0deg,
			transparent 0%,
			rgba(6, 182, 212, 0.6) 10%,
			rgba(59, 130, 246, 0.6) 20%,
			transparent 30%
		);
		animation: border-rotate var(--duration) linear infinite;
	}

	@keyframes border-rotate {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.border-content {
		position: relative;
		border-radius: calc(var(--border-radius) - 1px);
		background: var(--color-bg-primary, #0a0a14);
		z-index: 1;
	}
</style>
