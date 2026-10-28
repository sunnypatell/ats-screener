---
title: Configuration
description: Environment variables and configuration options for self-hosted instances.
---

## Environment Variables

All configuration is done through environment variables in the `.env` file. At least one provider must be configured (Gemini, Groq, or Ollama); the route returns `503` otherwise.

| Variable          | Required     | Description                                                                                                            |
| ----------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY`  | One of these | Google AI API key. Enables both Gemini legs (3.5 Flash Lite and 3.1 Flash Lite)                                        |
| `GROQ_API_KEY`    | One of these | Groq API key (GPT-OSS 120B). Recommended cross-vendor fallback                                                         |
| `OLLAMA_BASE_URL` | One of these | Base URL of a local Ollama daemon (e.g. `http://127.0.0.1:11434`)                                                      |
| `OLLAMA_MODEL`    | Optional     | Ollama model tag, defaults to `llama3.2`. Use any tag from `ollama list`.                                              |
| `OLLAMA_API_KEY`  | Optional     | Bearer token sent as `Authorization: Bearer {key}` on every Ollama request. Only needed if your Ollama is behind auth. |

:::caution
Never commit your `.env` file to version control. It's already in `.gitignore`, but double-check before pushing.
:::

## Provider Priority

The LLM chain composes from whatever's configured in env. Ordering is fixed:

1. **Ollama** (`OLLAMA_BASE_URL`), local first when configured
2. **Gemini 3.5 Flash Lite** via Google (`GEMINI_API_KEY`)
3. **GPT-OSS 120B** via Groq (`GROQ_API_KEY`)
4. **Gemini 3.1 Flash Lite** via Google (`GEMINI_API_KEY`)

Gemini free-tier quotas are counted per project **per model**, so the two Google legs draw
on separate daily pools, and a model-specific overload (`503 high demand`) on one rarely
affects the other. Groq sits in the middle because it is a different vendor, and once its
free tier can't admit a request it says so in under 100ms, so it never eats the time the
last leg needs.

:::note[Why GPT-OSS 120B on Groq]
Groq retired `llama-3.3-70b-versatile` on 2026-08-16. Of what remains on its free tier,
measured against the real capped prompt (about 6,000 tokens in, 2,300 to 3,700 out):

- `qwen/qwen3.8-27b` is capped at 1,000 output tokens per minute, so a full answer never fits.
- `openai/gpt-oss-20b` fails Groq's `json_object` validation on this prompt.
- `openai/gpt-oss-120b` returns the complete 6-platform JSON in 6 to 9 seconds, provided
  `reasoning_effort` is `low` and `max_tokens` is at least 4,096. Its reasoning tokens count
  against `max_tokens`, and at 3,072 the JSON is cut off after two platforms.

Groq admits a request against its 8K tokens-per-minute ceiling using the input plus an
estimate of the output, and for a prompt this size that estimate sometimes lands over the
limit (`413`, `Requested 8330 / Limit 8000`). In testing it answered three of four requests
in a fresh minute. Either way the refusal comes back in under 100ms, which is why Gemini 3.1
Flash Lite, not Groq, is the last leg.
:::

If a provider fails (timeout, rate limit, malformed response), the system automatically tries the next one. Self-hosters who want a fully offline scanner should set only `OLLAMA_BASE_URL` and leave the cloud keys unset.

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

## Authentication

How users sign in (or whether they sign in at all) is a separate choice from the LLM provider, and it's also driven by environment variables. ATS Screener supports three modes, picked automatically:

- **Anonymous**: leave Firebase and LDAP unset. The scanner is open and history is local. This is the default.
- **Firebase**: set the `PUBLIC_FIREBASE_*` variables for Google / email sign-in and synced history.
- **Active Directory**: set `LDAP_URL` for on-premise AD sign-in.

See [Authentication](/docs/self-hosting/authentication) for the full comparison and the [Active Directory guide](/docs/self-hosting/active-directory) for AD setup. The Firebase variables are listed below.

```bash
# self-host without firebase: leave every PUBLIC_FIREBASE_* var unset (the default).
# self-host with firebase: set all six.
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your-project
PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abc
```

## Free Tier Limits

| Provider | Model                 | Binding limit                  | Cost |
| -------- | --------------------- | ------------------------------ | ---- |
| Google   | Gemini 3.5 Flash Lite | requests per day, per model    | Free |
| Groq     | GPT-OSS 120B          | 8K tokens per minute (~1 scan) | Free |
| Google   | Gemini 3.1 Flash Lite | requests per day, per model    | Free |

Google no longer publishes fixed free-tier numbers; your project's current per-model
limits are on the [AI Studio usage page](https://aistudio.google.com/usage). Groq's 8K
tokens per minute fits roughly one scan a minute, which is plenty for a fallback that
only runs when Gemini fails.

Every provider blocks at its limits and never auto-charges. You cannot accidentally incur costs.

For the latest limits, see the official documentation:

- [Google AI rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Groq rate limits](https://console.groq.com/docs/rate-limits)

## Rate Limiting

Rate limiting is configured in `src/routes/api/analyze/rate-limiter.ts`:

```typescript
const MAX_RPM = 10;
const MAX_RPD = 200;
```

Adjust these values based on your expected traffic and API key limits.

## Timeouts

Each provider has its own timeout. [Vercel Fluid Compute](https://vercel.com/docs/fluid-compute) is enabled by default and allows up to 300 seconds on the Hobby plan:

```typescript
// Gemini 3.5: 25s, Groq: 12s, Gemini 3.1: 20s → worst case total: 57s
timeoutMs: 25_000; // buildGoogleProvider default
timeoutMs: 12_000; // buildGroqProvider
timeoutMs: 20_000; // gemini-3.1-flash-lite leg in buildProviders
```

Two constraints govern these numbers.

**They must sum to less than the route's `maxDuration` (60s)**, or the platform kills the
function before the last leg can run, silently turning a three-provider chain into a
shorter one. 25 + 12 + 20 leaves 3s of margin.

**Each provider's token budget must be reachable inside its own timeout.** The slowest
measured throughput is 311 tok/s on 3.5 Flash Lite, about 300 on 3.1 Flash Lite and 400 on
GPT-OSS 120B, so 6,144 tokens need 19.8s, 5,120 need 17.1s and 4,096 need 10.2s. If a budget were raised
above what its timeout allows, any response that ran to full length would be aborted
mid-flight, wasting the call and the fallback behind it. A unit test enforces this.

Typical requests are far below the ceiling: either Flash Lite answers in 6-11s and
GPT-OSS 120B in 6-9s. Output size tracks the fixed 6-platform schema rather than resume length, so a
short resume and a maxed-out one produce within 5% of the same number of output tokens.

If every provider fails the route returns `503` and logs `llm.all_providers_failed` at
error level, and the client falls back to rule-based scoring.
