---
title: Rate Limits
description: API rate limiting policies and how to handle limit errors.
---

ATS Screener implements rate limiting to protect the free-tier LLM APIs and prevent abuse.

## Limits

| Limit               | Value | Scope          |
| ------------------- | ----- | -------------- |
| Requests per minute | 10    | Per IP address |
| Requests per day    | 200   | Per IP address |

## How It Works

Rate limiting is enforced at the SvelteKit server endpoint level:

1. Each request is tracked by client IP address (via `x-forwarded-for`)
2. If the per-minute limit is exceeded, subsequent requests receive `429 Too Many Requests`
3. If the daily limit is exceeded, requests are blocked until the window resets

## Security Headers

All API responses include:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Cache-Control: no-store
```

## Handling Rate Limits

When you receive a `429` response, the body distinguishes which window was hit and the response includes a `Retry-After` header set to the seconds-until-reset for that window:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
Content-Type: application/json
```

```json
{
	"error": "rate limit exceeded: too many requests this minute. retry after 60s.",
	"retryAfter": 60
}
```

The error string ends with either `too many requests this minute` (per-minute window) or `daily limit reached` (per-day window). The `retryAfter` field (seconds) and the `Retry-After` header always match; clients can use either.

**Best practices:**

- Honor the `Retry-After` header (it is the exact reset window for the limit you tripped)
- Cache results locally to avoid redundant requests (the server also caches identical inputs in-memory; see the `_cached` flag in [endpoints](./endpoints))
- Implement exponential backoff for transient 5xx errors (rate-limit 429s should use Retry-After directly)
- For high-volume use, self-host with your own API keys

## Self-Hosted Limits

When self-hosting, rate limits are configurable. The actual bottleneck becomes your LLM provider's free tier:

| Provider | Model                 | RPM | RPD   | TPM  | TPD  |
| -------- | --------------------- | --- | ----- | ---- | ---- |
| Google   | Gemini 3.5 Flash Lite | 15  | 500   | 250K | -    |
| Groq     | Llama 3.3 70B         | 30  | 1,000 | 12K  | 100K |

Google no longer publishes per-model limits in its docs. They are per-project and
visible only in [your AI Studio rate-limit page](https://aistudio.google.com/usage),
so treat the numbers above as observed values rather than contractual ones, and read
`429` responses rather than hardcoding thresholds.

- [Google AI rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Groq rate limits](https://console.groq.com/docs/rate-limits)

:::tip
A full scoring request measures ~5,950 tokens in and ~3,330 tokens out. On Google the
binding constraint is RPD, not TPM: 500 scans/day, with RPM 15 governing burst. Groq's
100K TPD adds roughly 12 scans/day as a cross-vendor fallback.

The chain runs exactly one model per vendor. A second Gemini model on the same API key
does not get its own quota pool, so stacking them only spends latency before reaching
the fallback that can actually answer.

The full Gemini Flash tiers are unusable here regardless of quality: 20 RPD. Gemma 4 is
excluded too, on three counts measured against the real prompt: ~110s per call, output
returned in markdown fences instead of raw JSON, and a free tier whose terms include
using submitted data to improve Google's products, which is disqualifying for resume text.
:::

:::caution
`llama-3.3-70b-versatile` shuts down on **2026-08-16**. No remaining Groq free-tier model
fits this prompt afterwards (8K TPM ceiling against ~9.3K needed), so the Groq leg must be
dropped or the prompt shrunk before that date. The two Google legs are unaffected.
:::
