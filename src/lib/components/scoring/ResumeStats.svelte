<script lang="ts">
	import { localeStore } from '$stores/locale.svelte';
	import { resumeStore } from '$stores/resume.svelte';

	const resume = $derived(resumeStore.resume);
	let showAllSkills = $state(false);

	function methodLabel(method: string): string {
		const pt = localeStore.locale === 'pt-BR';
		const labels: Record<string, [string, string]> = {
			'text-layer': ['Camada de texto', 'Text layer'],
			ocr: ['OCR Tesseract por+eng', 'Tesseract OCR por+eng'],
			docx: ['Estrutura DOCX', 'DOCX structure'],
			'pasted-text': ['Texto colado', 'Pasted text']
		};
		return labels[method]?.[pt ? 0 : 1] ?? method;
	}

	function confidenceClass(value: number): string {
		if (value >= 85) return 'high';
		if (value >= 65) return 'medium';
		return 'low';
	}
</script>

{#if resume}
	<section class="overview">
		<header>
			<div>
				<p class="eyebrow">{localeStore.t('overview.title')}</p>
				<h3>{methodLabel(resume.metadata.extractionMethod)}</h3>
			</div>
			<div class="confidence {confidenceClass(resume.metadata.extractionQuality)}">
				<strong>{resume.metadata.extractionQuality}%</strong>
				<span>{localeStore.t('overview.confidence')}</span>
			</div>
		</header>

		<div class="stats">
			<div><strong>{resume.metadata.wordCount}</strong><span>{localeStore.t('overview.words')}</span></div>
			<div><strong>{resume.metadata.pageCount}</strong><span>{localeStore.t('overview.pages')}</span></div>
			<div><strong>{resume.sections.filter((section) => section.type !== 'unknown').length}</strong><span>{localeStore.t('overview.sections')}</span></div>
			<div><strong>{resume.skills.length}</strong><span>{localeStore.t('overview.skills')}</span></div>
			<div><strong>{resume.experience.length}</strong><span>{localeStore.t('overview.positions')}</span></div>
			<div><strong>{resume.education.length}</strong><span>{localeStore.t('overview.education')}</span></div>
		</div>

		<div class="detail">
			<h4>{localeStore.t('overview.detectedSections')}</h4>
			<div class="chips">
				{#each resume.sections.filter((section) => section.type !== 'unknown') as section}
					<span>✓ {section.type}</span>
				{/each}
			</div>
		</div>

		{#if resume.skills.length > 0}
			<div class="detail">
				<h4>{localeStore.t('overview.extractedSkills')} ({resume.skills.length})</h4>
				<div class="chips skills">
					{#each showAllSkills ? resume.skills : resume.skills.slice(0, 30) as skill}
						<span>{skill}</span>
					{/each}
					{#if resume.skills.length > 30}
						<button type="button" onclick={() => (showAllSkills = !showAllSkills)}>
							{showAllSkills
								? localeStore.locale === 'pt-BR' ? 'mostrar menos' : 'show less'
								: `+${resume.skills.length - 30}`}
						</button>
					{/if}
				</div>
			</div>
		{/if}

		<div class="columns">
			<div class="detail contact">
				<h4>{localeStore.t('overview.contact')}</h4>
				{#if resume.contact.name}<p>◉ {resume.contact.name}</p>{/if}
				{#if resume.contact.email}<p>✉ {resume.contact.email}</p>{/if}
				{#if resume.contact.phone}<p>☎ {resume.contact.phone}</p>{/if}
				{#if resume.contact.location}<p>⌖ {resume.contact.location}</p>{/if}
				{#if resume.contact.linkedin}<p>in {resume.contact.linkedin}</p>{/if}
				{#if resume.contact.github}<p>⌘ {resume.contact.github}</p>{/if}
			</div>

			<div class="detail flags">
				<h4>{localeStore.t('overview.method')}</h4>
				<p class:warning={resume.metadata.hasMultipleColumns}>
					{resume.metadata.hasMultipleColumns ? '⚠' : '✓'} {localeStore.t('overview.layout')}:
					{resume.metadata.hasMultipleColumns ? localeStore.t('overview.yes') : localeStore.t('overview.no')}
				</p>
				<p class:warning={resume.metadata.hasTables}>
					{resume.metadata.hasTables ? '⚠' : '✓'} {localeStore.t('overview.tables')}:
					{resume.metadata.hasTables ? localeStore.t('overview.yes') : localeStore.t('overview.no')}
				</p>
				<p class:warning={resume.metadata.hasImages}>
					{resume.metadata.hasImages ? '⚠' : '✓'} {localeStore.t('overview.images')}:
					{resume.metadata.hasImages ? localeStore.t('overview.yes') : localeStore.t('overview.no')}
				</p>
			</div>
		</div>
	</section>
{/if}

<style>
	.overview {
		padding: 1.4rem;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		background: var(--glass-bg);
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.2rem;
	}

	.eyebrow,
	h4,
	.stats span,
	.confidence span {
		color: var(--text-tertiary);
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	header h3 {
		margin-top: 0.2rem;
		color: var(--text-primary);
		font-size: 1.05rem;
	}

	.confidence {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 82px;
		padding: 0.65rem;
		border: 1px solid currentColor;
		border-radius: var(--radius-lg);
	}

	.confidence strong {
		font-size: 1.25rem;
	}

	.confidence.high {
		color: #22c55e;
	}

	.confidence.medium {
		color: #eab308;
	}

	.confidence.low {
		color: #ef4444;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 0.65rem;
	}

	.stats div {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		padding: 0.75rem 0.35rem;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		background: rgba(255, 255, 255, 0.02);
	}

	.stats strong {
		color: var(--text-primary);
		font-size: 1.2rem;
	}

	.detail {
		margin-top: 1.1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--glass-border);
	}

	h4 {
		margin-bottom: 0.6rem;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.chips span,
	.chips button {
		padding: 0.28rem 0.55rem;
		border: 1px solid rgba(6, 182, 212, 0.25);
		border-radius: 999px;
		background: rgba(6, 182, 212, 0.06);
		color: var(--accent-cyan);
		font-size: 0.72rem;
	}

	.chips button {
		cursor: pointer;
	}

	.columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.contact p,
	.flags p {
		margin-top: 0.4rem;
		overflow-wrap: anywhere;
		color: var(--text-secondary);
		font-size: 0.8rem;
	}

	.flags p {
		color: #22c55e;
	}

	.flags p.warning {
		color: #eab308;
	}

	@media (max-width: 760px) {
		.stats {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.columns {
			grid-template-columns: 1fr;
		}
	}
</style>
