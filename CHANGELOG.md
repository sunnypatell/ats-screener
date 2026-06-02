# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-06-02

self-host authentication cycle: active directory / ldap sign-in (closes [#16](https://github.com/sunnypatell/ats-screener/issues/16)) and a true firebase-free self-host (closes [#13](https://github.com/sunnypatell/ats-screener/issues/13)). purely additive: the hosted firebase deployment is byte-identical, and the anonymous self-host path is unchanged.

### Added

- **Active Directory (LDAP) authentication as a third self-host mode.** set `LDAP_URL` (plus a read-only service-account bind and `SESSION_SECRET`) and the app authenticates users against an on-premise AD domain: users sign in with their AD username and password, the scanner and `/api/analyze` sit behind that login, and scan history is kept in `localStorage` namespaced per user. designed for self-hosters running inside their own network (a domain-joined host or any LAN box that can reach a domain controller), which is exactly where the directory is reachable. accepts UPN (`user@domain`), down-level (`DOMAIN\user`), and bare `sAMAccountName` logon formats; supports an optional group allow-list with nested-group membership; LDAPS with internal-CA trust; and maps AD account-state errors (disabled, locked, expired, must-change-password) to friendly messages while collapsing "no such user" and "bad password" into one message so the form can't enumerate accounts. the Active Directory UI only renders when `LDAP_URL` is set, so it is invisible on the public deployment. new docs page at `/docs/self-hosting/active-directory`.
- **Three mutually-exclusive auth modes, resolved server-side** (`resolveAuthMode`): `ldap` (when `LDAP_URL` is set) > `firebase` (when `PUBLIC_FIREBASE_PROJECT_ID` is set) > `none` (anonymous). the mode plus the validated user are surfaced to the client via a new root `+layout.server.ts`, and the auth store generalizes to all three while keeping the firebase code path identical.
- **Stateless signed session cookie** for ldap mode, signed and verified with the Web Crypto API (HMAC-SHA256) so `hooks.server.ts` stays free of node built-ins. there is no server-side session store: the signed cookie is the session, so it survives restarts and works across instances. rotating `SESSION_SECRET` invalidates every session.
- **Pluggable server auth-provider abstraction** (`ServerAuthProvider`, mirroring the `buildProviders()` LLM pattern) so OIDC / SAML can be added later without touching the ldap path. the `ldapts` client is an `optionalDependency`, dynamically imported only on the login route, so it never reaches the client/edge bundles and forks that don't set `LDAP_URL` never load it.
- **Per-IP failed-login lockout** for the ldap sign-in action, mirroring the analyze rate-limiter (in-memory, per-instance), plus reliance on SvelteKit's built-in form-action origin check for CSRF.
- **Reorganized self-hosting docs** with a dedicated [Authentication](/docs/self-hosting/authentication) page (anonymous vs firebase vs active directory, with precedence and trade-offs), a README self-hosting matrix, and a `.env.example` "Authentication" group.

### Fixed

- **No-firebase self-host is now genuinely firebase-free (closes [#13](https://github.com/sunnypatell/ats-screener/issues/13)).** the Content-Security-Policy is mode-aware: the firebase / google-auth origins (`*.googleapis.com`, `*.firebaseio.com`, `*.firebaseapp.com`, `accounts.google.com`) appear in `connect-src` / `frame-src` only when firebase is the active auth mode, so a docker / on-prem self-host without firebase no longer serves a CSP that references firebase or reports firebase-related violations. the firebase-auth `dns-prefetch` hints also moved out of `app.html` (where they fired for every visitor) into a firebase-mode-only block in the root layout, so a no-firebase install never resolves google / firebase DNS. the hosted firebase deployment keeps both the firebase CSP origins and the dns-prefetch hints.

### Tests

- 381 -> 464 (+83). new suites under `tests/unit/server/`: `auth/config` (mode precedence, trim semantics, fail-closed validation, defaults), `auth/normalize` (all three logon formats, RFC 4515 filter escaping / injection, nested-group filter), `auth/errors` (AD sub-code mapping incl. 525/52e collapsing to one message), `auth/session` (sign/verify round-trip, tamper / expiry / wrong-secret rejection), `auth/login-rate-limit` (lockout + window expiry), `auth/provider` (factory inert vs configured), and `csp` (firebase origins present in firebase mode, absent in self-host mode). plus `tests/unit/stores/scores-ldap-history-namespacing.test.ts` (per-user history keys, anonymous legacy key untouched) and updated `lcp-readiness` guards for the relocated dns-prefetch hints.

## [0.3.2] - 2026-05-29

self-hosting cycle. two distinct closes to two BloodyIron issues, both purely additive (hosted production behaviour is byte-identical).

### Added

- **`OLLAMA_API_KEY` env var** (closes [#7](https://github.com/sunnypatell/ats-screener/issues/7) follow-up). optional bearer token sent as `Authorization: Bearer {key}` on every Ollama request, so self-hosters running the daemon behind a reverse-proxy or a hosted Ollama-compatible endpoint (OpenWebUI, LiteLLM, OpenRouter's Ollama-compatible routes, Cloudflare-tunnel + service token) can authenticate. vanilla local `ollama serve` setups leave the var unset and the request shape stays identical: no header, no behaviour change. empty or whitespace-only values are treated as not set so a stray `OLLAMA_API_KEY=` line in `.env` does not produce a malformed `Authorization: Bearer ` header that the proxy would reject. self-hosting docs at `/docs/self-hosting/configuration` cover when you'd need it. 11 new unit tests cover the with-key / without-key / empty-key / whitespace-key paths plus env passthrough.
- **firebase-optional self-host mode** (closes [#13](https://github.com/sunnypatell/ats-screener/issues/13)). leave every `PUBLIC_FIREBASE_*` env var unset and the app detects it at startup via a non-empty `PUBLIC_FIREBASE_PROJECT_ID` check, then switches the entire app to a fully local mode: the scanner unlocks for anonymous use, scan history persists to `localStorage` (capped at 5 newest-first, same shape as the firestore documents), the Sign In button and user menu are hidden, `/login` redirects away, the Hero's "Users Served" counter is omitted (it has nothing to read), and the Firebase SDK is never imported. previously this configuration would hang the scanner indefinitely on the loading spinner because the auth listener would silently fail on missing config. hosted production is unchanged: if `PUBLIC_FIREBASE_PROJECT_ID` is set, every code path runs exactly as before. new "Running without Firebase" section in the self-hosting docs walks through the trade-offs (single-device-only history, no password reset, no sign-out, the Saved JDs feature still works because it's already localStorage).
- **`scoresStore.history` localStorage backend** under `ats_local_scan_history_v1`. mirrors the firestore behaviour for self-host: save prepends and caps at 5, load returns up to 5 newest-first, clear wipes both in-memory and the bucket. localStorage failures (quota exceeded, incognito sandbox) degrade to in-memory-only with a single warn log; the scan flow never breaks.
- **`firebaseConfigured` boolean** exported from `$lib/firebase`. single source of truth for the "is firebase available?" check, consumed by `authStore`, `scoresStore`, Hero, and downstream UI. `getFirebase()` now rejects with a clear typed error if called when not configured, so any future caller that forgets the guard gets an obvious failure instead of a confusing one.

### Fixed

- **Scanner page no longer hangs on the loading spinner when firebase is unconfigured**. previously `setupAuthListener` would await `getFirebase()`, which would throw inside the firebase SDK on missing config; the unhandled rejection left `authStore.loading = true` forever and the scanner showed "Loading..." with no way out. now the constructor short-circuits on `!firebaseConfigured` and flips loading to false immediately, and the listener path is wrapped in try/catch with a logged error so a SDK-side failure on hosted firebase doesn't hang either.

### Tests

- 354 -> 381 (+27 across the two fixes). new: `tests/unit/api/providers.test.ts` block of 11 ollama auth cases (with-key / without-key / empty / whitespace / coexistence with `Content-Type` / byte-identical URL+body across key states / `buildProviders` passthrough both directions / `OLLAMA_API_KEY` alone produces no provider). new: `tests/unit/lib/firebase-configured.test.ts` (7 cases covering present / missing / empty / whitespace-only project id, and the typed error message shape from `getFirebase`). new: `tests/unit/stores/scores-local-history.test.ts` (9 cases covering empty start, seeded read, save + cap, FIFO eviction, clear, persistence across instance recreation, no-network assertion, JD snippet truncation, unique ids).

## [0.3.1] - 2026-05-04

### Added

- **ollama support for self-hosters** (#7). new `OLLAMA_BASE_URL` (and optional `OLLAMA_MODEL`, defaulting to `llama3.2`) env vars opt the local ollama daemon into the provider chain. when set, ollama is tried first; a fork running purely on local models needs no cloud keys. hosted instances stay unchanged: leave the new vars unset and the chain remains `[gemma, groq]` with identical request shape and 90s/30s timeouts. self-hosting docs at `/docs/self-hosting/configuration` walk through the install + .env setup.
- **provider chain extracted** to `src/routes/api/analyze/providers.ts` so composition is unit-testable in isolation. 18 new tests cover the cloud-only / ollama-only / all-three permutations, request shape (`POST {base}/api/chat`, `format: "json"`, trailing-slash forgiveness), response extraction, and per-provider timeouts.

### Fixed

- **`extractText` null-safety** across all three providers (google, groq, ollama). a malformed upstream response that decoded to `null` would throw `TypeError: Cannot read properties of null` before optional chaining could save it. all three now guard with `if (!data || typeof data !== 'object') return ''` so a misbehaving provider falls through to the next cleanly.

### Changed

- `LLMProvider.apiKeyName` renamed to `configKey` (ollama uses a base URL, not an API key). pure rename, no behavior change.
- `PROVIDER_TIMEOUTS_MS` parallel array removed; `timeoutMs` now lives on each `LLMProvider` so dynamic chain composition can carry per-provider deadlines without index juggling. values preserved: 90s gemma, 30s groq, 240s ollama.

## [0.3.0] - 2026-04-26

A wide pass across security, performance, accessibility, observability, and UX. The scoring engine and ATS profiles are unchanged. The differences a returning user will notice: a dotted paste-and-scan field next to the uploader, a JD library that saves job descriptions locally, a service worker that keeps the shell available offline, a themed 404 with a thinking bitmoji, and a faster, denser dashboard on phones. Everything else is behind-the-scenes hardening that makes the app cheaper to run, safer to use, and easier to crawl.

### Added

- **Paste-and-scan flow**: a textarea below the file uploader accepts resume text directly. New `parseResumeText` parser entry runs the same downstream extraction (sections, contact, experience, education, skills) as the file path, so scoring is identical whether you upload a PDF, a DOCX, or paste raw text.
- **JD Library**: a new `$lib/stores/jd-library.svelte.ts` store keeps up to ten job descriptions in `localStorage`. The "Saved JDs" pill on the JD textarea opens a dropdown of past entries with relative timestamps and a delete control, so applying to similar roles no longer means re-pasting the same JD. localStorage failures (incognito, sandboxed iframes) fall back to in-memory and warn once per session.
- **Service worker offline shell**: `src/service-worker.ts` precaches the build assets, takes over via `skipWaiting()` plus `clients.claim()`, uses cache-first for hashed assets, network-first for routes, and skips `/api/*` and cross-origin requests entirely so user-specific scoring is never cached. Registered from `+layout.svelte` only in production. Eight structural unit tests lock the invariants.
- **Themed 404**: `+error.svelte` now branches on `page.status === 404` and renders giant Geist Mono glitch numerals with a chromatic-aberration animation, mouse-parallax cyan/purple/blue orbs, four suggested-navigation chips, and a thinking bitmoji parked in the bottom-right with a slow bob. All motion is disabled under `prefers-reduced-motion`. Other statuses (429, 500) keep the existing professional card.
- **Privacy notice**: lives at `/docs/legal/privacy/` (Starlight). Plain-language coverage of what is collected (account info, capped scan history), what is not (raw resume text, full job description, file binaries), how scoring requests flow through the serverless function, third-party providers, retention, and practical rights regardless of jurisdiction. Includes a per-statute reading on whether PIPEDA, CCPA, and GDPR formally apply to a non-commercial student portfolio project that accepts voluntary donations.
- **Structured logger module**: `$lib/log.ts` exports `log(level, event, fields?)` plus `logger.{debug, info, warn, error}` shortcuts. Server emits NDJSON for Vercel log search; browser passes structured records to console for devtools-friendly expansion. Info and debug calls are silenced on non-localhost browsers in production. Every `console.warn` and `console.error` in `src/` was migrated to this module so log shape is consistent across the app.
- **Highest-impact fixes band on the dashboard**: a band between the summary card and the toolbar surfaces the top three structured suggestions across every ATS profile, ranked by impact (critical, high, medium, low) and deduplicated by summary text. Backed by `pickQuickWins` in `$engine/scorer/quick-wins`.
- **`/llms.txt`** at the site root so adopting AI crawlers (Anthropic, OpenAI, Perplexity) ingest a curated link list rather than scraping the full site.
- **`/.well-known/security.txt`** per RFC 9116, listing Contact, Expires, Canonical, and Policy fields for responsible disclosure.
- **PWA manifest** at `/manifest.webmanifest` with start_url, display, theme color, plus 192 and 512 PNG icons sized for the install prompt.
- **RSS 2.0 feed** at `/releases.xml` parsed from `CHANGELOG.md`, with ETag round-trip and CDN caching.
- **`/api/version`** endpoint returning `{ version, commit, branch, env }` for ops.
- **`/api/log-error`** sampled client-error reporter (5 percent default rate, env-tunable) with a 60-per-minute rolling cap and `keepalive: true` POST so reports survive page navigation.
- **`/api/vitals`** sampled web-vitals collector (LCP and CLS) using native `PerformanceObserver` and `navigator.sendBeacon`. No new dependency.
- **`/api/admin/rate-limit-stats`** token-gated counters (503 fail-closed when no `ADMIN_TOKEN` is configured).
- **`/healthz`** enriched with version, commit, env so deploys can be verified without the dashboard.
- **noscript fallback** with key links so JS-disabled visitors and bots see meaningful content.
- **Skip-to-content link** in the root layout.
- **ARIA live region** on the scanner announcing scan state to screen readers.
- **aria-current=page** on Navbar links.
- **og:image:alt + twitter:image:alt** for social-share accessibility, plus iOS PWA polish meta tags (apple-mobile-web-app-capable, status-bar-style, application-name).
- **`color-scheme=dark`** and **`format-detection=telephone=no`** so native form controls render in dark mode and mobile browsers stop auto-linking numeric strings as phone numbers.
- **Native Web Share + Copy Link** buttons on `/share`.
- **humans.txt** colophon at site root.
- **Person schema JSON-LD** on `/about` for entity recognition.
- **Sample JD button** in the JD textarea so a curious user can demo targeted scoring without writing a JD from scratch.

### Changed

- **Sign-in is now required for every scan, no exceptions.** A short-lived anonymous-trial path that briefly shipped during this cycle was reverted: the scanner page renders the auth gate the moment it sees an unauthenticated session, no localStorage flag, no free single scan. Documentation, FAQ, and changelog references to the trial were swept out so the policy reads consistently across the app.
- **WCAG 2.2 AA contrast guard**: a new test in `tests/unit/a11y/contrast.test.ts` parses every text-on-bg color token from `tokens.css` and asserts at least a 4.5:1 ratio for body text (3:1 for large or UI text). Lifted `--text-tertiary` alpha from 0.4 to 0.5 (3.78:1 to 5.36:1), replaced two semi-transparent reds and greens with solid tokens (3.02:1 to 5.21:1, 4.63:1 to 7.73:1), and swapped a hardcoded LinkedIn blue on a tinted background for `--accent-blue` (3.10:1 to 4.79:1).
- **Mobile UX pass on the scanner**: file picker accepts MIME types alongside extensions for reliable iOS Safari behavior, safe-area inset on the scanner bottom padding for notched iPhones, every action button raised to a 44x44 touch target (WCAG 2.5.5), Navbar hamburger raised to 44x44, dashboard toolbar wraps and stretches to full width on narrow screens, share badge dialog uses dynamic viewport height plus iOS momentum scrolling, search modal results use momentum scrolling.
- **CWV preload**: Google Fonts stylesheet preloaded with `as="style"` so `@font-face` rules arrive before the first paint, the `dns-prefetch` versus `preconnect` decision for Firebase auth and font hosts is documented inline in `app.html`, every `<img>` in component code now has explicit width and height plus `loading="lazy"` and `decoding="async"` where appropriate, and a new test in `tests/unit/perf/lcp-readiness.test.ts` locks the invariants.
- **Security headers**: HSTS extended to `max-age=63072000; includeSubDomains; preload` (2 year preload-list minimum, gated to https only so localhost is never poisoned), `Cross-Origin-Opener-Policy: same-origin-allow-popups` (preserves Firebase popup auth while isolating the browsing context), `Cross-Origin-Resource-Policy: same-origin` globally with a `cross-origin` exception on `/api/og` (LinkedIn, Twitter, Slack still scrape share previews), `X-DNS-Prefetch-Control: on`, `X-Permitted-Cross-Domain-Policies: none`. Thirteen header regression tests in `tests/unit/security/headers.test.ts` lock the values.
- **Permissions-Policy** extended with `interest-cohort=()` and `browsing-topics=()` to opt out of FLoC and the Topics API.
- **Sitemap and robots.txt**: main sitemap grew from 3 to 9 entries (now includes key docs landings); robots.txt references both the main sitemap and the docs sitemap-index.
- **Lazy-loaded resume parser**: pdfjs and mammoth ship in separate chunks, so a PDF-only user no longer loads mammoth and vice versa. The prior 880KB combined parser chunk is gone.
- **CDN caching** on `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/releases.xml`, `/api/og`, and `/privacy`. All static-ish endpoints serve from edge cache with stale-while-revalidate.
- **`/api/og` function-level memo** in addition to the CDN cache, so a cache-bypass header from a misconfigured client does not re-render the same image.
- **og-image.png** recompressed from 640KB to 247KB via sharp palette mode (61 percent smaller, identical visual).
- **apple-touch-icon.png** recompressed from 4.8KB to 2.8KB.
- **Auto-noindex preview deploys**: any `*.vercel.app` host that is not the production hostname now emits `meta robots="noindex, nofollow"` automatically.
- **`@vercel/og`** runtime moved off the deprecated `runtime: 'edge'` config to default node.
- **Highest-impact fixes** is the user-visible heading on the dashboard suggestions band (was "Quick Wins"). Internal symbols and CSS classes are unchanged.
- **Cmd+K hint**: Navbar and SearchModal now render `command + K` on macOS and `Ctrl + K` elsewhere, with spaces around the plus on both for legibility.
- **Footer cleanup**: the version badge linking to GitHub CHANGELOG and the standalone Changelog resource link were both removed (one source of truth on GitHub).
- **Public-roadmap docs page** removed entirely. The roadmap is iteration-shaped; a docs page on top of it became governance debt.
- **About FAQ and FAQPage JSON-LD** removed in favor of pointing curious users at `/docs`.
- **PR template** rewritten as a clean four-section scaffold (What changes / Why / Verification / Notes).

### Fixed

- **Localhost dev 403 on `/package.json?import`**: the Footer used to import `package.json` directly to render the version badge, which Vite blocks via `fs.deny`. The version is now inlined at build time via Vite's `define` from the read at config load. The badge itself was removed in this release.
- **Hydration mismatch on the home page**: `Math.random` calls in `Hero`, `SparklesText`, `ParticleField`, `AnimatedGridBackground`, and `Meteors` ran at module load, producing different output between SSR and client. All five were moved into `$effect` so SSR renders an empty decoration layer and the client fills in after hydration.
- **Hydration mismatch on the scanner**: `auth.svelte.ts` was setting `loading = false` on the SSR path while the client started with `loading = true`. SSR now keeps `loading = true` so both initial renders match; `onAuthStateChanged` resolves the real state after hydration.
- **Google profile picture not loading**: the global `Referrer-Policy` was causing the Google CDN to reject avatar fetches that included a referer. The avatar `<img>` now sets `referrerpolicy="no-referrer"` so the CDN request is anonymous and reliable.
- **Mobile dashboard suggestion text overlap**: `.suggestion-card-header` is now flex-wrap on mobile, `.suggestion-summary` is line-clamped to two lines when collapsed and unclamped when expanded, and the platform chips hide on phone widths to reclaim space.
- **Mobile dashboard card width parity**: summary, suggestions, and Priority Focus Areas cards used to render at slightly different widths on phones. All three now share `1.75rem` mobile padding so they line up.
- **Mobile UserMenu dropdown centering**: when the avatar lives inside the hamburger column, the dropdown was right-anchored to the column edge. It now anchors via `left: 50%` with a centered translate plus a separate keyframe.
- **Mobile mini-bars visibility**: the summary mini-bars were collapsing to a few visible pixels because of fixed 80px label and tight gaps. Mobile rule widens labels to 110px, raises track height, and bumps the row gap so each ATS bar is readable.
- **Sample resume button burning LLM quota**: a one-click "Try with a sample resume" affordance fired a real LLM scan against a fictional resume on every press. It was removed entirely. The sample JD button stays because it only populates the textarea.
- **Users-served counter not animating**: the IntersectionObserver threshold on the hero stats strip lowered from 0.5 to 0.1 (10 percent visibility is enough on any viewport). Added a 1500ms safety fallback that triggers the count-up if the observer still hasn't fired after the count loads.
- **`prefers-reduced-motion`** now also kills `animation-delay`, `transition-delay`, and document-level `scroll-behavior`. JS-driven smooth scroll opts in via `$lib/a11y.ts`.
- **`scan_logs` writes** are sampled via deterministic hash (`PUBLIC_SCAN_LOG_SAMPLE_RATE`, default 1.0) so high-traffic deployments can dial the rate down without redeploying.
- **Skip post-save `loadHistory` reload**: `saveToHistory` mutates `scanHistory` locally, eliminating one Firestore read query per scan.
- **Focus indicators** restored on previously-suppressed inputs (SearchModal search-input, login `.field-input`, uploader privacy-link).
- **CSP report extension noise**: a new filter drops reports whose blocked-uri starts with `chrome-extension://`, `moz-extension://`, `safari-extension://`, or `safari-web-extension://` ahead of the throttle, so the per-minute cap is reserved for genuine violations.
- **Critical CVEs**: `jspdf` 4.2.0 to 4.2.1 (HTML injection) and transitive `protobufjs` to 7.5.5 via `firebase` bump (arbitrary code execution).
- **Em dashes purged** from every comment, log string, and SEO title that I introduced this cycle, per the project writing rule.

### Tests

- 336 tests passing (up from 223 at 0.2.0). Added coverage for the structured logger, JD library, service worker invariants, security headers, WCAG 2.2 AA contrast, LCP readiness, paste-resume parsing, and the no-raw-html guard.

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
