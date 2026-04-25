<script lang="ts">
	import { scoresStore } from '$stores/scores.svelte';
	import { resumeStore } from '$stores/resume.svelte';

	let expanded = $state(false);

	// debounced JD value drives the live skill-extraction preview - parsing on
	// every keystroke would re-tokenize a long JD on every char and feel laggy
	const DEBOUNCE_MS = 400;
	const MIN_JD_LENGTH_FOR_PREVIEW = 50;
	let debouncedJD = $state('');
	$effect(() => {
		const v = scoresStore.jobDescription;
		const id = setTimeout(() => {
			debouncedJD = v;
		}, DEBOUNCE_MS);
		return () => clearTimeout(id);
	});

	type ParsedJD = {
		extractedSkills: string[];
		requiredSkills: string[];
		experienceLevel: string;
		roleType: string;
		industryContext: string;
	};
	let parsed = $state<ParsedJD | null>(null);

	// dynamically import the parser only when there's enough JD to preview - avoids
	// pulling compromise/skills-taxonomy into the layout chunk for users who never
	// open the JD section
	$effect(() => {
		const v = debouncedJD;
		if (v.length < MIN_JD_LENGTH_FOR_PREVIEW) {
			parsed = null;
			return;
		}
		let cancelled = false;
		(async () => {
			const { parseJobDescription } = await import('$engine/job-parser');
			if (cancelled) return;
			const result = parseJobDescription(v);
			if (cancelled) return;
			parsed = {
				extractedSkills: result.extractedSkills.slice(0, 12),
				requiredSkills: result.requiredSkills,
				experienceLevel: result.experienceLevel,
				roleType: result.roleType,
				industryContext: result.industryContext
			};
		})();
		return () => {
			cancelled = true;
		};
	});

	const resumeSkillsSet = $derived(
		new Set((resumeStore.resume?.skills ?? []).map((s) => s.toLowerCase()))
	);

	const matchSummary = $derived.by(() => {
		if (!parsed || resumeSkillsSet.size === 0) return null;
		const matched = parsed.extractedSkills.filter((s) => resumeSkillsSet.has(s.toLowerCase()));
		return {
			matched: matched.length,
			total: parsed.extractedSkills.length,
			matchedSet: new Set(matched.map((s) => s.toLowerCase()))
		};
	});

	function isMatched(skill: string): boolean {
		return matchSummary?.matchedSet.has(skill.toLowerCase()) ?? false;
	}
</script>

<div class="jd-input">
	<button class="jd-toggle" onclick={() => (expanded = !expanded)}>
		<span class="toggle-icon" class:expanded>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<polyline points="6,9 12,15 18,9" />
			</svg>
		</span>
		{#if expanded}
			Hide Job Description (Optional)
		{:else}
			Add Job Description for Targeted Scoring
		{/if}
	</button>

	{#if expanded}
		<div class="jd-textarea-wrapper">
			<textarea
				class="jd-textarea"
				placeholder="Paste the job description here for targeted keyword matching and industry-specific scoring..."
				rows="8"
				value={scoresStore.jobDescription}
				oninput={(e) => scoresStore.setJobDescription((e.target as HTMLTextAreaElement).value)}
			></textarea>
			{#if scoresStore.hasJobDescription}
				<div class="jd-status">
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
						<polyline points="22,4 12,14.01 9,11.01" />
					</svg>
					<span>Targeted mode active. Your resume will be scored against this specific job.</span>
				</div>
			{/if}

			{#if parsed && parsed.extractedSkills.length > 0}
				<div class="jd-preview">
					<div class="jd-preview-header">
						<span class="preview-label">Detected from JD</span>
						{#if matchSummary}
							<span
								class="match-summary"
								class:strong={matchSummary.matched / Math.max(matchSummary.total, 1) >= 0.6}
							>
								<strong>{matchSummary.matched}</strong> of
								<strong>{matchSummary.total}</strong> in your resume
							</span>
						{/if}
					</div>

					<div class="jd-meta-chips">
						{#if parsed.roleType !== 'other'}
							<span class="meta-chip">{parsed.roleType}</span>
						{/if}
						{#if parsed.industryContext !== 'general'}
							<span class="meta-chip">{parsed.industryContext}</span>
						{/if}
						<span class="meta-chip">{parsed.experienceLevel}</span>
					</div>

					<div class="skill-chips">
						{#each parsed.extractedSkills as skill}
							<span class="skill-chip" class:matched={isMatched(skill)}>
								{#if isMatched(skill)}
									<svg
										width="10"
										height="10"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="3"
									>
										<polyline points="20,6 9,17 4,12" />
									</svg>
								{/if}
								{skill}
							</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.jd-input {
		margin-top: 1.5rem;
	}

	.jd-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.8rem 1.25rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		width: 100%;
		backdrop-filter: blur(var(--glass-blur));
		transition:
			border-color 0.2s ease,
			color 0.2s ease;
	}

	.jd-toggle:hover {
		border-color: var(--accent-cyan);
		color: var(--text-primary);
	}

	.toggle-icon {
		transition: transform 0.2s ease;
		display: inline-flex;
		color: var(--accent-cyan);
	}

	.toggle-icon.expanded {
		transform: rotate(180deg);
	}

	.jd-textarea-wrapper {
		margin-top: 1rem;
	}

	.jd-textarea {
		width: 100%;
		padding: 1.25rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		color: var(--text-primary);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		line-height: 1.6;
		resize: vertical;
		backdrop-filter: blur(var(--glass-blur));
		transition: border-color 0.2s ease;
	}

	.jd-textarea:focus {
		outline: none;
		border-color: var(--accent-cyan);
		box-shadow: 0 0 20px rgba(6, 182, 212, 0.08);
	}

	.jd-textarea::placeholder {
		color: var(--text-tertiary);
	}

	.jd-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.75rem;
		font-size: 0.85rem;
		color: var(--accent-cyan);
		padding: 0.5rem 0.75rem;
		background: rgba(6, 182, 212, 0.05);
		border: 1px solid rgba(6, 182, 212, 0.15);
		border-radius: var(--radius-md);
	}

	/* live preview block: detected role / industry / skills from the typed JD */
	.jd-preview {
		margin-top: 0.85rem;
		padding: 0.85rem 1rem 1rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		animation: previewIn 0.25s ease;
	}

	@keyframes previewIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
	}

	.jd-preview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.65rem;
	}

	.preview-label {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-tertiary);
	}

	.match-summary {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		font-variant-numeric: tabular-nums;
	}

	.match-summary strong {
		color: var(--text-secondary);
		font-weight: 600;
	}

	.match-summary.strong strong {
		color: #22c55e;
	}

	.jd-meta-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-bottom: 0.6rem;
	}

	.meta-chip {
		padding: 0.15rem 0.5rem;
		font-size: 0.68rem;
		font-weight: 500;
		text-transform: capitalize;
		color: var(--text-tertiary);
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: var(--radius-full);
	}

	.skill-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.skill-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.18rem 0.55rem;
		font-size: 0.74rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: rgba(6, 182, 212, 0.06);
		border: 1px solid rgba(6, 182, 212, 0.15);
		border-radius: var(--radius-full);
	}

	.skill-chip.matched {
		color: #22c55e;
		background: rgba(34, 197, 94, 0.1);
		border-color: rgba(34, 197, 94, 0.28);
	}
</style>
