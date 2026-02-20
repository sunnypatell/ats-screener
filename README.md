<p align="center">
  <img src="https://img.shields.io/badge/SvelteKit-5-FF3E00?style=for-the-badge&logo=svelte&logoColor=white" alt="SvelteKit 5" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vitest-106_Tests-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Tests" />
  <img src="https://img.shields.io/badge/Cost-$0-22c55e?style=for-the-badge" alt="Free" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" />
</p>

<h1 align="center">ATS Screener</h1>

<p align="center">
  <strong>Free, open-source ATS resume screener that simulates how 6 real enterprise HCMS platforms parse, filter, and score your resume.</strong>
</p>

<p align="center">
  Workday &bull; Taleo (Oracle) &bull; iCIMS &bull; Greenhouse &bull; Lever &bull; SuccessFactors (SAP)
</p>

<p align="center">
  <a href="https://github.com/sunnypatell/ats-screener">View Source</a> &bull;
  <a href="https://github.com/sunnypatell/ats-screener/issues">Report Bug</a> &bull;
  <a href="https://github.com/sunnypatell/ats-screener/blob/main/CONTRIBUTING.md">Contribute</a>
</p>

---

## Why This Exists

Every ATS screener on the market gives you a single generic score based on arbitrary algorithms that have nothing to do with how real applicant tracking systems work. They charge you $30/month for a number they made up.

**ATS Screener is different.** It simulates 6 real enterprise HCMS platforms with researched scoring profiles, giving you 6 different scores that reflect how each system actually parses and filters resumes. And it's free. Forever. No sign-up.

## How It Works

```
Resume (PDF/DOCX)  ──→  Parser Engine  ──→  Structured Data  ──→  6 ATS Profiles  ──→  6 Scores + Breakdown
                         (Web Worker)         (sections,           (Workday,            (formatting, keywords,
                         client-side          skills, education,    Taleo, iCIMS,        sections, experience,
                                              experience)          Greenhouse,           education + suggestions)
                                                                   Lever, SAP)
              Job Description (optional)  ──→  JD Parser  ──→  Targeted Keyword Matching
```

1. **Upload your resume** (PDF or DOCX). Parsed entirely client-side in a Web Worker. Your file never leaves your browser.
2. **Optionally paste a job description** for targeted scoring with keyword matching.
3. **Get scored by 6 systems**, each with different weights for formatting, keywords, sections, experience, and education.
4. **See what to fix** with detailed breakdowns per system and actionable suggestions.

## ATS Profiles

Each profile is researched based on how the actual platform handles resumes:

| System             | Vendor     | Strictness | Keywords | Key Behavior                                                               |
| ------------------ | ---------- | ---------- | -------- | -------------------------------------------------------------------------- |
| **Workday**        | Workday    | High       | Exact    | Strict parser, hates creative formats, penalizes multi-column layouts      |
| **Taleo**          | Oracle     | High       | Exact    | Boolean keyword matching, very filter-driven, requires structured sections |
| **iCIMS**          | iCIMS      | Medium     | Fuzzy    | More format-tolerant, AI-assisted matching, modern parsing                 |
| **Greenhouse**     | Greenhouse | Low        | Semantic | Structured scorecards, lenient formatting, context-aware                   |
| **Lever**          | Lever      | Low        | Semantic | Startup-friendly, relationship-focused, flexible parsing                   |
| **SuccessFactors** | SAP        | High       | Exact    | Enterprise-grade, structured-data focused, strict section requirements     |

## Tech Stack

Every layer was chosen for this specific use case. No defaults, no boilerplate stacks.

