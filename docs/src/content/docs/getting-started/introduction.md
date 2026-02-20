---
title: Introduction
description: What ATS Screener is, why it exists, and how it's different from other resume scanners.
---

:::caution[Disclaimer]
ATS Screener is a student project built by [Sunny Patel](https://sunnypatel.net). All scoring simulations are based on publicly available documentation, community reports, and research into platform behavior. This tool is **not affiliated with or endorsed by** any ATS vendor (Oracle, Workday, iCIMS, Greenhouse, Employ, or SAP). Scores are educational approximations designed to help students and job seekers understand how different ATS platforms might evaluate their resumes. They do not guarantee any specific outcome in real application processes.
:::

ATS Screener is a free, open-source tool that simulates how **6 real enterprise Applicant Tracking Systems** parse, filter, and score resumes. Unlike other resume checkers that use arbitrary algorithms, every score here is backed by research into actual platform behavior.

## Why I Built This

Most ATS checkers online are marketing funnels. They show you a score, scare you with "issues found," then upsell you on a $30/month subscription. The scores they generate are meaningless because they aren't based on how real ATS platforms work.

Real ATS platforms don't all work the same way:

- **Taleo** uses literal keyword matching in its base configuration. "Project Manager" and "Project Management" are treated as different terms.
- **Greenhouse** doesn't auto-score at all. It's designed around human review with structured scorecards.
- **iCIMS** uses ML-based semantic matching with its Role Fit AI.
- **Workday** has strict parsing that skips headers, footers, and non-standard sections.

A single "ATS score" is meaningless. You need to know how _each_ platform would evaluate your resume. I built this tool because I was tired of paying for resume scanners that give you a meaningless number and a paywall.

## How It's Different

| Feature             | Other Scanners          | ATS Screener             |
| ------------------- | ----------------------- | ------------------------ |
| Platforms simulated | Generic "ATS"           | 6 specific platforms     |
| Scoring basis       | Arbitrary rules         | Research-backed profiles |
| Price               | $10-50/month            | Free forever             |
| Privacy             | Upload to their servers | Client-side file parsing |
| Open source         | No                      | MIT licensed             |
| API access          | No                      | Full REST API            |

## Two Scoring Modes

### General Mode (Resume Only)

Upload your resume without a job description. Each platform evaluates your resume's **general ATS readiness**: formatting, section structure, keyword density, quantified achievements, and education presentation.

This mode answers: _"If I submitted this resume to any job on this platform, would it parse correctly and present well?"_

### Targeted Mode (Resume + Job Description)

Paste a job description alongside your resume. Each platform evaluates **how well your resume matches that specific role**: keyword overlap, required skills coverage, experience relevance, and education fit.

This mode answers: _"For this specific job, would I pass the initial screening filters?"_

## Tech Stack

Built with performance and privacy in mind:

- **SvelteKit 5** with Svelte 5 runes for the frontend
- **pdfjs-dist** (Web Worker) for client-side PDF parsing
- **mammoth** for client-side DOCX parsing
- **Gemini 2.5 Flash Lite** for AI-powered analysis
- **Firebase** for authentication and scan history
- **Vercel** for hosting (free tier)

:::note[Completely Free]
The live instance is hosted and maintained by [Sunny Patel](https://sunnypatel.net) using free-tier API keys. There is no catch, no upsell, and no usage tier. If you want full control, you can also [self-host](/docs/self-hosting/setup/) with your own keys.
:::

:::note
Your resume file never leaves your browser. Only the extracted text is sent to the AI for scoring. See the [privacy section](/docs/getting-started/how-it-works/#privacy) for details.
:::
