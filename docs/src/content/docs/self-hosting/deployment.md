---
title: Deployment
description: Deploy ATS Screener to Cloudflare Pages, Vercel, or other platforms.
---

ATS Screener is designed for Cloudflare Pages but works on any platform that supports SvelteKit.

## Cloudflare Pages (Recommended)

The project includes a `wrangler.toml` for Cloudflare Pages deployment.

```bash
# install Wrangler CLI globally
pnpm add -g wrangler

# login to Cloudflare
wrangler login

# deploy
pnpm build && wrangler pages deploy .svelte-kit/cloudflare
```

### Set Environment Variables

In the Cloudflare dashboard:

1. Go to **Pages** > your project > **Settings** > **Environment variables**
2. Add your API keys as production secrets:
   - `GEMINI_API_KEY`
   - `GROQ_API_KEY` (optional)
   - `CEREBRAS_API_KEY` (optional)

:::tip
Environment variables set in the Cloudflare dashboard are encrypted at rest and never exposed to the client. They're only accessible in server-side code (`+server.ts` files).
:::

## Vercel

```bash
# install Vercel CLI
pnpm add -g vercel

# swap the adapter in svelte.config.js
# change: import adapter from '@sveltejs/adapter-cloudflare';
# to:     import adapter from '@sveltejs/adapter-vercel';

# install the adapter
pnpm add -D @sveltejs/adapter-vercel

# deploy
vercel --prod
```

Set environment variables in the Vercel dashboard under **Settings** > **Environment Variables**.

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

After deploying to Cloudflare Pages:

1. Go to your project's **Custom Domains** tab
2. Add your domain
3. Follow the DNS instructions
4. SSL is automatic
