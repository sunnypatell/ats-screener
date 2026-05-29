---
title: Configuration
description: Environment variables and configuration options for self-hosted instances.
---

## Environment Variables

All configuration is done through environment variables in the `.env` file. At least one provider must be configured (Gemini, Groq, or Ollama); the route returns `503` otherwise.

| Variable          | Required     | Description                                                                                                            |
| ----------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY`  | One of these | Google AI API key (Gemma 3 27B)                                                                                        |
| `GROQ_API_KEY`    | One of these | Groq API key (Llama 3.3 70B)                                                                                           |
| `OLLAMA_BASE_URL` | One of these | Base URL of a local Ollama daemon (e.g. `http://127.0.0.1:11434`)                                                      |
| `OLLAMA_MODEL`    | Optional     | Ollama model tag, defaults to `llama3.2`. Use any tag from `ollama list`.                                              |
| `OLLAMA_API_KEY`  | Optional     | Bearer token sent as `Authorization: Bearer {key}` on every Ollama request. Only needed if your Ollama is behind auth. |

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

### Behind a reverse proxy or auth gate

Vanilla `ollama serve` on `127.0.0.1` has no authentication, which is fine for a local-only setup. If your Ollama lives behind a reverse proxy that requires a bearer token, or you're pointing at a hosted Ollama-compatible endpoint (OpenWebUI, LiteLLM, OpenRouter's Ollama-compatible routes, a Cloudflare-tunneled daemon with a service token, etc.), set `OLLAMA_API_KEY` and the request will include `Authorization: Bearer {key}` on every call:

```bash
# in your .env
OLLAMA_BASE_URL=https://ollama.your-domain.tld
OLLAMA_MODEL=llama3.2
OLLAMA_API_KEY=sk-your-proxy-token
```

The header is only attached when the env var is non-empty, so leaving it unset keeps the request shape identical to the local-only setup. Empty or whitespace-only values are treated as not set so a stray `OLLAMA_API_KEY=` line in `.env` does not produce a malformed `Authorization: Bearer ` header that the proxy would reject.

## Running without Firebase

ATS Screener uses Firebase for sign-in and for cross-device scan history on the hosted instance. Self-hosters who don't want to run Firebase can leave every `PUBLIC_FIREBASE_*` env var unset and the app will detect this at startup and switch to a fully local mode:

- The scanner unlocks for anonymous use (no sign-in required).
- Scan history is persisted to the browser's `localStorage`, capped at 5 entries newest-first (same shape and cap as the Firestore-backed history).
- The Sign In button, user menu, and `/login` route are all hidden / redirect away.
- The Hero's "Users Served" counter is omitted from the landing page (it would have nothing to read).
- The Firebase SDK is never imported, so the build is smaller and the page never reaches out to `googleapis.com`.

Detection is based on a single signal: a non-empty `PUBLIC_FIREBASE_PROJECT_ID`. Set it (along with the rest of the Firebase config) to opt into auth + cross-device sync. Leave it unset (or empty) for fully local use.

```bash
# self-host without firebase: leave every PUBLIC_FIREBASE_* var unset.
# this is the default state; you don't need to add anything to .env.

# self-host with firebase: set all six.
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your-project
PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abc
```

Trade-offs of the no-Firebase path:

- **Single-device**: history lives in the current browser's `localStorage`. Clearing site data or switching browsers loses it. For cross-device sync, you need Firebase (or your own auth + database, see the issue tracker for roadmap discussion).
- **Quota**: `localStorage` is 5-10MB per origin. With the 5-entry cap (roughly 50KB total), you're 100x under that ceiling.
- **No password reset, no sign-out**: these features simply don't exist when auth is disabled, because there's no auth.
- **Saved JDs**: the "Saved JDs" feature in the Job Description textarea is already `localStorage`-backed and works either way.

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
