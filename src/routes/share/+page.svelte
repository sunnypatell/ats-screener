<script lang="ts">
	import { page } from '$app/stores';
	import SeoHead from '$components/seo/SeoHead.svelte';
	import { getScoreColor, getScoreLabel } from '$engine/scorer/classification';

	function clamp(n: number, min: number, max: number): number {
		return Math.max(min, Math.min(max, n));
	}

	function parseIntSafe(v: string | null, fallback: number, min: number, max: number): number {
		const n = v ? Number.parseInt(v, 10) : NaN;
		return Number.isFinite(n) ? clamp(n, min, max) : fallback;
	}

	const score = $derived(parseIntSafe($page.url.searchParams.get('score'), 0, 0, 100));
	const pass = $derived(parseIntSafe($page.url.searchParams.get('pass'), 0, 0, 6));
	const total = $derived(parseIntSafe($page.url.searchParams.get('total'), 6, 1, 6));
	const hasDelta = $derived($page.url.searchParams.has('delta'));
	const delta = $derived(parseIntSafe($page.url.searchParams.get('delta'), 0, -100, 100));

	// og:image points at the dynamic edge endpoint with the same query, so when
	// LinkedIn/Twitter fetches this page they get a per-share PNG preview
	const ogImageQuery = $derived.by(() => {
		const params = new URLSearchParams();
		params.set('score', String(score));
		params.set('pass', String(pass));
		params.set('total', String(total));
		if (hasDelta) params.set('delta', String(delta));
		return params.toString();
	});
	const ogImage = $derived(`${$page.url.origin}/api/og?${ogImageQuery}`);

	const title = $derived(
		hasDelta && delta > 0
			? `Improved ATS resume score by ${delta} points`
			: `Scored ${score}/100 across 6 real ATS platforms`
	);
	const description = $derived(
		`Free, open-source resume screener that simulates Workday, Taleo, iCIMS, Greenhouse, Lever, and SuccessFactors. ${pass} of ${total} systems passed.`
	);

	const color = $derived(getScoreColor(score));
	const verdict = $derived(getScoreLabel(score));
</script>

<SeoHead {title} {description} {ogImage} ogType="article" />

<main class="share-page">
	<div class="share-bg">
		<div class="bg-orb orb-1"></div>
		<div class="bg-orb orb-2"></div>
	</div>

	<div class="share-card">
		<div class="kicker">ATS Screener</div>
		<div class="score-row">
			<span class="score-number" style="color: {color}">{score}</span>
			{#if hasDelta && delta > 0}
				<span class="delta-pill positive">+{delta}</span>
			{:else if hasDelta && delta < 0}
				<span class="delta-pill negative">{delta}</span>
			{/if}
		</div>
		<div class="verdict" style="color: {color}">{verdict}</div>
		<div class="passing">
			<strong>{pass}</strong> of <strong>{total}</strong> ATS systems passed
		</div>

		<div class="cta">
			<a href="/scanner" class="cta-btn">Scan your resume — free</a>
		</div>

		<p class="footnote">
			ATS Screener simulates Workday, Taleo, iCIMS, Greenhouse, Lever, and SuccessFactors. Open
			source, no paywalls.
		</p>
	</div>
</main>

<style>
	.share-page {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100dvh;
		padding: 6rem 1.5rem 4rem;
		overflow: hidden;
	}

	.share-bg {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.bg-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(120px);
	}

	.orb-1 {
		width: 480px;
		height: 480px;
		background: rgba(6, 182, 212, 0.08);
		top: -10%;
		right: -10%;
	}

	.orb-2 {
		width: 380px;
		height: 380px;
		background: rgba(139, 92, 246, 0.06);
		bottom: -10%;
		left: -10%;
	}

	.share-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: 600px;
		padding: 3.25rem 2.5rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(20px);
	}

	.kicker {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.18em;
		color: var(--text-tertiary);
		margin-bottom: 1.25rem;
		text-transform: uppercase;
	}

	.score-row {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		line-height: 1;
		margin-bottom: 0.4rem;
	}

	.score-number {
		font-size: clamp(5rem, 14vw, 8rem);
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.04em;
	}

	.delta-pill {
		padding: 0.4rem 1rem;
		font-size: 1.1rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		border-radius: var(--radius-full);
	}

	.delta-pill.positive {
		color: #22c55e;
		background: rgba(34, 197, 94, 0.14);
	}

	.delta-pill.negative {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.14);
	}

	.verdict {
		font-size: 1.1rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		margin-bottom: 1.1rem;
	}

	.passing {
		font-size: 1rem;
		color: var(--text-secondary);
		margin-bottom: 2.25rem;
	}

	.passing strong {
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.cta {
		margin-bottom: 1.85rem;
	}

	.cta-btn {
		display: inline-flex;
		align-items: center;
		padding: 0.9rem 1.85rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-bg-primary);
		background: var(--gradient-primary);
		border-radius: var(--radius-full);
		text-decoration: none;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.cta-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 0 24px rgba(6, 182, 212, 0.3);
	}

	.footnote {
		font-size: 0.82rem;
		color: var(--text-tertiary);
		line-height: 1.6;
		max-width: 440px;
		margin: 0;
	}
</style>
