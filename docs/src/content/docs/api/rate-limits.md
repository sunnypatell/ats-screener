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

1. Each request is tracked by client IP address (via `cf-connecting-ip` or `x-forwarded-for`)
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

When you receive a `429` response:

```json
{
	"error": "rate limit exceeded. try again in 60 seconds."
}
```

**Best practices:**

- Implement exponential backoff in your client
- Cache results locally to avoid redundant requests
- For high-volume use, self-host with your own API keys

## Self-Hosted Limits

When self-hosting, rate limits are configurable. The actual bottleneck becomes your LLM provider's free tier:

| Provider | Model          | RPM | RPD    |
| -------- | -------------- | --- | ------ |
| Gemini   | 2.5 Flash Lite | 15  | 1,000  |
| Groq     | Llama 3.3 70B  | 30  | 14,400 |
| Cerebras | Llama 3.3 70B  | 30  | 1,000  |

:::tip
For the highest throughput on a self-hosted instance, configure both Gemini and Groq API keys. The fallback chain gives you up to 15,400 requests per day across both providers.
:::
