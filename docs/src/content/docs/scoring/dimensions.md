---
title: Scoring Dimensions
description: The 6 dimensions used to evaluate resumes across all ATS platforms, with per-platform weight breakdowns.
---

Every resume is scored across 6 dimensions. Each platform weighs these differently based on how it actually processes resumes. See [Scoring Methodology](/docs/scoring/methodology/) for the full math behind how these combine into a final score.

## Dimension Overview

| #     | Dimension            | Range | Description                                       |
| ----- | -------------------- | :---: | ------------------------------------------------- |
| $d_1$ | Formatting           | 0-100 | Parser compatibility and layout quality           |
| $d_2$ | Keyword Match        | 0-100 | Terminology overlap with JD or industry standards |
| $d_3$ | Section Completeness | 0-100 | Presence of standard resume sections              |
| $d_4$ | Experience Relevance | 0-100 | Bullet quality, action verbs, role relevance      |
| $d_5$ | Education Match      | 0-100 | Degree, institution, and date formatting          |
| $d_6$ | Quantification       | 0-100 | Ratio of quantified achievement bullets           |

## D1: Formatting

How well your resume would survive each platform's parser. This is a **deduction-based** score:

$$
F = \max\!\left(0,\;100 - \sum_{k} p_k \cdot \sigma\right)
$$

You start at 100 and lose points for each detected issue, scaled by the platform's parsing strictness $\sigma$.

**What triggers deductions:**

- Multi-column layouts ($p = 15$): parsers read text out of order
- Tables ($p = 12$): content inside tables may be skipped entirely
- Images and graphics ($p = 8$): text embedded in images is invisible
- Pages exceeding 2 ($p = 5$): may be truncated
- Very short content under 150 words ($p = 10$): likely a parsing failure
- Very long content over 1500 words ($p = 3$): consider trimming
- High special character density ($p = 8$): encoding problems
- Excessive all-caps lines ($p = 3$): confuses section detection
- Inconsistent bullet styles ($p = 2$): minor formatting noise

**How strictness changes the impact:**

The same issue costs you very different amounts depending on the platform:

| Issue        | Workday ($\sigma\!=\!0.90$) | iCIMS ($\sigma\!=\!0.60$) | Lever ($\sigma\!=\!0.35$) |
| ------------ | :-------------------------: | :-----------------------: | :-----------------------: |
| Multi-column |           $-13.5$           |          $-9.0$           |          $-5.25$          |
| Tables       |           $-10.8$           |          $-7.2$           |          $-4.2$           |
| Images       |           $-7.2$            |          $-4.8$           |          $-2.8$           |

