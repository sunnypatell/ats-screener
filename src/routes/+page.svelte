<script lang="ts">
	import Hero from '$components/landing/Hero.svelte';
	import Features from '$components/landing/Features.svelte';
	import HowItWorks from '$components/landing/HowItWorks.svelte';
	import Footer from '$components/landing/Footer.svelte';
</script>

<svelte:head>
	<title>ATS Screener - Free Resume Scanner for Real HCMS Platforms</title>
	<meta
		name="description"
		content="Free ATS resume screener simulating Workday, Taleo, iCIMS, Greenhouse, Lever, and SuccessFactors. Get real scores, not made-up numbers."
	/>
</svelte:head>

<main class="landing">
	<Hero />
	<Features />
	<HowItWorks />
	<Footer />
</main>

<style>
	.landing {
		/* no extra padding needed, each section handles its own spacing */
		min-height: 100dvh;
	}
</style>
