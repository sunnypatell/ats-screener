<script lang="ts">
	import { scoresStore } from '$stores/scores.svelte';
	import ScoreCard from './ScoreCard.svelte';
	import ScoreBreakdown from './ScoreBreakdown.svelte';
	import KeywordAnalysis from './KeywordAnalysis.svelte';
	import WeakestAreas from './WeakestAreas.svelte';
	import ResumeStats from './ResumeStats.svelte';
	import ShareBadge from './ShareBadge.svelte';
	import { generatePDF } from '$engine/scorer/report';
	import { getScoreColor, getScoreLabel } from '$engine/scorer/classification';
	import { computeScanComparison } from '$engine/scorer/comparison';
	import { pickQuickWins } from '$engine/scorer/quick-wins';
	import { getExampleFor } from '$engine/suggestions/templates';
	import { logger } from '$lib/log';
	import type { Suggestion, StructuredSuggestion } from '$engine/scorer/types';

	// derived stats for the summary card header
	const avgScore = $derived(scoresStore.averageScore);
	const passCount = $derived(scoresStore.passingCount);
	const totalCount = $derived(scoresStore.results.length);

	// top 3 highest-impact suggestions across all platforms, deduplicated
	// by summary text. surfaces in the Quick Wins band so users see what
	// to fix first without scrolling through every per-platform tab.
	// reuses the existing impactColorMap declared further down.
	const quickWins = $derived(pickQuickWins(scoresStore.results, 3));

	// toggle between grid cards and detailed breakdown view
	let activeView = $state<'cards' | 'detailed'>('cards');
	let showShareBadge = $state(false);

	// pdf export state
	let isExporting = $state(false);

	// collapsible suggestion cards
	let expandedSuggestion = $state<number | null>(null);

	function toggleSuggestion(index: number) {
		expandedSuggestion = expandedSuggestion === index ? null : index;
	}

	function isStructured(s: Suggestion): s is StructuredSuggestion {
		return typeof s === 'object' && 'summary' in s;
	}

	const impactColorMap: Record<string, string> = {
		critical: '#ef4444',
		high: '#f97316',
		medium: '#eab308',
		low: '#22c55e'
	};

	// deduplicate suggestions across all platforms
	const allSuggestions = $derived.by(() => {
		const seen = new Set<string>();
		const suggestions: Suggestion[] = [];
		for (const r of scoresStore.results) {
			for (const s of r.suggestions) {
				const key = isStructured(s) ? s.summary : s;
				if (!seen.has(key)) {
					seen.add(key);
					suggestions.push(s);
				}
			}
		}
		return suggestions.slice(0, 5);
	});

	// generates a PDF report using jsPDF
	async function exportResults() {
		if (isExporting) return;
		isExporting = true;
		try {
			await generatePDF();
		} catch (err) {
			logger.error('export.pdf_failed', {
				error: err instanceof Error ? err.message : String(err)
			});
		} finally {
			isExporting = false;
		}
	}

	// alias for backward compat in template
	const getAvgColor = getScoreColor;

	// per-block copy state for the example blocks - keyed by `${suggestionIndex}-${'before'|'after'}`
	// so multiple copies can show their "copied" state without trampling each other
	let copiedKey = $state<string | null>(null);
	let copiedTimer: ReturnType<typeof setTimeout> | null = null;

	// widened to Event so both pointer and keyboard handlers can pass through
	// without unsafe casts (KeyboardEvent and MouseEvent both have stopPropagation)
	async function copyExample(text: string, key: string, e: Event) {
		// the example block is inside the suggestion-card click target, so without
		// stopping propagation the click bubbles up and toggles the suggestion's
		// expanded state, which collapses the block the user just copied from
		e.stopPropagation();
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			const ta = document.createElement('textarea');
			ta.value = text;
			ta.style.position = 'fixed';
			ta.style.opacity = '0';
			document.body.appendChild(ta);
			ta.select();
			try {
				document.execCommand('copy');
			} finally {
				document.body.removeChild(ta);
			}
		}
		copiedKey = key;
		if (copiedTimer) clearTimeout(copiedTimer);
		copiedTimer = setTimeout(() => {
			copiedKey = null;
			copiedTimer = null;
		}, 1600);
	}

	// live countdown for the rate-limit retry hint inside the fallback toast
	// only ticks while the toast is visible and a retry timestamp is set
	let now = $state(Date.now());
	$effect(() => {
		if (!scoresStore.llmFallback || scoresStore.llmRetryAtMs === null) return;
		const id = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => clearInterval(id);
	});
	const retrySecondsRemaining = $derived(
		scoresStore.llmRetryAtMs !== null
			? Math.max(0, Math.ceil((scoresStore.llmRetryAtMs - now) / 1000))
			: 0
	);

	// scan-vs-previous-scan comparison
	// startScoring snapshots the previous top-of-history into previousScanForComparison,
	// which avoids the brief race where scanHistory[1] is stale before the post-save reload
	// finishes; we fall back to scanHistory[1] for any path that didn't go through startScoring
	// suppressed when viewing a snapshot loaded from history
	const previousScan = $derived(
		scoresStore.isFromHistory
			? null
			: (scoresStore.previousScanForComparison ?? scoresStore.scanHistory[1] ?? null)
	);
	const comparison = $derived(
		previousScan && scoresStore.hasResults
			? computeScanComparison(scoresStore.results, previousScan.results)
			: null
	);
	// fast lookup so each ScoreCard can render its own delta in the grid
	const previousByPlatform = $derived(
		new Map(comparison?.platforms.map((p) => [p.system, p.previous]) ?? [])
	);

	// twitter share intent for the "I improved" moment - the URL points at /share
	// (not the homepage) so twitter's crawler fetches a page whose og:image is a
	// dynamic PNG rendering this user's actual delta and score
	function shareImprovementToTwitter() {
		if (!comparison || comparison.deltaAverage <= 0 || typeof window === 'undefined') return;
		const text = `Just improved my ATS resume score from ${comparison.previousAverage} to ${comparison.currentAverage} (+${comparison.deltaAverage}) using @ATSScreener (free, simulates how Workday, Lever, iCIMS and others actually parse resumes)`;
		const params = new URLSearchParams({
			score: String(scoresStore.averageScore),
			pass: String(scoresStore.passingCount),
			total: String(scoresStore.results.length),
			delta: String(comparison.deltaAverage)
		});
		const sharePageUrl = `${window.location.origin}/share?${params.toString()}`;
		const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(sharePageUrl)}`;
		window.open(intent, '_blank', 'noopener,noreferrer,width=600,height=520');
	}
</script>

{#if scoresStore.hasResults}
	<div class="dashboard">
		<!-- summary header card -->
		<div class="dashboard-header">
			<div class="summary-card">
				<div class="summary-left">
					<div class="summary-score">
						<span class="score-number" style="color: {getAvgColor(avgScore)}">
							{avgScore}
						</span>
						<span class="score-verdict" style="color: {getAvgColor(avgScore)}">
							{getScoreLabel(avgScore)}
						</span>
						<span class="score-label">Average Score</span>
					</div>
				</div>
				<div class="summary-center">
					<div class="mini-bars">
						{#each scoresStore.results as result}
							<div class="mini-bar-item">
								<div class="mini-bar-track">
									<div
										class="mini-bar-fill"
										style="width: {result.overallScore}%; background: {getAvgColor(
											result.overallScore
										)}"
									></div>
								</div>
								<span class="mini-bar-label">{result.system}</span>
							</div>
						{/each}
					</div>
				</div>
				<div class="summary-right">
					<div class="summary-stat">
						<span class="stat-value">{passCount}/{totalCount}</span>
						<span class="stat-label">Systems Passed</span>
					</div>
					<div class="mode-badge">
						{#if scoresStore.mode === 'targeted'}
							<svg
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="12" cy="12" r="10" />
								<circle cx="12" cy="12" r="6" />
								<circle cx="12" cy="12" r="2" />
							</svg>
							Targeted Scoring
						{:else}
							<svg
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
							</svg>
							General Readiness
						{/if}
					</div>
				</div>
			</div>

			{#if comparison}
				{@const positive = comparison.deltaAverage > 0}
				{@const negative = comparison.deltaAverage < 0}
				<div
					class="comparison-band"
					class:up={positive}
					class:down={negative}
					class:flat={!positive && !negative}
				>
					<div class="comparison-headline">
						{#if positive}
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<polyline points="17 6 23 6 23 12" />
								<path d="M1 18l8-8 4 4 9-9" />
							</svg>
						{:else if negative}
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<polyline points="17 18 23 18 23 12" />
								<path d="M1 6l8 8 4-4 9 9" />
							</svg>
						{:else}
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<line x1="5" y1="12" x2="19" y2="12" />
							</svg>
						{/if}
						<span class="comparison-text">
							{#if positive}
								Your score went from <strong>{comparison.previousAverage}</strong> to
								<strong>{comparison.currentAverage}</strong>
								<span class="delta-pill positive">+{comparison.deltaAverage}</span>
							{:else if negative}
								Your score moved from <strong>{comparison.previousAverage}</strong> to
								<strong>{comparison.currentAverage}</strong>
								<span class="delta-pill negative">{comparison.deltaAverage}</span>
							{:else}
								No change since your last scan ({comparison.currentAverage})
							{/if}
						</span>
					</div>
					<div class="comparison-meta">
						{#if comparison.deltaPassing !== 0}
							<span
								class="meta-chip"
								class:positive={comparison.deltaPassing > 0}
								class:negative={comparison.deltaPassing < 0}
							>
								{comparison.previousPassing} → {comparison.currentPassing} passing
							</span>
						{/if}
						{#if comparison.improved > 0}
							<span class="meta-chip positive">{comparison.improved} improved</span>
						{/if}
						{#if comparison.regressed > 0}
							<span class="meta-chip negative">{comparison.regressed} regressed</span>
						{/if}
						{#if comparison.unchanged > 0 && comparison.improved === 0 && comparison.regressed === 0}
							<span class="meta-chip">{comparison.unchanged} unchanged</span>
						{/if}
						{#if positive}
							<button
								class="share-improvement-btn"
								onclick={shareImprovementToTwitter}
								title="Share this improvement on X"
								aria-label="Share improvement on X"
							>
								<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
									/>
								</svg>
								Share +{comparison.deltaAverage}
							</button>
						{/if}
					</div>
				</div>
			{/if}

			{#if scoresStore.llmFallback}
				<div class="fallback-toast">
					<div class="fallback-toast-left">
						<svg
							class="fallback-warn-icon"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#eab308"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
							<line x1="12" y1="9" x2="12" y2="13" />
							<line x1="12" y1="17" x2="12.01" y2="17" />
						</svg>
						<p class="fallback-toast-msg">
							<strong>AI scoring temporarily unavailable</strong> &mdash; looks like too many of you
							want to check your resumes at the same time! i'm covering the API costs myself and
							things are a little overwhelmed right now. your scores below are still accurate
							(rule-based analysis), but the AI suggestions/accuracy won't be as specific. try again
							later, or if you want to help keep this free for everyone
							<span class="fallback-emoji">😅</span>
							{#if retrySecondsRemaining > 0}
								<span class="fallback-retry-hint">
									AI scoring re-available in <strong>{retrySecondsRemaining}s</strong>
								</span>
							{/if}
						</p>
					</div>
					<div class="fallback-toast-actions">
						<a
							href="https://buymeacoffee.com/sunnypatell"
							target="_blank"
							rel="noopener"
							class="fallback-pill coffee-pill"
						>
							<svg
								width="15"
								height="15"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M10 2v2" />
								<path d="M14 2v2" />
								<path
									d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"
								/>
								<path d="M6 2v2" />
							</svg>
							Coffee
						</a>
						<a
							href="https://github.com/sponsors/sunnypatell"
							target="_blank"
							rel="noopener"
							class="fallback-pill sponsor-pill"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path
									d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
								/>
							</svg>
							Sponsor
						</a>
					</div>
				</div>
			{/if}
		</div>

		<!--
			quick wins band: top 3 highest-impact suggestions across all
			platforms (deduplicated). surfaces what to fix first without
			users having to scroll through every per-platform tab. only
			renders when there is at least one structured suggestion.
		-->
		{#if quickWins.length > 0}
			<div class="quick-wins-band">
				<div class="quick-wins-header">
					<svg
						class="quick-wins-icon"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
					</svg>
					<span>Highest-impact fixes</span>
					<span class="quick-wins-subtle">Fix these first</span>
				</div>
				<ol class="quick-wins-list">
					{#each quickWins as win, i (win.summary)}
						<li class="quick-wins-item">
							<span class="quick-wins-rank">{i + 1}</span>
							<span class="quick-wins-summary">{win.summary}</span>
							<span
								class="quick-wins-impact"
								style="color: {impactColorMap[win.impact] ?? '#a1a1aa'};"
							>
								{win.impact}
							</span>
						</li>
					{/each}
				</ol>
			</div>
		{/if}

		<!-- view toggle + export -->
		<div class="toolbar">
			<div class="view-toggle">
				<button
					class="toggle-btn"
					class:active={activeView === 'cards'}
					onclick={() => (activeView = 'cards')}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<rect x="3" y="3" width="7" height="7" />
						<rect x="14" y="3" width="7" height="7" />
						<rect x="3" y="14" width="7" height="7" />
						<rect x="14" y="14" width="7" height="7" />
					</svg>
					Card View
				</button>
				<button
					class="toggle-btn"
					class:active={activeView === 'detailed'}
					onclick={() => (activeView = 'detailed')}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="8" y1="6" x2="21" y2="6" />
						<line x1="8" y1="12" x2="21" y2="12" />
						<line x1="8" y1="18" x2="21" y2="18" />
						<line x1="3" y1="6" x2="3.01" y2="6" />
						<line x1="3" y1="12" x2="3.01" y2="12" />
						<line x1="3" y1="18" x2="3.01" y2="18" />
					</svg>
					Detailed View
				</button>
			</div>

			<div class="toolbar-actions">
				<button
					class="toolbar-btn"
					onclick={() => (showShareBadge = true)}
					title="Share score badge"
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="18" cy="5" r="3" />
						<circle cx="6" cy="12" r="3" />
						<circle cx="18" cy="19" r="3" />
						<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
						<line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
					</svg>
					Share
				</button>
				<button
					class="toolbar-btn"
					onclick={exportResults}
					disabled={isExporting}
					title="Export results as PDF"
				>
					{#if isExporting}
						<svg
							class="export-spinner"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M21 12a9 9 0 1 1-6.219-8.56" />
						</svg>
						Generating...
					{:else}
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="7,10 12,15 17,10" />
							<line x1="12" y1="15" x2="12" y2="3" />
						</svg>
						Export PDF
					{/if}
				</button>
			</div>
		</div>

		<!-- card view: 6 ATS score cards in a grid -->
		{#if activeView === 'cards'}
			<div class="scores-grid">
				{#each scoresStore.results as result (result.system)}
					<ScoreCard {result} previousScore={previousByPlatform.get(result.system)} />
				{/each}
			</div>
		{:else}
			<!-- detailed view: expandable breakdown per system -->
			<div class="breakdowns-list">
				{#each scoresStore.results as result (result.system)}
					<ScoreBreakdown {result} />
				{/each}
			</div>
		{/if}

		<!-- priority focus areas + resume overview -->
		<div class="analysis-grid">
			<WeakestAreas results={scoresStore.results} />
			<ResumeStats />
		</div>

		<!-- keyword analysis (full-width) -->
		<KeywordAnalysis results={scoresStore.results} />

		<!-- deduplicated suggestions as collapsible cards -->
		{#if allSuggestions.length > 0}
			<div class="suggestions-section">
				<div class="suggestions-header">
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
						/>
					</svg>
					<h3 class="suggestions-title">Optimization Suggestions</h3>
				</div>
				<p class="suggestions-subtitle">
					Actionable recommendations based on analysis across all 6 ATS platforms. Click to expand.
				</p>
				<div class="suggestions-cards">
					{#each allSuggestions as suggestion, i}
						{@const structured = isStructured(suggestion)}
						{@const impactColor = structured
							? (impactColorMap[suggestion.impact] ?? '#eab308')
							: impactColorMap[i === 0 ? 'critical' : i === 1 ? 'high' : i < 4 ? 'medium' : 'low']}
						{@const impactLabel = structured
							? suggestion.impact
							: i === 0
								? 'critical'
								: i === 1
									? 'high'
									: i < 4
										? 'medium'
										: 'low'}
						<!-- div+role=button instead of <button> so the nested copy <button>s
						     inside the body don't violate "no interactive descendants in a
						     button" (invalid HTML, broken keyboard/screen-reader semantics) -->
						<div
							class="suggestion-card"
							class:expanded={expandedSuggestion === i}
							role="button"
							tabindex="0"
							aria-expanded={expandedSuggestion === i}
							onclick={() => toggleSuggestion(i)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									toggleSuggestion(i);
								}
							}}
						>
							<div class="suggestion-card-header">
								<div class="suggestion-card-left">
									<span class="suggestion-priority" style="background: {impactColor};">
										{i + 1}
									</span>
									<span class="suggestion-summary">
										{structured
											? suggestion.summary
											: typeof suggestion === 'string'
												? suggestion
												: ''}
									</span>
								</div>
								<div class="suggestion-card-right">
									{#if structured && suggestion.platforms.length > 0}
										<div class="suggestion-platforms">
											{#each suggestion.platforms.slice(0, 3) as platform}
												<span class="platform-chip">{platform}</span>
											{/each}
										</div>
									{/if}
									<span class="suggestion-impact" style="color: {impactColor};">
										{impactLabel}
									</span>
									<svg
										class="suggestion-chevron"
										class:rotated={expandedSuggestion === i}
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<polyline points="6,9 12,15 18,9" />
									</svg>
								</div>
							</div>
							{#if expandedSuggestion === i}
								{@const suggestionText = structured
									? suggestion.summary
									: typeof suggestion === 'string'
										? suggestion
										: ''}
								{@const example = getExampleFor(suggestionText)}
								<div class="suggestion-card-body">
									{#if structured && suggestion.details.length > 0}
										<ul class="suggestion-details">
											{#each suggestion.details as detail}
												<li>{detail}</li>
											{/each}
										</ul>
									{:else if !structured}
										<!-- defensive: if suggestion is somehow a non-string non-structured
										value (e.g. malformed LLM output), interpolating directly would
										render "[object Object]" - same class as the bug fixed in
										ScoreBreakdown. typeof guard keeps the render type-safe -->
										<p>{typeof suggestion === 'string' ? suggestion : ''}</p>
									{/if}
									{#if example}
										<div class="suggestion-example">
											<p class="example-tip">{example.tip}</p>
											<div class="example-pair">
												<div class="example-block before">
													<div class="example-block-header">
														<span class="example-label">Before</span>
														<button
															type="button"
															class="copy-btn"
															class:copied={copiedKey === `${i}-before`}
															onclick={(e) => copyExample(example.before, `${i}-before`, e)}
															aria-label="Copy before text"
														>
															{#if copiedKey === `${i}-before`}
																<svg
																	width="11"
																	height="11"
																	viewBox="0 0 24 24"
																	fill="none"
																	stroke="currentColor"
																	stroke-width="3"
																>
																	<polyline points="20,6 9,17 4,12" />
																</svg>
																Copied
															{:else}
																<svg
																	width="11"
																	height="11"
																	viewBox="0 0 24 24"
																	fill="none"
																	stroke="currentColor"
																	stroke-width="2"
																>
																	<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
																	<path
																		d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
																	/>
																</svg>
																Copy
															{/if}
														</button>
													</div>
													<pre>{example.before}</pre>
												</div>
												<div class="example-block after">
													<div class="example-block-header">
														<span class="example-label">After</span>
														<button
															type="button"
															class="copy-btn"
															class:copied={copiedKey === `${i}-after`}
															onclick={(e) => copyExample(example.after, `${i}-after`, e)}
															aria-label="Copy after text"
														>
															{#if copiedKey === `${i}-after`}
																<svg
																	width="11"
																	height="11"
																	viewBox="0 0 24 24"
																	fill="none"
																	stroke="currentColor"
																	stroke-width="3"
																>
																	<polyline points="20,6 9,17 4,12" />
																</svg>
																Copied
															{:else}
																<svg
																	width="11"
																	height="11"
																	viewBox="0 0 24 24"
																	fill="none"
																	stroke="currentColor"
																	stroke-width="2"
																>
																	<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
																	<path
																		d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
																	/>
																</svg>
																Copy
															{/if}
														</button>
													</div>
													<pre>{example.after}</pre>
												</div>
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}

<ShareBadge bind:open={showShareBadge} />

<style>
	.dashboard {
		margin-top: 2rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.dashboard-header {
		margin-bottom: 0;
	}

	.summary-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 2rem 2.5rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
		gap: 2rem;
	}

	.summary-score {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.score-number {
		font-size: 3.5rem;
		font-weight: 800;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}

	.score-verdict {
		font-size: 0.9rem;
		font-weight: 700;
		margin-top: 0.35rem;
	}

	.score-label {
		font-size: 0.78rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 500;
		margin-top: 0.15rem;
	}

	/* mini bar chart in summary header */
	.summary-center {
		flex: 1;
		max-width: 360px;
	}

	.mini-bars {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.mini-bar-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.mini-bar-track {
		flex: 1;
		height: 4px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 2px;
		overflow: hidden;
	}

	.mini-bar-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.mini-bar-label {
		font-size: 0.65rem;
		color: var(--text-tertiary);
		width: 80px;
		text-align: right;
		font-weight: 500;
	}

	.summary-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.75rem;
	}

	.summary-stat {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.stat-label {
		font-size: 0.82rem;
		color: var(--text-tertiary);
	}

	.mode-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.85rem;
		background: rgba(6, 182, 212, 0.08);
		border: 1px solid rgba(6, 182, 212, 0.2);
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--accent-cyan);
	}

	/* compact toast-style fallback banner */
	.fallback-toast {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 0.75rem;
		padding: 0.75rem 1.25rem;
		background: rgba(234, 179, 8, 0.06);
		border: 1px solid rgba(234, 179, 8, 0.2);
		border-radius: var(--radius-lg);
		backdrop-filter: blur(var(--glass-blur));
		animation: toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes toastSlideIn {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.fallback-toast-left {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		flex: 1;
		min-width: 0;
	}

	.fallback-warn-icon {
		flex-shrink: 0;
		margin-top: 2px;
	}

	.fallback-toast-msg {
		font-size: 0.82rem;
		color: var(--text-secondary);
		line-height: 1.55;
		margin: 0;
	}

	.fallback-toast-msg strong {
		color: #eab308;
		font-weight: 600;
	}

	.fallback-emoji {
		font-size: 1rem;
		vertical-align: middle;
		line-height: 1;
	}

	.fallback-retry-hint {
		display: block;
		margin-top: 0.4rem;
		font-size: 0.78rem;
		color: var(--text-tertiary);
		font-variant-numeric: tabular-nums;
	}

	.fallback-retry-hint strong {
		color: var(--accent-cyan);
		font-weight: 600;
	}

	/* scan-vs-previous comparison band */
	.comparison-band {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem 1rem;
		margin-top: 1rem;
		padding: 0.75rem 1.1rem;
		border-radius: var(--radius-lg);
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		backdrop-filter: blur(12px);
	}

	.comparison-band.up {
		border-color: rgba(34, 197, 94, 0.25);
		background: rgba(34, 197, 94, 0.04);
	}

	.comparison-band.down {
		border-color: rgba(239, 68, 68, 0.22);
		background: rgba(239, 68, 68, 0.04);
	}

	.comparison-band.flat {
		border-color: rgba(255, 255, 255, 0.08);
	}

	.comparison-headline {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.88rem;
		color: var(--text-secondary);
	}

	.comparison-band.up .comparison-headline svg {
		color: #22c55e;
	}

	.comparison-band.down .comparison-headline svg {
		color: #ef4444;
	}

	.comparison-band.flat .comparison-headline svg {
		color: var(--text-tertiary);
	}

	.comparison-text strong {
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.delta-pill {
		display: inline-flex;
		align-items: center;
		padding: 0.1rem 0.5rem;
		margin-left: 0.4rem;
		font-size: 0.78rem;
		font-weight: 600;
		border-radius: var(--radius-full);
		font-variant-numeric: tabular-nums;
	}

	.delta-pill.positive {
		color: #22c55e;
		background: rgba(34, 197, 94, 0.12);
	}

	.delta-pill.negative {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.12);
	}

	.comparison-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.meta-chip {
		padding: 0.18rem 0.55rem;
		font-size: 0.74rem;
		color: var(--text-tertiary);
		border-radius: var(--radius-full);
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.06);
		font-variant-numeric: tabular-nums;
	}

	.meta-chip.positive {
		color: #22c55e;
		border-color: rgba(34, 197, 94, 0.2);
		background: rgba(34, 197, 94, 0.06);
	}

	.meta-chip.negative {
		color: #ef4444;
		border-color: rgba(239, 68, 68, 0.2);
		background: rgba(239, 68, 68, 0.06);
	}

	.share-improvement-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.32rem;
		padding: 0.18rem 0.6rem;
		font-size: 0.74rem;
		font-weight: 600;
		font-family: inherit;
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: var(--radius-full);
		cursor: pointer;
		transition:
			background 0.18s ease,
			border-color 0.18s ease,
			transform 0.18s ease;
	}

	.share-improvement-btn:hover {
		background: rgba(34, 197, 94, 0.12);
		border-color: rgba(34, 197, 94, 0.35);
		transform: translateY(-1px);
	}

	.share-improvement-btn svg {
		opacity: 0.85;
	}

	.fallback-toast-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.fallback-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.4rem 0.85rem;
		font-size: 0.78rem;
		font-weight: 600;
		text-decoration: none;
		border-radius: 999px;
		white-space: nowrap;
		transition:
			transform 0.15s ease,
			background 0.15s ease,
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.fallback-pill:hover {
		transform: translateY(-1px);
	}

	.coffee-pill {
		background: rgba(255, 221, 0, 0.1);
		border: 1px solid rgba(255, 221, 0, 0.3);
		color: #ffdd00;
	}

	.coffee-pill:hover {
		background: rgba(255, 221, 0, 0.18);
		border-color: rgba(255, 221, 0, 0.5);
		box-shadow: 0 0 14px rgba(255, 221, 0, 0.08);
	}

	.sponsor-pill {
		background: rgba(219, 39, 119, 0.1);
		border: 1px solid rgba(219, 39, 119, 0.3);
		color: #ec4899;
	}

	.sponsor-pill:hover {
		background: rgba(219, 39, 119, 0.18);
		border-color: rgba(219, 39, 119, 0.5);
		box-shadow: 0 0 14px rgba(219, 39, 119, 0.08);
	}

	/* quick wins band: surfaces top 3 highest-impact suggestions before
	   the user dives into per-platform detail. visually weighted between
	   the dashboard-header and the toolbar so it feels like a primary
	   recommendation, not a secondary chip. */
	.quick-wins-band {
		margin-bottom: 1.5rem;
		padding: 1.1rem 1.25rem;
		background:
			linear-gradient(135deg, rgba(6, 182, 212, 0.04), rgba(139, 92, 246, 0.03)), var(--glass-bg);
		border: 1px solid rgba(6, 182, 212, 0.18);
		border-radius: var(--radius-lg, 14px);
	}

	.quick-wins-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.85rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: 0.02em;
	}

	.quick-wins-icon {
		color: var(--accent-cyan);
		flex-shrink: 0;
	}

	.quick-wins-subtle {
		margin-left: auto;
		font-size: 0.72rem;
		font-weight: 500;
		color: var(--text-tertiary);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.quick-wins-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.quick-wins-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.55rem 0.75rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: var(--radius-md, 8px);
	}

	.quick-wins-rank {
		flex-shrink: 0;
		width: 22px;
		height: 22px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--accent-cyan);
		background: rgba(6, 182, 212, 0.1);
		border: 1px solid rgba(6, 182, 212, 0.25);
		border-radius: 50%;
	}

	.quick-wins-summary {
		flex: 1;
		font-size: 0.88rem;
		color: var(--text-primary);
		line-height: 1.5;
	}

	.quick-wins-impact {
		flex-shrink: 0;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* toolbar: toggle + export */
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.toolbar-actions {
		display: flex;
		gap: 0.5rem;
	}

	.toolbar-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 1rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		backdrop-filter: blur(var(--glass-blur));
		transition:
			border-color 0.2s ease,
			color 0.2s ease,
			background 0.2s ease;
	}

	.toolbar-btn:hover:not(:disabled) {
		border-color: rgba(6, 182, 212, 0.3);
		color: var(--accent-cyan);
		background: rgba(6, 182, 212, 0.05);
	}

	.toolbar-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.export-spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* view toggle tabs */
	.view-toggle {
		display: flex;
		gap: 0.5rem;
		padding: 0.25rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		width: fit-content;
		backdrop-filter: blur(var(--glass-blur));
	}

	.toggle-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 1rem;
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--text-tertiary);
		cursor: pointer;
		transition:
			background 0.2s ease,
			color 0.2s ease;
	}

	.toggle-btn:hover {
		color: var(--text-secondary);
	}

	.toggle-btn.active {
		background: rgba(6, 182, 212, 0.1);
		color: var(--accent-cyan);
		border: 1px solid rgba(6, 182, 212, 0.2);
	}

	.scores-grid {
		display: grid;
		/* 280px min lets 5 columns fit at ~1400px container width, reducing dead
		   side-space vs the old 340px min that produced only 4 columns */
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.breakdowns-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* two-column analysis grid for chart + stats */
	.analysis-grid {
		display: grid;
		grid-template-columns: 1.4fr 1fr;
		gap: 1.5rem;
	}

	.suggestions-section {
		padding: 1.75rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
	}

	.suggestions-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		color: var(--accent-cyan);
	}

	.suggestions-title {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.suggestions-subtitle {
		font-size: 0.85rem;
		color: var(--text-tertiary);
		margin-bottom: 1.25rem;
	}

	.suggestions-cards {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.suggestion-card {
		width: 100%;
		text-align: left;
		padding: 0;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition:
			border-color 0.2s ease,
			background 0.2s ease;
		overflow: hidden;
		font-family: inherit;
	}

	.suggestion-card:hover {
		border-color: rgba(6, 182, 212, 0.25);
		background: rgba(6, 182, 212, 0.03);
	}

	.suggestion-card.expanded {
		border-color: rgba(6, 182, 212, 0.3);
	}

	.suggestion-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.85rem 1rem;
		gap: 0.75rem;
	}

	.suggestion-card-left {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		min-width: 0;
		flex: 1;
	}

	.suggestion-priority {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		color: #fff;
		font-size: 0.68rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.suggestion-summary {
		font-size: 0.88rem;
		color: var(--text-secondary);
		line-height: 1.4;
	}

	.suggestion-card.expanded .suggestion-summary {
		font-weight: 600;
		color: var(--text-primary);
	}

	.suggestion-platforms {
		display: flex;
		gap: 0.3rem;
	}

	.platform-chip {
		padding: 0.15rem 0.5rem;
		font-size: 0.6rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		background: rgba(6, 182, 212, 0.08);
		border: 1px solid rgba(6, 182, 212, 0.2);
		border-radius: 999px;
		color: var(--accent-cyan);
		white-space: nowrap;
	}

	.suggestion-card-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.suggestion-impact {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.suggestion-chevron {
		color: var(--text-tertiary);
		transition: transform 0.2s ease;
	}

	.suggestion-chevron.rotated {
		transform: rotate(180deg);
	}

	.suggestion-card-body {
		padding: 0 1rem 1rem 3rem;
		animation: cardExpand 0.25s ease;
	}

	.suggestion-card-body p {
		font-size: 0.88rem;
		color: var(--text-secondary);
		line-height: 1.7;
		margin: 0;
	}

	.suggestion-details {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.suggestion-details li {
		font-size: 0.85rem;
		color: var(--text-secondary);
		line-height: 1.6;
		padding-left: 1.1rem;
		position: relative;
	}

	.suggestion-details li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.55rem;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--accent-cyan);
		opacity: 0.6;
	}

	/* before/after example block inside expanded suggestion */
	.suggestion-example {
		margin-top: 1rem;
		padding: 0.85rem 1rem 0.95rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
	}

	.example-tip {
		font-size: 0.78rem;
		color: var(--text-secondary);
		margin: 0 0 0.75rem;
		line-height: 1.55;
	}

	.example-pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem;
	}

	.example-block {
		padding: 0.55rem 0.75rem;
		border-radius: var(--radius-sm);
		border: 1px solid;
		min-width: 0;
	}

	.example-block.before {
		background: rgba(239, 68, 68, 0.05);
		border-color: rgba(239, 68, 68, 0.18);
	}

	.example-block.after {
		background: rgba(34, 197, 94, 0.05);
		border-color: rgba(34, 197, 94, 0.2);
	}

	.example-block-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.35rem;
	}

	.example-label {
		display: block;
		font-size: 0.62rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		opacity: 0.8;
	}

	.copy-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.1rem 0.45rem;
		font-size: 0.66rem;
		font-weight: 600;
		color: var(--text-tertiary);
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: var(--radius-full);
		cursor: pointer;
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			color 0.15s ease;
		user-select: none;
	}

	.copy-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.16);
		color: var(--text-secondary);
	}

	.copy-btn:focus-visible {
		outline: 2px solid var(--accent-cyan);
		outline-offset: 2px;
	}

	.copy-btn.copied {
		color: #22c55e;
		background: rgba(34, 197, 94, 0.1);
		border-color: rgba(34, 197, 94, 0.28);
	}

	.example-block.before .example-label {
		color: #ef4444;
	}

	.example-block.after .example-label {
		color: #22c55e;
	}

	.example-block pre {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.74rem;
		line-height: 1.55;
		color: var(--text-secondary);
		white-space: pre-wrap;
		word-break: break-word;
	}

	@media (max-width: 640px) {
		.example-pair {
			grid-template-columns: 1fr;
		}
	}

	@keyframes cardExpand {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 900px) {
		.analysis-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.summary-card {
			flex-direction: column;
			text-align: center;
			gap: 1.5rem;
			padding: 1.75rem;
		}

		/* keep the suggestions card padded the same as priority focus areas
		   so all dashboard cards have the same outer width and feel uniform. */
		.suggestions-section {
			padding: 1.75rem;
		}

		.summary-center {
			max-width: 100%;
			width: 100%;
		}

		/* mini bars on mobile: bigger labels, taller tracks, fill the column.
		   without these the bars look invisible because the row gaps and
		   the 80px right-aligned label leave the track squeezed thin. */
		.mini-bars {
			gap: 0.55rem;
		}
		.mini-bar-item {
			gap: 0.75rem;
		}
		.mini-bar-track {
			height: 6px;
		}
		.mini-bar-label {
			width: 110px;
			font-size: 0.72rem;
			text-align: left;
		}

		.summary-right {
			align-items: center;
		}

		.summary-score {
			align-items: center;
		}

		.scores-grid {
			grid-template-columns: 1fr;
		}

		/* toolbar: stack view-toggle and actions vertically on narrow screens
		   so the buttons do not squash below 44px wide. */
		.toolbar {
			flex-wrap: wrap;
			gap: 0.75rem;
		}

		.view-toggle {
			width: 100%;
		}

		.toggle-btn {
			flex: 1;
			justify-content: center;
			/* WCAG 2.5.5: ensure buttons are at least 44px tall */
			min-height: 44px;
		}

		.toolbar-actions {
			width: 100%;
			justify-content: stretch;
		}

		.toolbar-btn {
			flex: 1;
			justify-content: center;
			/* WCAG 2.5.5 touch target */
			min-height: 44px;
		}

		.fallback-toast {
			flex-direction: column;
			align-items: stretch;
		}

		.fallback-toast-actions {
			justify-content: center;
		}

		/* quick-wins items: allow text to wrap so long suggestions stay readable */
		.quick-wins-item {
			flex-wrap: wrap;
			gap: 0.5rem 0.75rem;
		}

		.quick-wins-impact {
			margin-left: auto;
		}

		/* suggestion cards: on narrow viewports the right-side cluster (platform
		   chips + impact label + chevron) can exceed the row width and overlap the
		   summary text. wrap the header so the right cluster drops below on
		   overflow, and let the left side truncate text before that happens. */
		.suggestion-card-header {
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		.suggestion-card-left {
			min-width: 0;
		}

		.suggestion-summary {
			overflow: hidden;
			text-overflow: ellipsis;
			display: -webkit-box;
			-webkit-line-clamp: 2;
			line-clamp: 2;
			-webkit-box-orient: vertical;
		}

		/* when the card is expanded on mobile, drop the clamp so the full
		   suggestion text is visible inside the open accordion. */
		.suggestion-card.expanded .suggestion-summary {
			display: block;
			-webkit-line-clamp: unset;
			line-clamp: unset;
			-webkit-box-orient: unset;
			overflow: visible;
			text-overflow: clip;
		}

		/* hide platform chips on very small viewports to reclaim space */
		.suggestion-platforms {
			display: none;
		}
	}
</style>
