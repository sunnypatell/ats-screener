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

| Provider | Model         | RPM | RPD    | TPM | TPD  |
| -------- | ------------- | --- | ------ | --- | ---- |
| Google   | Gemma 3 27B   | 30  | 14,400 | 15K | -    |
| Groq     | Llama 3.3 70B | 30  | 1,000  | 12K | 100K |

For the latest limits, see the official documentation:

- [Google AI rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Groq rate limits](https://console.groq.com/docs/rate-limits)

:::tip
The hosted version uses Gemma 3 27B as the primary model with Llama 3.3 70B via Groq as fallback. Both run on independent free tiers. The binding constraint is TPM (tokens per minute), not RPD. Each scan uses ~8,000 tokens total (prompt + response), giving a realistic throughput of roughly 2,600 scans per day from Gemma alone. Groq's free tier adds ~12 scans/day (100K TPD limit) as an emergency safety net.
:::
