# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-20

### Added

- **Resume Parser**: PDF parsing with pdfjs-dist in Web Worker, DOCX parsing with mammoth, section detection (contact, summary, experience, education, skills, projects, certifications), contact info extraction, date normalization
- **NLP Engine**: Custom tokenizer with stemming and normalization, TF-IDF implementation, skills synonym database (8+ industries), skills taxonomy with 250+ skills, exact + fuzzy keyword matching, n-gram extraction
- **Scoring Engine**: 6 ATS system profiles (Workday, Taleo, iCIMS, Greenhouse, Lever, SuccessFactors), formatting scorer, keyword matcher, section completeness scorer, experience scorer with quantification detection, education scorer with degree matching
- **Job Description Parser**: Rule-based JD extraction, skill categorization (required vs preferred), experience level detection, education requirement detection, role type classification, industry context detection
- **LLM Integration**: Google Gemini 2.0 Flash proxy via SvelteKit server endpoints, semantic JD analysis, smart suggestions, graceful fallback to rule-based when quota exhausted
- **Landing Page**: Hero with animated mesh gradient background, FlipWords ATS name cycling, SparklesText on gradient heading, NumberTicker animated counters, MovingBorder score preview cards, TextGenerateEffect description reveal, floating particles, mouse-tracking glow
- **Features Section**: 6 feature cards with SVG icons, gradient backgrounds, spotlight hover effect, section badge
- **How It Works Section**: 4-step timeline with gradient connectors, step cards with icons
- **Footer**: 4-column layout with Logo, product links, resources, legal info, social links
- **Scanner Page**: Resume upload (drag-and-drop, PDF/DOCX), job description input with toggle, background gradient orbs, scan/reset actions with loading states
- **Score Dashboard**: Summary card with average score, pass rate, mode badge, 6 ATS score cards with animated ring progress, keyword summary, breakdown bars, deduplicated suggestions
- **Animated UI Components**: FlipWords, NumberTicker, TextGenerateEffect, SparklesText, MovingBorder (all native Svelte, inspired by Aceternity/Magic UI)
- **Design System**: Dark glassmorphic theme, CSS custom properties, Open Props tokens, Geist font, scoped styles per component
- **Testing**: 106 unit/integration tests covering parser, scorer, NLP, job-parser, and full pipeline
- **CI/CD**: GitHub Actions for lint, typecheck, test, and build
- **Documentation**: README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, CHANGELOG

### Technical Details

- SvelteKit 5 with Svelte 5 runes ($state, $derived, $effect, $props)
- TypeScript strict mode, 0 type errors across 410+ files
- Vercel deployment with adapter-vercel
- pnpm package manager
- ESLint + Prettier + svelte-check
- Vitest for unit testing, Playwright for E2E
