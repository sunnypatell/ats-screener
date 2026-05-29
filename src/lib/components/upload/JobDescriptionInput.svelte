<script lang="ts">
	import { scoresStore } from '$stores/scores.svelte';
	import { resumeStore } from '$stores/resume.svelte';
	import { jdLibrary } from '$stores/jd-library.svelte';
	import { authStore } from '$stores/auth.svelte';
	import { SAMPLE_JD } from '$lib/sample-resume';
	import { logger } from '$lib/log';

	let expanded = $state(false);
	let libraryOpen = $state(false);

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
			try {
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
			} catch (err) {
				// preview is best-effort - if the parser throws (corrupt input,
				// transient import failure), keep the previous parsed state and
				// log so it's grep-able in console without breaking the scan flow
				logger.warn('jd_preview.parse_failed', {
					error: err instanceof Error ? err.message : String(err)
				});
			}
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

	// relative-time formatter - same logic as ScanHistory.svelte
	function formatDate(iso: string): string {
		const d = new Date(iso);
		const now = new Date();
		const diff = now.getTime() - d.getTime();
		const mins = Math.floor(diff / 60_000);
		const hours = Math.floor(diff / 3_600_000);
		const days = Math.floor(diff / 86_400_000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	const MIN_JD_TO_SAVE = 50;

	function saveCurrentJD() {
		const content = scoresStore.jobDescription;
		if (content.trim().length < MIN_JD_TO_SAVE) return;
		const label = window.prompt('label this job description (e.g. "Senior Engineer at Acme")');
		if (label === null) return; // user cancelled
		jdLibrary.save(label, content);
	}

	function loadFromLibrary(content: string) {
		scoresStore.setJobDescription(content);
		libraryOpen = false;
	}

	const savedJDs = $derived(jdLibrary.list);
</script>

<div class="jd-input">
	<button class="jd-toggle" onclick={() => (expanded = !expanded)} aria-expanded={expanded}>
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
			<div class="jd-action-row">
				{#if !scoresStore.hasJobDescription}
					<button
						type="button"
						class="jd-sample-btn"
						onclick={() => scoresStore.setJobDescription(SAMPLE_JD)}
					>
						Try with a sample job description
					</button>
				{/if}
				<!-- the Saved JDs feature is localStorage-only, so it works on
				     self-host (firebase disabled) AND for authenticated users on
				     hosted. anonymous visitors on hosted firebase still don't see
				     it: signing in is required for any scan-adjacent persistence. -->
				{#if authStore.disabled || authStore.isAuthenticated}
					<button
						type="button"
						class="jd-save-btn"
						disabled={scoresStore.jobDescription.trim().length < MIN_JD_TO_SAVE}
						onclick={saveCurrentJD}
					>
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
							<polyline points="17,21 17,13 7,13 7,21" />
							<polyline points="7,3 7,8 15,8" />
						</svg>
						Save JD
					</button>
					{#if savedJDs.length > 0}
						<div class="jd-library-wrap">
							<button
								type="button"
								class="jd-library-btn"
								aria-expanded={libraryOpen}
								onclick={() => (libraryOpen = !libraryOpen)}
							>
								<svg
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
									<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
								</svg>
								Saved JDs ({savedJDs.length})
							</button>
							{#if libraryOpen}
								<div class="jd-library-dropdown" role="listbox" aria-label="Saved job descriptions">
									{#each savedJDs as entry (entry.id)}
										<div class="jd-library-item" role="option" aria-selected="false">
											<button
												type="button"
												class="jd-library-load"
												onclick={() => loadFromLibrary(entry.content)}
											>
												<span class="jd-library-label">{entry.label}</span>
												<span class="jd-library-time">{formatDate(entry.savedAt)}</span>
											</button>
											<button
												type="button"
												class="jd-library-delete"
												aria-label="Delete {entry.label}"
												onclick={() => jdLibrary.remove(entry.id)}
											>
												<svg
													width="12"
													height="12"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2.5"
												>
													<line x1="18" y1="6" x2="6" y2="18" />
													<line x1="6" y1="6" x2="18" y2="18" />
												</svg>
											</button>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				{/if}
			</div>
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

	.jd-action-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.6rem;
	}

	.jd-sample-btn {
		display: inline-flex;
		align-items: center;
		padding: 0.4rem 0.85rem;
		background: rgba(6, 182, 212, 0.06);
		color: var(--accent-cyan);
		border: 1px solid rgba(6, 182, 212, 0.2);
		border-radius: var(--radius-md);
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}

	.jd-sample-btn:hover {
		background: rgba(6, 182, 212, 0.12);
		border-color: rgba(6, 182, 212, 0.35);
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

	@media (max-width: 640px) {
		/* bump action-row buttons to 44px tall on mobile to meet WCAG 2.5.5 */
		.jd-sample-btn,
		.jd-save-btn,
		.jd-library-btn {
			min-height: 44px;
		}

		/* JD textarea: 8 rows eats the whole screen on a 375px phone.
		   5 rows keeps the placeholder visible and shows text without hiding the
		   action row below the fold. */
		.jd-textarea {
			min-height: 110px;
		}
	}

	/* save JD button */
	.jd-save-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.4rem 0.85rem;
		background: rgba(6, 182, 212, 0.06);
		color: var(--accent-cyan);
		border: 1px solid rgba(6, 182, 212, 0.2);
		border-radius: var(--radius-md);
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			opacity 0.15s ease;
	}

	.jd-save-btn:hover:not(:disabled) {
		background: rgba(6, 182, 212, 0.12);
		border-color: rgba(6, 182, 212, 0.35);
	}

	.jd-save-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	/* library pill and dropdown */
	.jd-library-wrap {
		position: relative;
	}

	.jd-library-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.4rem 0.85rem;
		background: rgba(255, 255, 255, 0.04);
		color: var(--text-secondary);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			color 0.15s ease;
	}

	.jd-library-btn:hover,
	.jd-library-btn[aria-expanded='true'] {
		background: rgba(255, 255, 255, 0.07);
		border-color: rgba(255, 255, 255, 0.15);
		color: var(--text-primary);
	}

	.jd-library-dropdown {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		z-index: 50;
		min-width: 280px;
		/* on narrow viewports the dropdown must not overflow the screen edge.
		   clamp to the viewport width minus 2rem breathing room. right: 0
		   anchors the right edge when the left-side anchor would push it off-screen. */
		max-width: min(360px, calc(100vw - 2rem));
		right: 0;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		backdrop-filter: blur(var(--glass-blur));
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		overflow: hidden;
		animation: previewIn 0.15s ease;
	}

	.jd-library-item {
		display: flex;
		align-items: center;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	}

	.jd-library-item:last-child {
		border-bottom: none;
	}

	.jd-library-load {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.15rem;
		padding: 0.65rem 0.85rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background 0.12s ease;
	}

	.jd-library-load:hover {
		background: rgba(6, 182, 212, 0.06);
	}

	.jd-library-label {
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 240px;
	}

	.jd-library-time {
		font-size: 0.72rem;
		color: var(--text-tertiary);
		font-variant-numeric: tabular-nums;
	}

	.jd-library-delete {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		/* 44x44 meets WCAG 2.5.5 touch target size recommendation */
		width: 44px;
		height: 44px;
		margin-right: 0.15rem;
		background: none;
		border: none;
		border-radius: var(--radius-md);
		color: var(--text-tertiary);
		cursor: pointer;
		transition:
			background 0.12s ease,
			color 0.12s ease;
	}

	.jd-library-delete:hover {
		background: rgba(239, 68, 68, 0.12);
		color: #ef4444;
	}
</style>
