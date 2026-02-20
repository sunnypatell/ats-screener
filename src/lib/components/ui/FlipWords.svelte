<script lang="ts">
	import { onMount } from 'svelte';

	// cycles through an array of words with a smooth flip animation
	let {
		words,
		interval = 2000,
		class: className = ''
	}: {
		words: string[];
		interval?: number;
		class?: string;
	} = $props();

	let activeIndex = $state(0);
	let animating = $state(false);

	onMount(() => {
		const timer = setInterval(() => {
			// trigger exit animation
			animating = true;
			setTimeout(() => {
				activeIndex = (activeIndex + 1) % words.length;
				animating = false;
			}, 300);
		}, interval);
		return () => clearInterval(timer);
	});
</script>

<span class="flip-words {className}">
	<span class="flip-word" class:exit={animating} class:enter={!animating}>
		{words[activeIndex]}
	</span>
</span>

<style>
	.flip-words {
		display: inline-block;
		position: relative;
		overflow: hidden;
		vertical-align: bottom;
	}

	.flip-word {
		display: inline-block;
		transition:
			transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
			opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1),
			filter 0.35s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.flip-word.exit {
		transform: translateY(-100%);
		opacity: 0;
		filter: blur(6px);
	}

	.flip-word.enter {
		transform: translateY(0);
		opacity: 1;
		filter: blur(0);
	}
</style>
