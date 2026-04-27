import { ImageResponse } from '@vercel/og';
import { clamp, parseInt0 } from '$lib/clamp';
import type { RequestHandler } from './$types';

// runs on the default (node) serverless runtime - the deprecated `runtime: 'edge'`
// adapter-vercel option pulls SvelteKit's bundled root.js (which references
// node:crypto via dynamic import) into an edge-only build that esbuild fails to
// resolve. @vercel/og >=0.6 works fine on node-runtime serverless functions
export const config = { maxDuration: 30 };

const WIDTH = 1200;
const HEIGHT = 630;

// score-tier colors mirror src/lib/engine/scorer/classification.ts
function tierColor(score: number): string {
	if (score >= 80) return '#22c55e';
	if (score >= 60) return '#eab308';
	if (score >= 40) return '#f97316';
	return '#ef4444';
}

function tierLabel(score: number): string {
	if (score >= 80) return 'EXCELLENT';
	if (score >= 60) return 'GOOD';
	if (score >= 40) return 'NEEDS WORK';
	return 'POOR';
}

// function-level LRU memo of rendered PNG bytes. the vercel cdn cache
// already absorbs identical repeat requests by URL, but a cache-bypass
// header (Cache-Control: no-cache from a misconfigured client, a fresh
// edge region, etc) lands on the function and re-renders the same image.
// 200 entries x ~60kb per image is ~12MB of resident memory, well within
// vercel hobby's per-function ceiling. keys are content-addressed so
// collisions are not possible.
const renderCache = new Map<string, ArrayBuffer>();
const RENDER_CACHE_MAX = 200;

function cacheKey(score: number, pass: number, total: number, delta: number | null): string {
	return `${score}|${pass}|${total}|${delta ?? ''}`;
}

