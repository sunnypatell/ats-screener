# roadmap, experimental cross-department track

a living backlog worked iteratively on the `feat/dev-fixes-and-features` branch by a senior team across security, engineering, performance, accessibility, marketing, SEO, growth, UX, and ops. the goal is to take this app from 1,300 users to 50,000 while keeping total cost at $0/month (firebase spark + vercel hobby) and shipping zero regressions. the LLM layer is intentionally out of scope (free providers stay free providers). every other surface is fair game.

ground rules:

- never push or merge to `main` from this branch.
- every item ships end to end: code, dry/smoke tests where feasible, commit, push.
- the quality gate (`pnpm check && pnpm lint && pnpm format:check && pnpm test && pnpm build`) must pass before each commit.
- prefer small, reversible changes. one item per iteration is fine.
- writing rule: no em dashes or double hyphens anywhere (chat, code, commits, comments, doc strings).

each entry: status, department(s), value, risk, how to test.

---

## done

- [x] **PR #10 audit fix: `loadFromHistory` abort race + clear `llmAnalysis` on history load** (engineering, UX). a click on a history entry mid-scan no longer lets the in-flight LLM call stomp the loaded snapshot, and stale analysis from a prior session is cleared so the dashboard never shows mismatched data. test: existing vitest suite (184 tests) green; manual flow: start a scan, click a history row, verify results stay pinned to the historical entry.
- [x] **privacy and data-handling notice + footer link** (legal, marketing, trust). new `/privacy` route describes what is collected, how it is processed, retention, third-party sharing, your rights under PIPEDA, and contact details. written in plain language; does not reveal architecture beyond what a user needs to make an informed decision. surfaced from the Legal column in the footer. test: dev server returns 200 on the route; rendered head includes proper SeoHead meta; footer link navigates correctly.
- [x] **PR template rewrite for open-source contributors** (community, marketing). the old template was a single one-line meta-instruction left over from an internal style note, which leaked the wrong tone to every external contributor. replaced with a short, human-toned scaffold (What changes / Why / Verification / Notes for reviewers) plus a one-line pointer to CONTRIBUTING.md. test: rendered the file in github preview locally; verified four section prompts read as hints not instructions.

## priority 1, cost containment (must hold $0 at 50k users)

- [x] **sample `scan_logs` writes via deterministic hashing** (engineering, ops, cost). new `$lib/sampling.ts` exports `shouldSample(seed, rate)` (djb2 hash, 10000 buckets, fail-closed on non-finite) and `parseSampleRate(raw)` (clamps `[0,1]`, default 1.0). `writeScanLog` now gates on `shouldSample(${uid}:${timestamp}, SCAN_LOG_SAMPLE_RATE)`. behaviour at current scale is unchanged because the default rate is 1.0; setting `PUBLIC_SCAN_LOG_SAMPLE_RATE=0.1` in vercel env drops 90% of writes to scan_logs without a redeploy, keeping us inside firestore spark when scan volume crosses ~14k/day. 12 new unit tests cover hash determinism, rate boundaries, and empirical distribution over 10k seeds. 196 tests total, all green.
- [x] **skip `loadHistory()` reload after save** (engineering, perf, cost). `saveToHistory` no longer issues a second `getDocs` after the prune; instead it builds the new `ScanHistoryEntry` from the in-flight `sanitized` payload plus the returned `docRef.id` and mutates `scanHistory` locally. one firestore read query per scan eliminated. on next cold start `loadHistory` still rehydrates the canonical set so any drift gets corrected. test: gate green (184 tests pass); flow inspection: the local entry shape is a complete `ScanHistoryEntry` so subsequent comparisons that depend on `scanHistory[0]` see exactly what `loadHistory` would have produced.
- [ ] **lazy-load pdfjs and mammoth on file pick, not scanner entry** (engineering, perf, UX). today the scanner chunk ships ~880 kb gzipped on first paint of `/scanner`. dynamic import these only after the user actually drops a file. reduces TTI for visitors who land but never upload. test: build, inspect node 6 chunk sizes, confirm pdfjs and mammoth no longer in the initial scanner chunk.
- [x] **CDN cache headers on `/sitemap.xml` and `/robots.txt`** (perf, ops). routes already had `max-age=3600` for browsers but no `s-maxage`, so vercel's edge cache passed through to the function on every miss. now emit `public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800` so the cdn absorbs crawler traffic. test: dev gate green; curl confirms the new header on both routes.

