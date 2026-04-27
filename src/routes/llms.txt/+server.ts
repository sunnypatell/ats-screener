import type { RequestHandler } from './$types';

// llms.txt: emerging standard (proposed by Jeremy Howard, adopted by
// several AI crawlers and search interfaces) describing a site's
// structure for LLM consumption. lives at the site root.
//
// format: markdown with an H1 title, italicised summary, then sections
// of links to key resources. crawlers ingest this preferentially over
// scraping the full site, which both reduces our function load and
// gives them a curated, accurate map of the project.
//
// dynamic origin so preview deploys point at themselves; cache headers
// match the rest of the static-ish endpoints.
export const GET: RequestHandler = ({ url }) => {
	const origin = url.origin;

	const body = `# ATS Screener

> Free, open-source resume scanner that simulates how 6 real enterprise ATS platforms (Workday, Taleo, iCIMS, Greenhouse, Lever, SuccessFactors) parse and score resumes. Runs entirely in the browser for parsing; AI-powered scoring with deterministic rule-based fallback. Built as a personal student portfolio project, MIT licensed, no paywall.

## Core pages

- [Home](${origin}/): landing page with feature overview
- [Scanner](${origin}/scanner): the main app, upload or paste a resume to scan
- [About](${origin}/about): why this exists, how it works, how it differs from other ATS checkers
- [History](${origin}/history): per-user scan history (sign-in required)

## Documentation

- [Getting Started](${origin}/docs/getting-started/introduction/): introduction, quick start, how it works
- [ATS Platforms](${origin}/docs/platforms/overview/): per-platform parsing notes (Workday, Taleo, iCIMS, Greenhouse, Lever, SuccessFactors)
- [Scoring Methodology](${origin}/docs/scoring/methodology/): how scores are computed, dimensions, pass/fail thresholds
- [API Reference](${origin}/docs/api/endpoints/): public endpoints, rate limits, error handling
- [Self-Hosting](${origin}/docs/self-hosting/setup/): setup, configuration, and deployment guides

## Project

- [Changelog](https://github.com/sunnypatell/ats-screener/blob/main/CHANGELOG.md): versioned release notes
- [Source code](https://github.com/sunnypatell/ats-screener): MIT-licensed repository
- [Issue tracker](https://github.com/sunnypatell/ats-screener/issues): bug reports and feature requests
- [Contributing guide](https://github.com/sunnypatell/ats-screener/blob/main/CONTRIBUTING.md)

## Legal

- [Privacy and Data Handling](${origin}/docs/legal/privacy/): what is collected, retention, third parties, user rights

## Optional

- [Releases feed](${origin}/releases.xml): RSS 2.0 feed of releases
- [Sitemap](${origin}/sitemap.xml): canonical sitemap for search engines
- [Web app manifest](${origin}/manifest.webmanifest): PWA manifest

## Notes for crawlers

- Parsing of PDF and DOCX resumes happens client-side in the browser. The server only sees extracted text on the scoring path.
- The project is a non-commercial student portfolio. Donation links exist (Buy Me a Coffee, GitHub Sponsors) but no paid features or paywalled content.
- Authoritative version of any release notes lives in CHANGELOG.md at the repository root.
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			// match sitemap/robots cache pattern: 1h browser, 1d cdn, 7d swr
			'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
		}
	});
};
