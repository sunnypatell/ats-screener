# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Paste-and-scan flow**: a textarea below the file uploader accepts pasted resume text directly. Same scoring runs whether you upload a PDF, a DOCX, or paste raw text. New `parseResumeText` parser entry runs the same downstream extraction (sections, contact, experience, education, skills) as the file path. 15 unit tests cover empty input, structural extraction, metadata defaults, CRLF normalization, and result-shape compatibility.
- **Try-a-sample-resume**: a one-click button on the scanner loads a fictional but representative resume, so casual visitors can experience the full scoring flow without uploading anything personal.
- **Privacy notice**: lives at `/docs/legal/privacy/` (Starlight). Plain-language coverage of what is collected (account info, capped scan history), what is not (raw resume text, full job description, file binaries), how scoring requests flow through the serverless function, third-party providers, retention, and your practical rights regardless of jurisdiction. Includes a per-statute reading on whether PIPEDA, CCPA, and GDPR formally apply to a non-commercial student portfolio project that accepts voluntary donations.
- **Public roadmap**: hand-curated marketing-toned view at `/docs/roadmap/` with sections for Recently shipped, In flight, On deck, Stretch goals, and Not planned.
- **FAQ + FAQPage JSON-LD on /about**: 7 author-curated Q&As covering free/open-source, sign-in requirement, paste-and-scan, no vendor affiliation, server-side data flow, score interpretation, and how to support. Visible UI uses native `<details>` elements; structured data mirrors visible content per Google's rich-result rules.
- **`/llms.txt`** at the site root for AI-crawler discoverability (Anthropic, OpenAI, Perplexity standard).
- **`/.well-known/security.txt`** per RFC 9116, listing Contact, Expires, Canonical, and Policy fields for responsible disclosure.
- **PWA manifest** at `/manifest.webmanifest` with start_url, display, theme color, and icons. App is now installable from supported browsers.
- **RSS 2.0 feed** at `/releases.xml` parsed from `CHANGELOG.md`, with ETag round-trip and CDN caching.
- **Footer Resources** column gains a Roadmap link (Changelog points straight at the GitHub CHANGELOG.md to keep one source of truth).
- **`/api/version`** endpoint returning `{ version, commit, branch, env }` for ops.
- **`/api/log-error`** sampled client-error reporter with a 60/min rolling cap.
- **`/api/vitals`** sampled web-vitals collector (LCP and CLS) using native PerformanceObserver and `navigator.sendBeacon`.
- **`/api/admin/rate-limit-stats`** with token gate (503 fail-closed when no token configured).
- **noscript fallback** with key links so JS-disabled visitors and bots see meaningful content.
- **Skip-to-content link** in the root layout.
- **ARIA live region** on the scanner announcing scan state to screen readers.
- **aria-current=page** on Navbar links.
- **og:image:alt + twitter:image:alt** for social-share accessibility.
- **iOS PWA polish** meta tags (apple-mobile-web-app-capable, status-bar-style, application-name).
- **`color-scheme=dark`** so native form controls render in dark mode instead of flashing white.
- **`format-detection=telephone=no`** so mobile browsers stop auto-linking numeric strings as phone numbers.
- **Native Web Share + Copy Link** buttons on the `/share` landing page.

### Changed

- **Permissions-Policy** extended with `interest-cohort=()` and `browsing-topics=()` to opt out of FLoC and the Topics API.
- **Sitemap and robots.txt**: main sitemap grew from 3 entries to 9 (now includes key docs landings); robots.txt references both the main sitemap and the docs sitemap-index for full crawl coverage.
- **Lazy-loaded resume parser**: pdfjs and mammoth now ship in separate chunks, so a PDF-only user no longer loads mammoth and vice versa. Prior 880KB combined parser chunk eliminated.
- **CDN caching** on `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/releases.xml`, `/api/og`, and `/privacy` page (where applicable). All key static-ish endpoints serve from edge cache with stale-while-revalidate.
- **`/api/og` function-level memo** (in addition to existing CDN cache) defends against cache-bypass headers.
- **og-image.png** recompressed from 640KB to 247KB (61% smaller) via sharp palette mode.
- **Auto-noindex preview deploys**: any `*.vercel.app` host that is not the production hostname now emits `meta robots="noindex, nofollow"` automatically.
- **PR template** rewritten as a clean four-section scaffold (What changes / Why / Verification / Notes) for external contributors.
- **PR #10 followup fix**: `loadFromHistory` now aborts in-flight scans before swapping results, and clears stale `llmAnalysis` from prior sessions.

