<script lang="ts">
	import Hero from '$components/landing/Hero.svelte';
	import LogoMarquee from '$components/landing/LogoMarquee.svelte';

	import Features from '$components/landing/Features.svelte';
	import HowItWorks from '$components/landing/HowItWorks.svelte';
	import CallToAction from '$components/landing/CallToAction.svelte';
	import Footer from '$components/landing/Footer.svelte';
	import SeoHead from '$components/seo/SeoHead.svelte';

	const softwareAppLd = {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'ATS Screener',
		applicationCategory: 'BusinessApplication',
		operatingSystem: 'Web',
		description:
			'Free ATS resume screener simulating Workday, Taleo, iCIMS, Greenhouse, Lever, and SuccessFactors. Real scores, not made-up numbers.',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		author: { '@type': 'Person', name: 'Sunny Patel' }
	};

	// escape '<' so the serialized JSON can never accidentally close the surrounding
	// <script> tag - safe even if softwareAppLd ever contains user-controlled values
	const ldJson = JSON.stringify(softwareAppLd).replace(/</g, '\\u003c');
</script>

<SeoHead
	title="ATS Screener - Free Resume Scanner for Real HCMS Platforms"
	description="Free ATS resume screener simulating Workday, Taleo, iCIMS, Greenhouse, Lever, and SuccessFactors. Get real scores, not made-up numbers."
/>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${ldJson}</` + `script>`}
</svelte:head>

<main class="landing">
	<Hero />
	<LogoMarquee />
	<Features />
	<HowItWorks />
	<CallToAction />
	<Footer />
</main>

<style>
	.landing {
		/* no extra padding needed, each section handles its own spacing */
		min-height: 100dvh;
	}
</style>
