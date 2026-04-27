---
title: API Endpoints
description: REST API reference for integrating ATS Screener scoring into your tools.
---

ATS Screener exposes a single REST endpoint for all scoring operations.

## POST `/api/analyze`

Score a resume against all 6 ATS platforms, or extract requirements from a job description.

### Request

```bash
curl -X POST http://localhost:5173/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "full-score",
    "resumeText": "John Doe\nSoftware Engineer\n5 years React, TypeScript..."
  }'
```

### Request Body

| Field            | Type   | Required         | Description                                       |
| ---------------- | ------ | ---------------- | ------------------------------------------------- |
| `mode`           | string | Yes              | `"full-score"` or `"analyze-jd"`                  |
| `resumeText`     | string | For `full-score` | Raw text extracted from resume (max 50,000 chars) |
| `jobDescription` | string | For `analyze-jd` | Full job description text (max 20,000 chars)      |

**Validation rules:**

- `Content-Type` header must be `application/json`
- `resumeText` cannot be empty or whitespace-only
- `resumeText` maximum length: 50,000 characters
- `jobDescription` maximum length: 20,000 characters
- `mode` must be exactly `"full-score"` or `"analyze-jd"`

### Modes

#### `full-score`

Score a resume against all 6 ATS platforms. Optionally include a `jobDescription` for targeted scoring.

```json
{
	"mode": "full-score",
	"resumeText": "John Doe\nSoftware Engineer...",
	"jobDescription": "We are looking for a Senior Frontend Engineer..."
}
```

#### `analyze-jd`

Extract structured requirements from a job description without scoring a resume.

```json
{
	"mode": "analyze-jd",
	"jobDescription": "We are looking for a Senior Frontend Engineer..."
}
```

### Response (full-score)

```json
{
	"results": [
		{
			"system": "Workday",
			"vendor": "Workday Inc.",
			"overallScore": 75,
			"passesFilter": true,
			"breakdown": {
				"formatting": {
					"score": 80,
					"issues": ["Header content may be skipped"],
					"details": ["Single-column layout detected"]
				},
				"keywordMatch": {
					"score": 70,
					"matched": ["React", "TypeScript", "Node.js"],
					"missing": ["AWS", "CI/CD"],
					"synonymMatched": ["JavaScript frameworks"]
				},
				"sections": {
					"score": 85,
					"present": ["Experience", "Education", "Skills"],
					"missing": ["Certifications"]
				},
				"experience": {
					"score": 75,
					"quantifiedBullets": 8,
					"totalBullets": 12,
					"actionVerbCount": 10,
					"highlights": ["Strong quantification"]
				},
				"education": {
					"score": 90,
					"notes": ["BS Computer Science detected"]
				}
			},
			"suggestions": ["Add AWS and CI/CD keywords to match Workday's exact matching"]
		}
	],
	"_provider": "gemma-3-27b",
	"_fallback": false,
	"_cached": false
}
```

### Response Fields

| Field                    | Type                       | Description                                                                                                |
| ------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `results`                | array                      | Array of 6 platform scoring objects                                                                        |
| `results[].system`       | string                     | Platform name                                                                                              |
| `results[].overallScore` | number                     | 0-100 weighted composite score                                                                             |
| `results[].passesFilter` | boolean                    | Whether resume passes initial screening                                                                    |
| `results[].breakdown`    | object                     | Per-dimension scores and details                                                                           |
| `results[].suggestions`  | string \| StructuredItem[] | Platform-specific improvement tips. May be plain strings (rule-based) or structured objects (LLM-enhanced) |
| `_provider`              | string                     | Which LLM provider handled the request (e.g. `gemma-3-27b`, `groq-llama-3.3-70b`)                          |
| `_fallback`              | boolean                    | `true` when all providers failed and the client must fall back to local rule-based scoring                 |
| `_cached`                | boolean                    | `true` when the response was served from the in-memory result cache (sub-100ms, zero LLM cost)             |

The server keeps a SHA-256 keyed in-memory LRU of recent prompts (200 entries, 24h TTL). Identical input hits the cache and returns instantly; the `_cached` flag tells you whether the response was a hit. The cache lives per Vercel instance; cold starts begin empty.

## Auxiliary Endpoints

Every path below is publicly reachable. None of them require an API key. The two exceptions to "fully public" are flagged in the Notes column.

### Operations and deploy identity