### Fixed

- **Critical CVEs**: `jspdf` 4.2.0 -> 4.2.1 (HTML injection) and transitive `protobufjs` -> 7.5.5 via `firebase` bump (arbitrary code execution).
- **Focus indicators** restored on previously-suppressed inputs (SearchModal search-input, login `.field-input`, uploader privacy-link).
- **`prefers-reduced-motion`** now also kills `animation-delay`, `transition-delay`, and document-level `scroll-behavior`. JS-driven smooth-scroll opt-in via new `$lib/a11y.ts`.
- **`scan_logs` writes** are now sampled via deterministic hash (`PUBLIC_SCAN_LOG_SAMPLE_RATE`, default 1.0) so high-traffic deployments can dial the rate down without redeploying.
- **Skip post-save `loadHistory` reload**: `saveToHistory` now mutates `scanHistory` locally, eliminating one Firestore read query per scan.

### Tests

- 223 tests passing (up from 184). Added coverage for sampling, CSP throttle, no-raw-html guard, `parseResumeText`, and rate-limit stats.

## [0.2.0] - 2026-04-25

### Added

- **Share + OG pipeline**: dynamic `/api/og` PNG endpoint via `@vercel/og` (content-addressed by score/pass/total/delta, CDN-cached at `s-maxage=86400`); new `/share` landing page emits `og:image` pointing at `/api/og` so LinkedIn / X / iMessage previews show the user's actual score
- **ShareBadge polish**: "Copy share link" + "Share to X" buttons; LinkedIn share-text now appends the `/share` URL so its crawler can fetch the rich preview
- **Comparison band on dashboard**: "you went from 67 to 78 (+11)" with up/down/flat states and a Twitter share-intent on positive deltas
- **Per-card delta pill** anchored to each ScoreCard's score ring
- **Per-row delta** in the scan-history dropdown
- **Journey stats card on /history**: total improvement, best score, scan count, strongest-gain platform, days span
- **Score timeline SVG chart on /history**: line chart with hover tooltips, no chart-library dep
- **Live JD skill-extraction preview**: as the user types a JD, parse on a 400ms debounce and show detected role/industry/level + extracted skill chips (matched skills get a green check)
- **Before/after example templates** on expanded suggestion cards (7 categories) with one-click copy on each block
- **Cancellable in-flight scoring**: re-scan or reset aborts the prior fetch instead of leaking a stale response into state
- **Live retry-after countdown** in the LLM-fallback toast when `/api/analyze` returns 429
- **In-memory result cache** on `/api/analyze`, SHA-256 keyed by full prompt; same-input requests skip the LLM (verified live: 46s to 81ms, ~570x). Response shape adds `_cached` flag (additive, non-breaking)
- **Improved rate-limit response**: `Retry-After` header + `retryAfter` body field, distinguishes minute vs daily reason, no longer double-charges minute slots on daily failures
- **Auxiliary endpoints**: `/healthz` (JSON liveness probe), dynamic `/robots.txt` and `/sitemap.xml` (origin-tracking), `/api/csp-report` (logs CSP violations to Vercel logs)
- **Security headers via hooks**: HSTS, Referrer-Policy, Permissions-Policy, X-Content-Type-Options, X-Frame-Options DENY, plus `Content-Security-Policy-Report-Only`
- **Per-route SEO**: `SeoHead` component with og/twitter/canonical, plus JSON-LD `SoftwareApplication` on the landing page
- **Branded `+error.svelte`** for 404 / 429 / 5xx
- **Custom `/docs/[...slug]` catchall** for the Astro docs build with path-traversal protection (replaces hooks-based docs serving)
- **Login form hardening**: email normalization (trim + lowercase) prevents duplicate-account bug from casing/whitespace; displayName maxlength

### Changed

