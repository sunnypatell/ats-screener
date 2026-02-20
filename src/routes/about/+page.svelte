<script lang="ts">
	import Logo from '$components/ui/Logo.svelte';
</script>

<svelte:head>
	<title>About | ATS Screener</title>
	<meta
		name="description"
		content="Learn about ATS Screener, the free open-source tool that simulates how real enterprise ATS platforms parse and score your resume."
	/>
</svelte:head>

<main class="about">
	<div class="about-bg">
		<div class="bg-orb orb-1"></div>
		<div class="bg-orb orb-2"></div>
	</div>

	<div class="container">
		<!-- hero section -->
		<section class="about-hero">
			<div class="page-badge">
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="16" x2="12" y2="12" />
					<line x1="12" y1="8" x2="12.01" y2="8" />
				</svg>
				<span>About</span>
			</div>
			<h1 class="hero-title">
				Built Because ATS Screeners
				<span class="gradient-text">Are Broken</span>
			</h1>
			<p class="hero-subtitle">
				Every existing ATS checker uses the same generic algorithm and charges you for it. None of
				them simulate how real enterprise platforms actually parse your resume. We built one that
				does. For free.
			</p>
		</section>

		<!-- the problem -->
		<section class="section">
			<div class="section-badge">The Problem</div>
			<h2>Why Existing ATS Screeners Fail You</h2>
			<div class="problem-grid">
				<div class="problem-card">
					<div class="problem-icon">
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
							/>
							<line x1="12" y1="9" x2="12" y2="13" />
							<line x1="12" y1="17" x2="12.01" y2="17" />
						</svg>
					</div>
					<h3>Generic Algorithms</h3>
					<p>
						They all use the same basic keyword-matching approach regardless of which ATS your
						application will actually go through. A score from "ATS Checker Pro" means nothing if
						the company uses Workday.
					</p>
				</div>
				<div class="problem-card">
					<div class="problem-icon">
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
							<line x1="1" y1="10" x2="23" y2="10" />
						</svg>
					</div>
					<h3>Paywalls Everywhere</h3>
					<p>
						Most "free" ATS checkers give you a teaser score then lock detailed results behind a
						paywall. Job seekers already under financial stress shouldn't have to pay to optimize
						their resume.
					</p>
				</div>
				<div class="problem-card">
					<div class="problem-icon">
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
						</svg>
					</div>
					<h3>Data Privacy Concerns</h3>
					<p>
						You upload your resume (personal info, work history, contact details) to a random
						website. Where does that data go? Who has access? Our tool parses everything
						client-side. Your data never leaves your browser.
					</p>
				</div>
				<div class="problem-card">
					<div class="problem-icon">
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="15" y1="9" x2="9" y2="15" />
							<line x1="9" y1="9" x2="15" y2="15" />
						</svg>
					</div>
					<h3>No Real ATS Knowledge</h3>
					<p>
						Workday parses resumes completely differently from Greenhouse. Taleo's boolean keyword
						filters work nothing like Lever's context matching. A one-size-fits-all score is
						useless.
					</p>
				</div>
			</div>
		</section>

		<!-- our approach -->
		<section class="section">
			<div class="section-badge">Our Approach</div>
			<h2>How ATS Screener Works Differently</h2>
			<div class="approach-list">
				<div class="approach-item">
					<div class="approach-number">01</div>
					<div class="approach-content">
						<h3>LLM-Powered Analysis</h3>
						<p>
							Instead of hard-coded keyword matching, we use large language models to semantically
							analyze your resume against each ATS system's known behavior. The LLM understands
							context, transferable skills, and industry-specific terminology across any field.
						</p>
					</div>
				</div>
				<div class="approach-item">
					<div class="approach-number">02</div>
					<div class="approach-content">
						<h3>Six Real ATS Profiles</h3>
						<p>
							We simulate Workday, Taleo (Oracle), iCIMS, Greenhouse, Lever, and SAP
							SuccessFactors. Each profile reflects the actual parsing strictness, keyword strategy,
							and scoring behavior of that platform based on research into their documented
							capabilities.
						</p>
					</div>
				</div>
				<div class="approach-item">
					<div class="approach-number">03</div>
					<div class="approach-content">
						<h3>Multi-Provider Fallback</h3>
						<p>
							Our LLM scoring chains through Google Gemini, Groq, and Cerebras with automatic
							failover. If all LLM providers are unavailable, a deterministic rule-based engine
							provides scoring as a fallback. You always get results.
						</p>
					</div>
				</div>
				<div class="approach-item">
					<div class="approach-number">04</div>
					<div class="approach-content">
						<h3>Client-Side First</h3>
						<p>
							Resume parsing (PDF/DOCX text extraction, section detection, entity extraction)
							happens entirely in your browser. Only anonymized text snippets are sent to LLM
							providers for scoring. Your files never touch our servers.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- tech stack -->
		<section class="section">
			<div class="section-badge">Under the Hood</div>
			<h2>Tech Stack</h2>
			<div class="tech-grid">
				<div class="tech-card">
					<h4>Frontend</h4>
					<ul>
						<li>SvelteKit 5 (Svelte 5 runes)</li>
						<li>Scoped CSS + CSS custom properties</li>
						<li>Motion.dev for animations</li>
						<li>Bits UI for accessible primitives</li>
					</ul>
				</div>
				<div class="tech-card">
					<h4>Engine</h4>
					<ul>
						<li>Custom PDF/DOCX parser (pdfjs-dist + mammoth)</li>
						<li>TF-IDF + NLP tokenizer</li>
						<li>6 ATS profile scorers</li>
						<li>Skills taxonomy (500+ terms, 10+ industries)</li>
					</ul>
				</div>
				<div class="tech-card">
					<h4>AI</h4>
					<ul>
						<li>Google Gemini 2.5 Flash-Lite (primary)</li>
						<li>Groq Llama 3.3 70B (fallback)</li>
						<li>Cerebras Llama 3.3 70B (fallback)</li>
						<li>Rule-based fallback (offline capable)</li>
					</ul>
				</div>
				<div class="tech-card">
					<h4>Infrastructure</h4>
					<ul>
						<li>Cloudflare Pages (hosting)</li>
						<li>Cloudflare Functions (API)</li>
						<li>GitHub Actions (CI/CD)</li>
						<li>Vitest + Playwright (testing)</li>
					</ul>
				</div>
			</div>
		</section>

		<!-- open source -->
		<section class="section open-source-section">
			<div class="open-source-card">
				<div class="os-icon">
					<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
						/>
					</svg>
				</div>
				<h2>100% Open Source</h2>
				<p>
					Every line of code is public. No hidden tracking, no data collection, no premium tiers.
					MIT licensed. Fork it, improve it, self-host it.
				</p>
				<div class="os-links">
					<a
						href="https://github.com/sunnypatell/ats-screener"
						target="_blank"
						rel="noopener"
						class="os-btn primary"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
							/>
						</svg>
						View on GitHub
					</a>
					<a
						href="https://github.com/sunnypatell/ats-screener/issues"
						target="_blank"
						rel="noopener"
						class="os-btn secondary"
					>
						Report an Issue
					</a>
				</div>
			</div>
		</section>

		<!-- creator -->
		<section class="section">
			<div class="section-badge">Creator</div>
			<h2>Built by Sunny Patel</h2>
			<div class="creator-card">
				<div class="creator-info">
					<p>
						Software engineer who got tired of paying $30/month for ATS tools that give the same
						useless generic score. Built this as an open-source alternative that actually simulates
						real enterprise platforms.
					</p>
					<div class="creator-links">
						<a
							href="https://github.com/sunnypatell"
							target="_blank"
							rel="noopener"
							class="creator-link"
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
								/>
							</svg>
							GitHub
						</a>
						<a
							href="https://www.linkedin.com/in/sunny-patel-30b460204/"
							target="_blank"
							rel="noopener"
							class="creator-link"
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
								/>
							</svg>
							LinkedIn
						</a>
					</div>
				</div>
			</div>
		</section>
	</div>
