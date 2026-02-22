---
title: Scoring Methodology
description: The math behind how ATS Screener simulates 6 real ATS platforms, from weighted scoring to platform-specific quirk adjustments.
---

:::caution[Before You Read]
This page documents the actual math running in ATS Screener's scoring engine. Every formula here was written by [Sunny Patel](https://sunnypatel.net), pulled directly from the source code, and verified computationally before being published. These are **simulations** based on publicly available documentation, community reports, and independent research into how each platform processes resumes.
:::

## The Big Picture

When you scan your resume, ATS Screener evaluates it against 6 platform profiles independently. Each profile is a mathematical model with its own weights, parsing strictness, keyword matching strategy, and platform-specific quirks.

The final score for each platform comes down to three steps:

1. Score each of the **6 dimensions** individually (0-100 each)
2. Compute a **weighted sum** using that platform's specific weight vector
3. Apply **quirk adjustments** for platform-specific edge cases

Here's the formal definition.

## Composite Score Formula

For a given platform $p$, the overall score is:

$$
S_p = \text{clamp}\!\left(0,\;100,\;\sum_{i=1}^{6} w_i^{(p)} \cdot d_i \;+\; Q_p\right)
$$

where:

- $d_i \in [0, 100]$ is the score for dimension $i$
- $w_i^{(p)}$ is the weight assigned to dimension $i$ by platform $p$
- $Q_p$ is the total quirk adjustment for platform $p$ (always $\leq 0$)
- $\text{clamp}(a, b, x) = \max(a, \min(b, x))$

The six dimensions $d_1$ through $d_6$ are:

| Index | Dimension            | What It Measures                           |
| ----- | -------------------- | ------------------------------------------ |
| $d_1$ | Formatting           | Parser compatibility, layout cleanliness   |
| $d_2$ | Keyword Match        | Term overlap with JD or industry standards |
| $d_3$ | Section Completeness | Presence of required resume sections       |
| $d_4$ | Experience Relevance | Bullet quality, action verbs, recency      |
| $d_5$ | Education Match      | Degree presence, field, date formatting    |
| $d_6$ | Quantification       | Ratio of quantified achievement bullets    |

### Weight Constraint

All platform weight vectors are normalized:

$$
\sum_{i=1}^{6} w_i^{(p)} = 1.0 \quad \forall\; p
$$

This means the weighted sum $\sum w_i^{(p)} \cdot d_i$ produces a value in $[0, 100]$ before quirk adjustments. I verified this for all 6 profiles in the codebase.

## Platform Weight Vectors

Each platform weighs the 6 dimensions differently. These weights come from researching how each platform actually behaves: strict keyword matchers like Taleo weight keywords heavily, while modern platforms like Lever care more about experience quality.

| Platform       | $w_1$ (fmt) | $w_2$ (kw) | $w_3$ (sec) | $w_4$ (exp) | $w_5$ (edu) | $w_6$ (quant) | $\sigma$ | Strategy |
| -------------- | :---------: | :--------: | :---------: | :---------: | :---------: | :-----------: | :------: | -------- |
| Workday        |    0.25     |    0.30    |    0.15     |    0.15     |    0.10     |     0.05      |   0.90   | exact    |
| Taleo          |    0.20     |  **0.35**  |    0.15     |    0.15     |    0.10     |     0.05      |   0.85   | exact    |
| iCIMS          |    0.15     |    0.30    |    0.15     |    0.20     |    0.10     |     0.10      |   0.60   | fuzzy    |
| Greenhouse     |    0.10     |    0.25    |    0.10     |    0.25     |    0.10     |     0.20      |   0.40   | semantic |
| Lever          |    0.08     |    0.22    |    0.10     |  **0.30**   |    0.10     |     0.20      |   0.35   | semantic |
| SuccessFactors |    0.25     |    0.25    |  **0.20**   |    0.15     |    0.10     |     0.05      |   0.85   | exact    |

$\sigma$ is the **parsing strictness** parameter, which I'll explain below. **Bold** values highlight the highest weight in that column.

A few things jump out from this table:

