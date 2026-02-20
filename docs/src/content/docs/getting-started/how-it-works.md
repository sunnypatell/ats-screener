---
title: How It Works
description: Architecture overview of resume parsing, scoring, and AI analysis.
---

ATS Screener combines client-side document parsing with AI-powered analysis to simulate how each platform would evaluate your resume.

## Architecture

```
Browser                          Server (Edge Functions)
┌─────────────────────┐          ┌──────────────────────┐
│ 1. Upload PDF/DOCX  │          │                      │
│ 2. Parse in Worker   │──text──▶│ 3. Gemini AI scores  │
│ 4. Display results  │◀─JSON───│    from 6 platforms   │
└─────────────────────┘          └──────────────────────┘
```

### Step 1: Client-Side Parsing

When you upload a resume:

- **PDF files** are parsed using Mozilla's `pdfjs-dist` running in a Web Worker. This extracts all text content, preserving structure.
- **DOCX files** are parsed using `mammoth`, which converts Word documents to clean text.

All parsing happens in your browser. The file itself is never uploaded anywhere.

### Step 2: Text Extraction

The parser extracts structured data:

- **Contact info** (name, email, phone, LinkedIn, GitHub)
- **Sections** (experience, education, skills, projects, certifications, summary)
- **Dates** and timeline information
- **Raw text** for keyword analysis

### Step 3: AI Analysis

The extracted text (not the file) is sent to a SvelteKit server endpoint, which proxies it to Gemini AI. The AI evaluates the resume from 6 different platform perspectives, each with unique:

- Parsing strictness levels
- Keyword matching strategies (exact, fuzzy, semantic)
- Section weight distributions
- Scoring quirks and edge cases

### Step 4: Results

The AI returns structured JSON with per-platform scores, breakdowns, keyword analysis, and suggestions. The frontend renders this as an interactive dashboard.

## Privacy

Your privacy is protected at every step:

1. **Files stay local.** PDF/DOCX parsing happens entirely in your browser's Web Worker.
2. **Only text is transmitted.** The extracted text (not the original file) is sent for AI analysis.
3. **No storage.** The server endpoint is stateless. It proxies to Gemini and returns results. Nothing is logged or stored.
4. **No accounts.** No sign-ups, no cookies (beyond basic session), no tracking.
5. **Open source.** You can verify all of the above by reading the [source code](https://github.com/sunnypatell/ats-screener).

## LLM Provider Chain

The server uses a fallback chain to maximize availability:

| Priority | Provider      | Model                   | Free Tier Limit |
| -------- | ------------- | ----------------------- | --------------- |
| 1        | Google Gemini | gemini-2.5-flash-lite   | 1,000 req/day   |
| 2        | Groq          | llama-3.3-70b-versatile | 14,400 req/day  |
| 3        | Cerebras      | llama-3.3-70b           | 1,000 req/day   |

If Gemini's daily quota is hit, the system automatically falls back to Groq, then Cerebras. If all providers fail, you'll get an error with a suggestion to try again later.

:::note[Zero Cost to You]
The live instance is hosted by the developer using their own API keys across all three providers. The fallback chain means you'll almost never hit a capacity wall, even during high traffic.
:::

:::note
The `_provider` and `_fallback` fields in API responses tell you which provider handled your request.
:::
