/// <reference lib="webworker" />

// service worker for ats screener PWA.
//
// cache strategy summary:
// - build assets (js/css chunks from vite):  cache-first. these are content-
//   hashed, so stale-while-revalidate would waste bandwidth. a new deploy
//   produces new hashes, which fall through to network automatically.
// - static files (icons, manifest, fonts from /static): cache-first. same
//   rationale: file content rarely changes; cache-name versioning ensures a
//   deploy invalidates them.
// - /api/* paths: NEVER cached. the analyze endpoint returns LLM-scored
//   results for a specific resume+JD pair. caching even one response would
//   make every visitor see the same stale score. always network-only.
// - cross-origin requests: NEVER cached. we do not control cache-control
//   headers for external origins and CORS rules could prevent cache writes.
// - all other same-origin GET (SvelteKit routes, prerendered pages): network-
//   first with stale fallback. fresh on every load when online; graceful
//   degradation when offline.
//
// lifecycle:
// - install: precache build + static. skipWaiting() so the new SW takes over
//   immediately on next navigate rather than waiting for all tabs to close.
// - activate: delete every cache that is not the current version string. this
//   is the primary cache-busting mechanism on deploy. clients.claim() so the
//   active SW controls already-open pages without requiring a reload.

import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = `cache-${version}`;

// the full precache list: hashed build assets plus static files.
const PRECACHE_URLS = new Set([...build, ...files]);

// install: populate the precache. skipWaiting so we activate immediately.
self.addEventListener('install', (event: ExtendableEvent) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll([...PRECACHE_URLS]))
			.then(() => self.skipWaiting())
	);
});

// activate: purge every stale cache (any name != CACHE_NAME).
// clients.claim() makes this SW the controller for all in-scope pages right
// away, so the first navigation after an update gets the fresh cache.
self.addEventListener('activate', (event: ExtendableEvent) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
			)
			.then(() => self.clients.claim())
	);
});

// fetch: tiered strategy based on request characteristics.
self.addEventListener('fetch', (event: FetchEvent) => {
	const { request } = event;
	const url = new URL(request.url);

	// only intercept GET. mutations (POST/PUT/DELETE) must go straight to
	// the network; caching them would silently drop side effects.
	if (request.method !== 'GET') return;

	// never cache /api/*: LLM responses are user-specific and must be fresh.
	// caching even one result would serve stale scores to subsequent visitors.
	if (url.pathname.startsWith('/api/')) return;

	// never cache cross-origin requests. we do not own those cache headers
	// and CORS errors on cache writes would produce opaque responses that
	// inflate quota and hide failures.
	if (url.origin !== self.location.origin) return;

	// cache-first for anything in the precache set (content-hashed build
	// artifacts and static files). network fallback handles the edge case
	// where the install precache failed for a specific asset.
	if (PRECACHE_URLS.has(url.pathname)) {
		event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
		return;
	}

	// network-first for all other same-origin GETs (SvelteKit route
	// navigations, prerendered pages, etc.). on success, refresh the cache
	// entry so offline fallback is always warm. on failure, serve the cached
	// version if available, else return a minimal 503 page.
	event.respondWith(
		fetch(request)
			.then((response) => {
				// only cache successful same-origin responses
				if (response.ok) {
					const clone = response.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
				}
				return response;
			})
			.catch(() =>
				caches.match(request).then(
					(cached) =>
						cached ??
						new Response(
							'<!doctype html><html><head><title>offline</title></head>' +
								'<body><h1>you are offline</h1>' +
								'<p>ats screener requires a network connection to analyze your resume. ' +
								'please reconnect and try again.</p></body></html>',
							{
								status: 503,
								headers: { 'Content-Type': 'text/html; charset=utf-8' }
							}
						)
				)
			)
	);
});
