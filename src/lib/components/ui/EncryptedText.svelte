<script lang="ts">
	import { onMount } from 'svelte';

	let {
		phrases,
		class: className = ''
	}: {
		phrases: string[];
		class?: string;
	} = $props();

	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

	let displayText = $state('');

	function scramble(text: string): string {
		return text.replace(/[^ ]/g, () => chars[Math.floor(Math.random() * chars.length)]);
	}

	onMount(() => {
		let frame: number;
		let timeout: ReturnType<typeof setTimeout>;
		let cancelled = false;

		function animatePhrase(phraseIdx: number) {
			if (cancelled) return;

			const target = phrases[phraseIdx];
			// calculate ticks per character based on phrase length to fill ~3-5 seconds
			// at 60fps, 3s = 180 frames, 5s = 300 frames
			// we want the reveal to take about 70% of the display time
			const totalFrames = Math.max(180, Math.min(300, target.length * 12));
			const nonSpaceChars = target.replace(/ /g, '').length;
			const framesPerChar = Math.max(3, Math.floor((totalFrames * 0.7) / nonSpaceChars));

			let revealedCount = 0;
			let tickCount = 0;

			// start with full scramble
			displayText = scramble(target);

			const animate = () => {
				if (cancelled) return;
				tickCount++;

				// reveal one character every N ticks
				if (tickCount % framesPerChar === 0 && revealedCount < target.length) {
					// skip spaces
					while (revealedCount < target.length && target[revealedCount] === ' ') {
						revealedCount++;
					}
					revealedCount++;
				}

				// build display string
				let result = '';
				for (let i = 0; i < target.length; i++) {
					if (target[i] === ' ') {
						result += ' ';
					} else if (i < revealedCount) {
						result += target[i];
					} else {
						result += chars[Math.floor(Math.random() * chars.length)];
					}
				}
				displayText = result;

				if (revealedCount < target.length) {
					frame = requestAnimationFrame(animate);
				} else {
					// hold the revealed text for a moment, then scramble out and move to next
					const holdTime = 1500;
					timeout = setTimeout(() => {
						if (cancelled) return;
						scrambleOut(target, phraseIdx);
					}, holdTime);
				}
			};

			frame = requestAnimationFrame(animate);
		}

		function scrambleOut(text: string, phraseIdx: number) {
			if (cancelled) return;

			let hiddenCount = 0;
			let tickCount = 0;
			const nonSpaceChars = text.replace(/ /g, '').length;
			const framesPerChar = 2; // scramble out faster than reveal

			const animate = () => {
				if (cancelled) return;
				tickCount++;

				if (tickCount % framesPerChar === 0 && hiddenCount < text.length) {
					while (hiddenCount < text.length && text[hiddenCount] === ' ') {
						hiddenCount++;
					}
					hiddenCount++;
				}

				let result = '';
				for (let i = 0; i < text.length; i++) {
					if (text[i] === ' ') {
						result += ' ';
					} else if (i < hiddenCount) {
						result += chars[Math.floor(Math.random() * chars.length)];
					} else {
						result += text[i];
					}
				}
				displayText = result;

				if (hiddenCount < nonSpaceChars + (text.length - nonSpaceChars)) {
					frame = requestAnimationFrame(animate);
				} else {
					// brief pause then start next phrase
					timeout = setTimeout(() => {
						if (cancelled) return;
						const nextIdx = (phraseIdx + 1) % phrases.length;
						animatePhrase(nextIdx);
					}, 300);
				}
			};

			frame = requestAnimationFrame(animate);
		}

		// start after initial delay
		timeout = setTimeout(() => {
			if (!cancelled) animatePhrase(0);
		}, 800);

		return () => {
			cancelled = true;
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