| Layer            | Choice                                                 | Why                                                                                                                             |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**    | SvelteKit 5 (Svelte 5 runes)                           | Compiled to vanilla JS, zero VDOM. ~15KB runtime vs React's 45KB+. Critical for computation-heavy PDF parsing + NLP in-browser. |
| **Styling**      | Svelte scoped CSS + CSS custom properties + Open Props | Dark glassmorphic design system. No Tailwind. Scoped per component.                                                             |
| **PDF Parsing**  | pdfjs-dist (Web Worker)                                | Mozilla-maintained, battle-tested, fully client-side.                                                                           |
| **DOCX Parsing** | mammoth                                                | Client-side DOCX to text extraction.                                                                                            |
| **NLP**          | Custom TF-IDF + tokenizer + skills taxonomy            | Lightweight, runs in browser, supports 8+ industries.                                                                           |
| **LLM**          | Google Gemini 2.0 Flash (free tier)                    | 1,500 req/day for semantic JD analysis and smart suggestions.                                                                   |
| **LLM Proxy**    | SvelteKit +server.ts endpoints                         | API key stays server-side. Graceful fallback when quota exhausted.                                                              |
| **Hosting**      | Cloudflare Pages                                       | Free: 100k function invocations/day, unlimited static bandwidth.                                                                |
| **Testing**      | Vitest + Playwright + @testing-library/svelte          | 106 unit/integration tests. E2E for critical flows.                                                                             |
| **CI**           | GitHub Actions                                         | Lint + typecheck + test + build on every push.                                                                                  |

**Total cost: $0** at any scale.

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte              # Landing page (Hero, Features, HowItWorks, Footer)
│   ├── scanner/+page.svelte      # Scanner tool (upload → parse → score → results)
│   └── api/analyze/+server.ts    # LLM proxy endpoint (Gemini)
├── lib/
│   ├── components/
│   │   ├── landing/              # Hero, Features, HowItWorks, Footer
│   │   ├── scoring/              # ScoreDashboard, ScoreCard
│   │   ├── upload/               # ResumeUploader, JobDescriptionInput
│   │   └── ui/                   # Logo, Navbar, FlipWords, NumberTicker,
│   │                             # TextGenerateEffect, SparklesText, MovingBorder
│   ├── engine/
│   │   ├── parser/               # PDF/DOCX parsing, section detection, contact extraction
│   │   ├── scorer/               # Scoring engine + 6 ATS profiles (Workday, Taleo, etc.)
│   │   ├── nlp/                  # Tokenizer, TF-IDF, synonyms, skills taxonomy
│   │   ├── llm/                  # Gemini client, prompts, fallback
│   │   └── job-parser/           # Job description extractor
│   ├── stores/                   # Svelte 5 rune-based state (resume, scores, settings)
│   └── styles/                   # CSS tokens, global styles, animations
└── tests/
    └── unit/                     # 106 tests across parser, scorer, NLP, integration
```

## Getting Started

```bash
# Clone
git clone https://github.com/sunnypatell/ats-screener.git
cd ats-screener

# Install
pnpm install

# Dev server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm check

# Lint
pnpm lint

# Build
pnpm build
```

## Scoring Engine

The scoring engine is deterministic: same input always produces the same output. Each ATS profile applies different weights:

```
Overall Score = weighted sum of:
  ├── Formatting Score     (parseability, structure, ATS-friendliness)
  ├── Keyword Match Score  (exact/fuzzy/semantic matching against skills taxonomy)
  ├── Section Score        (presence of required sections: contact, experience, education, skills)
  ├── Experience Score     (quantified achievements, action verbs, recency weighting)
  └── Education Score      (degree level, field relevance, institution)
```

**Two modes:**

- **General Mode** (resume only): ATS-readiness score across all 6 systems
- **Targeted Mode** (resume + JD): keyword matching against extracted job requirements

## Industries Supported

The skills taxonomy and NLP engine support any industry:

- Technology / Software Engineering
- Finance / Accounting
- Healthcare / Nursing
- Marketing / Content
- Legal / Compliance
- Operations / Supply Chain
- Education
- Sales / Business Development
- Design / Creative

## Design

Dark glassmorphic aesthetic with Aceternity/Magic UI-inspired effects built natively in Svelte:

- **FlipWords**: smooth word cycling with blur transitions
- **NumberTicker**: spring-physics animated counters
- **TextGenerateEffect**: word-by-word reveal with blur-to-sharp
- **SparklesText**: floating sparkle particles
- **MovingBorder**: rotating conic-gradient borders
- **Mesh gradient** background with floating orbs
- **Mouse-tracking spotlight** on cards
- **Grid pattern overlay** for depth

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, commit conventions, and PR process.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting. Your resume data never leaves your browser.

## License

[MIT](LICENSE) - Sunny Patel
