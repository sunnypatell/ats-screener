import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// the privacy notice originally lived at /privacy as a Svelte route. it was
// relocated to /docs/legal/privacy/ in the Starlight docs site for better
// long-form readability. anyone with the old URL bookmarked or shared
// (search results, blog posts that linked the old path, etc) gets
// redirected to the new home with a permanent 308 so search engines
// transfer authority cleanly.
//
// 308 (Permanent Redirect) preserves the GET method on the redirect, which
// matters less here since /privacy never accepted POST, but is the modern
// canonical equivalent of 301 for caches and crawlers.
export const GET: RequestHandler = () => {
	redirect(308, '/docs/legal/privacy/');
};
