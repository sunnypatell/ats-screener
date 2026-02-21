<script lang="ts">
	import { resumeStore } from '$stores/resume.svelte';

	const resume = $derived(resumeStore.resume);
	let skillsExpanded = $state(false);
</script>

{#if resume}
	<div class="resume-stats">
		<div class="stats-header">
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
				<polyline points="14,2 14,8 20,8" />
			</svg>
			<h3>Resume Overview</h3>
		</div>

		<!-- quick stats grid -->
		<div class="stats-grid">
			<div class="stat-item">
				<span class="stat-value">{resume.metadata.wordCount}</span>
				<span class="stat-label">Words</span>
			</div>
			<div class="stat-item">
				<span class="stat-value">{resume.metadata.pageCount}</span>
				<span class="stat-label">{resume.metadata.pageCount === 1 ? 'Page' : 'Pages'}</span>
			</div>
			<div class="stat-item">
				<span class="stat-value">{resume.sections.length}</span>
				<span class="stat-label">Sections</span>
			</div>
			<div class="stat-item">
				<span class="stat-value">{resume.skills.length}</span>
				<span class="stat-label">Skills Found</span>
			</div>
			<div class="stat-item">
				<span class="stat-value">{resume.experience.length}</span>
				<span class="stat-label">Positions</span>
			</div>
			<div class="stat-item">
				<span class="stat-value">{resume.education.length}</span>
				<span class="stat-label">Education</span>
			</div>
		</div>

		<!-- detected sections -->
		<div class="section-detail">
			<h4>Detected Sections</h4>
			<div class="section-chips">
				{#each resume.sections as section}
					<span class="section-chip">
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
						>
							<polyline points="20,6 9,17 4,12" />
						</svg>
						{section.type}
					</span>
				{/each}
			</div>
		</div>

		<!-- extracted skills -->
		{#if resume.skills.length > 0}
			<div class="section-detail">
				<h4>Extracted Skills ({resume.skills.length})</h4>
				<div class="skill-chips">
					{#each skillsExpanded ? resume.skills : resume.skills.slice(0, 30) as skill}
						<span class="skill-chip">{skill}</span>
					{/each}
					{#if !skillsExpanded && resume.skills.length > 30}
						<button class="skill-chip more" onclick={() => (skillsExpanded = true)}
							>+{resume.skills.length - 30} more</button
						>
					{/if}
					{#if skillsExpanded && resume.skills.length > 30}
						<button class="skill-chip more" onclick={() => (skillsExpanded = false)}
							>show less</button
						>
					{/if}
				</div>
			</div>
		{/if}

		<!-- contact info -->
		{#if resume.contact}
			<div class="section-detail">
				<h4>Contact Info</h4>
				<div class="contact-items">
					{#if resume.contact.name}
						<div class="contact-item">
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
								<circle cx="12" cy="7" r="4" />
							</svg>
							<span>{resume.contact.name}</span>
						</div>
					{/if}
					{#if resume.contact.email}
						<a class="contact-item contact-link" href="mailto:{resume.contact.email}">
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
								/>
								<polyline points="22,6 12,13 2,6" />
							</svg>
							<span>{resume.contact.email}</span>
						</a>
					{/if}
					{#if resume.contact.phone}
						<a
							class="contact-item contact-link"
							href="tel:{resume.contact.phone.replace(/[\s()-]/g, '')}"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
								/>
							</svg>
							<span>{resume.contact.phone}</span>
						</a>
					{/if}
					{#if resume.contact.linkedin}
						<a
							class="contact-item contact-link"
							href={resume.contact.linkedin.startsWith('http')
								? resume.contact.linkedin
								: `https://${resume.contact.linkedin}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
								/>
							</svg>
							<span>{resume.contact.linkedin}</span>
						</a>
					{/if}
					{#if resume.contact.github}
						<a
							class="contact-item contact-link"
							href={resume.contact.github.startsWith('http')
								? resume.contact.github
								: `https://${resume.contact.github}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
								/>
							</svg>
							<span>{resume.contact.github}</span>
						</a>
					{/if}
					{#if resume.contact.website}
						<a
							class="contact-item contact-link"
							href={resume.contact.website.startsWith('http')
								? resume.contact.website
								: `https://${resume.contact.website}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="12" cy="12" r="10" />
								<line x1="2" y1="12" x2="22" y2="12" />
								<path
									d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
								/>
							</svg>
							<span>{resume.contact.website}</span>
						</a>
					{/if}
				</div>
			</div>
		{/if}

		<!-- format warnings -->
		<div class="format-flags">
			<div class="flag" class:flagged={resume.metadata.hasMultipleColumns}>
				{#if resume.metadata.hasMultipleColumns}
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#eab308"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="8" x2="12" y2="12" />
						<line x1="12" y1="16" x2="12.01" y2="16" />
					</svg>
				{:else}
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#22c55e"
						stroke-width="2.5"
					>
						<polyline points="20,6 9,17 4,12" />
					</svg>
				{/if}
				<span>Multi-Column Layout</span>
			</div>
			<div class="flag" class:flagged={resume.metadata.hasTables}>
				{#if resume.metadata.hasTables}
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#eab308"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="8" x2="12" y2="12" />
						<line x1="12" y1="16" x2="12.01" y2="16" />
					</svg>
				{:else}
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#22c55e"
						stroke-width="2.5"
					>
						<polyline points="20,6 9,17 4,12" />
					</svg>
				{/if}
				<span>Tables Detected</span>
			</div>
			<div class="flag" class:flagged={resume.metadata.hasImages}>
				{#if resume.metadata.hasImages}
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#eab308"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="8" x2="12" y2="12" />
						<line x1="12" y1="16" x2="12.01" y2="16" />
					</svg>
				{:else}
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#22c55e"
						stroke-width="2.5"
					>
						<polyline points="20,6 9,17 4,12" />
					</svg>
				{/if}
				<span>Images/Graphics</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.resume-stats {
		padding: 1.75rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
	}

	.stats-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		color: var(--accent-cyan);
	}

	.stats-header h3 {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 800;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	.stat-label {
		font-size: 0.7rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-top: 0.25rem;
	}

	.section-detail {
		margin-bottom: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid var(--glass-border);
	}

	.section-detail h4 {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 0.6rem;
	}

	.section-chips,
	.skill-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.section-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.2rem 0.6rem;
		background: rgba(34, 197, 94, 0.08);
		color: #22c55e;
		border: 1px solid rgba(34, 197, 94, 0.15);
		border-radius: var(--radius-full);
		font-size: 0.72rem;
		font-weight: 500;
		text-transform: capitalize;
	}

	.skill-chip {
		padding: 0.2rem 0.6rem;
		background: rgba(6, 182, 212, 0.08);
		color: var(--accent-cyan);
		border: 1px solid rgba(6, 182, 212, 0.15);
		border-radius: var(--radius-full);
		font-size: 0.72rem;
		font-weight: 500;
	}

	.skill-chip.more {
		background: rgba(255, 255, 255, 0.03);
		color: var(--text-tertiary);
		border-color: var(--glass-border);
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			color 0.15s ease;
		font-family: inherit;
	}

	.skill-chip.more:hover {
		border-color: rgba(6, 182, 212, 0.3);
		color: var(--accent-cyan);
	}

	.contact-items {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.contact-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.contact-item svg {
		flex-shrink: 0;
		color: var(--text-tertiary);
	}

	.contact-link {
		text-decoration: none;
		transition: color 0.15s ease;
		cursor: pointer;
	}

	.contact-link:hover {
		color: var(--accent-cyan);
	}

	.contact-link:hover svg {
		color: var(--accent-cyan);
	}

	.format-flags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid var(--glass-border);
	}

	.flag {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.78rem;
		color: var(--text-tertiary);
	}

	.flag.flagged {
		color: #eab308;
	}

	@media (max-width: 480px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
