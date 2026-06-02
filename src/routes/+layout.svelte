<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import Navbar from '$components/ui/Navbar.svelte';
	import { authStore } from '$stores/auth.svelte';
	import { installErrorReporter } from '$lib/error-reporter';
	import { installWebVitals } from '$lib/web-vitals';
	import { logger } from '$lib/log';

	let { children, data } = $props();

	// bridge the server-resolved auth mode + ldap user into the auth store on the
	// CLIENT only. hydrateFromServer is a no-op during SSR by design: writing
	// per-request user data into a module-level singleton on the server could leak
	// one request's identity into another's html. the $effect re-runs on client
	// navigation; SSR renders from the store's constructor defaults.
	$effect(() => {
		authStore.hydrateFromServer(data);
	});

	// install the sampled client-side error reporter and the web-vitals
	// collector once per page lifetime. both run in the browser only; ssr
	// is a no-op via the browser guards inside each module.
	$effect(() => {
		installErrorReporter();
		installWebVitals();
	});

	// register the service worker after hydration, production-only.
	// dev skips registration because SvelteKit does not emit a compiled
	// service-worker.js in dev mode; attempting to register it would 404.
	// onMount is fire-and-forget so registration never blocks hydration.
	onMount(() => {
		if ('serviceWorker' in navigator && import.meta.env.PROD) {
			navigator.serviceWorker
				.register('/service-worker.js', { type: 'module' })
				.then((reg) => {
					logger.info('sw.registered', { scope: reg.scope });
				})
				.catch((error) => {
					logger.warn('sw.register_failed', { error });
				});
		}
	});
</script>

<svelte:head>
	<title>ATS Screener</title>
	{#if authStore.mode === 'firebase'}
		<!-- dns-prefetch for firebase auth hosts, emitted only when firebase is the
		     active auth mode so a self-host without firebase never resolves these.
		     lighter than preconnect: warms DNS for visitors who end up signing in,
		     without the TLS-handshake cost for those who never do. -->
		<link rel="dns-prefetch" href="//accounts.google.com" />
		<link rel="dns-prefetch" href="//apis.google.com" />
		<link rel="dns-prefetch" href="//securetoken.googleapis.com" />
		<link rel="dns-prefetch" href="//identitytoolkit.googleapis.com" />
		<link rel="dns-prefetch" href="//firestore.googleapis.com" />
	{/if}
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
