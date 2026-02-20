<section class="footer">
	<div class="footer-content">
		<div class="footer-brand">
			<span class="gradient-text">ATS Screener</span>
			<p>free ATS resume screener. built by a student, for students.</p>
		</div>
		<div class="footer-links">
			<a href="https://github.com/sunnypatell/ats-screener" target="_blank" rel="noopener">
				GitHub
			</a>
			<a href="/scanner">Scanner</a>
		</div>
	</div>
	<div class="footer-bottom">
		<p>&copy; {new Date().getFullYear()} Sunny Patel. MIT License.</p>
	</div>
</section>

<style>
	.footer {
		padding: 4rem 2rem 2rem;
		border-top: 1px solid var(--glass-border);
	}

	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.footer-brand {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.gradient-text {
		font-size: 1.25rem;
		font-weight: 700;
		background: var(--gradient-primary);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.footer-brand p {
		font-size: 0.9rem;
		color: var(--text-tertiary);
	}

	.footer-links {
		display: flex;
		gap: 1.5rem;
	}

	.footer-links a {
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.9rem;
		transition: color 0.2s ease;
	}

	.footer-links a:hover {
		color: var(--accent-cyan);
	}

	.footer-bottom {
		max-width: 1200px;
		margin: 0 auto;
		padding-top: 1.5rem;
		border-top: 1px solid var(--glass-border);
	}

	.footer-bottom p {
		font-size: 0.8rem;
		color: var(--text-tertiary);
		text-align: center;
	}

	@media (max-width: 640px) {
		.footer-content {
			flex-direction: column;
		}
	}
</style>
