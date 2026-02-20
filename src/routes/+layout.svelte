<script lang="ts">
	import '../app.css';
	import Navbar from '$components/ui/Navbar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>ATS Screener</title>
</svelte:head>

<Navbar />
{@render children()}
