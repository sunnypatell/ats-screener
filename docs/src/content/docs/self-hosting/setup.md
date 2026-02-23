---
title: Setup Guide
description: How to run your own instance of ATS Screener.
---

ATS Screener can be self-hosted for free. You'll need at least one LLM API key.

## Prerequisites

- **Node.js** 18+ (20 recommended)
- **pnpm** 8+ (package manager)
- A free API key from [Google AI Studio](https://aistudio.google.com/apikey) (required for Gemma 3 27B)

## Installation

```bash
# clone the repo
git clone https://github.com/sunnypatell/ats-screener.git
cd ats-screener

# install dependencies
pnpm install

# copy environment template
cp .env.example .env
```

## Get API Keys (Free)

### Google Gemini (Primary)

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Add to `.env`: `GEMINI_API_KEY=your_key_here`

### Groq (Recommended Fallback)

1. Go to [Groq Console](https://console.groq.com/keys)
2. Create a new API key
3. Add to `.env`: `GROQ_API_KEY=your_key_here`

:::tip
You need the **Google AI API key** to run the app (Gemma 3 27B primary, 14,400 RPD). Adding a **Groq API key** is strongly recommended as it provides a completely independent fallback (Llama 3.3 70B, 14,400 RPD) so users never see failures during peak traffic.
:::

## Run Locally

```bash
# development server with hot reload
pnpm dev

# the app will be available at http://localhost:5173
```

## Build for Production

```bash
# create production build
pnpm build

# preview the production build locally
pnpm preview
```

## Verify It Works

1. Open `http://localhost:5173`
2. Navigate to `/scanner`
3. Upload a PDF or DOCX resume
4. You should see scores from all 6 platforms

If you see a `503` error, check that your API keys are correctly set in `.env`.
