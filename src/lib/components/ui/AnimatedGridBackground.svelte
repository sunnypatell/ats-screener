<script lang="ts">
	let {
		gridSize = 40,
		strokeColor = 'rgba(6, 182, 212, 0.08)',
		accentColor = 'rgba(6, 182, 212, 0.15)'
	}: {
		gridSize?: number;
		strokeColor?: string;
		accentColor?: string;
	} = $props();

	// randomly highlight some grid cells for a subtle pulse effect
	const highlightCount = 8;
	const highlights = Array.from({ length: highlightCount }, () => ({
		x: Math.random() * 100,
		y: Math.random() * 100,
		delay: Math.random() * 5,
		duration: 3 + Math.random() * 4
	}));
</script>

<div class="grid-background" aria-hidden="true">
	<svg class="grid-svg" width="100%" height="100%">
		<defs>
			<pattern id="grid-pattern" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
				<path
					d="M {gridSize} 0 L 0 0 0 {gridSize}"
					fill="none"
					stroke={strokeColor}
					stroke-width="0.5"
				/>
			</pattern>
			<radialGradient id="grid-fade" cx="50%" cy="50%" r="60%">
				<stop offset="0%" stop-color="white" stop-opacity="1" />
				<stop offset="100%" stop-color="white" stop-opacity="0" />
			</radialGradient>
			<mask id="grid-mask">
				<rect width="100%" height="100%" fill="url(#grid-fade)" />
			</mask>
		</defs>
		<rect width="100%" height="100%" fill="url(#grid-pattern)" mask="url(#grid-mask)" />
	</svg>

	<!-- pulsing highlight cells -->
	{#each highlights as hl}
		<div
			class="grid-highlight"
			style="
				left: {hl.x}%;
				top: {hl.y}%;
				animation-delay: {hl.delay}s;
				animation-duration: {hl.duration}s;
				background: {accentColor};
			"
		></div>
	{/each}
</div>

<style>
	.grid-background {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 0;
	}

	.grid-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.grid-highlight {
		position: absolute;
		width: 40px;
		height: 40px;
		border-radius: 2px;
		opacity: 0;
		animation: gridPulse ease-in-out infinite;
		transform: translate(-50%, -50%);
	}

	@keyframes gridPulse {
		0%,
		100% {
			opacity: 0;
		}
		50% {
			opacity: 1;
		}
	}
</style>
