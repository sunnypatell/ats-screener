import { ImageResponse } from '@vercel/og';
import type { RequestHandler } from './$types';

// edge runtime is required by @vercel/og (uses Web APIs only)
export const config = { runtime: 'edge' };

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

export const GET: RequestHandler = ({ url }) => {
	const score = parseInt0(url.searchParams.get('score'), 0, 0, 100);
	const pass = parseInt0(url.searchParams.get('pass'), 0, 0, 6);
	const total = parseInt0(url.searchParams.get('total'), 6, 1, 6);
	const delta = url.searchParams.has('delta') ? parseInt0(url.searchParams.get('delta'), 0, -100, 100) : null;

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
				background:
					'linear-gradient(135deg, #0a0a1a 0%, #0d0d24 50%, #12122e 100%)',
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
						children: [
							'Free • Open source • No paywalls',
							'ats-screener.vercel.app'
						]
					}
				}
			]
		}
	};

	// @vercel/og applies its own Cache-Control default; setting one here would
	// concatenate rather than replace, so we let the default stand. crawlers
	// refetch when query params change (which is the right behavior for shares)
	return new ImageResponse(tree as never, { width: WIDTH, height: HEIGHT });
};
