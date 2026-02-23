---
title: Introduction
description: What ATS Screener is, why it exists, and how it's different from other resume scanners.
---

:::caution[Disclaimer]
This is a independent research project built by [Sunny Patel](https://sunnypatel.net) and is **not intended to defame, misrepresent, or make claims about any ATS platform or vendor**. All scoring simulations are approximations based on publicly available documentation, community reports, and general industry knowledge. They do not reflect the actual proprietary algorithms of any platform. ATS Screener is **not affiliated with or endorsed by** Workday, Oracle (Taleo), iCIMS, Greenhouse, Lever, SAP (SuccessFactors), or any other ATS vendor. The goal is to help students and job seekers get a general sense of how their resume might perform across different types of resume screening approaches used by leading HCM providers.
:::

ATS Screener is a free, open-source tool that simulates how **6 real enterprise Applicant Tracking Systems** parse, filter, and score resumes. Unlike other resume checkers that use arbitrary algorithms, every score here is backed by research into actual platform behavior.

## Why I Built This

I was a student applying to jobs and internships, doing what everyone tells you to do: run your resume through an ATS checker before submitting. So I'd upload my resume to these "free" ATS scanners, wait for the analysis, and then get hit with the same thing every time: "Your score is ready! Unlock your full results for $29.99/month."

Every single one of them. They show you just enough to scare you, blur out the actual feedback, and paywall the rest. And the scores they generate? Completely made up. One generic number based on arbitrary rules that have nothing to do with how real ATS platforms actually work.

The thing is, real ATS platforms don't all evaluate resumes the same way:

- **Taleo** uses literal keyword matching in its base configuration. "Project Manager" and "Project Management" are treated as different terms.
- **Greenhouse** doesn't auto-score at all. It's designed around human review with structured scorecards.
- **iCIMS** uses ML-based semantic matching with its Role Fit AI.
- **Workday** has strict parsing that skips headers, footers, and non-standard sections.

A single "ATS score" is meaningless. You need to know how _each_ platform would evaluate your resume. So I built this tool to give students and job seekers what those paid tools won't: **6 honest scores from 6 real platforms**, completely free, no paywall, no "premium tier" hiding your results.

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
- **Gemma 3 27B** (primary) with Gemini fallbacks for AI-powered analysis
- **Firebase** for authentication and scan history
- **Vercel** for hosting (free tier)

:::note[Completely Free]
The live instance at [ats-screener.vercel.app](https://ats-screener.vercel.app) is hosted and maintained by [Sunny Patel](https://sunnypatel.net) using free-tier API keys. There is no catch, no upsell, and no usage tier. If you want full control, you can also [self-host](/docs/self-hosting/setup/) with your own keys.

If you find this tool useful and want to help keep it running, consider [buying me a coffee](https://buymeacoffee.com/sunnypatell) or [sponsoring on GitHub](https://github.com/sponsors/sunnypatell).
:::

:::note
Your resume file never leaves your browser. Only the extracted text is sent to the AI for scoring. See the [privacy section](/docs/getting-started/how-it-works/#privacy) for details.
:::
