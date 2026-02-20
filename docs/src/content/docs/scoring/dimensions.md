---
title: Scoring Dimensions
description: The 5 dimensions used to evaluate resumes across all ATS platforms.
---

Every resume is scored across 5 dimensions. Each platform weighs these differently based on its actual behavior.

## Formatting (0-100)

How well your resume would parse through each platform's specific parser.

**What's evaluated:**

- Single-column vs multi-column layout
- Use of tables, text boxes, or graphics
- Header/footer content placement
- Standard vs creative section headings
- Font consistency and readability
- File format (PDF vs DOCX)

**Platform differences:**

- **Workday/Taleo**: Strict. Tables, columns, and headers break parsing. Score drops significantly.
- **iCIMS**: ALEX parser handles most formats. Score is lenient.
- **Greenhouse**: LLM parser handles almost anything. Minimal penalties.

## Keyword Match (0-100)

How well your resume's terminology matches what the platform is looking for.

**In general mode:**

- Industry-standard terminology
- Technical skills and certifications
- Action verbs and professional language
- Keyword density and distribution

**In targeted mode:**

- Direct matches between JD requirements and resume content
- Skill coverage (what percentage of required skills appear)
- Synonym and variation matching (platform-dependent)

**Platform differences:**

- **Taleo**: Exact literal match only. "PM" ≠ "Project Manager"
- **Lever**: Stemming-based. "Managing" matches "Management"
- **iCIMS/Greenhouse**: Semantic. "Led a team" matches "Leadership"

## Section Completeness (0-100)

Presence of standard, parseable resume sections.

**Expected sections:**

- Contact information (name, email, phone)
- Professional experience / work history
- Education
- Skills / technical skills
- Summary or objective (optional but valued)

**Bonus sections:**

- Certifications
- Projects
- Publications
- Volunteer work

**Platform differences:**

- **Workday**: Specifically requires standard headings like "Experience" and "Education"
- **SuccessFactors**: Needs clearly structured sections for Textkernel parsing
- **Greenhouse/Lever**: More lenient on section naming

## Experience Relevance (0-100)

Quality and relevance of your professional experience.

**What's evaluated:**

- Quantified achievements (numbers, percentages, dollar amounts)
- Action verb usage ("Led," "Built," "Increased" vs "Responsible for")
- Recency weighting (recent experience valued more)
- Relevance to stated field or JD requirements
- Bullet point quality and specificity

**Example scoring:**

- "Increased quarterly revenue by 34% through implementation of automated lead scoring" = High score
- "Responsible for various projects and tasks as assigned" = Low score

## Education (0-100)

How well your education section parses and matches expectations.

**What's evaluated:**

- Degree presence and level (PhD > Masters > Bachelors > Associate)
- Field of study relevance
- Institution name parseability
- Date formatting (graduation year)
- GPA/honors (if applicable and strong)
- Certifications and continuing education
