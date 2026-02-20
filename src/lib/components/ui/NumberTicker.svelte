<script lang="ts">
	import { onMount } from 'svelte';

	// target value to animate to, duration in ms
	let {
		value,
		duration = 1200,
		delay = 0,
		class: className = '',
		suffix = ''
	}: {
		value: number;
		duration?: number;
		delay?: number;
		class?: string;
		suffix?: string;
	} = $props();

	let displayValue = $state(0);
	let mounted = $state(false);

	onMount(() => {
		const timeout = setTimeout(() => {
			mounted = true;
			const start = performance.now();
			const startVal = 0;
			const endVal = value;

			function tick(now: number) {
				const elapsed = now - start;
				const progress = Math.min(elapsed / duration, 1);
				// cubic ease-out for a snappy feel
				const eased = 1 - Math.pow(1 - progress, 3);
				displayValue = Math.round(startVal + (endVal - startVal) * eased);
				if (progress < 1) requestAnimationFrame(tick);
			}
			requestAnimationFrame(tick);
		}, delay);
		return () => clearTimeout(timeout);
	});

	// re-animate when value changes after mount
	$effect(() => {
		if (!mounted) return;
		const start = performance.now();
		const startVal = displayValue;
		const endVal = value;
		if (startVal === endVal) return;

		function tick(now: number) {
			const elapsed = now - start;
			const progress = Math.min(elapsed / duration, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			displayValue = Math.round(startVal + (endVal - startVal) * eased);
			if (progress < 1) requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
	});
</script>

<span class="number-ticker {className}">
	{displayValue}{suffix}
</span>

<style>
	.number-ticker {
		font-variant-numeric: tabular-nums;
		display: inline-block;
	}
</style>
