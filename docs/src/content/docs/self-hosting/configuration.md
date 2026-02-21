---
title: Configuration
description: Environment variables and configuration options for self-hosted instances.
---

## Environment Variables

All configuration is done through environment variables in the `.env` file.

| Variable           | Required | Description                                          |
| ------------------ | -------- | ---------------------------------------------------- |
| `GEMINI_API_KEY`   | Yes      | Google AI API key (used for Gemma 3 + Gemini models) |
| `GROQ_API_KEY`     | Optional | Groq API key (optional fallback)                     |
| `CEREBRAS_API_KEY` | Optional | Cerebras API key (optional fallback)                 |

:::caution
Never commit your `.env` file to version control. It's already in `.gitignore`, but double-check before pushing.
:::

## Provider Priority

The LLM fallback chain follows this order:

1. **Gemma 3 27B** (primary, 14,400 RPD via `GEMINI_API_KEY`)
2. **Gemini 2.5 Flash** (fallback, 20 RPD via `GEMINI_API_KEY`)
3. **Gemini 2.5 Flash Lite** (fallback, 20 RPD via `GEMINI_API_KEY`)
4. **Groq Llama 3.3 70B** (if `GROQ_API_KEY` is set)
5. **Cerebras Llama 3.3 70B** (if `CEREBRAS_API_KEY` is set)

If a provider fails (timeout, rate limit, malformed response), the system automatically tries the next one. All Google models (Gemma + Gemini) use the same API key.

## Free Tier Limits

| Provider | Model           | RPM | RPD    | Cost                   |
| -------- | --------------- | --- | ------ | ---------------------- |
| Gemma    | 3 27B (primary) | 30  | 14,400 | Free (blocks at limit) |
| Gemini   | 2.5 Flash       | 5   | 20     | Free (blocks at limit) |
| Gemini   | 2.5 Flash Lite  | 10  | 20     | Free (blocks at limit) |
| Groq     | Llama 3.3 70B   | 30  | 14,400 | Free                   |
| Cerebras | Llama 3.3 70B   | 30  | 1,000  | Free                   |

**Key detail about Google AI:** The free tier will **block** requests at the limit, never auto-charge. You cannot accidentally incur costs.

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

The default timeout for LLM requests is 60 seconds:

```typescript
const PROVIDER_TIMEOUT_MS = 60_000;
```

Increase this if you're experiencing timeouts with longer resumes.
