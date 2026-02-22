---
title: Deployment
description: Deploy ATS Screener to Vercel, Netlify, or other platforms.
---

ATS Screener is designed for Vercel but works on any platform that supports SvelteKit.

## Vercel (Recommended)

The project is pre-configured with `@sveltejs/adapter-vercel`.

```bash
# install Vercel CLI
pnpm add -g vercel

# deploy
vercel --prod
```

### Set Environment Variables

In the Vercel dashboard:

1. Go to your project > **Settings** > **Environment Variables**
2. Add your API keys:
   - `GEMINI_API_KEY` (required)
   - `GROQ_API_KEY` (optional fallback)
   - `CEREBRAS_API_KEY` (optional fallback)
3. Add your Firebase config (all `PUBLIC_FIREBASE_*` variables from `.env.example`)

:::tip
Environment variables set in the Vercel dashboard are encrypted at rest and never exposed to the client. Server-side keys (like `GEMINI_API_KEY`) are only accessible in `+server.ts` files. `PUBLIC_` prefixed variables are available client-side.
:::

## Netlify

```bash
# install the adapter
pnpm add -D @sveltejs/adapter-netlify

# update svelte.config.js to use adapter-netlify

# deploy via Netlify CLI or Git integration
```

## Docker

```dockerfile
FROM node:20-slim AS base
RUN npm i -g pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-slim
WORKDIR /app
COPY --from=base /app/build ./build
COPY --from=base /app/package.json .

EXPOSE 3000
CMD ["node", "build"]
```

:::note
For Docker deployments, use `@sveltejs/adapter-node` and set environment variables via your container orchestrator (Docker Compose, Kubernetes, etc.).
:::

## Custom Domain

After deploying to Vercel:

1. Go to your project's **Settings** > **Domains**
2. Add your domain
3. Follow the DNS instructions
4. SSL is automatic

---

## Attribution

ATS Screener is MIT licensed. You're free to self-host, fork, and modify it. The only requirement is that you keep the original copyright notice and license file intact in your copy. If you build something on top of it, a visible credit linking back to the [original project](https://github.com/sunnypatell/ats-screener) is appreciated. Removing attribution and passing it off as your own work isn't cool.
