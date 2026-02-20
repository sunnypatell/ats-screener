<script lang="ts">
	import { onMount } from 'svelte';

	let {
		value,
		duration = 2000,
		delay = 0,
		prefix = '',
		suffix = '',
		decimals = 0
	}: {
		value: number;
		duration?: number;
		delay?: number;
		prefix?: string;
		suffix?: string;
		decimals?: number;
	} = $props();

	let displayValue = $state(0);
	let hasStarted = $state(false);
	let containerEl: HTMLSpanElement;

	onMount(() => {
		// use IntersectionObserver to only animate when visible
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !hasStarted) {
					hasStarted = true;
					setTimeout(startAnimation, delay);
				}
			},
			{ threshold: 0.3 }
		);

		observer.observe(containerEl);
		return () => observer.disconnect();
	});

	function startAnimation() {
		const startTime = performance.now();
		const startValue = displayValue;
		const endValue = value;

		function tick(now: number) {
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// ease-out cubic
			const eased = 1 - Math.pow(1 - progress, 3);
			displayValue = startValue + (endValue - startValue) * eased;

			if (progress < 1) {
				requestAnimationFrame(tick);
			} else {
				displayValue = endValue;
			}
		}

		requestAnimationFrame(tick);
	}

	// re-animate when value changes
	$effect(() => {
		if (hasStarted && value !== displayValue) {
			startAnimation();
		}
	});

	const formattedValue = $derived(displayValue.toFixed(decimals));
</script>

<span class="animated-counter" bind:this={containerEl}>
	{prefix}{formattedValue}{suffix}
</span>

<style>
	.animated-counter {
		font-variant-numeric: tabular-nums;
		display: inline-block;
	}
</style>