## priority 2, security

- [x] **resume-content XSS audit + guard test** (security, engineering). grep across `src/` confirmed two pre-existing `{@html}` usages, both intentional and trusted: landing-page JSON-LD (developer-authored literal with `<` escaped to unicode) and the docs SearchModal (pagefind build-time excerpts, no runtime user input). zero usages flow user, network, or LLM data into raw html. new `tests/unit/security/no-raw-html.test.ts` walks `src/`, fails CI if any new file introduces `{@html}`, `innerHTML=`, or `outerHTML=` outside the explicit allowlist. each allowlist entry carries an inline rationale so future auditors see the threat-model decision.
- [ ] **rate-limit metrics counter exposed at `/api/admin/rate-limit-stats`** (ops, security). gated by a shared secret in `RATE_LIMIT_ADMIN_TOKEN`. tiny in-memory tally of total requests, 429s by reason, top 10 offending IP prefixes (truncated). gives visibility without storage cost. test: hit the endpoint without the token, expect 401; with the token, expect json shape.
- [x] **CSP report dedupe and rate cap** (security, ops). new `src/routes/api/csp-report/throttle.ts` module: dedupes by `(directive, blocked-uri)` over a 5-minute window and caps total logs at 100 per rolling minute, with amortized O(1) gc on the dedupe map. supports legacy `{csp-report: {...}}` and modern reporting-api list shapes. wired into the endpoint as a single `if (shouldLogReport(reportKey(body)))` gate. 9 new tests cover dedupe within and across windows, distinct keys, hard cap behaviour, and minute-boundary reset. dry-tested via curl: first report logs, identical repeat suppressed silently. 206 tests total.
- [ ] **`/api/og` abuse hardening** (security, perf, cost). PR #10's CDN cache is content-addressed by score+pass+total+delta, so combinatorial spam is bounded, but a crawler can still hit the function the first time per unique URL. add an in-process LRU memo of last 1000 rendered images (already covered by the CDN, but defends against a cache-bypass header). test: 1000 unique requests in a tight loop, confirm function invocations stay flat after warmup.
- [ ] **enforce CSP after a soak window** (security). switch `Content-Security-Policy-Report-Only` to enforced once `/api/csp-report` shows a clean baseline for 7 days. requires nonce-based inline script support in the layout. higher risk; gate behind `CSP_ENFORCE=1` env.

## priority 3, accessibility (target WCAG 2.2 AA)

- [ ] **`prefers-reduced-motion` respect across all CSS animations** (a11y). audit every `transition`, `@keyframes`, and svelte `transition:` directive; wrap in `@media (prefers-reduced-motion: no-preference)` or short-circuit when reduced-motion is set. test: lighthouse a11y; manual via OS toggle.
- [x] **skip-to-content link** (a11y). new layout-level `<a class="skip-link" href="#content">` rendered before the Navbar, sliding into view from the top edge on focus. wrapper `<div id="content" tabindex="-1">` provides the focus target so the link works on every route without per-page coordination. animation respects `prefers-reduced-motion: reduce`. test: dev server `/` returns the link in dom and the wrapper id; gate green.
- [ ] **focus-visible audit on all interactive elements** (a11y). svelte components, custom buttons, share badges, suggestion cards. ensure a 2px high-contrast outline appears under keyboard focus and not under mouse focus. test: tab through scanner end to end, screenshot focus rings.
- [ ] **ARIA live region for scan state changes** (a11y). screen readers should hear "scanning", "scan complete, average score 87 of 100", "scan failed, fallback used". `polite` priority. test: VoiceOver runthrough.
- [ ] **dark theme color contrast audit** (a11y, design). axe or pa11y over the rendered pages, fix any AA failures. test: tooling output clean.

