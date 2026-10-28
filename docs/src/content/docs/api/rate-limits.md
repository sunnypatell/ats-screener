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

| Provider | Model                 | Binding limit                  |
| -------- | --------------------- | ------------------------------ |
| Google   | Gemini 3.5 Flash Lite | requests per day, per model    |
| Groq     | GPT-OSS 120B          | 8K tokens per minute (~1 scan) |
| Google   | Gemini 3.1 Flash Lite | requests per day, per model    |

Google no longer publishes per-model limits in its docs. They are per-project and
visible only in [your AI Studio rate-limit page](https://aistudio.google.com/usage),
so read `429` responses rather than hardcoding thresholds.

- [Google AI rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Groq rate limits](https://console.groq.com/docs/rate-limits)

:::tip
A full scoring request measures about 6,000 tokens in and 2,300 to 3,700 tokens out. On
Google the binding constraint is requests per day, and free-tier quotas are counted per
model, so the two Flash Lite legs are two separate daily pools. Groq's 8K tokens per
minute fits about one scan a minute, enough for a fallback that only runs when Gemini fails.

The full Gemini Flash tiers are unusable here regardless of quality: 20 RPD. Gemma 4 is
excluded too, measured against the real prompt: about 110s per call, with output returned
in markdown fences instead of raw JSON.
:::
