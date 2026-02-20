<script lang="ts">
	import { onMount } from 'svelte';

	let {
		text,
		class: className = ''
	}: {
		text: string;
		class?: string;
	} = $props();

	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

	// snapshot the text for the animation closure
	const targetText = text; // eslint-disable-line svelte/valid-compile -- intentional snapshot
	let displayText = $state(
		targetText.replace(/[^ ]/g, () => chars[Math.floor(Math.random() * chars.length)])
	);
	let revealedCount = $state(0);

	onMount(() => {
		let frame: number;
		let tickCount = 0;

		const animate = () => {
			tickCount++;

			// reveal one character every few ticks
			if (tickCount % 3 === 0 && revealedCount < targetText.length) {
				// skip spaces
				while (revealedCount < targetText.length && targetText[revealedCount] === ' ') {
					revealedCount++;
				}
				revealedCount++;
			}

			// build display string: revealed chars + scrambled remainder
			let result = '';
			for (let i = 0; i < targetText.length; i++) {
				if (targetText[i] === ' ') {
					result += ' ';
				} else if (i < revealedCount) {
					result += targetText[i];
				} else {
					result += chars[Math.floor(Math.random() * chars.length)];
				}
			}
			displayText = result;

			if (revealedCount < targetText.length) {
				frame = requestAnimationFrame(animate);
			}
		};

		// start after a brief delay
		const timeout = setTimeout(() => {
			frame = requestAnimationFrame(animate);
		}, 800);

		return () => {
			clearTimeout(timeout);
			cancelAnimationFrame(frame);
		};
	});
</script>

<span class="encrypted-text {className}">{displayText}</span>

<style>
	.encrypted-text {
		font-family: 'Geist Mono', monospace;
	}
</style>