- **Firebase SDK lazy-loaded** out of the root layout chunk (~488kb no longer ships to landing-page visitors who never sign in)
- **`@vercel/og` response re-wrapped** so `Cache-Control` actually applies (the constructor's headers option concatenates rather than replaces)
- **Migrated `$app/stores` to `$app/state`** (deprecated in newer SvelteKit)
- **Single source of truth for `<meta name="robots">`**: removed the static tag from `app.html`; `SeoHead` now emits exactly one tag (indexable or noindex per route) so noIndex pages no longer ship conflicting directives
- **`/api/og` runtime**: moved off the deprecated `runtime: 'edge'` config to default node runtime

### Fixed

- **`[object Object]` rendered in per-platform suggestions**: `ScoreBreakdown.svelte` interpolated structured suggestions without type-narrowing. Fixed with `suggestionText` / `suggestionDetails` helpers (same pattern report.ts already used). Hardened the equivalent fallback branch in `ScoreDashboard.svelte` with a `typeof` guard
- **Rate-limiter cleanup throttled** to once per 30s so it doesn't run O(n) on every request once the IP map exceeds threshold (real perf cliff at scale)
- **Snapshot-at-`startScoring`** fixes a race where a rapid re-scan compared against the wrong "previous" entry while the firestore save was still in flight
- **Production build error**: moved docs serving out of `hooks.server.ts` into a `/docs/[...slug]` catchall so node-only `fs/path` imports don't pollute the shared bundle (was a real prod-blocking error from the edge bundler trying to resolve Node built-ins)
- **JD-preview unhandled rejection**: debounced parser now wraps the IIFE in try/catch so transient parse failures don't surface as unhandled rejections
- **Pass/total tampering**: `/api/og` and `/share` now clamp `pass` to `<= total` so a crafted URL like `?pass=6&total=1` cannot render impossible text
- **Timeline y-coordinate clamped** to `[0, 100]` so anomalous out-of-range scores still render inside the chart padding box
- **Suggestion copy buttons**: outer suggestion-card changed from `<button>` to `<div role="button">` so the inner copy `<button>`s are valid HTML (no nested interactive elements)

### Tests

- 184 tests passing (started at 106): added coverage for classification, fallback, cache, rate-limiter, comparison, timeline, journey, suggestion templates

## [0.1.0] - 2026-02-20

### Added

- **Resume Parser**: PDF parsing with pdfjs-dist in Web Worker, DOCX parsing with mammoth, section detection (contact, summary, experience, education, skills, projects, certifications), contact info extraction, date normalization
- **NLP Engine**: Custom tokenizer with stemming and normalization, TF-IDF implementation, skills synonym database (8+ industries), skills taxonomy with 250+ skills, exact + fuzzy keyword matching, n-gram extraction
- **Scoring Engine**: 6 ATS system profiles (Workday, Taleo, iCIMS, Greenhouse, Lever, SuccessFactors), formatting scorer, keyword matcher, section completeness scorer, experience scorer with quantification detection, education scorer with degree matching
- **Job Description Parser**: Rule-based JD extraction, skill categorization (required vs preferred), experience level detection, education requirement detection, role type classification, industry context detection
- **LLM Integration**: Google Gemini 2.0 Flash proxy via SvelteKit server endpoints, semantic JD analysis, smart suggestions, graceful fallback to rule-based when quota exhausted
- **Landing Page**: Hero with animated mesh gradient background, FlipWords ATS name cycling, SparklesText on gradient heading, NumberTicker animated counters, MovingBorder score preview cards, TextGenerateEffect description reveal, floating particles, mouse-tracking glow
- **Features Section**: 6 feature cards with SVG icons, gradient backgrounds, spotlight hover effect, section badge
- **How It Works Section**: 4-step timeline with gradient connectors, step cards with icons
- **Footer**: 4-column layout with Logo, product links, resources, legal info, social links
- **Scanner Page**: Resume upload (drag-and-drop, PDF/DOCX), job description input with toggle, background gradient orbs, scan/reset actions with loading states
- **Score Dashboard**: Summary card with average score, pass rate, mode badge, 6 ATS score cards with animated ring progress, keyword summary, breakdown bars, deduplicated suggestions
- **Animated UI Components**: FlipWords, NumberTicker, TextGenerateEffect, SparklesText, MovingBorder (all native Svelte, inspired by Aceternity/Magic UI)
- **Design System**: Dark glassmorphic theme, CSS custom properties, Open Props tokens, Geist font, scoped styles per component
- **Testing**: 106 unit/integration tests covering parser, scorer, NLP, job-parser, and full pipeline
- **CI/CD**: GitHub Actions for lint, typecheck, test, and build
- **Documentation**: README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, CHANGELOG

### Technical Details

- SvelteKit 5 with Svelte 5 runes ($state, $derived, $effect, $props)
- TypeScript strict mode, 0 type errors across 410+ files
- Vercel deployment with adapter-vercel
- pnpm package manager
- ESLint + Prettier + svelte-check
- Vitest for unit testing, Playwright for E2E
