---
title: Configuration
description: Environment variables and configuration options for self-hosted instances.
---

## Environment Variables

All configuration is done through environment variables in the `.env` file. At least one provider must be configured (Gemini, Groq, or Ollama); the route returns `503` otherwise.

| Variable          | Required     | Description                                                               |
| ----------------- | ------------ | ------------------------------------------------------------------------- |
| `GEMINI_API_KEY`  | One of these | Google AI API key (Gemma 3 27B)                                           |
| `GROQ_API_KEY`    | One of these | Groq API key (Llama 3.3 70B)                                              |
| `OLLAMA_BASE_URL` | One of these | Base URL of a local Ollama daemon (e.g. `http://127.0.0.1:11434`)         |
| `OLLAMA_MODEL`    | Optional     | Ollama model tag, defaults to `llama3.2`. Use any tag from `ollama list`. |

:::caution
Never commit your `.env` file to version control. It's already in `.gitignore`, but double-check before pushing.
:::

## Provider Priority

The LLM chain composes from whatever's configured in env. Ordering is fixed:

1. **Ollama** (`OLLAMA_BASE_URL`), local first when configured
2. **Gemma 3 27B** via Google (`GEMINI_API_KEY`)
3. **Llama 3.3 70B** via Groq (`GROQ_API_KEY`)

If a provider fails (timeout, rate limit, malformed response), the system automatically tries the next one. Because each provider uses a separate credential, their quotas are completely independent. Self-hosters who want a fully offline scanner should set only `OLLAMA_BASE_URL` and leave the cloud keys unset.

## Running Locally with Ollama

For privacy-first deployments where every byte of the resume stays on your machine:

```bash
# install ollama from https://ollama.com and pull a model
ollama pull llama3.2

# in your .env (or as shell vars before pnpm dev):
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2

# leave GEMINI_API_KEY / GROQ_API_KEY unset for offline-only mode
```

The Ollama path uses Ollama's `format: 'json'` so the model returns strict JSON without prompt-engineering tricks. First scan is slow on commodity hardware (60-120s for `llama3.2:3b` on a typical laptop); subsequent scans of the same resume hit the in-memory result cache and return in <100ms. Bigger models produce noticeably better suggestions but take longer.

The `/api/analyze` response includes `_provider: "ollama-{model}"` so you can confirm requests are landing locally and not falling back to a cloud key you forgot to remove.

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
