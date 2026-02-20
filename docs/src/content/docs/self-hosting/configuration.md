---
title: Configuration
description: Environment variables and configuration options for self-hosted instances.
---

## Environment Variables

All configuration is done through environment variables in the `.env` file.

| Variable           | Required     | Description                              |
| ------------------ | ------------ | ---------------------------------------- |
| `GEMINI_API_KEY`   | One of three | Google Gemini API key (primary provider) |
| `GROQ_API_KEY`     | Optional     | Groq API key (first fallback)            |
| `CEREBRAS_API_KEY` | Optional     | Cerebras API key (second fallback)       |

:::caution
Never commit your `.env` file to version control. It's already in `.gitignore`, but double-check before pushing.
:::

## Provider Priority

The LLM fallback chain follows this order:

1. **Gemini 2.5 Flash Lite** (if `GEMINI_API_KEY` is set)
2. **Groq Llama 3.3 70B** (if `GROQ_API_KEY` is set)
3. **Cerebras Llama 3.3 70B** (if `CEREBRAS_API_KEY` is set)

If a provider fails (timeout, rate limit, malformed response), the system automatically tries the next one.

## Free Tier Limits

| Provider | RPM | RPD    | Token Limit | Cost                   |
| -------- | --- | ------ | ----------- | ---------------------- |
| Gemini   | 15  | 1,000  | 250k TPM    | Free (blocks at limit) |
| Groq     | 30  | 14,400 | 6k TPM      | Free                   |
| Cerebras | 30  | 1,000  | 60k TPM     | Free                   |

**Key detail about Gemini:** The free tier will **block** requests at the limit, never auto-charge. You cannot accidentally incur costs.

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