</main>

<style>
	.about {
		position: relative;
		min-height: 100dvh;
		padding: 7rem 2rem 4rem;
		overflow: hidden;
	}

	.about-bg {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.bg-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(120px);
		will-change: transform;
		transform: translateZ(0);
	}

	.orb-1 {
		width: 500px;
		height: 500px;
		background: rgba(6, 182, 212, 0.06);
		top: 5%;
		left: -10%;
	}

	.orb-2 {
		width: 400px;
		height: 400px;
		background: rgba(139, 92, 246, 0.04);
		bottom: 20%;
		right: -10%;
	}

	.container {
		position: relative;
		max-width: 900px;
		margin: 0 auto;
	}

	/* hero */
	.about-hero {
		margin-bottom: 5rem;
	}

	.page-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 1rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-full);
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
		backdrop-filter: blur(12px);
	}

	.page-badge svg {
		color: var(--accent-cyan);
	}

	.hero-title {
		font-size: clamp(2rem, 5vw, 3.5rem);
		font-weight: 800;
		letter-spacing: -0.03em;
		margin-bottom: 1rem;
		color: var(--text-primary);
		line-height: 1.15;
	}

	.gradient-text {
		background: var(--gradient-primary);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-subtitle {
		font-size: clamp(1rem, 2vw, 1.2rem);
		color: var(--text-secondary);
		line-height: 1.7;
		max-width: 700px;
	}

	/* sections */
	.section {
		margin-bottom: 5rem;
	}

	.section-badge {
		display: inline-block;
		padding: 0.3rem 0.85rem;
		background: rgba(6, 182, 212, 0.08);
		border: 1px solid rgba(6, 182, 212, 0.15);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--accent-cyan);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 1rem;
	}

	.section h2 {
		font-size: clamp(1.5rem, 3vw, 2.25rem);
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 2rem;
		letter-spacing: -0.02em;
	}

	/* problem grid */
	.problem-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.25rem;
	}

	.problem-card {
		padding: 1.5rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
		transition: border-color 0.2s ease;
	}

	.problem-card:hover {
		border-color: rgba(239, 68, 68, 0.2);
	}

	.problem-icon {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(239, 68, 68, 0.08);
		border-radius: var(--radius-md);
		color: #ef4444;
		margin-bottom: 1rem;
	}

	.problem-card h3 {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.problem-card p {
		font-size: 0.88rem;
		color: var(--text-secondary);
		line-height: 1.6;
	}

	/* approach list */
	.approach-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.approach-item {
		display: flex;
		gap: 1.5rem;
		padding: 1.5rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
		transition: border-color 0.2s ease;
	}

	.approach-item:hover {
		border-color: rgba(6, 182, 212, 0.2);
	}

	.approach-number {
		font-size: 2rem;
		font-weight: 800;
		color: var(--accent-cyan);
		opacity: 0.3;
		line-height: 1;
		flex-shrink: 0;
		width: 48px;
	}

	.approach-content h3 {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.4rem;
	}

	.approach-content p {
		font-size: 0.88rem;
		color: var(--text-secondary);
		line-height: 1.6;
	}

	/* tech grid */
	.tech-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.25rem;
	}

	.tech-card {
		padding: 1.5rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
	}

	.tech-card h4 {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--accent-cyan);
		margin-bottom: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.tech-card ul {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.tech-card li {
		font-size: 0.85rem;
		color: var(--text-secondary);
		padding-left: 1rem;
		position: relative;
	}

	.tech-card li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.55rem;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--accent-cyan);
		opacity: 0.5;
	}

	/* open source card */
	.open-source-card {
		text-align: center;
		padding: 3rem 2rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
	}

	.os-icon {
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 50%;
		margin: 0 auto 1.25rem;
		color: var(--text-primary);
	}

	.open-source-card h2 {
		font-size: 1.75rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
	}

	.open-source-card p {
		font-size: 1rem;
		color: var(--text-secondary);
		max-width: 500px;
		margin: 0 auto 1.5rem;
		line-height: 1.6;
	}

	.os-links {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.os-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-lg);
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.os-btn.primary {
		color: var(--color-bg-primary);
		background: var(--gradient-primary);
	}

	.os-btn.primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
		color: var(--color-bg-primary);
	}

	.os-btn.secondary {
		color: var(--text-secondary);
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
	}

	.os-btn.secondary:hover {
		border-color: var(--accent-cyan);
		color: var(--text-primary);
		transform: translateY(-1px);
	}

	/* creator */
	.creator-card {
		padding: 2rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
	}

	.creator-info p {
		font-size: 1rem;
		color: var(--text-secondary);
		line-height: 1.7;
		margin-bottom: 1.25rem;
	}

	.creator-links {
		display: flex;
		gap: 1rem;
	}

	.creator-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-tertiary);
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.creator-link:hover {
		color: var(--accent-cyan);
	}

	@media (max-width: 640px) {
		.about {
			padding: 5rem 1.5rem 3rem;
		}

		.problem-grid,
		.tech-grid {
			grid-template-columns: 1fr;
		}

		.approach-item {
			flex-direction: column;
			gap: 0.75rem;
		}

		.approach-number {
			font-size: 1.25rem;
		}

		.os-links {
			flex-direction: column;
			align-items: center;
		}
	}
</style>