- **Taleo** has the highest keyword weight (0.35). This tracks with reality: Taleo's base configuration does literal boolean keyword matching.
- **Lever** has the highest experience weight (0.30). Lever is designed around structured interview feedback, so experience quality matters more than keyword stuffing.
- **Greenhouse and Lever** weight quantification at 0.20 while legacy systems barely care (0.05). Modern platforms value measurable impact.
- **Formatting** ranges from 0.08 (Lever) to 0.25 (Workday/SuccessFactors). Makes sense: Lever uses a modern parser that handles most formats, while Workday's parser is notoriously strict.

### Worked Example

Say your resume scores: $d = [85, 70, 90, 75, 80, 60]$ across the six dimensions.

**Workday:**

$$
\begin{aligned}
S &= (0.25)(85) + (0.30)(70) + (0.15)(90) \\
  &\quad + (0.15)(75) + (0.10)(80) + (0.05)(60) \\
  &= 21.25 + 21.0 + 13.5 + 11.25 + 8.0 + 3.0 \\
  &= 78.00
\end{aligned}
$$

**Lever:**

$$
\begin{aligned}
S &= (0.08)(85) + (0.22)(70) + (0.10)(90) \\
  &\quad + (0.30)(75) + (0.10)(80) + (0.20)(60) \\
  &= 6.80 + 15.40 + 9.0 + 22.50 + 8.0 + 12.0 \\
  &= 73.70
\end{aligned}
$$

Same resume, different scores. The spread between the highest (SuccessFactors at 79.0) and lowest (Lever at 73.7) is 5.3 points, and it comes entirely from how each platform prioritizes different qualities. This is realistic since most ATS platforms care about broadly similar things but weight them differently.

## Format Scoring (Deduction Model)

Format scoring uses a **deduction model**: you start at 100 and lose points for each formatting issue. The penalty for each issue is scaled by the platform's parsing strictness $\sigma$.

$$
F = \max\!\left(0,\;\min\!\left(100,\;100 - \sum_{k} p_k \cdot \sigma\right)\right)
$$

where $p_k$ is the base penalty for formatting issue $k$ and $\sigma \in [0, 1]$ is the platform's parsing strictness.

### Base Penalties

| Issue                             | Base Penalty ($p_k$) | Rationale                                |
| --------------------------------- | :------------------: | ---------------------------------------- |
| Multi-column layout               |          15          | Parser reads text out of order           |
| Tables detected                   |          12          | Content inside tables may be skipped     |
| Images/graphics                   |          8           | Text in images is invisible to parsers   |
| Pages > 2                         |          5           | May be truncated                         |
| Word count < 150                  |          10          | Likely a parsing failure or empty resume |
| Word count > 1500                 |          3           | Minor; consider trimming                 |
| Special char ratio > 5%           |          8           | Encoding issues or bad PDF extraction    |
| All-caps lines > 3                |          3           | Can confuse section detection            |
| Inconsistent bullets (> 2 styles) |          2           | Minor formatting inconsistency           |

### Strictness Scaling

The key insight is that the same formatting issue hurts you differently depending on the platform. A multi-column layout on Workday ($\sigma = 0.90$) costs you $15 \times 0.90 = 13.5$ points, but on Lever ($\sigma = 0.35$) it only costs $15 \times 0.35 = 5.25$ points.

**Worst case** (every issue present at once):

$$
\begin{aligned}
\text{Total base penalty} &= 15 + 12 + 8 + 5 + 10 \\
  &\quad + 3 + 8 + 3 + 2 \\
  &= 66
\end{aligned}
$$

| Platform       | $\sigma$ | Total Deduction | Format Score |
| -------------- | :------: | :-------------: | :----------: |
| Workday        |   0.90   |      59.4       |     40.6     |
| Taleo          |   0.85   |      56.1       |     43.9     |
| SuccessFactors |   0.85   |      56.1       |     43.9     |
| iCIMS          |   0.60   |      39.6       |     60.4     |
| Greenhouse     |   0.40   |      26.4       |     73.6     |
| Lever          |   0.35   |      23.1       |     76.9     |

