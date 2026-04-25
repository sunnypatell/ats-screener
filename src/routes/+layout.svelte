<script lang="ts">
	import '../app.css';
	import Navbar from '$components/ui/Navbar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>ATS Screener</title>
</svelte:head>

<!--
	skip link bypasses the navbar for keyboard and screen-reader users.
	visually hidden until focused, slides into view from the top edge.
	target is the wrapper div, not each page's own <main>, so the skip
	works on every route without per-page coordination.
-->
<a class="skip-link" href="#content">Skip to content</a>
<Navbar />
<div id="content" tabindex="-1">
	{@render children()}
</div>

<style>
	.skip-link {
		position: absolute;
		top: 0;
		left: 0;
		padding: 0.75rem 1.25rem;
		background: var(--accent-cyan, #06b6d4);
		color: #0a0a1a;
		font-weight: 600;
		text-decoration: none;
		border-radius: 0 0 8px 0;
		transform: translateY(-200%);
		transition: transform 0.15s ease;
		z-index: 1000;
	}

	.skip-link:focus,
	.skip-link:focus-visible {
		transform: translateY(0);
		outline: 2px solid #0a0a1a;
		outline-offset: -4px;
	}

	/* respect users who asked for less motion: no slide-in animation */
	@media (prefers-reduced-motion: reduce) {
		.skip-link {
			transition: none;
		}
	}

	/*
		the wrapper receives focus only programmatically via the skip link,
		so a default outline around the whole page would be visual noise
		without accessibility benefit. focus moves on to the first
		focusable child as soon as the user tabs.
	*/
	#content {
		outline: none;
	}
</style>
