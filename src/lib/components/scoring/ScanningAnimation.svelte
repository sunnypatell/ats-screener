<script lang="ts">
	import { onMount } from 'svelte';

	const platforms = [
		{ name: 'Workday', vendor: 'Workday Inc.', color: '#06b6d4' },
		{ name: 'Taleo', vendor: 'Oracle', color: '#f59e0b' },
		{ name: 'iCIMS', vendor: 'iCIMS', color: '#3b82f6' },
		{ name: 'Greenhouse', vendor: 'Greenhouse', color: '#22c55e' },
		{ name: 'Lever', vendor: 'Employ', color: '#8b5cf6' },
		{ name: 'SuccessFactors', vendor: 'SAP', color: '#f59e0b' }
	];

	// fun rotating status verbs (like Claude Code's style)
	const statusVerbs = [
		'parsing sections',
		'extracting keywords',
		'simulating Workday parser',
		'testing Taleo compatibility',
		'analyzing keyword density',
		'evaluating formatting',
		'checking section structure',
		'running iCIMS Role Fit',
		'measuring experience depth',
		'scanning for ATS pitfalls',
		'matching semantic clusters',
		'computing relevance scores',
		'profiling Greenhouse match',
		'assessing Lever compatibility',
		'calibrating SAP taxonomy',
		'cross-referencing platforms',
		'generating suggestions',
		'finalizing scores'
	];

	let activeIndex = $state(0);
	let verbIndex = $state(0);
	let mounted = $state(false);
	let elapsed = $state(0);

	onMount(() => {
		mounted = true;

		// cycle platforms
		const platformInterval = setInterval(() => {
			activeIndex = (activeIndex + 1) % platforms.length;
		}, 2000);

		// cycle status verbs faster
		const verbInterval = setInterval(() => {
			verbIndex = (verbIndex + 1) % statusVerbs.length;
		}, 1400);

		// elapsed timer
		const timerInterval = setInterval(() => {
			elapsed++;
		}, 1000);

		return () => {
			clearInterval(platformInterval);
			clearInterval(verbInterval);
			clearInterval(timerInterval);
		};
	});
</script>

