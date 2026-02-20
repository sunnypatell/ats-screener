<script lang="ts">
	import Logo from '$components/ui/Logo.svelte';
</script>

<footer class="footer">
	<div class="footer-inner">
		<div class="footer-top">
			<!-- brand column -->
			<div class="footer-brand">
				<Logo size="sm" />
				<p class="brand-tagline">
					Free, open-source ATS resume screener that simulates real enterprise HCMS platforms. Built
					for job seekers who want real scores, not made-up numbers.
				</p>
				<div class="social-links">
					<a
						href="https://github.com/sunnypatell/ats-screener"
						target="_blank"
						rel="noopener"
						class="social-link"
						aria-label="GitHub Repository"
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
							/>
						</svg>
					</a>
					<a
						href="https://linkedin.com/in/sunnypatell"
						target="_blank"
						rel="noopener"
						class="social-link"
						aria-label="LinkedIn Profile"
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
							/>
						</svg>
					</a>
				</div>
			</div>

			<!-- product links -->
			<div class="footer-col">
				<h4 class="col-title">Product</h4>
				<a href="/scanner" class="footer-link">Resume Scanner</a>
				<a href="#features" class="footer-link">Features</a>
				<a
					href="https://github.com/sunnypatell/ats-screener"
					target="_blank"
					rel="noopener"
					class="footer-link">Source Code</a
				>
			</div>

			<!-- resources links -->
			<div class="footer-col">
				<h4 class="col-title">Resources</h4>
				<a
					href="https://github.com/sunnypatell/ats-screener#readme"
					target="_blank"
					rel="noopener"
					class="footer-link">Documentation</a
				>
				<a
					href="https://github.com/sunnypatell/ats-screener/issues"
					target="_blank"
					rel="noopener"
					class="footer-link">Report a Bug</a
				>
				<a
					href="https://github.com/sunnypatell/ats-screener/blob/main/CONTRIBUTING.md"
					target="_blank"
					rel="noopener"
					class="footer-link">Contributing</a
				>
			</div>

			<!-- legal links -->
			<div class="footer-col">
				<h4 class="col-title">Legal</h4>
				<a
					href="https://github.com/sunnypatell/ats-screener/blob/main/LICENSE"
					target="_blank"
					rel="noopener"
					class="footer-link">MIT License</a
				>
				<a
					href="https://github.com/sunnypatell/ats-screener/blob/main/SECURITY.md"
					target="_blank"
					rel="noopener"
					class="footer-link">Security</a
				>
			</div>
		</div>

		<!-- bottom bar -->
		<div class="footer-bottom">
			<p class="copyright">
				&copy; {new Date().getFullYear()} Sunny Patel. Open source under MIT License.
			</p>
			<p class="tech-stack">Built with SvelteKit 5, TypeScript, and zero tracking.</p>
		</div>
	</div>
</footer>

<style>
	.footer {
		position: relative;
		padding: 5rem 2rem 2rem;
		border-top: 1px solid var(--glass-border);
		background: linear-gradient(180deg, transparent, rgba(6, 182, 212, 0.02));
	}

	.footer-inner {
		max-width: 1200px;
		margin: 0 auto;
	}

	.footer-top {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		gap: 3rem;
		margin-bottom: 3rem;
	}

	.footer-brand {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.brand-tagline {
		font-size: 0.9rem;
		color: var(--text-tertiary);
		line-height: 1.6;
		max-width: 320px;
	}

	.social-links {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.social-link {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-md);
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		color: var(--text-secondary);
		transition:
			color 0.2s ease,
			border-color 0.2s ease,
			background 0.2s ease;
	}

	.social-link:hover {
		color: var(--accent-cyan);
		border-color: rgba(6, 182, 212, 0.3);
		background: rgba(6, 182, 212, 0.05);
	}

	.footer-col {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.col-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-primary);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 0.25rem;
	}

	.footer-link {
		color: var(--text-tertiary);
		text-decoration: none;
		font-size: 0.88rem;
		transition: color 0.2s ease;
	}

	.footer-link:hover {
		color: var(--accent-cyan);
	}

	.footer-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 2rem;
		border-top: 1px solid var(--glass-border);
	}

	.copyright {
		font-size: 0.8rem;
		color: var(--text-tertiary);
	}

	.tech-stack {
		font-size: 0.8rem;
		color: var(--text-tertiary);
		opacity: 0.6;
	}

	@media (max-width: 768px) {
		.footer-top {
			grid-template-columns: 1fr 1fr;
			gap: 2.5rem;
		}

		.footer-brand {
			grid-column: 1 / -1;
		}

		.footer-bottom {
			flex-direction: column;
			gap: 0.5rem;
			text-align: center;
		}
	}

	@media (max-width: 480px) {
		.footer-top {
			grid-template-columns: 1fr;
		}

		.footer {
			padding: 3rem 1.5rem 2rem;
		}
	}
</style>
