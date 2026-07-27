<script lang="ts">
	import { SAMPLE_JD } from '$lib/sample-resume';
	import { localeStore } from '$stores/locale.svelte';
	import { resumeStore } from '$stores/resume.svelte';
	import { scoresStore } from '$stores/scores.svelte';

	let expanded = $state(false);
	let parsed = $state<{
		extractedSkills: string[];
		requiredSkills: string[];
		experienceLevel: string;
		roleType: string;
		industryContext: string;
	} | null>(null);
	let debounce: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		const value = scoresStore.jobDescription;
		clearTimeout(debounce);
		if (value.trim().length < 50) {
			parsed = null;
			return;
		}
		debounce = setTimeout(async () => {
			try {
				const { parseJobDescription } = await import('$engine/job-parser');
				const result = parseJobDescription(value);
				parsed = {
					extractedSkills: result.extractedSkills.slice(0, 16),
					requiredSkills: result.requiredSkills,
					experienceLevel: result.experienceLevel,
					roleType: result.roleType,
					industryContext: result.industryContext
				};
			} catch {
				parsed = null;
			}
		}, 350);
		return () => clearTimeout(debounce);
	});

	const resumeSkills = $derived(
		new Set((resumeStore.resume?.skills ?? []).map((skill) => skill.toLocaleLowerCase()))
	);

	function matched(skill: string): boolean {
		return resumeSkills.has(skill.toLocaleLowerCase());
	}

	const matchCount = $derived(parsed?.extractedSkills.filter(matched).length ?? 0);
</script>

<div class="job-description">
	<button class="toggle" type="button" onclick={() => (expanded = !expanded)} aria-expanded={expanded}>
		<span aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
		{expanded ? localeStore.t('jd.hide') : localeStore.t('jd.show')}
	</button>

	{#if expanded}
		<div class="panel">
			<textarea
				rows="9"
				placeholder={localeStore.t('jd.placeholder')}
				value={scoresStore.jobDescription}
				oninput={(event) =>
					scoresStore.setJobDescription((event.target as HTMLTextAreaElement).value)}
			></textarea>

			<div class="actions">
				{#if !scoresStore.hasJobDescription}
					<button type="button" onclick={() => scoresStore.setJobDescription(SAMPLE_JD)}>
						{localeStore.locale === 'pt-BR' ? 'Usar vaga de exemplo' : 'Use sample job'}
					</button>
				{/if}
				{#if scoresStore.hasJobDescription}
					<button type="button" onclick={() => scoresStore.setJobDescription('')}>
						{localeStore.locale === 'pt-BR' ? 'Limpar' : 'Clear'}
					</button>
				{/if}
			</div>

			{#if scoresStore.hasJobDescription}
				<p class="active">✓ {localeStore.t('jd.active')}</p>
			{/if}

			{#if parsed && parsed.extractedSkills.length > 0}
				<div class="preview">
					<div class="preview-header">
						<strong>{localeStore.t('jd.detected')}</strong>
						<span>{matchCount}/{parsed.extractedSkills.length} {localeStore.t('jd.inResume')}</span>
					</div>
					<div class="meta">
						{#if parsed.roleType !== 'other'}<span>{parsed.roleType}</span>{/if}
						{#if parsed.industryContext !== 'general'}<span>{parsed.industryContext}</span>{/if}
						<span>{parsed.experienceLevel}</span>
					</div>
					<div class="skills">
						{#each parsed.extractedSkills as skill}
							<span class:matched={matched(skill)}>{matched(skill) ? '✓ ' : ''}{skill}</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.job-description {
		margin-top: 1rem;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		width: 100%;
		padding: 0.9rem 1rem;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		background: var(--glass-bg);
		color: var(--text-secondary);
		cursor: pointer;
		font-weight: 600;
		text-align: left;
	}

	.toggle:hover {
		border-color: rgba(6, 182, 212, 0.45);
	}

	.panel {
		margin-top: 0.65rem;
		padding: 1rem;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		background: var(--glass-bg);
	}

	textarea {
		width: 100%;
		resize: vertical;
		padding: 0.9rem;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		background: rgba(0, 0, 0, 0.18);
		color: var(--text-primary);
		font: inherit;
		line-height: 1.5;
	}

	textarea:focus {
		outline: 1px solid var(--accent-cyan);
		border-color: var(--accent-cyan);
	}

	.actions {
		display: flex;
		gap: 0.6rem;
		margin-top: 0.7rem;
	}

	.actions button {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--accent-cyan);
		cursor: pointer;
	}

	.active {
		margin-top: 0.8rem;
		color: #22c55e;
		font-size: 0.82rem;
	}

	.preview {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--glass-border);
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		color: var(--text-secondary);
		font-size: 0.8rem;
	}

	.meta,
	.skills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		margin-top: 0.65rem;
	}

	.meta span,
	.skills span {
		padding: 0.25rem 0.55rem;
		border: 1px solid var(--glass-border);
		border-radius: 999px;
		color: var(--text-tertiary);
		font-size: 0.72rem;
	}

	.skills span.matched {
		border-color: rgba(34, 197, 94, 0.4);
		background: rgba(34, 197, 94, 0.08);
		color: #22c55e;
	}
</style>
