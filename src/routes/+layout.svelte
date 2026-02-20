<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>ATS Screener - Free Resume Scanner for Real HCMS Platforms</title>
</svelte:head>

{@render children()}