export const GET: RequestHandler = async ({ url }) => {
	const score = parseInt0(url.searchParams.get('score'), 0, 0, 100);
	// parse total first, then cap pass to <= total so a tampered URL like
	// ?pass=6&total=1 cannot render "6 of 1 ATS systems passed"
	const total = parseInt0(url.searchParams.get('total'), 6, 1, 6);
	const pass = clamp(parseInt0(url.searchParams.get('pass'), 0, 0, 6), 0, total);
	const delta = url.searchParams.has('delta')
		? parseInt0(url.searchParams.get('delta'), 0, -100, 100)
		: null;

	// memo lookup: content-addressed by the four params that drive the image
	const memoKey = cacheKey(score, pass, total, delta);
	const cached = renderCache.get(memoKey);
	if (cached) {
		// LRU bump on hit
		renderCache.delete(memoKey);
		renderCache.set(memoKey, cached);
		return new Response(cached, {
			status: 200,
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control':
					'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800, immutable',
				// override the global same-origin CORP set in hooks.server.ts:
				// social platforms (LinkedIn, Twitter, Facebook, Slack) fetch og images
				// from their own origin when generating link previews. same-origin would
				// block those cross-origin fetches and break every social share card.
				// cross-origin is safe here because this endpoint only serves a static
				// pre-rendered PNG with no user-sensitive data.
				'Cross-Origin-Resource-Policy': 'cross-origin'
			}
		});
	}

	const color = tierColor(score);
	const label = tierLabel(score);

	// React-element tree built as plain objects so we don't need JSX in the project.
	// satori (under @vercel/og) accepts this shape directly.
	const tree = {
		type: 'div',
		props: {
			style: {
				width: '100%',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				background: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d24 50%, #12122e 100%)',
				color: '#e4e4e7',
				padding: '64px 72px',
				fontFamily: 'Inter, system-ui, sans-serif'
			},
			children: [
				// header strip
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							alignItems: 'center',
							gap: '16px',
							fontSize: '22px',
							fontWeight: 600,
							color: '#a1a1aa',
							letterSpacing: '0.06em',
							textTransform: 'uppercase'
						},
						children: [
							{
								type: 'div',
								props: {
									style: {
										width: '12px',
										height: '12px',
										borderRadius: '50%',
										background: color
									}
								}
							},
							'ATS SCREENER'
						]
					}
				},
				// center: score + verdict
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							flexDirection: 'column',
							gap: '10px'
						},
						children: [
							{
								type: 'div',
								props: {
									style: {
										display: 'flex',
										alignItems: 'baseline',
										gap: '24px'
									},
									children: [
										{
											type: 'div',
											props: {
												style: {
													fontSize: '260px',
													fontWeight: 800,
													color,
													lineHeight: 1,
													letterSpacing: '-0.04em'
												},
												children: String(score)
											}
										},
										delta !== null && delta > 0
											? {
													type: 'div',
													props: {
														style: {
															display: 'flex',
															alignItems: 'center',
															padding: '10px 22px',
															background: 'rgba(34, 197, 94, 0.18)',
															color: '#22c55e',
															borderRadius: '999px',
															fontSize: '40px',
															fontWeight: 700
														},
														children: `+${delta}`
													}
												}
											: null,
										delta !== null && delta < 0
											? {
													type: 'div',
													props: {
														style: {
															display: 'flex',
															alignItems: 'center',
															padding: '10px 22px',
															background: 'rgba(239, 68, 68, 0.18)',
															color: '#ef4444',
															borderRadius: '999px',
															fontSize: '40px',
															fontWeight: 700
														},
														children: String(delta)
													}
												}
											: null
									].filter(Boolean)
								}
							},
							{
								type: 'div',
								props: {
									style: {
										fontSize: '40px',
										fontWeight: 700,
										color,
										letterSpacing: '0.04em'
									},
									children: label
								}
							},
							{
								type: 'div',
								props: {
									style: {
										fontSize: '28px',
										color: '#a1a1aa',
										marginTop: '8px'
									},
									children: `${pass} of ${total} ATS systems passed`
								}
							}
						]
					}
				},
				// footer
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							fontSize: '22px',
							color: '#71717a'
						},
						children: ['Free • Open source • No paywalls', 'ats-screener.vercel.app']
					}
				}
			]
		}
	};

	// @vercel/og's ImageResponse hardcodes Cache-Control: no-cache,no-store and
	// passing a custom Cache-Control via the constructor's headers option only
	// CONCATENATES (verified locally - ends up "no-cache, no-store, public,...").
	// to actually cache at Vercel's CDN we re-wrap the rendered bytes in a fresh
	// Response with the headers we want. since the URL is fully content-addressed
	// (score+pass+total+delta), any unique combination caches forever - massive
	// cost protection because repeat shares of the same link hit the edge cache,
	// never the function
	const og = new ImageResponse(tree as never, { width: WIDTH, height: HEIGHT });
	const buffer = await og.arrayBuffer();

	// store in the function-level memo before responding. LRU eviction keeps
	// the map bounded; oldest entry is at the head of the iterator since Map
	// preserves insertion order and we re-insert on hit above.
	if (renderCache.size >= RENDER_CACHE_MAX) {
		const oldest = renderCache.keys().next().value;
		if (oldest !== undefined) renderCache.delete(oldest);
	}
	renderCache.set(memoKey, buffer);

	return new Response(buffer, {
		status: 200,
		headers: {
			'Content-Type': 'image/png',
			// s-maxage = vercel cdn TTL (1d), max-age = browser TTL (1h),
			// stale-while-revalidate keeps serving stale up to 7d while refreshing
			'Cache-Control':
				'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800, immutable',
			// override the global same-origin CORP set in hooks.server.ts:
			// social platforms (LinkedIn, Twitter, Facebook, Slack) fetch og images
			// from their own origin when generating link previews. same-origin would
			// block those cross-origin fetches and break every social share card.
			// cross-origin is safe here because this endpoint only serves a static
			// pre-rendered PNG with no user-sensitive data.
			'Cross-Origin-Resource-Policy': 'cross-origin'
		}
	});
};