<div class="scanning" class:mounted>
	<!-- glassmorphic scanning card -->
	<div class="scan-card">
		<!-- animated border -->
		<div class="scan-border"></div>

		<div class="scan-inner">
			<!-- orbiting ring -->
			<div class="orbit-container">
				<div class="orbit-ring">
					<div class="orbit-dot"></div>
				</div>
				<div class="center-icon">
					<svg
						width="28"
						height="28"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
						<polyline points="14,2 14,8 20,8" />
						<line x1="16" y1="13" x2="8" y2="13" />
						<line x1="16" y1="17" x2="8" y2="17" />
						<polyline points="10,9 9,9 8,9" />
					</svg>
				</div>
			</div>

			<h3 class="scan-title">Analyzing across 6 ATS platforms</h3>

			<!-- rotating status verb -->
			<div class="status-verb-container">
				{#key verbIndex}
					<span class="status-verb">{statusVerbs[verbIndex]}</span>
				{/key}
			</div>

			<!-- platform progress row -->
			<div class="platform-row">
				{#each platforms as platform, i}
					<div
						class="platform-pip"
						class:active={i === activeIndex}
						class:done={i < activeIndex}
						style="--pip-color: {platform.color}"
					>
						<div class="pip-fill" class:filling={i === activeIndex}></div>
						{#if i < activeIndex}
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
						{:else if i === activeIndex}
							<div class="pip-spinner"></div>
						{/if}
						<span class="pip-label">{platform.name}</span>
					</div>
				{/each}
			</div>

			<!-- elapsed time -->
			<div class="scan-meta">
				<span class="meta-dot"></span>
				<span>{elapsed}s elapsed</span>
				<span class="meta-sep">&middot;</span>
				<span>Gemini 2.5 Flash Lite</span>
			</div>
		</div>
	</div>
</div>

<style>
	.scanning {
		padding: 3rem 0;
		opacity: 0;
		transform: translateY(20px);
		transition:
			opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.scanning.mounted {
		opacity: 1;
		transform: translateY(0);
	}

	/* glassmorphic card with animated border */
	.scan-card {
		position: relative;
		max-width: 560px;
		margin: 0 auto;
		border-radius: var(--radius-xl);
		overflow: hidden;
	}

	.scan-border {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		padding: 1px;
		background: conic-gradient(
			from var(--border-angle, 0deg),
			transparent 40%,
			rgba(6, 182, 212, 0.6),
			rgba(59, 130, 246, 0.4),
			rgba(139, 92, 246, 0.3),
			transparent 80%
		);
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		animation: rotate-border 3s linear infinite;
	}

	@property --border-angle {
		syntax: '<angle>';
		initial-value: 0deg;
		inherits: false;
	}

	@keyframes rotate-border {
		to {
			--border-angle: 360deg;
		}
	}

	.scan-inner {
		position: relative;
		padding: 2.5rem 2rem;
		background: var(--glass-bg);
		backdrop-filter: blur(var(--glass-blur));
		border-radius: inherit;
		text-align: center;
	}

	/* orbiting ring around center icon */
	.orbit-container {
		position: relative;
		width: 72px;
		height: 72px;
		margin: 0 auto 1.5rem;
	}

	.orbit-ring {
		position: absolute;
		inset: 0;
		border: 1px solid rgba(6, 182, 212, 0.2);
		border-radius: 50%;
		animation: spin 4s linear infinite;
	}

	.orbit-dot {
		position: absolute;
		top: -3px;
		left: 50%;
		transform: translateX(-50%);
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent-cyan);
		box-shadow: 0 0 10px rgba(6, 182, 212, 0.6);
	}

	.center-icon {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--accent-cyan);
		opacity: 0.8;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.scan-title {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
	}

	/* rotating status verb with entrance animation */
	.status-verb-container {
		height: 1.6rem;
		overflow: hidden;
		margin-bottom: 2rem;
	}

	.status-verb {
		display: block;
		font-size: 0.88rem;
		color: var(--accent-cyan);
		font-weight: 500;
		animation: verb-enter 0.35s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes verb-enter {
		from {
			opacity: 0;
			transform: translateY(12px);
			filter: blur(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
			filter: blur(0);
		}
	}

	/* platform progress pips */
	.platform-row {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.platform-pip {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 0.6rem;
		border-radius: var(--radius-md);
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--glass-border);
		min-width: 68px;
		overflow: hidden;
		transition:
			border-color 0.3s ease,
			background 0.3s ease;
	}

	.platform-pip.active {
		border-color: var(--pip-color);
		background: color-mix(in srgb, var(--pip-color) 6%, transparent);
	}

	.platform-pip.done {
		border-color: rgba(34, 197, 94, 0.3);
	}

	.platform-pip.done svg {
		color: #22c55e;
	}

	.pip-fill {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 2px;
		width: 0;
		background: var(--pip-color);
	}

	.pip-fill.filling {
		animation: fill-bar 2s linear forwards;
	}

	@keyframes fill-bar {
		to {
			width: 100%;
		}
	}

	.pip-spinner {
		width: 10px;
		height: 10px;
		border: 1.5px solid var(--glass-border);
		border-top-color: var(--pip-color);
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	.pip-label {
		font-size: 0.58rem;
		font-weight: 600;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		white-space: nowrap;
	}

	.platform-pip.active .pip-label {
		color: var(--text-secondary);
	}

	.platform-pip.done .pip-label {
		color: var(--text-secondary);
	}

	/* meta info */
	.scan-meta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 0.72rem;
		color: var(--text-tertiary);
		opacity: 0.6;
	}

	.meta-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--accent-cyan);
		animation: meta-pulse 1.5s ease-in-out infinite;
	}

	@keyframes meta-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}

	.meta-sep {
		opacity: 0.4;
	}

	@media (max-width: 640px) {
		.platform-row {
			flex-wrap: wrap;
		}

		.platform-pip {
			min-width: 56px;
		}

		.scan-inner {
			padding: 2rem 1.25rem;
		}
	}
</style>
