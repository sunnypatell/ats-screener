<script lang="ts">
	import { scoresStore } from '$stores/scores.svelte';
	import { authStore } from '$stores/auth.svelte';
	import type { Suggestion, StructuredSuggestion, ScoreResult } from '$engine/scorer/types';

	function getScoreColor(score: number): string {
		if (score >= 80) return '#22c55e';
		if (score >= 60) return '#eab308';
		if (score >= 40) return '#f97316';
		return '#ef4444';
	}

	function getScoreLabel(score: number): string {
		if (score >= 80) return 'Excellent';
		if (score >= 60) return 'Good';
		if (score >= 40) return 'Needs Work';
		return 'Poor';
	}

	function isStructured(s: Suggestion): s is StructuredSuggestion {
		return typeof s === 'object' && 'summary' in s;
	}

	const impactColors: Record<string, string> = {
		critical: '#ef4444',
		high: '#f97316',
		medium: '#eab308',
		low: '#22c55e'
	};

	function getBreakdowns(result: ScoreResult) {
		return [
			{ label: 'Formatting', score: result.breakdown.formatting.score },
			{ label: 'Keywords', score: result.breakdown.keywordMatch.score },
			{ label: 'Sections', score: result.breakdown.sections.score },
			{ label: 'Experience', score: result.breakdown.experience.score },
			{ label: 'Education', score: result.breakdown.education.score }
		];
	}

	function getImpactLabel(suggestion: Suggestion, index: number): string {
		if (isStructured(suggestion)) return suggestion.impact;
		if (index === 0) return 'critical';
		if (index === 1) return 'high';
		if (index < 4) return 'medium';
		return 'low';
	}

	function getImpactColor(suggestion: Suggestion, index: number): string {
		const label = getImpactLabel(suggestion, index);
		return impactColors[label] ?? '#eab308';
	}

	function getSuggestionText(suggestion: Suggestion): string {
		return isStructured(suggestion)
			? suggestion.summary
			: typeof suggestion === 'string'
				? suggestion
				: '';
	}

	const avgScore = $derived(scoresStore.averageScore);
	const passCount = $derived(scoresStore.passingCount);
	const results = $derived(scoresStore.results);
	const mode = $derived(scoresStore.mode);
	const userName = $derived(
		authStore.user?.displayName ?? authStore.user?.email?.split('@')[0] ?? 'Anonymous'
	);
	const scanDate = $derived(
		new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
	);

	const allSuggestions = $derived.by(() => {
		const seen = new Set<string>();
		const suggestions: Suggestion[] = [];
		for (const r of results) {
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
</script>

<!-- off-screen PDF report layout, A4 proportions -->
<div
	id="pdf-report"
	style="
		position: absolute;
		left: -9999px;
		top: -9999px;
		width: 794px;
		min-height: 1123px;
		background: #0a0a1a;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
		color: rgba(255,255,255,0.95);
		padding: 40px 44px;
		box-sizing: border-box;
	"
>
	<!-- header -->
	<div
		style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px;"
	>
		<div>
			<div
				style="font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: rgba(255,255,255,0.95); margin-bottom: 4px;"
			>
				ATS Screening Report
			</div>
			<div style="font-size: 13px; font-weight: 600; color: #06b6d4; letter-spacing: 0.02em;">
				ATS Screener
			</div>
		</div>
		<div style="text-align: right;">
			<div style="font-size: 13px; color: rgba(255,255,255,0.65); margin-bottom: 3px;">
				{userName}
			</div>
			<div style="font-size: 11px; color: rgba(255,255,255,0.4);">
				{scanDate}
			</div>
			<div
				style="
				display: inline-block;
				margin-top: 6px;
				padding: 3px 10px;
				background: rgba(6,182,212,0.08);
				border: 1px solid rgba(6,182,212,0.2);
				border-radius: 999px;
				font-size: 10px;
				font-weight: 600;
				color: #06b6d4;
				letter-spacing: 0.03em;
			"
			>
				{mode === 'targeted' ? 'TARGETED SCORING' : 'GENERAL READINESS'}
			</div>
		</div>
	</div>

	<!-- divider -->
	<div style="height: 1px; background: rgba(255,255,255,0.08); margin-bottom: 24px;"></div>

	<!-- summary section -->
	<div
		style="
		display: flex;
		align-items: center;
		gap: 32px;
		padding: 20px 24px;
		background: rgba(255,255,255,0.03);
		border: 1px solid rgba(255,255,255,0.08);
		border-radius: 16px;
		margin-bottom: 24px;
	"
	>
		<!-- big score -->
		<div style="text-align: center; min-width: 100px;">
			<div
				style="font-size: 52px; font-weight: 800; color: {getScoreColor(avgScore)}; line-height: 1;"
			>
				{avgScore}
			</div>
			<div
				style="font-size: 12px; font-weight: 700; color: {getScoreColor(
					avgScore
				)}; margin-top: 4px;"
			>
				{getScoreLabel(avgScore)}
			</div>
			<div
				style="font-size: 9px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px;"
			>
				Average Score
			</div>
		</div>

		<!-- mini bar chart -->
		<div style="flex: 1;">
			{#each results as result}
				<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
					<span
						style="font-size: 10px; color: rgba(255,255,255,0.4); width: 80px; text-align: right; font-weight: 500;"
					>
						{result.system}
					</span>
					<div
						style="flex: 1; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;"
					>
						<div
							style="height: 100%; width: {result.overallScore}%; background: {getScoreColor(
								result.overallScore
							)}; border-radius: 3px;"
						></div>
					</div>
					<span
						style="font-size: 10px; font-weight: 600; color: {getScoreColor(
							result.overallScore
						)}; width: 24px; text-align: right;"
					>
						{result.overallScore}
					</span>
				</div>
			{/each}
		</div>

		<!-- pass count -->
		<div style="text-align: center; min-width: 80px;">
			<div style="font-size: 28px; font-weight: 700; color: rgba(255,255,255,0.95);">
				{passCount}/{results.length}
			</div>
			<div
				style="font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.04em;"
			>
				Systems Passed
			</div>
		</div>
	</div>

	<!-- per-platform breakdown: 3x2 grid -->
	<div
		style="font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.95); margin-bottom: 12px;"
	>
		Platform Breakdown
	</div>
	<div
		style="
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-bottom: 24px;
	"
	>
		{#each results as result}
			<div
				style="
				width: calc(33.333% - 7px);
				padding: 14px 16px;
				background: rgba(255,255,255,0.03);
				border: 1px solid rgba(255,255,255,0.08);
				border-radius: 12px;
				box-sizing: border-box;
			"
			>
				<!-- platform header -->
				<div
					style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"
				>
					<div>
						<div style="font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.95);">
							{result.system}
						</div>
					</div>
					<div style="display: flex; align-items: center; gap: 6px;">
						<span
							style="
							padding: 2px 7px;
							border-radius: 999px;
							font-size: 8px;
							font-weight: 600;
							text-transform: uppercase;
							letter-spacing: 0.04em;
							background: {result.passesFilter ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'};
							color: {result.passesFilter ? '#22c55e' : '#ef4444'};
							border: 1px solid {result.passesFilter ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'};
						"
						>
							{result.passesFilter ? 'PASS' : 'FAIL'}
						</span>
						<span
							style="font-size: 16px; font-weight: 800; color: {getScoreColor(
								result.overallScore
							)};"
						>
							{result.overallScore}
						</span>
					</div>
				</div>

				<!-- breakdown bars -->
				{#each getBreakdowns(result) as item}
					<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
						<span
							style="font-size: 8px; color: rgba(255,255,255,0.4); width: 58px; text-align: right; font-weight: 500;"
						>
							{item.label}
						</span>
						<div
							style="flex: 1; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden;"
						>
							<div
								style="height: 100%; width: {item.score}%; background: {getScoreColor(
									item.score
								)}; border-radius: 2px;"
							></div>
						</div>
						<span
							style="font-size: 8px; font-weight: 600; color: {getScoreColor(
								item.score
							)}; width: 18px; text-align: right;"
						>
							{item.score}
						</span>
					</div>
				{/each}

				<!-- keyword counts -->
				{#if result.breakdown.keywordMatch.matched.length > 0 || result.breakdown.keywordMatch.missing.length > 0}
					<div
						style="display: flex; gap: 10px; margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.06);"
					>
						<span style="font-size: 8px;">
							<span style="font-weight: 700; color: #22c55e;"
								>{result.breakdown.keywordMatch.matched.length}</span
							>
							<span style="color: rgba(34,197,94,0.7);"> matched</span>
						</span>
						<span style="font-size: 8px;">
							<span style="font-weight: 700; color: #ef4444;"
								>{result.breakdown.keywordMatch.missing.length}</span
							>
							<span style="color: rgba(239,68,68,0.7);"> missing</span>
						</span>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- top suggestions -->
	{#if allSuggestions.length > 0}
		<div
			style="font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.95); margin-bottom: 10px;"
		>
			Top Suggestions
		</div>
		<div
			style="
			padding: 14px 18px;
			background: rgba(255,255,255,0.03);
			border: 1px solid rgba(255,255,255,0.08);
			border-radius: 12px;
			margin-bottom: 24px;
		"
		>
			{#each allSuggestions as suggestion, i}
				<div
					style="
					display: flex;
					align-items: flex-start;
					gap: 10px;
					{i > 0 ? 'margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05);' : ''}
				"
				>
					<span
						style="
						display: inline-flex;
						align-items: center;
						justify-content: center;
						width: 18px;
						height: 18px;
						border-radius: 50%;
						background: {getImpactColor(suggestion, i)};
						color: #fff;
						font-size: 9px;
						font-weight: 700;
						flex-shrink: 0;
						margin-top: 1px;
					"
					>
						{i + 1}
					</span>
					<div style="flex: 1; min-width: 0;">
						<div style="font-size: 11px; color: rgba(255,255,255,0.85); line-height: 1.4;">
							{getSuggestionText(suggestion)}
						</div>
					</div>
					<span
						style="
						font-size: 8px;
						font-weight: 600;
						text-transform: uppercase;
						letter-spacing: 0.04em;
						color: {getImpactColor(suggestion, i)};
						flex-shrink: 0;
						margin-top: 2px;
					"
					>
						{getImpactLabel(suggestion, i)}
					</span>
				</div>
			{/each}
		</div>
	{/if}

	<!-- footer -->
	<div
		style="
		margin-top: auto;
		padding-top: 16px;
		border-top: 1px solid rgba(255,255,255,0.06);
	"
	>
		<div
			style="font-size: 8px; color: rgba(255,255,255,0.3); line-height: 1.6; margin-bottom: 12px;"
		>
			This report is generated by ATS Screener, an independent open-source research tool built by
			Sunny Patel. It is not affiliated with, endorsed by, or representative of any ATS vendor.
			Scores are estimates based on publicly documented platform behaviors and should not be treated
			as official certifications.
		</div>
		<div style="display: flex; justify-content: space-between; align-items: center;">
			<div style="font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.35);">
				ATS Screener by Sunny Patel
			</div>
			<div style="font-size: 9px; color: rgba(255,255,255,0.25);">ats-screener.vercel.app</div>
			<div style="font-size: 9px; color: rgba(255,255,255,0.25);">
				Generated {new Date().toLocaleString('en-US', {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				})}
			</div>
		</div>
	</div>
</div>
