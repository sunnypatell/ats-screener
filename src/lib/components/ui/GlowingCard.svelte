<script lang="ts">
	let {
		children,
		glowColor = 'rgba(6, 182, 212, 0.4)',
		borderRadius = 'var(--radius-xl)',
		padding = '1.75rem'
	}: {
		children: import('svelte').Snippet;
		glowColor?: string;
		borderRadius?: string;
		padding?: string;
	} = $props();

	let cardEl: HTMLDivElement;
	let mouseX = $state(0);
	let mouseY = $state(0);
	let isHovered = $state(false);

	function handleMouseMove(e: MouseEvent) {
		if (!cardEl) return;
		const rect = cardEl.getBoundingClientRect();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;
	}
</script>

<div
	class="glowing-card"
	bind:this={cardEl}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
	onmousemove={handleMouseMove}
	role="presentation"
	style="
		--glow-x: {mouseX}px;
		--glow-y: {mouseY}px;
		--glow-color: {glowColor};
		--glow-opacity: {isHovered ? 1 : 0};
		border-radius: {borderRadius};
		padding: {padding};
	"
>
	<!-- hover glow overlay -->
	<div class="glow-overlay" aria-hidden="true"></div>
	<!-- border glow effect -->
	<div class="border-glow" aria-hidden="true"></div>
	<!-- content -->
	<div class="card-content">
		{@render children()}
	</div>
</div>

<style>
	.glowing-card {
		position: relative;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		backdrop-filter: blur(var(--glass-blur));
		overflow: hidden;
		transition: border-color 0.3s ease;
	}

	.glowing-card:hover {
		border-color: rgba(6, 182, 212, 0.15);
	}

	.glow-overlay {
		position: absolute;
		inset: 0;
		opacity: var(--glow-opacity);
		background: radial-gradient(
			300px circle at var(--glow-x) var(--glow-y),
			var(--glow-color),
			transparent 60%
		);
		transition: opacity 0.3s ease;
		pointer-events: none;
		z-index: 0;
	}

	.border-glow {
		position: absolute;
		inset: 0;
		opacity: var(--glow-opacity);
		background: radial-gradient(
			400px circle at var(--glow-x) var(--glow-y),
			rgba(6, 182, 212, 0.12),
			transparent 50%
		);
		transition: opacity 0.3s ease;
		pointer-events: none;
		z-index: 0;
		mask:
			linear-gradient(#fff 0 0) content-box,
			linear-gradient(#fff 0 0);
		mask-composite: exclude;
		-webkit-mask-composite: xor;
		padding: 1px;
		border-radius: inherit;
	}

	.card-content {
		position: relative;
		z-index: 1;
	}
</style>