**Positive signals** (noted but don't add points):

- Clean single-column layout
- Appropriate page length (1-2 pages)
- Word count in the ideal range (300-800)

**How much each platform cares:**

| Platform       | Weight ($w_1$) | Strictness ($\sigma$) |
| -------------- | :------------: | :-------------------: |
| Workday        |      0.25      |         0.90          |
| SuccessFactors |      0.25      |         0.85          |
| Taleo          |      0.20      |         0.85          |
| iCIMS          |      0.15      |         0.60          |
| Greenhouse     |      0.10      |         0.40          |
| Lever          |      0.08      |         0.35          |

Workday and SuccessFactors tie for the highest formatting weight. If you're applying to Fortune 500 companies (overwhelmingly Workday), a clean single-column PDF is non-negotiable.

## D2: Keyword Match

How well your resume's terminology matches what the platform is looking for. This is the single most impactful dimension across most platforms.

**The formula:**

$$
K = \min\!\left(100,\;\frac{|M| + 0.8 \cdot |S|}{|J|} \times 100\right)
$$

- $M$ = exact keyword matches
- $S$ = synonym or partial matches (depends on matching strategy)
- $J$ = keywords extracted from the job description
- 0.8 coefficient: synonym matches are worth 80% of exact matches

**In general mode** (no JD): the scorer evaluates industry-standard terminology, technical skills, certifications, action verbs, and professional language. Without a JD to compare against, $K = 100$ by convention and the AI evaluates keyword quality holistically.

**In targeted mode** (with JD): direct comparison between JD requirements and resume content. This is where the matching strategy matters most.

**Matching strategies by platform:**

| Strategy | Platforms                      | What Counts as $M$      | What Counts as $S$                                     |
| -------- | ------------------------------ | ----------------------- | ------------------------------------------------------ |
| Exact    | Workday, Taleo, SuccessFactors | Literal term match only | $\emptyset$ (nothing)                                  |
| Fuzzy    | iCIMS                          | Literal match           | Synonym database + canonical forms                     |
| Semantic | Greenhouse, Lever              | Literal match           | Synonyms + partial string containment ($\geq 3$ chars) |

**Why this matters:** if the JD says "Project Manager" and your resume says "PM":

- **Exact platforms**: miss. "PM" $\neq$ "Project Manager". You need both forms.
- **Fuzzy platforms**: hit (synonym match, worth 80%).
- **Semantic platforms**: hit (synonym match, worth 80%).

:::note
The maximum possible keyword score using only synonym matches is $0.8 \times 100 = 80$. You'll always benefit from having exact matches alongside synonyms, especially on exact-match platforms where synonyms don't count at all.
:::

**How much each platform cares:**

| Platform       | Weight ($w_2$) | Strategy |
| -------------- | :------------: | -------- |
| Taleo          |    **0.35**    | exact    |
| Workday        |      0.30      | exact    |
| iCIMS          |      0.30      | fuzzy    |
| Greenhouse     |      0.25      | semantic |
| SuccessFactors |      0.25      | exact    |
| Lever          |      0.22      | semantic |

Taleo's 0.35 keyword weight combined with exact-only matching is why it has a reputation for being the strictest platform. Over a third of your score depends on having the literal terms from the JD on your resume.

## D3: Section Completeness

Whether your resume has the standard sections that ATS parsers expect.

**Required sections** (expected by all platforms):

- Contact information (name, email, phone)
- Professional experience / work history
- Education
- Skills / technical skills

**Bonus sections** (improve the score):

- Summary or objective
- Certifications
- Projects
- Publications
- Volunteer work

**Platform differences:**

| Platform       | Weight ($w_3$) | Behavior                                               |
| -------------- | :------------: | ------------------------------------------------------ |
| SuccessFactors |    **0.20**    | Textkernel parser needs clearly structured sections    |
| Workday        |      0.15      | Requires standard headings ("Experience", "Education") |
| Taleo          |      0.15      | Requires clearly labeled sections                      |
| iCIMS          |      0.15      | ALEX parser is moderately flexible                     |
| Greenhouse     |      0.10      | Lenient on section naming                              |
| Lever          |      0.10      | Lenient on section naming                              |

SuccessFactors cares the most about section structure. Its Textkernel-based parser relies on detecting standard section headers to route content into the right fields. Non-standard or creative headers (like "Where I've Been" instead of "Experience") can cause parsing failures.

## D4: Experience Relevance

Quality and relevance of your professional experience.

**What's evaluated:**

- Quantified achievements (numbers, percentages, dollar amounts)
- Action verb usage ("Led," "Built," "Increased" vs "Responsible for")
- Recency weighting (recent experience valued more)
- Relevance to stated field or JD requirements
- Bullet point quality and specificity

**Example scoring contrast:**

> "Increased quarterly revenue by 34% through implementation of automated lead scoring"

This scores high: quantified achievement + action verb + specific methodology.

> "Responsible for various projects and tasks as assigned"

This scores low: no quantification, passive language, zero specificity.

**How much each platform cares:**

| Platform       | Weight ($w_4$) |
| -------------- | :------------: |
| Lever          |    **0.30**    |
| Greenhouse     |      0.25      |
| iCIMS          |      0.20      |
| Workday        |      0.15      |
| Taleo          |      0.15      |
| SuccessFactors |      0.15      |

Lever and Greenhouse weight experience the highest because they're designed around structured human review. These platforms surface your experience bullets directly to hiring managers through structured scorecards, so quality matters more than keyword count.

## D5: Education Match

How well your education section parses and meets expectations.

**What's evaluated:**

- Degree presence and level
- Field of study relevance
- Institution name parseability
- Date formatting (graduation year)
- GPA/honors (if applicable and strong)
- Certifications and continuing education

**All platforms weight this equally at $w_5 = 0.10$.** Education is a baseline requirement check rather than a differentiator in ATS scoring. It matters for pass/fail (does the degree meet the minimum requirement?) but has less weight in the composite score.

## D6: Quantification

The ratio of experience bullets that contain measurable achievements. This dimension is derived directly from the experience analysis:

$$
d_6 = \begin{cases} \left\lfloor\dfrac{b_q}{b_t} \times 100\right\rfloor & \text{if } b_t > 0 \\[6pt] 0 & \text{if } b_t = 0 \end{cases}
$$

where $b_q$ = bullets with numbers/percentages/dollar amounts and $b_t$ = total bullets.

**Examples:**

- 2 quantified out of 10 total: $d_6 = 20$
- 5 quantified out of 10 total: $d_6 = 50$
- 8 quantified out of 10 total: $d_6 = 80$

**How much each platform cares:**

| Platform       | Weight ($w_6$) |
| -------------- | :------------: |
| Greenhouse     |    **0.20**    |
| Lever          |    **0.20**    |
| iCIMS          |      0.10      |
| Workday        |      0.05      |
| Taleo          |      0.05      |
| SuccessFactors |      0.05      |

There's a clear split here. Modern platforms (Greenhouse, Lever) weight quantification 4x more than legacy systems (Workday, Taleo, SuccessFactors). The reasoning: modern ATS platforms are built to surface candidate data to hiring managers through structured scorecards and evaluation workflows. Quantified achievements are the kind of concrete signal that helps a reviewer make a quick decision.

For legacy systems, the parser just needs to extract and index your content. Whether your bullets say "increased revenue by 34%" or "responsible for revenue" doesn't change how Taleo's keyword index stores it.

## Weight Distribution Visualization

To see how different the scoring profiles really are, here's how each platform distributes its weight budget across the 6 dimensions:

| Platform       | Profile Shape                                                           |
| -------------- | ----------------------------------------------------------------------- |
| Workday        | Formatting and keywords dominate (0.25 + 0.30 = 0.55)                   |
| Taleo          | Keywords dominate everything else (0.35)                                |
| iCIMS          | Balanced between keywords and experience (0.30 + 0.20)                  |
| Greenhouse     | Experience and quantification lead (0.25 + 0.20 = 0.45)                 |
| Lever          | Experience-heavy with quantification (0.30 + 0.20 = 0.50)               |
| SuccessFactors | Formatting, keywords, and sections balanced (0.25 + 0.25 + 0.20 = 0.70) |

The shift from legacy to modern platforms is clear: old systems care about **parsing correctly and matching keywords**. New systems care about **experience quality and measurable impact**.

:::note[What Should You Optimize?]
If you're applying broadly, focus on what every platform agrees on: clean formatting, relevant keywords from the JD, complete sections, and quantified achievements. If you're targeting a specific company, check which ATS they use (see our [platform guides](/docs/platforms/)) and optimize for that profile's highest-weighted dimensions.
:::