Even the absolute worst-case resume doesn't hit 0 on any platform, because $\sigma \leq 0.90$ and the max penalty sum is 66, so the floor is $100 - (66 \times 0.90) = 40.6$. The format score can only reach 0 if $\sigma \geq 100/66 \approx 1.52$, which is impossible since $\sigma \in [0, 1]$.

## Keyword Matching

This is probably the most important scoring dimension for job seekers, especially in targeted mode. Each platform uses one of three keyword matching strategies.

### The Formula

$$
K = \min\!\left(100,\;\frac{|M| + 0.8 \cdot |S|}{|J|} \times 100\right)
$$

where:

- $M$ = set of exact keyword matches between resume and JD
- $S$ = set of synonym/partial matches (strategy-dependent)
- $J$ = set of distinct keywords extracted from the job description
- If $|J| = 0$ (no JD provided), $K = 100$ by convention

The **0.8 coefficient** on synonym matches is intentional. A synonym match is close but not as strong as an exact match. If the JD says "Project Manager" and your resume says "PM", that's a synonym match, worth 80% of a direct hit.

### Matching Strategies

**Exact** (Workday, Taleo, SuccessFactors): Only populates $M$. Synonym set $S = \emptyset$. You need the literal terms from the JD.

$$
K_{\text{exact}} = \min\!\left(100,\;\frac{|M|}{|J|} \times 100\right)
$$

**Fuzzy** (iCIMS): Populates both $M$ and $S$ using a synonym database and canonical form mapping.

$$
K_{\text{fuzzy}} = \min\!\left(100,\;\frac{|M| + 0.8 \cdot |S|}{|J|} \times 100\right)
$$

**Semantic** (Greenhouse, Lever): Same formula as fuzzy, but $S$ additionally includes partial string matches (substring containment where both terms are $\geq 3$ characters).

### Practical Impact

With $|M| = 15$, $|S| = 5$, and $|J| = 30$:

- **Exact**: $\frac{15}{30} \times 100 = 50.0$
- **Fuzzy**: $\frac{15 + (0.8)(5)}{30} \times 100 = \frac{19}{30} \times 100 \approx 63.3$

That 13-point difference from synonym matching is significant. It's one of the reasons a resume might pass on Greenhouse but fail on Taleo.

:::note
The maximum possible score using only synonym matches is 80 (when $|M| = 0$ and $|S| = |J|$). You'll always benefit from having exact keyword matches alongside synonyms.
:::

## Quantification Score

The sixth dimension, quantification, is derived from the experience analysis:

$$
d_6 = \begin{cases} \left\lfloor\dfrac{b_q}{b_t} \times 100\right\rfloor & \text{if } b_t > 0 \\[6pt] 0 & \text{if } b_t = 0 \end{cases}
$$

where $b_q$ is the number of experience bullets containing quantified achievements (numbers, percentages, dollar amounts) and $b_t$ is the total number of experience bullets.

A resume with 3 out of 10 bullets containing numbers scores $\lfloor 30 \rfloor = 30$. A resume with 8 out of 10 scores $\lfloor 80 \rfloor = 80$.

This dimension matters a lot more on modern platforms. Greenhouse and Lever weight it at 0.20 (one-fifth of your total score), while legacy systems like Workday and Taleo only weight it at 0.05. The reasoning: modern platforms with structured scorecards surface quantified achievements to reviewers, so they carry more signal.

## Quirk Adjustments

Every platform has quirks: specific behaviors that don't fit neatly into the six dimensions. These are modeled as conditional penalty checks that fire after the weighted sum.

$$
Q_p = -\sum_{j} q_j^{(p)} \cdot \mathbb{1}\!\left[\text{condition}_j\right]
$$

where $q_j^{(p)}$ is the penalty value for quirk $j$ on platform $p$, and $\mathbb{1}[\cdot]$ is the indicator function (1 if the condition is true, 0 otherwise). The negative sign means quirks always reduce the score.

### Currently Modeled Quirks

