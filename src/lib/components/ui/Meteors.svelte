<script lang="ts">
	let {
		count = 20,
		color = '#06b6d4'
	}: {
		count?: number;
		color?: string;
	} = $props();

	const meteors = Array.from({ length: count }, () => ({
		left: Math.random() * 100,
		delay: Math.random() * 10,
		duration: 1.5 + Math.random() * 3,
		size: 1 + Math.random() * 1.5,
		top: -10 - Math.random() * 30
	}));
</script>

<div class="meteors-container" aria-hidden="true">
	{#each meteors as meteor}
		<div
			class="meteor"
			style="
				left: {meteor.left}%;
				top: {meteor.top}%;
				animation-delay: {meteor.delay}s;
				animation-duration: {meteor.duration}s;
				width: {meteor.size}px;
				height: {60 + Math.random() * 80}px;
			"
		>
			<div
				class="meteor-head"
				style="
					width: {meteor.size}px;
					height: {meteor.size}px;
					background: {color};
					box-shadow: 0 0 4px {color};
				"
			></div>
			<div
				class="meteor-tail"
				style="
					width: {meteor.size * 0.6}px;
					background: linear-gradient(to bottom, {color}, transparent);
				"
			></div>
		</div>
	{/each}
</div>

<style>
	.meteors-container {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 0;
	}

	.meteor {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		opacity: 0;
		animation: meteorFall linear infinite;
		transform: rotate(215deg);
	}

	.meteor-head {
		border-radius: 50%;
		flex-shrink: 0;
	}

	.meteor-tail {
		flex: 1;
		border-radius: 0 0 1px 1px;
	}

	@keyframes meteorFall {
		0% {
			opacity: 0;
			transform: rotate(215deg) translateY(0);
		}
		5% {
			opacity: 1;
		}
		70% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: rotate(215deg) translateY(800px);
		}
	}
</style>
