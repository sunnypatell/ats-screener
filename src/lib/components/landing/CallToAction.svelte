<section class="cta">
	<div class="cta-bg">
		<div class="cta-orb cta-orb-1"></div>
		<div class="cta-orb cta-orb-2"></div>
	</div>

	<div class="cta-content">
		<h2 class="cta-title">
			Stop guessing.
			<br />
			<span class="gradient-text">Start scoring.</span>
		</h2>
		<p class="cta-description">
			Upload your resume and get real ATS scores in under 30 seconds. Free account required. No
			paywall. Open source. Just accurate, platform-specific feedback.
		</p>
		<div class="cta-actions">
			<a href="/scanner" class="cta-button">
				<span class="btn-shimmer"></span>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
					<polyline points="14,2 14,8 20,8" />
					<path d="M12 18v-6" />
					<path d="M9 15l3 3 3-3" />
				</svg>
				Scan Your Resume Free
			</a>
			<a
				href="https://github.com/sunnypatell/ats-screener"
				target="_blank"
				rel="noopener"
				class="cta-secondary"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
					/>
				</svg>
				View on GitHub
			</a>
		</div>
	</div>
</section>

<style>
	.cta {
		position: relative;
		padding: 5rem 2rem 8rem;
		text-align: center;
		overflow: hidden;
	}

	.cta-bg {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.cta-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(120px);
	}

	.cta-orb-1 {
		width: 500px;
		height: 500px;
		background: rgba(6, 182, 212, 0.08);
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.cta-orb-2 {
		width: 400px;
		height: 400px;
		background: rgba(59, 130, 246, 0.06);
		top: 30%;
		left: 60%;
		transform: translate(-50%, -50%);
	}

	.cta-content {
		position: relative;
		max-width: 700px;
		margin: 0 auto;
	}

	.cta-title {
		font-size: clamp(2.25rem, 6vw, 3.75rem);
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.04em;
		line-height: 1.1;
		margin-bottom: 1.5rem;
	}

	.gradient-text {
		background: var(--gradient-primary);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.cta-description {
		font-size: 1.15rem;
		color: var(--text-secondary);
		line-height: 1.7;
		margin-bottom: 2.5rem;
		max-width: 560px;
		margin-left: auto;
		margin-right: auto;
	}

	.cta-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.25rem;
		flex-wrap: wrap;
	}

	.cta-button {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		padding: 1.1rem 2.5rem;
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--color-bg-primary);
		background: var(--gradient-primary);
		border-radius: var(--radius-lg);
		text-decoration: none;
		overflow: hidden;
		transition:
			transform 0.25s ease,
			box-shadow 0.25s ease;
	}

	.cta-button:hover {
		transform: translateY(-3px);
		box-shadow:
			0 0 40px rgba(6, 182, 212, 0.35),
			0 0 80px rgba(59, 130, 246, 0.15);
		color: var(--color-bg-primary);
	}

	.btn-shimmer {
		position: absolute;
		inset: 0;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		animation: shimmer 3s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	.cta-secondary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1.1rem 2rem;
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		backdrop-filter: blur(12px);
		transition:
			border-color 0.2s ease,
			color 0.2s ease;
	}

	.cta-secondary:hover {
		border-color: rgba(255, 255, 255, 0.15);
		color: var(--text-primary);
	}

	@media (max-width: 640px) {
		.cta {
			padding: 5rem 1.5rem;
		}

		.cta-actions {
			flex-direction: column;
		}
	}
</style>
