---
title: Configuration
description: Environment variables and configuration options for self-hosted instances.
---

## Environment Variables

All configuration is done through environment variables in the `.env` file.

| Variable         | Required    | Description                                    |
| ---------------- | ----------- | ---------------------------------------------- |
| `GEMINI_API_KEY` | Yes         | Google AI API key (powers Gemma 3 27B primary) |
| `GROQ_API_KEY`   | Recommended | Groq API key (Llama 3.3 70B fallback)          |

:::caution
Never commit your `.env` file to version control. It's already in `.gitignore`, but double-check before pushing.
:::

## Provider Priority

The LLM fallback chain uses cross-provider redundancy so quota limits on one provider don't cascade:

1. **Gemma 3 27B** via Google (primary, `GEMINI_API_KEY`)
2. **Llama 3.3 70B** via Groq (fallback, `GROQ_API_KEY`)

If a provider fails (timeout, rate limit, malformed response), the system automatically tries the next one. Because each provider uses a separate API key, their quotas are completely independent.

## Free Tier Limits

| Provider | Model         | RPM  | RPD    | TPM | Cost |
| -------- | ------------- | ---- | ------ | --- | ---- |
| Google   | Gemma 3 27B   | 30   | 14,400 | 15K | Free |
| Groq     | Llama 3.3 70B | 1000 | 14,400 | 12K | Free |

Both providers block at their limits and never auto-charge. You cannot accidentally incur costs.

For the latest limits, see the official documentation:

- [Google AI rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Groq rate limits](https://console.groq.com/docs/rate-limits)

## Rate Limiting

Rate limiting is configured in `src/routes/api/analyze/+server.ts`:

```typescript
const RATE_LIMIT = {
	maxPerMinute: 10,
	maxPerDay: 200
};
```

Adjust these values based on your expected traffic and API key limits.

## Timeouts

Each provider has its own timeout. [Vercel Fluid Compute](https://vercel.com/docs/fluid-compute) is enabled by default and allows up to 300 seconds on the Hobby plan:

```typescript
// Gemma: 90s, Groq: 30s → worst case total: 120s
const PROVIDER_TIMEOUTS_MS = [90_000, 30_000];
```

Gemma 3 27B typically takes 30-45 seconds for the full scoring prompt but can spike under load. The 90s timeout gives generous headroom. Groq responds in under 1 second but gets 30s for safety. If both providers fail, the system falls back to rule-based scoring on the client side.
