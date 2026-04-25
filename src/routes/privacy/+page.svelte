<script lang="ts">
	import SeoHead from '$components/seo/SeoHead.svelte';

	const lastUpdated = '2026-04-25';
	const contactEmail = 'sunnypatel124555@gmail.com';
</script>

<SeoHead
	title="Privacy and Data Handling | ATS Screener"
	description="How ATS Screener collects, uses, retains, and protects your data. Operated as a student project from Richmond Hill, Ontario, Canada."
/>

<main class="privacy">
	<div class="container">
		<header class="page-header">
			<div class="page-badge">Privacy</div>
			<h1>Privacy and data handling</h1>
			<p class="last-updated">Last updated: {lastUpdated}</p>
		</header>

		<section class="card">
			<h2>Who runs this</h2>
			<p>
				ATS Screener is a personal student project run by Sunny Patel from Richmond Hill, Ontario,
				Canada. It is not a commercial service and there is no company behind it. The aim is to
				follow the spirit of Canadian privacy law (PIPEDA) and similar guidance, but the obligations
				of a commercial operator do not all map cleanly onto a non-revenue student project. The
				policy below describes, in plain language, what we actually do.
			</p>
		</section>

		<section class="card">
			<h2>What we collect</h2>
			<p>Two categories, both opt-in by signing in:</p>
			<ul>
				<li>
					<strong>Account information</strong> from your sign-in provider: your email address, your display
					name, and (if available) your profile photo. We do not see or store your password.
				</li>
				<li>
					<strong>Scan history</strong> tied to your account, capped at your 5 most recent scans: numeric
					scores per ATS profile, lists of matched and missing keywords derived from your resume, the
					file name you uploaded, the scan timestamp and mode, and a short snippet of the job description
					(up to 200 characters). The full text of your resume is never sent to, or stored on, our servers.
					PDF and DOCX parsing happens entirely inside your browser.
				</li>
			</ul>
			<p>
				If you use the app without signing in, no scan data is saved anywhere; the result lives in
				your browser tab and is gone when you close it.
			</p>
		</section>

		<section class="card">
			<h2>How we process scoring requests</h2>
			<p>
				Scoring is performed by third-party AI providers. When you run a scan, the relevant prompt
				(which includes your resume text and, in targeted mode, the job description) is sent to one
				of those providers over TLS so it can return a score. We do not retain the raw prompt or the
				raw response on our servers as durable storage. A short-lived in-memory cache is used to
				deduplicate identical repeat requests and reduce cost; that cache is per-region, never
				written to disk, and disappears when the serverless instance recycles.
			</p>
			<p>
				The third-party AI providers have their own privacy practices, which apply to data they
				receive. We choose providers whose terms permit transient processing without long-term
				retention.
			</p>
		</section>

		<section class="card">
			<h2>What we do not collect</h2>
			<ul>
				<li>We do not sell your data, full stop.</li>
				<li>
					We do not run third-party advertising trackers, marketing pixels, or session-replay tools.
				</li>
				<li>
					We do not store the raw text of your resume, the full text of your job description, or the
					binary contents of your uploaded file.
				</li>
				<li>We do not share your scan results with employers or recruiters.</li>
			</ul>
		</section>

		<section class="card">
			<h2>Where it lives</h2>
			<p>
				Account info and scan history are stored in a managed cloud database operated by a
				well-known third-party provider, with access restricted to your account. Like most cloud
				services, that provider may store data in regions outside Canada. Data in transit is
				encrypted with TLS, and the provider encrypts data at rest.
			</p>
		</section>

		<section class="card">
			<h2>How long we keep it</h2>
			<ul>
				<li>
					Scan history is automatically capped at your 5 most recent scans. Older scans are deleted
					on the next save.
				</li>
				<li>
					You can clear all of your scan history at any time from the History page in the app.
				</li>
				<li>
					Account information persists until you ask us to delete your account (see "Your rights"
					below).
				</li>
				<li>
					Operational logs (request counts, error codes, response timings) are retained briefly by
					hosting infrastructure for diagnostics and then rotate out automatically.
				</li>
			</ul>
		</section>

		<section class="card">
			<h2>Your rights</h2>
			<p>Under PIPEDA you have, broadly, the right to:</p>
			<ul>
				<li>
					<strong>Access</strong> the personal information we hold about you. Your stored scan history
					is visible in the History page; for anything else, email us and we will send a copy.
				</li>
				<li>
					<strong>Correct</strong> inaccurate personal information. Email us if a stored field is wrong.
				</li>
				<li>
					<strong>Delete</strong> your data. Use the in-app "clear history" control to erase scan data,
					or email us to delete your full account and any associated records.
				</li>
				<li>
					<strong>Withdraw consent</strong> by signing out and asking us to delete your account.
				</li>
			</ul>
			<p>
				You may also contact the Office of the Privacy Commissioner of Canada at <a
					href="https://www.priv.gc.ca/"
					target="_blank"
					rel="noopener">priv.gc.ca</a
				> if you believe a complaint has not been resolved.
			</p>
		</section>

		<section class="card">
			<h2>Cookies and similar technologies</h2>
			<p>
				We use only what is required for sign-in and to remember whether you are signed in across
				page loads. We do not use cookies or local storage for behavioural tracking or advertising.
			</p>
		</section>

		<section class="card">
			<h2>Children</h2>
			<p>
				This app is not directed at children under 13, and we do not knowingly collect data from
				them.
			</p>
		</section>

		<section class="card">
			<h2>Changes to this notice</h2>
			<p>
				If something material changes, we will update the "Last updated" date at the top of this
				page. Substantial changes (a new category of data, a new third-party provider) will be
				called out in the project changelog.
			</p>
		</section>

		<section class="card contact">
			<h2>Contact</h2>
			<p>
				Email <a href="mailto:{contactEmail}">{contactEmail}</a> for any privacy question, data access
				request, correction, or deletion request. The author is based in Richmond Hill, Ontario, Canada.
			</p>
			<p class="footnote">
				This document is written in plain language because legalese hides accountability. If
				anything here is unclear or seems wrong, write in.
			</p>
		</section>
	</div>
