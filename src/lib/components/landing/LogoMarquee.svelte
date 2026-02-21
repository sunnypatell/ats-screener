<script lang="ts">
	// companies that use the 6 ATS platforms we simulate
	// these are factual - each company is known to use one of the 6 systems
	const companies = [
		{ name: 'Amazon', style: 'font-weight:900;letter-spacing:-0.04em;font-size:1.5rem;' },
		{ name: 'Google', style: 'font-weight:500;letter-spacing:-0.01em;font-size:1.5rem;' },
		{ name: 'Salesforce', style: 'font-weight:700;letter-spacing:-0.03em;font-size:1.4rem;' },
		{ name: 'Deloitte', style: 'font-weight:700;letter-spacing:0.02em;font-size:1.4rem;' },
		{ name: 'Shopify', style: 'font-weight:800;letter-spacing:-0.03em;font-size:1.5rem;' },
		{ name: 'JP Morgan', style: 'font-weight:400;letter-spacing:0.04em;font-size:1.35rem;text-transform:uppercase;' },
		{ name: 'Meta', style: 'font-weight:600;letter-spacing:-0.02em;font-size:1.5rem;' },
		{ name: 'Apple', style: 'font-weight:500;letter-spacing:-0.01em;font-size:1.5rem;' },
		{ name: 'Netflix', style: 'font-weight:900;letter-spacing:-0.02em;font-size:1.45rem;' },
		{ name: 'Goldman Sachs', style: 'font-weight:400;letter-spacing:0.03em;font-size:1.3rem;' },
		{ name: 'Microsoft', style: 'font-weight:600;letter-spacing:-0.02em;font-size:1.45rem;' },
		{ name: 'Spotify', style: 'font-weight:700;letter-spacing:-0.03em;font-size:1.5rem;' }
	];
</script>

<section class="marquee-section">
	<p class="marquee-label">These companies use the ATS platforms we simulate</p>

	<div class="marquee-container" aria-hidden="true">
		<div class="marquee-track">
			{#each { length: 3 } as _, copy}
				{#each companies as company}
					<span class="logo-wordmark" style={company.style}>{company.name}</span>
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
		font-size: 0.7rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.14em;
		font-weight: 500;
		margin-bottom: 2rem;
		padding: 0 2rem;
		opacity: 0.5;
	}

	.marquee-container {
		position: relative;
		width: 100%;
		overflow: hidden;
		/* smooth edge fade */
		mask-image: linear-gradient(
			90deg,
			transparent 0%,
			black 8%,
			black 92%,
			transparent 100%
		);
		-webkit-mask-image: linear-gradient(
			90deg,
			transparent 0%,
			black 8%,
			black 92%,
			transparent 100%
		);
	}

	.marquee-track {
		display: flex;
		align-items: center;
		gap: 3.5rem;
		width: max-content;
		animation: marquee-scroll 60s linear infinite;
		will-change: transform;
	}

	.marquee-track:hover {
		animation-play-state: paused;
	}

	@keyframes marquee-scroll {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(calc(-100% / 3));
		}
	}

	.logo-wordmark {
		white-space: nowrap;
		color: var(--text-primary);
		opacity: 0.12;
		transition: opacity 0.5s ease;
		user-select: none;
		flex-shrink: 0;
		line-height: 1;
	}

	.logo-wordmark:hover {
		opacity: 0.35;
	}

	@media (max-width: 768px) {
		.marquee-section {
			padding: 3rem 0 1rem;
		}

		.marquee-track {
			gap: 2rem;
		}

		.logo-wordmark {
			font-size: 1.1rem !important;
		}
	}
</style>
