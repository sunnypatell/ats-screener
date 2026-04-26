<script lang="ts">
	import { page } from '$app/state';

	// per-route meta tags - lifted out of app.html so each page can supply
	// its own title/description/canonical without rendering duplicate og: tags
	interface Props {
		title: string;
		description: string;
		ogImage?: string;
		ogImageAlt?: string;
		ogType?: 'website' | 'article';
		canonical?: string;
		noIndex?: boolean;
	}

	let {
		title,
		description,
		ogImage = '/og-image.png',
		ogImageAlt = 'ATS Screener: free open-source resume scoring against 6 real ATS platforms.',
		ogType = 'website',
		canonical,
		noIndex = false
	}: Props = $props();

	const url = $derived(page.url);
	const resolvedCanonical = $derived(canonical ?? `${url.origin}${url.pathname}`);
	const resolvedOgImage = $derived(
		ogImage.startsWith('http') ? ogImage : `${url.origin}${ogImage}`
	);

	// auto-noindex preview deploys. production hostname is fixed, so any other
	// vercel.app subdomain (preview branches, deployment-id deploys, etc) is
	// treated as a non-canonical environment and gets noindex regardless of
	// the per-page noIndex prop. prevents preview URLs from polluting google's
	// index with duplicate content.
	const PRODUCTION_HOST = 'ats-screener.vercel.app';
	const isPreviewHost = $derived(
		url.hostname !== PRODUCTION_HOST && url.hostname.endsWith('.vercel.app')
	);
	const robotsContent = $derived(noIndex || isPreviewHost ? 'noindex, nofollow' : 'index, follow');
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={resolvedCanonical} />
	<!-- single source of truth for robots. app.html no longer emits a baseline
	     so this attribute covers indexable, per-page noIndex, AND preview-host
	     auto-noindex without conflict. -->
	<meta name="robots" content={robotsContent} />

	<meta property="og:type" content={ogType} />
	<meta property="og:site_name" content="ATS Screener" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:url" content={resolvedCanonical} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={resolvedOgImage} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={ogImageAlt} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={resolvedOgImage} />
	<meta name="twitter:image:alt" content={ogImageAlt} />
</svelte:head>
