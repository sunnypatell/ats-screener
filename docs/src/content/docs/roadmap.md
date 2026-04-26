---
title: Public Roadmap
description: What ATS Screener has shipped recently, what is in flight, and what is on deck. Updated as releases happen.
lastUpdated: 2026-04-26
---

The roadmap below is the public view of where ATS Screener is heading. It is curated by the project author and updated as work lands. Anything that has shipped is also in the [CHANGELOG](https://github.com/sunnypatell/ats-screener/blob/main/CHANGELOG.md) on GitHub.

:::tip
Want something that is not on this list? [Open a feature request](https://github.com/sunnypatell/ats-screener/issues/new) on GitHub. Most of what ships starts that way.
:::

## Recently shipped

The 0.2.x series focused on cost containment, security, accessibility, and trust. Highlights:

- **Privacy notice** that explains what we collect, what we do not, and how AI scoring requests actually flow. Lives at [Privacy and Data Handling](/docs/legal/privacy/).
- **Anonymous trial scan** so visitors can run one scoring pass without signing in.
- **FAQ section** on the [About page](https://ats-screener.vercel.app/about) with structured data for richer search results.
- **RSS feed** at `/releases.xml` for anyone who follows projects via a feed reader.
- **Web app manifest** for installability on mobile and desktop.
- **Better keyboard accessibility** across the app: skip-to-content link, visible focus rings on every input, ARIA live region announcing scan progress for screen readers.
- **Reduced motion respected** across all CSS animations and JS-driven smooth scrolls.
- **PR template** rewritten so external contributors land on a clean structure rather than internal style notes.
- **Behind the scenes**: tighter rate-limiting, deduplicated CSP violation logs, in-process memo cache on the OG image route, sampled error and web-vitals collection. None of this is user visible day to day, but it keeps the project running on free tier as it grows.

## In flight

These are the things being actively worked on or queued up next.

- **Quick Wins card** above the score dashboard: surface the three highest-impact suggestions across all platforms so users see what to fix first.
- **Lazy-loaded resume parser**: the PDF and DOCX engines (~880KB combined) currently ship on every scanner-page visit. Defer them until a file is actually picked.
- **Mobile polish**: file picker behaviour on iOS Safari, sticky header collisions, modal scrolling.
- **Color contrast audit** against WCAG 2.2 AA targets.

## On deck

Smaller items waiting their turn. The order shifts based on what users ask for.

- **Public docs feedback loop** so readers can flag a page as helpful or not.
- **Per-platform deep dives** in the docs (each ATS gets its own page with quirks, edge cases, and resume tips for that target).
- **Structured logger** to replace scattered `console.warn` / `console.error` across the codebase.

## Stretch goals

Things that would be great to ship but require more thought than a single iteration.

- **CSP enforced** (currently report-only). Requires a nonce-based migration so SvelteKit's inline hydration scripts keep working.
- **Service worker for offline shell** so repeat visits load instantly even on flaky connections. PWA manifest is already in place.
- **Internationalisation** beyond English. Today every visible string is in English; the LLM scoring is multi-language tolerant, but the UI is not.
- **Resume diff view**: paste two versions, see exactly which scoring changes happened and why.

## Not planned

A few things this project is unlikely to do:

- **Paid features.** The app stays free.
- **Selling user data.** Ever.
- **Replacing a real ATS.** This is a simulator built for self-improvement. The numbers it produces are not predictions of hiring outcomes.

## How this list is maintained

The roadmap is a snapshot, not a contract. Items move, get rethought, or get dropped when the trade-offs change. The most reliable signal of what is actually happening is the [CHANGELOG](https://github.com/sunnypatell/ats-screener/blob/main/CHANGELOG.md) and the project's [GitHub repository](https://github.com/sunnypatell/ats-screener).
