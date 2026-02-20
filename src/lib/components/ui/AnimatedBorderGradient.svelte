<script lang="ts">
	let {
		children,
		borderRadius = '16px',
		borderWidth = '1px',
		duration = '3s',
		gradientColors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#06b6d4']
	}: {
		children: import('svelte').Snippet;
		borderRadius?: string;
		borderWidth?: string;
		duration?: string;
		gradientColors?: string[];
	} = $props();

	const gradient = $derived(gradientColors.join(', '));
</script>

<div
	class="border-gradient-wrapper"
	style="
		--border-radius: {borderRadius};
		--border-width: {borderWidth};
		--animation-duration: {duration};
		--gradient: {gradient};
	"
>
	<div class="border-gradient-inner">
		{@render children()}
	</div>
</div>

<style>
	.border-gradient-wrapper {
		position: relative;
		border-radius: var(--border-radius);
		padding: var(--border-width);
		background: conic-gradient(from 0deg, var(--gradient));
		background-size: 200% 200%;
		animation: borderRotate var(--animation-duration) linear infinite;
	}

	.border-gradient-inner {
		border-radius: calc(var(--border-radius) - var(--border-width));
		background: var(--color-bg-primary, #0a0a14);
		width: 100%;
		height: 100%;
	}

	@keyframes borderRotate {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}
</style>
