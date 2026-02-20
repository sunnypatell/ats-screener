---
title: SuccessFactors (SAP)
description: How SAP SuccessFactors uses Textkernel parsing and Joule AI for resume evaluation.
---

**SuccessFactors** by SAP is used by 13.4% of Fortune 500 companies. It combines the industry-leading Textkernel parser with SAP's Joule AI for skills matching and stack ranking.

## Key Facts

| Attribute        | Value                            |
| ---------------- | -------------------------------- |
| Vendor           | SAP                              |
| Market Share     | 13.4% Fortune 500                |
| Parser           | Textkernel (95%+ field accuracy) |
| Keyword Strategy | Taxonomy normalization           |
| Strictness       | High                             |
| Auto-Reject      | Via stack ranking                |

## Parsing Behavior

SuccessFactors relies on Textkernel, the gold standard in resume parsing:

- **Textkernel** achieves 95%+ accuracy on standard fields (name, email, dates, skills).
- **Taxonomy normalization.** Skills are mapped to a standardized taxonomy. "React.js," "ReactJS," and "React" all normalize to the same entry.
- **Scanned PDFs will NOT parse.** Textkernel requires text-based documents. Image-based PDFs fail completely.
- **Joule AI** provides AI-powered skills matching and candidate stack ranking.
- **Structured data focus.** SuccessFactors works best with clearly structured, data-rich resumes.

## Scoring Weights

SuccessFactors emphasizes structured data and taxonomy-matched skills:

| Dimension            | Weight | Why                          |
| -------------------- | ------ | ---------------------------- |
| Formatting           | 15%    | Textkernel needs clean input |
| Keyword Match        | 30%    | Taxonomy normalization helps |
| Section Completeness | 20%    | Structured data extraction   |
| Experience Relevance | 25%    | Joule AI evaluates this      |
| Education            | 10%    | Standard extraction          |

## Tips for SuccessFactors

1. **Use text-based PDFs** or DOCX. Scanned/image PDFs will completely fail.
2. **Include standard skill names.** Taxonomy normalization helps, but don't rely on obscure terms.
3. **Structure your sections clearly.** Textkernel excels with well-organized resumes.
4. **Include dates in a standard format.** "Jan 2020 - Present" or "01/2020 - Present."
5. **Don't use graphics or charts** for skills. Textkernel needs text to parse.

:::caution
If your PDF was created by scanning a paper document, SuccessFactors (and most ATS platforms) will fail to parse it. Always use digitally-created PDFs or DOCX files.
:::
