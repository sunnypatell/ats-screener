<script lang="ts">
	import { onMount } from 'svelte';

	const platforms = [
		{ name: 'Workday', vendor: 'Workday Inc.', color: '#06b6d4' },
		{ name: 'Taleo', vendor: 'Oracle', color: '#ef4444' },
		{ name: 'iCIMS', vendor: 'iCIMS', color: '#3b82f6' },
		{ name: 'Greenhouse', vendor: 'Greenhouse', color: '#22c55e' },
		{ name: 'Lever', vendor: 'Employ', color: '#8b5cf6' },
		{ name: 'SuccessFactors', vendor: 'SAP', color: '#f59e0b' }
	];

	// which platform index is currently "active" in the animation
	let activeIndex = $state(0);
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
		const interval = setInterval(() => {
			activeIndex = (activeIndex + 1) % platforms.length;
		}, 2000);
		return () => clearInterval(interval);
	});
</script>

<div class="scanning" class:mounted>
	<div class="scanning-header">
		<div class="pulse-ring">
			<div class="pulse-dot"></div>
		</div>
		<h3>Analyzing your resume across 6 ATS platforms</h3>
		<p class="scanning-hint">
			Evaluating formatting, keywords, sections, experience, and education for each system
		</p>
	</div>

	<div class="platform-grid">
		{#each platforms as platform, i}
			<div
				class="platform-card"
				class:active={i === activeIndex}
				class:done={i < activeIndex}
				style="--platform-color: {platform.color}; --delay: {i * 0.08}s"
			>
				<div class="card-progress" class:filling={i === activeIndex}></div>
				<div class="card-content">
					<span class="platform-name">{platform.name}</span>
					<span class="platform-vendor">{platform.vendor}</span>
				</div>
				<div class="card-status">
					{#if i < activeIndex}
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
						>
							<polyline points="20,6 9,17 4,12" />
						</svg>
					{:else if i === activeIndex}
						<div class="mini-spinner"></div>
					{:else}
						<div class="pending-dot"></div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<p class="scoring-note">
		Powered by Gemini AI with research-backed ATS platform profiles
	</p>
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

	.scanning-header {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	.pulse-ring {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.25rem;
		border-radius: 50%;
		background: rgba(6, 182, 212, 0.08);
		animation: pulse-outer 2s ease-in-out infinite;
	}

	.pulse-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--accent-cyan);
		box-shadow: 0 0 16px rgba(6, 182, 212, 0.5);
		animation: pulse-inner 2s ease-in-out infinite;
	}

	@keyframes pulse-outer {
		0%, 100% {
			transform: scale(1);
			background: rgba(6, 182, 212, 0.08);
		}
		50% {
			transform: scale(1.1);
			background: rgba(6, 182, 212, 0.12);
		}
	}

	@keyframes pulse-inner {
		0%, 100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(0.8);
			opacity: 0.7;
		}
	}

	.scanning-header h3 {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.scanning-hint {
		font-size: 0.9rem;
		color: var(--text-tertiary);
	}

	.platform-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
		max-width: 640px;
		margin: 0 auto;
	}

	.platform-card {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		overflow: hidden;
		transition:
			border-color 0.4s ease,
			background 0.4s ease,
			transform 0.3s ease;
		animation: card-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
		animation-delay: var(--delay);
	}

	@keyframes card-enter {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.95);
		}
	}

	.platform-card.active {
		border-color: var(--platform-color);
		background: color-mix(in srgb, var(--platform-color) 5%, transparent);
		transform: scale(1.02);
	}

	.platform-card.done {
		border-color: rgba(34, 197, 94, 0.25);
	}

	.card-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 2px;
		width: 0;
		background: var(--platform-color);
		border-radius: 1px;
	}

	.card-progress.filling {
		animation: fill-progress 2s linear forwards;
	}

	@keyframes fill-progress {
		from {
			width: 0;
		}
		to {
			width: 100%;
		}
	}

	.card-content {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.platform-name {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.platform-vendor {
		font-size: 0.68rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.card-status {
		flex-shrink: 0;
	}

	.card-status svg {
		color: #22c55e;
	}

	.mini-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid var(--glass-border);
		border-top-color: var(--platform-color);
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.pending-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--glass-border);
	}

	.scoring-note {
		text-align: center;
		margin-top: 2rem;
		font-size: 0.78rem;
		color: var(--text-tertiary);
		opacity: 0.6;
	}

	@media (max-width: 640px) {
		.platform-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 400px) {
		.platform-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
