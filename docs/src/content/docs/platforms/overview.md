---
title: Platform Overview
description: The 6 enterprise ATS platforms simulated by ATS Screener and how they differ.
---

ATS Screener simulates scoring from 6 of the most widely deployed enterprise Applicant Tracking Systems. Each platform has fundamentally different approaches to parsing, filtering, and ranking candidates.

## Platform Comparison

| Platform           | Vendor       | Market Position   | Parser Strictness | Keyword Strategy       |
| ------------------ | ------------ | ----------------- | ----------------- | ---------------------- |
| **Workday**        | Workday Inc. | 37.1% Fortune 500 | High              | Exact + HiredScore AI  |
| **Taleo**          | Oracle       | Legacy Enterprise | Very High         | Exact literal match    |
| **iCIMS**          | iCIMS        | #1 ATS globally   | Medium            | Semantic (ML-based)    |
| **Greenhouse**     | Greenhouse   | Tech & Startups   | Low               | Semantic (LLM-based)   |
| **Lever**          | Employ       | Modern Recruiting | Low               | Stemming-based         |
| **SuccessFactors** | SAP          | 13.4% Fortune 500 | High              | Taxonomy normalization |

## Key Differences

### Parsing Approach

Not all ATS platforms parse resumes the same way. Some use their own parsers, while most rely on third-party parsing engines:

- **Textkernel** powers SuccessFactors and many others (95%+ field accuracy)
- **HireAbility ALEX** powers iCIMS (grammar-based NLP)
- **Greenhouse** recently moved to an LLM-based parser (most modern)
- **Workday** uses its own strict parser that skips headers/footers

### Keyword Matching

This is where platforms diverge the most:

- **Taleo** uses literal string matching in its base configuration. "Project Manager" will not match "Project Management." Abbreviations don't match full forms.
- **Workday** does exact matching by default, but acquired HiredScore in 2024 for AI-powered semantic matching.
- **iCIMS** uses its Role Fit AI to do semantic matching. "Led a team of 10" can match "Management experience."
- **Greenhouse** uses LLM-based matching, the most forgiving of all platforms.
- **Lever** uses stemming (matching word roots) but can't handle abbreviations.
- **SuccessFactors** normalizes skills to a taxonomy using SAP's Joule AI.

### Auto-Scoring vs Human Review

Not all platforms automatically score candidates:

- **Taleo** has auto-scoring with a visible "Req Rank" percentage and auto-reject via disqualification questions.
- **Workday** uses configurable knockout questions and optional AI screening (HiredScore).
- **iCIMS** provides Role Fit AI scores as advisory information for recruiters.
- **SuccessFactors** does stack ranking with Joule AI.
- **Greenhouse** does NOT auto-score. It's designed around structured human review with scorecards.
- **Lever** does NOT auto-score or rank. Everything is search-dependent.

:::tip
If your resume needs to pass automated filters (Taleo, Workday), focus on exact keyword matching and clean formatting. If you're applying to companies using Greenhouse or Lever, focus more on the content quality since a human will review it first.
:::
