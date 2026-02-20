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

1. **Files stay local.** PDF/DOCX parsing happens entirely in your browser's Web Worker. The original file is never uploaded.
2. **Only text is transmitted.** The extracted text (not the original file) is sent to Google Gemini for AI analysis.
3. **Scan history is stored in Firebase.** Your scores and scan metadata are saved to your account in Firestore so you can track progress over time. Only you can access your own data.
4. **Free account required.** Sign in with Google or email/password to use the scanner. This enables scan history and prevents abuse.
5. **Open source.** You can verify all of the above by reading the [source code](https://github.com/sunnypatell/ats-screener).

:::note[Zero Cost to You]
The live instance is hosted by [Sunny Patel](https://sunnypatel.net) using free-tier API keys. All infrastructure (Vercel, Firebase Spark, Gemini) runs on free tiers.
:::

:::note
The `_provider` and `_fallback` fields in API responses tell you which provider handled your request.
:::
