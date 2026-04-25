import { ImageResponse } from '@vercel/og';
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

function clamp(n: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, n));
}

function parseInt0(v: string | null, fallback: number, min: number, max: number): number {
	const n = v ? Number.parseInt(v, 10) : NaN;
	return Number.isFinite(n) ? clamp(n, min, max) : fallback;
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
	return new Response(buffer, {
		status: 200,
		headers: {
			'Content-Type': 'image/png',
			// s-maxage = vercel cdn TTL (1d), max-age = browser TTL (1h),
			// stale-while-revalidate keeps serving stale up to 7d while refreshing
			'Cache-Control':
				'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800, immutable'
		}
	});
};
