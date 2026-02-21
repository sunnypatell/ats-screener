---
title: Taleo (Oracle)
description: How Oracle's Taleo ATS evaluates resumes based on our research into its keyword matching behavior.
---

**Taleo** by Oracle is one of the oldest enterprise ATS platforms still in widespread use. Based on available documentation, it uses the strictest keyword matching configuration of the platforms simulated here.

## Key Facts

| Attribute        | Value                                       |
| ---------------- | ------------------------------------------- |
| Vendor           | Oracle                                      |
| Market Share     | Legacy enterprise (transitioning to ORC)    |
| Parser           | Proprietary                                 |
| Keyword Strategy | Exact literal match (base configuration)    |
| Strictness       | Very High (in our simulation)               |
| Auto-Reject      | Yes (disqualification questions + Req Rank) |

## Parsing Behavior

Based on publicly documented behavior, Taleo's base keyword matching is strict:

- **Literal keyword matching** in the base configuration. "Project Manager" and "Project Management" are treated as different strings.
- **Abbreviations may not match.** "PM" and "Project Manager" are treated as separate terms in the base system.
- **Req Rank percentage** is visible to recruiters and used for auto-ranking candidates.
- **Disqualification questions** can auto-reject before any human sees your resume.
- **Limited synonym matching** in the base system. The newer Oracle Recruiting Cloud (ORC) adds ML-based matching capabilities.

## Scoring Weights

In our simulation, Taleo weights keywords more heavily than other platforms:

| Dimension            | Weight | Why                             |
| -------------------- | ------ | ------------------------------- |
| Formatting           | 10%    | Parser is basic but functional  |
| Keyword Match        | 40%    | The primary sorting mechanism   |
| Section Completeness | 10%    | Less important than keywords    |
| Experience Relevance | 25%    | Years and relevance matter      |
| Education            | 15%    | Often used as a knockout filter |

## Tips for Taleo

1. **Copy exact keywords** from the job posting. Don't paraphrase.
2. **Spell out AND abbreviate.** Write "Project Management (PM)" to cover both.
3. **Include both singular and plural forms** when relevant.
4. **Answer screening questions carefully.** These can auto-reject you before scoring.
5. **Use the exact job title** from the posting somewhere in your resume.
6. **Don't rely on synonyms.** If they say "Java," don't just write "JVM languages."

:::caution
In our simulation, Taleo's strict keyword matching tends to produce the lowest scores for most resumes. A resume that scores well on Greenhouse or Lever can score significantly lower on Taleo if it doesn't include exact keyword matches. This reflects the documented behavior of Taleo's base keyword matching, though actual implementations may vary.
:::
