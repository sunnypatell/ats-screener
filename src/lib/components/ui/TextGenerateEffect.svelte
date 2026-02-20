<script lang="ts">
	import { onMount } from 'svelte';

	// the full text to reveal word-by-word
	let { text, class: className = '', delay = 0 }: { text: string; class?: string; delay?: number } = $props();

	// splits into words, each fades in sequentially
	const words = $derived(text.split(' '));
	let visibleCount = $state(0);
	let started = $state(false);

	onMount(() => {
		const timeout = setTimeout(() => {
			started = true;
			const interval = setInterval(() => {
				visibleCount++;
				if (visibleCount >= words.length) clearInterval(interval);
			}, 40);
			return () => clearInterval(interval);
		}, delay);
		return () => clearTimeout(timeout);
	});
</script>

<span class="text-generate {className}">
	{#each words as word, i}
		<span
			class="word"
			class:visible={started && i < visibleCount}
		>{word}{' '}</span>
	{/each}
</span>

<style>
	.text-generate {
		display: inline;
	}

	.word {
		opacity: 0;
		filter: blur(4px);
		transition:
			opacity 0.3s ease,
			filter 0.3s ease;
		display: inline;
	}

	.word.visible {
		opacity: 1;
		filter: blur(0);
	}
</style>
