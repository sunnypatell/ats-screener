<script lang="ts">
	let {
		children,
		size = 400,
		color = 'rgba(6, 182, 212, 0.06)'
	}: {
		children: import('svelte').Snippet;
		size?: number;
		color?: string;
	} = $props();

	let containerEl: HTMLDivElement;
	let mouseX = $state(0);
	let mouseY = $state(0);
	let isVisible = $state(false);

	function handleMouseMove(e: MouseEvent) {
		if (!containerEl) return;
		const rect = containerEl.getBoundingClientRect();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;
	}
</script>

<div
	class="spotlight-container"
	bind:this={containerEl}
	onmouseenter={() => (isVisible = true)}
	onmouseleave={() => (isVisible = false)}
	onmousemove={handleMouseMove}
	role="presentation"
>
	<div
		class="spotlight-effect"
		aria-hidden="true"
		style="
			background: radial-gradient({size}px circle at {mouseX}px {mouseY}px, {color}, transparent 60%);
			opacity: {isVisible ? 1 : 0};
		"
	></div>
	{@render children()}
</div>

<style>
	.spotlight-container {
		position: relative;
		overflow: hidden;
	}

	.spotlight-effect {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
		transition: opacity 0.3s ease;
	}
</style>
