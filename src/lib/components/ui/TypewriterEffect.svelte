<script lang="ts">
	import { onMount } from 'svelte';

	let {
		text,
		speed = 50,
		delay = 0,
		cursor = true,
		cursorChar = '|',
		onComplete
	}: {
		text: string;
		speed?: number;
		delay?: number;
		cursor?: boolean;
		cursorChar?: string;
		onComplete?: () => void;
	} = $props();

	let displayedText = $state('');
	let isComplete = $state(false);
	let showCursor = $state(true);

	onMount(() => {
		let currentIndex = 0;
		let timeout: ReturnType<typeof setTimeout>;

		// cursor blink
		const cursorInterval = setInterval(() => {
			showCursor = !showCursor;
		}, 530);

		// initial delay before typing starts
		timeout = setTimeout(() => {
			function type() {
				if (currentIndex < text.length) {
					displayedText = text.slice(0, currentIndex + 1);
					currentIndex++;
					timeout = setTimeout(type, speed);
				} else {
					isComplete = true;
					onComplete?.();
				}
			}
			type();
		}, delay);

		return () => {
			clearTimeout(timeout);
			clearInterval(cursorInterval);
		};
	});
</script>

<span class="typewriter">
	<span class="typewriter-text">{displayedText}</span>
	{#if cursor && (!isComplete || showCursor)}
		<span class="typewriter-cursor" class:blink={isComplete}>
			{cursorChar}
		</span>
	{/if}
</span>

<style>
	.typewriter {
		display: inline;
	}

	.typewriter-text {
		white-space: pre-wrap;
	}

	.typewriter-cursor {
		color: var(--accent-cyan);
		font-weight: 300;
		animation: none;
	}

	.typewriter-cursor.blink {
		animation: cursorBlink 1.06s step-end infinite;
	}

	@keyframes cursorBlink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
	}
</style>