| Platform | Quirk                     | Condition                        | Penalty |
| -------- | ------------------------- | -------------------------------- | :-----: |
| Workday  | Non-standard headers      | > 2 unrecognized section headers |    5    |
| Workday  | Page limit                | > 2 pages                        |    8    |
| Taleo    | Low keyword density       | < 5 skills detected (with JD)    |   10    |
| Taleo    | Missing standard sections | > 1 required section missing     |    8    |

### Full Score Assembly

Putting it all together for a Workday example:

Given $d = [85, 70, 90, 75, 80, 60]$ and one triggered quirk (non-standard headers):

$$
S_{\text{weighted}} = \sum_{i=1}^{6} w_i \cdot d_i = 78.00
$$

$$
Q = -(5) \cdot \mathbb{1}[\text{true}] = -5
$$

$$
S_{\text{Workday}} = \text{clamp}(0, 100, 78.00 + (-5)) = 73.00
$$

## Passing Thresholds

Each platform has a threshold that determines whether your resume "passes" the initial filter. These are set based on research into typical auto-reject cutoffs:

| Platform       | Passing Score | Reasoning                                              |
| -------------- | :-----------: | ------------------------------------------------------ |
| Workday        |      70       | Strict Fortune 500 systems tend to filter aggressively |
| Taleo          |      65       | Legacy boolean matching has some tolerance             |
| iCIMS          |      60       | ALEX parser is more forgiving                          |
| Greenhouse     |      55       | Designed for human review, lower auto-filter bar       |
| Lever          |      50       | Minimal auto-filtering by design                       |
| SuccessFactors |      65       | Enterprise standard, moderate strictness               |

The pass/fail determination is simply:

$$
\text{passes}_p = \begin{cases} \text{true} & \text{if } S_p \geq \tau_p \\ \text{false} & \text{otherwise} \end{cases}
$$

where $\tau_p$ is the passing threshold for platform $p$.

## Cross-Platform Divergence

One of the things I wanted to demonstrate with this tool is that the same resume genuinely scores differently across platforms. It's not just the thresholds that differ; the weights create real separation.

For $d = [80, 65, 85, 70, 75, 55]$:

| Platform       | Score | Threshold | Result |
| -------------- | :---: | :-------: | ------ |
| Workday        | 73.00 |    70     | Pass   |
| Taleo          | 72.25 |    65     | Pass   |
| iCIMS          | 71.25 |    60     | Pass   |
| SuccessFactors | 74.00 |    65     | Pass   |
| Greenhouse     | 68.75 |    55     | Pass   |
| Lever          | 68.70 |    50     | Pass   |

The spread here is 5.30 points from highest to lowest. All pass in this example, but tweak the keyword score down to 45 and Taleo (weight 0.35) drops 7 points while Lever (weight 0.22) only drops 4.4. That differential is the whole point: your optimization strategy should depend on where you're applying.

## AI vs Rule-Based Scoring

Everything above describes the **rule-based fallback engine**. When AI scoring is available (Gemma 3 27B via Google's Generative Language API), the LLM evaluates each dimension using the same platform profiles as context. The AI can pick up on nuances that rule-based scoring can't, things like contextual relevance, phrasing quality, and role-specific terminology.

The rule-based engine exists as a fallback for when the AI is unavailable (rate limits, timeouts, etc.). It produces serviceable scores using the exact formulas on this page, but AI scoring is generally more nuanced and accurate for real-world resume evaluation.

:::note[Source Code]
Every formula on this page maps directly to the scoring engine at [`src/lib/engine/scorer/`](https://github.com/sunnypatell/ATS-Screener/tree/main/src/lib/engine/scorer). The weight vectors live in [`profiles/`](https://github.com/sunnypatell/ATS-Screener/tree/main/src/lib/engine/scorer/profiles), format scoring in [`format-scorer.ts`](https://github.com/sunnypatell/ATS-Screener/blob/main/src/lib/engine/scorer/format-scorer.ts), and keyword matching in [`keyword-matcher.ts`](https://github.com/sunnypatell/ATS-Screener/blob/main/src/lib/engine/scorer/keyword-matcher.ts). It's all MIT-licensed if you want to dig in.
:::