</main>

<style>
	.privacy {
		min-height: 100vh;
		padding: 4rem 1.5rem 6rem;
		background:
			radial-gradient(ellipse at top, rgba(6, 182, 212, 0.04), transparent 50%),
			var(--bg-primary, #0a0a1a);
		color: var(--text-primary);
	}

	.container {
		max-width: 760px;
		margin: 0 auto;
	}

	.page-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.page-badge {
		display: inline-block;
		padding: 0.35rem 0.9rem;
		border: 1px solid var(--glass-border);
		border-radius: 999px;
		background: var(--glass-bg);
		color: var(--accent-cyan);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: 1rem;
	}

	.page-header h1 {
		font-size: clamp(1.8rem, 4vw, 2.6rem);
		margin: 0 0 0.5rem;
		letter-spacing: -0.02em;
	}

	.last-updated {
		color: var(--text-tertiary);
		font-size: 0.85rem;
		margin: 0;
	}

	.card {
		padding: 1.6rem 1.75rem;
		margin-bottom: 1rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg, 14px);
	}

	.card h2 {
		font-size: 1.1rem;
		margin: 0 0 0.75rem;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	.card p,
	.card li {
		font-size: 0.92rem;
		line-height: 1.65;
		color: var(--text-secondary);
	}

	.card p {
		margin: 0 0 0.75rem;
	}

	.card p:last-child {
		margin-bottom: 0;
	}

	.card ul {
		margin: 0 0 0.75rem;
		padding-left: 1.2rem;
	}

	.card li {
		margin-bottom: 0.4rem;
	}

	.card strong {
		color: var(--text-primary);
		font-weight: 600;
	}

	.card a {
		color: var(--accent-cyan);
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition: border-color 0.15s ease;
	}

	.card a:hover {
		border-bottom-color: var(--accent-cyan);
	}

	.card a:focus-visible {
		outline: 2px solid var(--accent-cyan);
		outline-offset: 2px;
		border-radius: 2px;
	}

	.card.contact .footnote {
		margin-top: 0.75rem;
		font-size: 0.82rem;
		color: var(--text-tertiary);
		font-style: italic;
	}

	@media (max-width: 640px) {
		.privacy {
			padding: 3rem 1rem 4rem;
		}

		.card {
			padding: 1.25rem 1.25rem;
		}
	}
</style>
