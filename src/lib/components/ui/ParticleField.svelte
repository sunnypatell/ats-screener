<script lang="ts">
	let {
		count = 50,
		color = 'rgba(6, 182, 212, 0.3)',
		maxSize = 3,
		speed = 1
	}: {
		count?: number;
		color?: string;
		maxSize?: number;
		speed?: number;
	} = $props();

	const particles = Array.from({ length: count }, () => ({
		x: Math.random() * 100,
		y: Math.random() * 100,
		size: 0.5 + Math.random() * maxSize,
		duration: (20 + Math.random() * 40) / speed,
		delay: Math.random() * -30,
		driftX: -20 + Math.random() * 40,
		driftY: -20 + Math.random() * 40,
		opacity: 0.2 + Math.random() * 0.6
	}));
</script>

<div class="particle-field" aria-hidden="true">
	{#each particles as p}
		<div
			class="particle"
			style="
				left: {p.x}%;
				top: {p.y}%;
				width: {p.size}px;
				height: {p.size}px;
				background: {color};
				opacity: {p.opacity};
				animation-duration: {p.duration}s;
				animation-delay: {p.delay}s;
				--drift-x: {p.driftX}px;
				--drift-y: {p.driftY}px;
			"
		></div>
	{/each}
</div>

<style>
	.particle-field {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 0;
	}

	.particle {
		position: absolute;
		border-radius: 50%;
		animation: particleDrift ease-in-out infinite alternate;
	}

	@keyframes particleDrift {
		0% {
			transform: translate(0, 0);
		}
		100% {
			transform: translate(var(--drift-x), var(--drift-y));
		}
	}
</style>