| Path                          | Method | Purpose                                                                                                                               | Notes                                                                                                   |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `/healthz`                    | GET    | Liveness probe. Returns `{ status: "ok", timestamp, version, commit, env }` so a single probe confirms the right build is live.       | `Cache-Control: no-store`. Suitable for cron-job.org, BetterStack, etc.                                 |
| `/api/version`                | GET    | Public deploy identity. Returns `{ version, commit, branch, env }`. All four fields are non-sensitive (mirror of public GitHub repo). | Browser cache 60s, CDN cache 5m, SWR 1d.                                                                |
| `/api/admin/rate-limit-stats` | GET    | In-memory counters for the per-IP rate limiter (`totalChecks`, `totalAllowed`, `totalBlockedMinute`, `totalBlockedDaily`).            | Token-gated. Returns 503 if `ADMIN_TOKEN` env var is unset (16+ chars). Returns 401 on header mismatch. |

### Telemetry ingest (sampled, console-only logging)

| Path              | Method | Purpose                                                                                                                                                             | Notes                                                                                    |
| ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `/api/csp-report` | POST   | Receives Content-Security-Policy violation reports for the Report-Only header set by `hooks.server.ts`. Drops browser-extension noise before the throttle.          | 5-minute dedupe window per `(directive, blocked-uri)`, 100/min hard cap, 204 No Content. |
| `/api/log-error`  | POST   | Sampled client-error reporter wired from `window.onerror` and `unhandledrejection`. Body: `{ message, source, line, col, stack, url, ua, at }`. No durable storage. | 60/min rolling cap. 5% default sample rate (env-tunable via `PUBLIC_ERROR_SAMPLE_RATE`). |
| `/api/vitals`     | POST   | Sampled web-vitals collector for LCP and CLS. Body: `{ lcp, cls, url, ua, at }`. Uses native `PerformanceObserver` and `navigator.sendBeacon` on the client.        | 60/min rolling cap. 5% default sample rate (`PUBLIC_VITALS_SAMPLE_RATE`).                |

### Share and OpenGraph

| Path      | Method | Purpose                                                                                                                                        | Notes                                                                                                |
| --------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `/api/og` | GET    | Edge-cached PNG via `@vercel/og` for share previews. Query: `score`, `pass`, `total`, optional `delta`. Function-level LRU memo on top of CDN. | Per-route `Cross-Origin-Resource-Policy: cross-origin` so social platforms (LinkedIn, X) can scrape. |
| `/share`  | GET    | Branded share landing page. Reads the same query params and emits `og:image` pointing at `/api/og`. Native Web Share + Copy Link buttons.      | Static-ish, edge-cached.                                                                             |

### Discoverability and feeds

| Path                        | Method | Purpose                                                                                                                                                                                  | Notes                                                            |
| --------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `/robots.txt`               | GET    | Dynamic. Tracks deployment origin. References both the main sitemap and the docs sitemap-index for full crawl coverage.                                                                  | Cache: browser 1h, CDN 1d, SWR 7d.                               |
| `/sitemap.xml`              | GET    | Dynamic. Lists public routes plus key docs landings, each with `lastmod`, `changefreq`, and `priority`.                                                                                  | Cache: browser 1h, CDN 1d, SWR 7d.                               |
| `/llms.txt`                 | GET    | Curated link list for adopting AI crawlers (Anthropic, OpenAI, Perplexity standard). Dynamic origin so previews match themselves.                                                        | Cache: browser 1h, CDN 1d, SWR 7d.                               |
| `/releases.xml`             | GET    | RSS 2.0 feed parsed from `CHANGELOG.md`. One `<item>` per `## [X.Y.Z] - YYYY-MM-DD` block with title, GitHub anchor link, RFC 822 pubDate, stable guid, and CDATA-wrapped markdown body. | ETag round-trip on no-change. Cache: browser 1h, CDN 1d, SWR 7d. |
| `/.well-known/security.txt` | GET    | RFC 9116 disclosure channel. Lists Contact, Expires, Canonical, Policy, Acknowledgments, Preferred-Languages.                                                                            | Static file under `static/.well-known/`. Served `text/plain`.    |
| `/manifest.webmanifest`     | GET    | PWA manifest. Name, start_url, display, theme color, icons (favicon.svg plus 192/512 PNG, plus apple-touch-icon).                                                                        | Static. Browsers auto-fetch via `<link rel="manifest">`.         |
| `/humans.txt`               | GET    | Author colophon. Optional courtesy file for curious humans and automated scanners.                                                                                                       | Static.                                                          |

### Redirects

| Path       | Method | Behavior                                                                             |
| ---------- | ------ | ------------------------------------------------------------------------------------ |
| `/privacy` | GET    | 308 redirect to `/docs/legal/privacy/`. Old footer link kept working after the move. |
