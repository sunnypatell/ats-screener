<script lang="ts">
	let {
		children,
		speed = 30,
		direction = 'left',
		pauseOnHover = true
	}: {
		children: import('svelte').Snippet;
		speed?: number;
		direction?: 'left' | 'right';
		pauseOnHover?: boolean;
	} = $props();

	let isPaused = $state(false);
	const animationDuration = $derived(`${speed}s`);
	const animationDirection = $derived(direction === 'left' ? 'normal' : 'reverse');
</script>

<div
	class="infinite-scroll"
	class:paused={pauseOnHover && isPaused}
	onmouseenter={() => (isPaused = true)}
	onmouseleave={() => (isPaused = false)}
	style="--scroll-duration: {animationDuration}; --scroll-direction: {animationDirection};"
	aria-hidden="true"
>
	<div class="scroll-track">
		<div class="scroll-content">
			{@render children()}
		</div>
		<div class="scroll-content" aria-hidden="true">
			{@render children()}
		</div>
	</div>
</div>

<style>
	.infinite-scroll {
		overflow: hidden;
		mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
		-webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
	}

	.scroll-track {
		display: flex;
		width: max-content;
		animation: infiniteScroll var(--scroll-duration) linear infinite var(--scroll-direction);
	}

	.infinite-scroll.paused .scroll-track {
		animation-play-state: paused;
	}

	.scroll-content {
		display: flex;
		align-items: center;
		gap: 2rem;
		padding-right: 2rem;
	}

	@keyframes infiniteScroll {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}
</style>
