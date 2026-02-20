---
title: Lever
description: How Lever's search-based approach and stemming engine evaluate resumes.
---

**Lever** (now part of Employ) is a modern ATS popular with mid-market companies and growing startups. It has no automated scoring or ranking. Everything is search-driven.

## Key Facts

| Attribute        | Value                   |
| ---------------- | ----------------------- |
| Vendor           | Employ (formerly Lever) |
| Market Share     | Modern recruiting       |
| Parser           | Proprietary             |
| Keyword Strategy | Stemming-based          |
| Strictness       | Low                     |
| Auto-Reject      | No                      |

## Parsing Behavior

Lever's parser is relatively capable:

- **Handles columns and tables** better than most ATS platforms.
- **Uses word stemming** for matching. "Managing" matches "Management" and "Manager."
- **Abbreviations are a blind spot.** "ML" may not match "Machine Learning."
- **No scoring or ranking.** Recruiters find candidates through search queries.
- **Entirely search-dependent.** Your resume's visibility depends on what recruiters search for.

## Scoring Weights

Since Lever relies on search rather than scoring, our simulation reflects searchability and content quality:

| Dimension            | Weight | Why                                |
| -------------------- | ------ | ---------------------------------- |
| Formatting           | 15%    | Parser is capable but not perfect  |
| Keyword Match        | 25%    | Stemming helps, but search-driven  |
| Section Completeness | 15%    | Helps recruiter scanning           |
| Experience Relevance | 30%    | Quality matters for search results |
| Education            | 15%    | Searchable field                   |

## Tips for Lever

1. **Include both full terms and abbreviations.** "Machine Learning (ML)" covers stemming gaps.
2. **Use industry-standard terminology.** Recruiters search with common terms, not creative synonyms.
3. **Keep formatting clean but standard.** Lever handles columns but simple is still better.
4. **Front-load important keywords** in your experience descriptions. Search results show previews.
5. **Include location info** if relevant. Lever recruiters often filter by geography.
