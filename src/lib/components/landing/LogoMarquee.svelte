<script lang="ts">
	const platforms = [
		{ name: 'Workday', share: '37.1% Fortune 500' },
		{ name: 'Oracle Taleo', share: 'Legacy Enterprise' },
		{ name: 'iCIMS', share: '#1 ATS Globally' },
		{ name: 'Greenhouse', share: 'Tech & Startups' },
		{ name: 'Lever', share: 'Modern Recruiting' },
		{ name: 'SAP SuccessFactors', share: '13.4% Fortune 500' }
	];

	const capabilities = [
		'Parsing Simulation',
		'Keyword Matching',
		'Semantic Analysis',
		'Format Scoring',
		'Section Detection',
		'AI Suggestions',
		'Job Description Matching',
		'Cross-Industry Support'
	];
</script>

<section class="marquee-section">
	<p class="marquee-label">Simulates real enterprise ATS platforms used by 75%+ of Fortune 500</p>

	<!-- primary marquee: platform logos (monochrome wordmarks) -->
	<div class="marquee-container" aria-hidden="true">
		<div class="marquee-track">
			{#each [0, 1] as _copy}
				{#each platforms as platform}
					<div class="marquee-item">
						<span class="logo-wordmark">{platform.name}</span>
						<span class="platform-share">{platform.share}</span>
					</div>
				{/each}
			{/each}
		</div>
	</div>

	<!-- secondary marquee: capabilities scrolling opposite direction -->
	<div class="marquee-container marquee-reverse" aria-hidden="true">
		<div class="marquee-track reverse">
			{#each [0, 1] as _copy}
				{#each capabilities as cap}
					<div class="cap-chip">{cap}</div>
				{/each}
			{/each}
		</div>
	</div>
</section>

<style>
	.marquee-section {
		padding: 4rem 0 2rem;
		text-align: center;
		position: relative;
		overflow: hidden;
	}

	.marquee-label {
		font-size: 0.78rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-weight: 500;
		margin-bottom: 2.5rem;
		padding: 0 2rem;
	}

	.marquee-container {
		position: relative;
		width: 100%;
		overflow: hidden;
		mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
		-webkit-mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
	}

	.marquee-reverse {
		margin-top: 1.5rem;
	}

	.marquee-track {
		display: flex;
		align-items: center;
		width: max-content;
		animation: marquee-scroll 45s linear infinite;
	}

	.marquee-track.reverse {
		animation: marquee-scroll-reverse 30s linear infinite;
	}

	.marquee-track:hover {
		animation-play-state: paused;
	}

	@keyframes marquee-scroll {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}

	@keyframes marquee-scroll-reverse {
		0% {
			transform: translateX(-50%);
		}
		100% {
			transform: translateX(0);
		}
	}

	.marquee-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		padding: 0 3rem;
		flex-shrink: 0;
	}

	/* monochrome wordmark logos - like Vercel/Supabase partner logos */
	.logo-wordmark {
		font-size: 1.8rem;
		font-weight: 800;
		letter-spacing: -0.04em;
		white-space: nowrap;
		color: var(--text-primary);
		opacity: 0.15;
		transition: opacity 0.4s ease;
		user-select: none;
	}

	.marquee-item:hover .logo-wordmark {
		opacity: 0.45;
	}

	.platform-share {
		font-size: 0.62rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-weight: 500;
		white-space: nowrap;
		opacity: 0.35;
		transition: opacity 0.4s ease;
	}

	.marquee-item:hover .platform-share {
		opacity: 0.6;
	}

	/* capability chips */
	.cap-chip {
		flex-shrink: 0;
		padding: 0.4rem 1.1rem;
		margin: 0 0.4rem;
		font-size: 0.72rem;
		font-weight: 500;
		color: var(--text-tertiary);
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-full);
		white-space: nowrap;
		letter-spacing: 0.02em;
		transition:
			border-color 0.3s ease,
			color 0.3s ease;
	}

	.cap-chip:hover {
		border-color: rgba(6, 182, 212, 0.25);
		color: var(--text-secondary);
	}

	@media (max-width: 768px) {
		.marquee-section {
			padding: 2.5rem 0 1rem;
		}

		.logo-wordmark {
			font-size: 1.3rem;
		}

		.marquee-item {
			padding: 0 1.75rem;
		}

		.marquee-reverse {
			margin-top: 1rem;
		}
	}
</style>
