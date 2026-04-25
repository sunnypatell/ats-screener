<script lang="ts">
	import { computeTimeline, type TimelinePoint } from '$engine/scorer/timeline';
	import { getScoreColor } from '$engine/scorer/classification';
	import type { ScanHistoryEntry } from '$stores/scores.svelte';

	let { entries }: { entries: ScanHistoryEntry[] } = $props();

	const chart = $derived(
		computeTimeline(
			entries.map((e) => ({
				id: e.id,
				timestamp: e.timestamp,
				averageScore: e.averageScore,
				fileName: e.fileName,
				mode: e.mode
			}))
		)
	);

	let hoverIndex = $state<number | null>(null);
	const hoverPoint = $derived(
		hoverIndex !== null && chart ? (chart.points[hoverIndex] ?? null) : null
	);

	function shortDate(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function fmtTooltipDate(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	// pick the index whose x is closest to the pointer; works for sparse points
	function handleMove(e: PointerEvent, svgEl: SVGSVGElement) {
		if (!chart) return;
		const rect = svgEl.getBoundingClientRect();
		const xRatio = (e.clientX - rect.left) / rect.width;
		const xInChart = xRatio * chart.width;
		let nearest = 0;
		let bestDist = Infinity;
		for (let i = 0; i < chart.points.length; i++) {
			const d = Math.abs(chart.points[i].x - xInChart);
			if (d < bestDist) {
				bestDist = d;
				nearest = i;
			}
		}
		hoverIndex = nearest;
	}

	function handleLeave() {
		hoverIndex = null;
	}

	// per-point hover dots get a slight halo when active
	function dotRadius(p: TimelinePoint, active: boolean): number {
		void p;
		return active ? 6 : 4;
	}
</script>

{#if chart}
	<div class="timeline-wrap">
		<div class="timeline-header">
			<h3>Score over time</h3>
			<span class="timeline-meta">{chart.points.length} scans</span>
		</div>
		<div class="chart-shell">
			<svg
				viewBox="0 0 {chart.width} {chart.height}"
				preserveAspectRatio="none"
				class="timeline-svg"
				role="img"
				aria-label="Line chart of resume scores over time"
				onpointermove={(e) => handleMove(e, e.currentTarget as SVGSVGElement)}
				onpointerleave={handleLeave}
			>
				<defs>
					<linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="#06b6d4" stop-opacity="0.32" />
						<stop offset="100%" stop-color="#06b6d4" stop-opacity="0" />
					</linearGradient>
					<linearGradient id="timelineStroke" x1="0" y1="0" x2="1" y2="0">
						<stop offset="0%" stop-color="#06b6d4" />
						<stop offset="100%" stop-color="#8b5cf6" />
					</linearGradient>
				</defs>

				<!-- baseline rule -->
				<line
					x1={chart.innerLeft}
					y1={chart.innerBottom}
					x2={chart.innerRight}
					y2={chart.innerBottom}
					stroke="rgba(255,255,255,0.06)"
					stroke-width="1"
				/>

				<!-- area fill -->
				<path d={chart.areaD} fill="url(#timelineFill)" />
				<!-- line -->
				<path
					d={chart.pathD}
					fill="none"
					stroke="url(#timelineStroke)"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>

				<!-- score dots -->
				{#each chart.points as p, i}
					<circle
						cx={p.x}
						cy={p.y}
						r={dotRadius(p, hoverIndex === i)}
						fill={getScoreColor(p.score)}
						stroke="var(--color-bg-primary)"
						stroke-width="2"
					/>
				{/each}

				<!-- guide line at the hovered x -->
				{#if hoverPoint}
					<line
						x1={hoverPoint.x}
						y1={chart.innerTop}
						x2={hoverPoint.x}
						y2={chart.innerBottom}
						stroke="rgba(255,255,255,0.18)"
						stroke-width="1"
						stroke-dasharray="3 3"
					/>
				{/if}
			</svg>

			<!-- absolute-positioned tooltip; placed in DOM (not SVG) so it can use real CSS -->
			{#if hoverPoint && chart}
				{@const xPct = (hoverPoint.x / chart.width) * 100}
				{@const onLeft = xPct > 65}
				<div
					class="timeline-tooltip"
					class:left={onLeft}
					style="left: {xPct}%; top: {(hoverPoint.y / chart.height) * 100}%;"
				>
					<div class="tooltip-row">
						<span class="tooltip-score" style="color: {getScoreColor(hoverPoint.score)}">
							{hoverPoint.score}
						</span>
						<span class="tooltip-mode">{hoverPoint.mode}</span>
					</div>
					{#if hoverPoint.fileName}
						<div class="tooltip-file">{hoverPoint.fileName}</div>
					{/if}
					<div class="tooltip-date">{fmtTooltipDate(hoverPoint.timestamp)}</div>
				</div>
			{/if}
		</div>

		<!-- x-axis labels: first and last only to avoid clutter -->
		<div class="x-axis">
			<span>{shortDate(chart.points[0].timestamp)}</span>
			<span>{shortDate(chart.points[chart.points.length - 1].timestamp)}</span>
		</div>
	</div>
{/if}

<style>
	.timeline-wrap {
		padding: 1.25rem 1.25rem 1rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		backdrop-filter: blur(12px);
	}

	.timeline-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 0.85rem;
	}

	.timeline-header h3 {
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.timeline-meta {
		font-size: 0.72rem;
		color: var(--text-tertiary);
		font-variant-numeric: tabular-nums;
	}

	.chart-shell {
		position: relative;
		width: 100%;
	}

	.timeline-svg {
		width: 100%;
		height: 220px;
		display: block;
		touch-action: none;
	}

	.timeline-tooltip {
		position: absolute;
		transform: translate(-50%, calc(-100% - 12px));
		padding: 0.5rem 0.75rem;
		background: rgba(10, 10, 26, 0.96);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		pointer-events: none;
		min-width: 110px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(8px);
	}

	.timeline-tooltip.left {
		transform: translate(calc(-100% + 8px), calc(-100% - 12px));
	}

	.tooltip-row {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.tooltip-score {
		font-size: 1.2rem;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}

	.tooltip-mode {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-tertiary);
	}

	.tooltip-file {
		font-size: 0.72rem;
		color: var(--text-secondary);
		margin-top: 0.2rem;
		max-width: 180px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tooltip-date {
		font-size: 0.7rem;
		color: var(--text-tertiary);
		margin-top: 0.15rem;
	}

	.x-axis {
		display: flex;
		justify-content: space-between;
		font-size: 0.7rem;
		color: var(--text-tertiary);
		font-variant-numeric: tabular-nums;
		padding: 0 0.5rem;
		margin-top: 0.4rem;
	}
</style>