## priority 4, UX and growth

- [ ] **top-of-results "Quick Wins" card** (UX, growth). a small card above the score dashboard summarising the 3 highest-impact suggestions across all platforms. uses the existing `impact` field on `StructuredSuggestion`. test: unit test the picker (impact ranking, dedupe across platforms).
- [ ] **anonymous trial cap via localStorage** (growth). let users run 1 scan without signing in, then prompt for sign-in. localStorage key + simple gate in scanner. test: trigger the gate on second scan in incognito; confirm sign-in unlocks.
- [ ] **empty-state hint on scanner** (UX). when no file is loaded, render an explicit drag-and-drop area with copy and an upload icon. test: visual smoke.
- [ ] **paste-and-scan flow** (UX). textarea fallback for users who do not want to upload a file. wires into the same scoring path. test: paste a known resume, compare scores vs upload of the same content.
- [ ] **mobile UX pass on scanner** (UX, a11y). file picker on iOS Safari, modal scrolling, sticky toolbar overlap. test: chrome devtools device mode + manual on iOS if available.

## priority 5, SEO, PR, marketing

- [ ] **public `/changelog` route** (marketing, SEO). server-render from `CHANGELOG.md`. helps with branded search and gives release transparency. test: curl the route, verify structured headings and SEO meta.
- [ ] **public `/roadmap` route** (marketing, growth). render a sanitised version of this file (or a curated subset). signals momentum to potential users. test: curl, verify content.
- [ ] **FAQ JSON-LD on `/about`** (SEO). `FAQPage` structured data improves rich-result eligibility. test: validate via google's rich results test (manual).
- [ ] **RSS feed at `/releases.xml`** (marketing, ops). cheap, static, helps developer audiences subscribe. test: curl, validate xml.
- [ ] **per-route canonical edge cases** (SEO). audit `/share?...` query-param canonicals so the same score does not get crawled under multiple permutations. test: curl /share with mixed casing.

## priority 6, engineering and observability

- [ ] **in-house sampled error reporter at `/api/log-error`** (ops). client posts errors at 5% sampling, server console.warns; no storage. cost stays zero. test: throw a synthetic error, confirm 5% sample arrives at server logs.
- [ ] **structured logger** (ops). replace scattered `console.warn`/`console.error` with a tiny `log.info/warn/error` that emits json on server and is no-op in production browser. test: vitest assertions on the logger output shape.
- [x] **`/api/version` endpoint** (ops, UX). new GET returns `{ version, commit (7-char sha), branch, env }`. version comes from package.json read once at module load (per cold start), commit/branch/env come from `VERCEL_GIT_*` env vars (graceful "dev" fallback in dev). cache-control trades short browser ttl (60s) for long cdn ttl (5m) plus 1d stale-while-revalidate so the toast can spot a new deploy fast without function-invocation cost. test: dev curl returns expected shape; gate green. follow-up: client-side polling toast "new version available, refresh" lands as a separate, smaller iteration.
- [ ] **PWA manifest plus offline shell** (UX, perf). minimal manifest, service worker that caches the static shell so repeat visits load instantly. test: chrome devtools application tab; offline mode loads the shell.
- [ ] **web-vitals sampled collection** (perf, ops). 5% sample of CLS/LCP/INP posted to `/api/vitals`, server console-only. test: simulate a vitals event, confirm shape.

---

## stopping criteria

stop the loop when one of:

1. all items are checked, or
2. the next pending item's cons (risk, complexity, runtime cost, user friction) exceed its pros at this user scale, or
3. a CI gate or manual smoke surfaces a regression that warrants a halt and review.

when stopping, leave a final commit on the branch with a `STATUS.md` note summarising what shipped, what remained, and why.
