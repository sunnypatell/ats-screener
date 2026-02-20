# how enterprise ATS platforms actually parse, filter, and score resumes

**date:** february 2026
**goal:** understand real-world ATS scoring behavior to build an accurate resume screener simulation

---

## table of contents

1. [resume parsing engines (the actual technology)](#resume-parsing-engines)
2. [platform-by-platform breakdown](#platform-breakdown)
3. [AI-native platforms (Eightfold, HiredScore, Pymetrics)](#ai-native-platforms)
4. [semantic matching vs keyword matching](#semantic-vs-keyword)
5. [common rejection/filtering reasons](#rejection-reasons)
6. [market share data](#market-share)
7. [key takeaways for our scoring engine](#key-takeaways)

---

## resume parsing engines

the ATS itself is usually NOT the parser. most ATS platforms use a third-party parsing engine under the hood or let customers plug one in. the parser extracts structured data from unstructured resumes; the ATS then uses that data for filtering, searching, and matching.

### the big parsing engines

| engine | used by | languages | fields | notes |
|--------|---------|-----------|--------|-------|
| **Textkernel (absorbed Sovren)** | Oracle, SuccessFactors, Lever, Bullhorn, Salesforce | 29 | 100+ | industry leader, processes 2B+ resumes/year. now has LLM parser powered by GPT-3.5 |
| **RChilli** | SAP SuccessFactors (native), many mid-market | 40+ | 200+ | SAP's go-to parser. strong taxonomy normalization |
| **Affinda** | white-label for many ATS vendors | 50+ | 100+ | ML-based (non-LLM), agentic AI for format adaptation. self-hosted option available |
| **DaXtra** | staffing/recruiting platforms | many | 150+ | strong in staffing industry, includes candidate management |
| **HireAbility** | mid-market ATS platforms | multilingual | standard | solid multilingual support |

### how parsing actually works (technical pipeline)

the parsing pipeline has distinct stages:

1. **document ingestion** - accepts PDF, DOCX, RTF, TXT, HTML, ODT. some support image-based PDFs via OCR (Textkernel does, native Oracle Recruiting Cloud does not)
2. **text extraction** - convert document to raw text. this is where formatting kills resumes: tables, columns, headers/footers, text boxes, and graphics can break extraction
3. **preprocessing** - tokenization, lowercasing, stopword removal, normalization
4. **section detection** - identify resume sections (experience, education, skills, etc.) using pattern matching + ML classifiers. bold text is treated as a strong signal for section headers
5. **named entity recognition (NER)** - extract entities: person names, company names, job titles, dates, locations, degrees, skills. modern parsers use BERT-based transformer models fine-tuned on resume data
6. **taxonomy normalization** - map extracted skills/titles to standardized taxonomies. "Software Engineer," "Application Developer," and "Backend Developer" get mapped to the same normalized concept. this is critical and is what separates good parsers from bad ones
7. **structured output** - emit JSON with all extracted fields

### what gets extracted (typical field set)

```
personal: name, email, phone, address, linkedin, websites
experience: [employer, title, location, start_date, end_date, description] (per role)
education: [institution, degree, degree_type, field, graduation_date] (per entry)
skills: [skill_name, proficiency, years, context] - mapped to skill taxonomy
certifications: [name, issuer, date]
languages: [language, proficiency]
metadata: total_years_experience, management_level, executive_type
```

### format compatibility reality

| format | support level | notes |
|--------|--------------|-------|
| DOCX | best | most reliably parsed. ATS engines treat bold as section delimiter signals. single-column layouts parse cleanest |
| PDF (text-based) | good | modern parsers handle these well. problems only with complex layouts, multi-column, or locked PDFs |
| PDF (scanned/image) | poor-to-fair | requires OCR. Textkernel supports it, many native ATS parsers do not. Oracle Recruiting Cloud explicitly cannot parse scanned PDFs |
| TXT/RTF | good | universally readable, no formatting issues, but lose all visual structure |
| Images (PNG/JPG) | poor | almost no ATS handles these well. Greenhouse explicitly warns against image uploads |

---

## platform breakdown

### 1. Workday Recruiting

**market position:** dominant in enterprise. 37.1% of Fortune 500 companies use Workday (2024-2025 data). the most widely used ATS among large companies by a significant margin.

**parsing engine:** proprietary, tightly integrated with Workday HCM. not publicly confirmed to use Textkernel/Sovren, but Textkernel offers connectors for Workday.

**how scoring/ranking works:**
- Workday historically did NOT have AI-driven candidate scoring. recruiters used keyword search + manual filtering
- **in 2024, Workday acquired HiredScore**, which fundamentally changes the story
- HiredScore provides AI-powered candidate matching that scores candidates against job requirements
- HiredScore uses explainable, auditable AI (not generative AI) with transparent scoring: users can see exactly why a candidate was scored a certain way
- HiredScore's "fetch" feature resurfaces previously rejected candidates from the talent pool who match new openings
- the system provides automatic candidate ranking with bias audits and compliance configuration

**key technical details:**
- expects standard section headings: "Experience," "Education," "Skills," "Certifications"
- nontraditional headings and complex formatting (columns, tables, graphics) may not parse
- favors single-column, text-based resumes in DOCX or PDF
- parsed data flows directly into the HCM profile (address, education, email, experience, name, phone)
- recruiters filter using keyword searches within the ATS

**what causes rejection:**
- formatting that breaks parsing (columns, tables, images, fancy templates)
- missing standard section headings
- knockout questions on the application (work authorization, willingness to relocate, etc.)
- recruiter never sees the resume if keyword search doesn't surface it

**quirks:**
- Workday's application process is notoriously long and tedious for candidates
- the HiredScore acquisition is still being rolled out; many Workday customers may not have it enabled yet
- HiredScore explicitly avoids generative AI for compliance/auditability reasons

---

### 2. Oracle Taleo

**market position:** legacy giant. still used by many large enterprises, especially those already on Oracle HCM. being gradually replaced by Oracle Recruiting Cloud (ORC), which launched in 2018.

**parsing engine:** proprietary parser for Taleo. for Oracle Recruiting Cloud, Textkernel and RChilli are available as add-on parsers (Textkernel handles OCR for scanned PDFs, which ORC cannot do natively).

**how scoring/ranking works:**

taleo is one of the few ATS platforms that actually auto-scores candidates against requisitions. it has four distinct scoring mechanisms:

1. **Req Rank (Requisition Rank)** - a percentage score based on how well the resume + application data matches the job requisition. this is the main "ATS score" people refer to. it's a keyword overlap percentage.

2. **Candidate Suggestions (AI-driven, 0-3 stars)** - the ML-based "Suggested Candidates" feature scores on four criteria:
   - **Profile** - how well candidate's title/description match the req (0-3 stars)
   - **Education** - degree level match (0-3 stars)
   - **Experience** - years and relevance of experience (0-3 stars)
   - **Skills** - competency match (0-3 stars)
   - uses ML so terms don't need to be exact matches; it can find semantic similarities

3. **Prescreening Questions** - configurable questions with weighted scoring:
   - each question/competency can be marked "Required" (must match) or "Asset" (nice to have)
   - weight values assigned to questions for more/less consideration
   - results combined into a prescreening score

4. **Knockout/Disqualification Questions** - binary pass/fail:
   - single-answer questions with at least two possible answers
   - one answer = pass, other answer(s) = instantly disqualified
   - candidate is automatically exited from the process

**matching criteria (from Oracle docs):**
- preferred jobs/job title
- preferred locations/location
- organizations
- competencies (treated as wildcards, always considered)
- questions (treated as wildcards, always considered)
- job level, type, schedule, shift
- employee status
- education level
- travel requirements
- minimum salary

**what causes rejection:**
- failing knockout questions (automatic, instant)
- low prescreening score below threshold
- missing required certifications/education
- not completing required assessments
- low keyword match percentage

**quirks:**
- Taleo is the only major ATS that does genuine automated resume scoring with a visible rank percentage
- the Candidate Suggestions feature is ML-based and can recognize synonyms
- Taleo's parsing is known to strip HTML tags, special characters, and certain fonts
- Taleo is being sunset in favor of Oracle Recruiting Cloud, but migration is slow

---

### 3. iCIMS

**market position:** leads overall ATS market with 10.7% market share (2024). strong in mid-to-large enterprise.

**parsing engine:** uses keyword-density algorithm and section-recognition engine. not publicly confirmed which third-party parser they use. likely proprietary or a white-labeled solution.

**how scoring/ranking works:**

- **Role Fit Score** - iCIMS's AI-based "Candidate Ranking" feature that shows a visual score for how well a candidate matches a role
- the role fit visualization shows experience match, skills match, and an overall tier
- the system auto-generates a skills list from the full text of the resume (not just from a skills section)
- uses semantic analysis rather than pure keyword matching
- proprietary algorithms combined with third-party ML technologies

**technical approach:**
- keyword-density algorithm: counts frequency and placement of relevant terms
- section-recognition engine: favors clean headings, simple fonts, standard bullet styles
- AI goes beyond keywords to analyze related skills, experiences, and qualities of past successful hires
- includes bias audits and transparency features with opt-out options

**what causes rejection:**
- poor formatting that breaks the section-recognition engine
- lack of keywords matching the job description
- failing pre-screening questions
- iCIMS supports both automated and manual candidate advancement

**quirks:**
- iCIMS has embraced AI cautiously, combining innovation with bias audits and transparency
- the "Copilot" feature assists recruiters but doesn't auto-reject
- the platform generates its own skills inference from resume text, which means your explicit skills list isn't the only thing scored

---

### 4. Greenhouse

**market position:** 4th largest ATS globally. popular with tech companies and high-growth startups. strong in mid-market.

**parsing engine:** proprietary ML models that extract skills, job titles, years of experience, start/end dates, and company names from resumes.

**how scoring/ranking works:**

**this is a critical insight: Greenhouse fundamentally does NOT auto-score or auto-rank candidates.**

per co-founder Jon Stross:
- "We don't have some magic AI" that judges applicants
- greenhouse does NOT utilize a match score
- human intervention is required to advance, reject, or hire a candidate
- candidates generally appear in the order they applied
- if companies get many applicants, they may look at referrals first, or the first 50 applicants, and once they have enough "pretty good" candidates, they interview those and ignore the rest

**what Greenhouse actually does:**
- **structured hiring scorecards** - the core differentiator. before interviews, the hiring team defines:
  - required attributes/skills for the role
  - focus attributes to test in each interview stage
  - a 5-point rating scale (science-based survey methodology to reduce bias)
  - scorecards are assigned to interviewers and completed after each interview
  - team reviews scorecards together in "candidate roundup" meetings
- **keyword search** - recruiters can search resumes for keywords using "Required" (AND) and "Preferred" (OR) boolean logic
- **knockout questions** - optional, basic screening (legal age, relocation willingness), but these don't auto-advance; they pre-filter before human review
- **Talent Matching** (newer feature) - ML-based parsing that extracts skills, titles, experience as structured data for filtering

**what causes "rejection":**
- never reaching human review because the recruiter stopped looking after the first batch of good candidates
- failing knockout questions (manual review still required in most configs)
- not surfacing in keyword searches because of missing terminology

**quirks:**
- Greenhouse's philosophy is explicitly anti-auto-rejection. this is a selling point
- the scorecard system means the real "scoring" happens during interviews, not resume screening
- the platform is designed around reducing bias through structured evaluation
- for our screener, Greenhouse-style means: parsing + keyword matching + human decision, NOT automated ranking

---

### 5. Lever

**market position:** 5th largest ATS. popular with tech companies and startups, similar market to Greenhouse.

**parsing engine:** confirmed to use Sovren (now Textkernel) for resume parsing. sends resumes to hosted Sovren instances for extraction.

**how scoring/ranking works:**
- Lever does NOT automatically rank resumes against job descriptions
- recruiters use keyword search to filter through applications
- LeverTRM's search supports word stemming (e.g., searching "collaborating" finds "collaborate," "collaboration," etc.)
- recruiters manually assign scores visible to other HR team members
- the platform focuses on relationship management (CRM-like) rather than automated scoring

**technical details:**
- Sovren integration extracts contact info, experience, education into structured fields
- keyword search pulls from all parseable content in candidate profiles
- supports word stemming but cannot identify abbreviations (e.g., "PM" won't match "Project Manager")
- AI features (newer): can analyze resume content with deeper technical understanding, evaluating project complexity and impact beyond keyword matches

**what causes rejection:**
- not appearing in keyword searches
- recruiter manually passing on the candidate
- failing screening questions

**quirks:**
- despite using Sovren (a sophisticated parser), Lever's matching is fundamentally keyword-search-based, not score-based
- the word stemming support is a nice feature but abbreviation blindness is a real limitation
- Lever recently added AI innovations but details on the scoring algorithm are sparse

---

### 6. SAP SuccessFactors Recruiting

**market position:** 13.4% of Fortune 500. strong in large enterprise, especially companies already on SAP.

**parsing engine:** native parsing with limited capabilities. primary third-party parser is **RChilli** (SAP's official partner). Textkernel also available as an add-on.

**how scoring/ranking works:**
- native: basic parsing that feeds candidate search and filtering
- with RChilli: AI-powered search & match that:
  - parses resumes into 200+ structured fields
  - normalizes skills/titles to standardized taxonomy
  - computes match scores with full breakdowns of how scores were calculated
  - goes beyond keywords by understanding context, synonyms, and normalized taxonomy
  - uses AI and confidence scoring to identify both stated and implied skills
  - returns ranked results from both applied candidates and existing talent pools
  - recruiters can define custom weighting: skill match, title relevance, location, education, years of experience

**technical details:**
- resume parsing supported in 15+ languages natively; 40+ with RChilli
- parsed data maps through "Candidate Standardization" configuration with picklist mapping
- the system requires completing a mapping exercise to configure how parsed data maps to profile fields
- profile-before-application architecture (profile must exist before application)

**what causes rejection:**
- scanned PDFs / image-based PDFs will NOT parse (native parser lacks OCR; Textkernel add-on needed for this)
- resume parsing breaks when Mobile Apply is enabled
- incomplete profile mapping configuration
- failing screening criteria

**quirks:**
- the native parser is weak; RChilli or Textkernel is essentially required for real resume parsing
- the mapping/configuration step is complex and many orgs don't set it up properly
- RChilli's bias-removal feature can strip name, gender, nationality from parsed data
- RChilli is GDPR, SOC 2, HIPAA, ISO 27001 compliant and doesn't store resume data post-processing

---

### 7. ADP Workforce Now

**market position:** in top 10 ATS vendors. primarily targets small-to-midsize businesses.

**parsing engine:** AI-powered talent acquisition tools with intelligent candidate matching. ADP's native parsing is basic. the platform supports third-party ATS integrations (ApplicantStack, JazzHR, JobScore) for more advanced parsing.

**how scoring/ranking works:**
- basic keyword matching against job posting requirements
- automated workflows for candidate processing
- no publicly documented scoring algorithm
- relies heavily on clean, structured formatting for accurate parsing

**what causes rejection:**
- complex layouts, unusual fonts, or inconsistent formatting that disrupts parsing
- content in headers/footers (ATS cannot read these)
- tables, graphics, italics
- non-standard section headings
- file format issues (scanned PDFs)

**quirks:**
- ADP recommends DOCX over PDF for best ATS compatibility
- primarily an HR/payroll platform with recruiting bolted on; the ATS is not its core strength
- many ADP customers use third-party ATS integrations rather than the native recruiting module
- limited public documentation on the parsing/scoring internals

---

### 8. BambooHR

**market position:** popular with small businesses (SMB). not in the enterprise ATS conversation.

**parsing engine:** BambooHR does NOT have built-in resume parsing in its ATS. users must integrate third-party solutions (CandidateZip, Parseur via Zapier/Make, Skima AI, etc.) for parsing.

**how scoring/ranking works:**
- no automated scoring or ranking
- applicants are tagged and labeled based on resume information (manually or via integrations)
- the ATS tracks applied date, status, rating (manual), resume/cover letter file IDs
- AI/NLP capabilities come only through third-party integrations

**what causes rejection:**
- manual decision by recruiter
- failing application questions

**quirks:**
- the lack of native parsing is a significant gap
- primarily an HRIS with a basic ATS, not a recruiting-first platform
- for our simulator, BambooHR-style means essentially no automated filtering; everything is manual

---

## AI-native platforms

these are a different category from traditional ATS. they sit on top of or replace traditional ATS scoring with deep ML/AI.

### Eightfold.ai

**approach:** deep learning talent intelligence platform

**technical architecture:**
- built on 1.6+ billion career profiles and 1.6+ million skills
- uses **token-level embedding models** to embed skills, titles, companies, degrees, and schools into vector space
- extracts hundreds of features per candidate: embeddings, similarity scores, structured data
- blends features into a **calibrated prediction** that ranks candidates by likelihood of success
- training data: historical data on who applied, got advanced, was hired, and thrived in similar roles
- decomposes jobs into roles with capability needs, then matches people by relevant capabilities and experiences
- **adjacent skills detection**: identifies skills a candidate could learn based on their existing skill graph

**what makes it different from keyword matching:**
- understands that a "Senior Java Developer" at Amazon and a "Lead Backend Engineer" at Google have overlapping capability profiles even with zero keyword overlap
- matches on potential, not just past role titles
- the skill taxonomy has 1.6M+ skills with relationships mapped between them

### HiredScore (now Workday)

**approach:** responsible AI for talent orchestration

**technical architecture:**
- NOT using generative AI; uses traditional ML for auditability
- scores candidates based strictly on criteria listed in the job description
- 100% auditable logs of scoring decisions
- provides explainable reasoning behind every score/ranking
- "fetch" feature: mines historical applicant pools for candidates who were rejected from previous openings but match current ones
- includes bias audits, local compliance configuration
- integrates with Workday, SAP, Oracle, and other major ATS platforms

### Pymetrics (now Harver)

**approach:** neuroscience-based behavioral assessment

**technical architecture:**
- gamified cognitive/emotional assessments (not resume parsing)
- measures traits like: learning speed from mistakes, memory capacity, risk tolerance, attention to detail
- AI compares candidate game performance against profiles of high-performers in the role
- predicts role fit based on behavioral traits rather than resume keywords
- completely different paradigm from resume-based scoring

---

## semantic matching vs keyword matching

this is the core technical distinction our scoring engine needs to understand.

### keyword matching (traditional, still dominant)

how it works:
1. extract keywords from job description
2. search for exact keyword matches in resume text
3. count matches, optionally weight by frequency or placement
4. rank by match count or percentage

techniques:
- **exact string matching** - "Java" matches "Java" but not "JavaScript"
- **TF-IDF (term frequency-inverse document frequency)** - weights terms by how often they appear in the resume vs how common they are across all resumes. rare, specific terms get higher weight
- **boolean filtering** - AND/OR/NOT queries on keyword presence
- **keyword density** - frequency of matching terms relative to total text

limitations:
- "project management" won't match "program management"
- "JS" won't match "JavaScript"
- cannot understand context: "managed a team developing software" vs "developed software for a management team"
- 98% of Fortune 500 companies use keyword-based ATS; this approach reportedly misses up to 75% of qualified candidates (though that specific stat is disputed)

### semantic matching (modern, growing adoption)

how it works:
1. convert both resume and job description into vector representations (embeddings)
2. compute similarity between vectors using mathematical distance measures
3. rank by similarity score

techniques:
- **word embeddings (Word2Vec, GloVe)** - map words to dense vectors where semantically similar words are close together. "project management" and "program management" end up near each other in vector space
- **transformer models (BERT, RoBERTa, DistilBERT)** - generate contextual embeddings that understand meaning based on surrounding words
- **cosine similarity** - measures angular distance between vectors: `cos(theta) = (A . B) / (||A|| * ||B||)`. scores 0-1 where 1 = identical meaning
- **Jaccard similarity** - measures overlap: `|A intersect B| / |A union B|`. good for comparing skill sets
- **semantic role labeling (SRL)** - identifies who did what to whom in a sentence, understanding contextual relationships

**key insight:** semantic matching can improve candidate matching accuracy by ~60% over keyword matching. it recognizes synonyms, related terms, and industry jargon. "software development" matches "coding," "programming," "engineering."

### Textkernel/Sovren's approach (the industry standard for third-party matching)

Textkernel's Search & Match engine is the most documented scoring algorithm in the industry. here's how it actually works:

**8 scoring categories:**
1. Education
2. Job Titles
3. Skills
4. Industries (taxonomy-based)
5. Languages
6. Certifications
7. Executive Type
8. Management Level

**scoring process:**
1. parse both source document (job) and target document (resume)
2. normalize all extracted entities to taxonomy concepts (skills are ONLY scored as normalized concepts, not raw keywords; this eliminates false negatives from synonym mismatches)
3. generate complex queries across all 8 categories
4. calculate unweighted score for each category (0-100)
5. apply category weights (auto-suggested or custom)
6. compute **Weighted Score** = sum of (category_score * category_weight) for each category. score 0-100 representing how well resume matches job
7. compute **Reverse Compatibility Score (RCS)** = how well the job matches the resume (the other direction). this penalizes overqualified candidates
8. blend into **SovScore** = proprietary combination of Weighted Score and RCS. this bidirectional scoring prevents overqualified candidates from topping results

**dynamic weight adjustments:**
- remote jobs: location weight drops to zero
- IT roles: IT skills weighted more heavily
- recent experience: current job title weighted higher than title from 5 years ago
- cross-field boosting: skills appearing in recent job titles get additional weight

---

## rejection and filtering reasons

### what actually causes resumes to be filtered out

based on research across all platforms, here are the real filtering mechanisms in order of how common they are:

**tier 1: hard filters (automatic, binary)**
- knockout/disqualification questions (work authorization, required certifications, willing to relocate)
- minimum education level not met
- required years of experience threshold
- application incomplete (missing required fields)
- file format unreadable (scanned image PDF, corrupted file)

**tier 2: parsing failures (the resume never makes it into the system properly)**
- tables/columns break text extraction, content ends up jumbled
- content in headers/footers gets ignored
- graphics/images/charts are invisible to parsers
- unusual fonts cause character encoding issues
- text boxes and floating elements lose their position context
- multi-column layouts merge content from different sections

**tier 3: low relevance score (candidate exists in system but ranks low)**
- missing keywords from job description
- wrong terminology (abbreviations vs full terms, synonyms)
- skills mentioned but not in the context the parser expects
- irrelevant experience dominating the resume (dilutes keyword density)
- no overlap between resume title/summary and job title

**tier 4: human filtering (the recruiter never gets to your resume)**
- recruiter stops reviewing after finding enough "good" candidates (confirmed by Greenhouse co-founder)
- resume appears after a large batch of strong candidates
- recruiter uses keyword search and resume doesn't surface
- recruiter filters by source (referrals first, job boards last)

### the "75% rejection" stat

the widely cited "75% of resumes are rejected by ATS" originated from a 2012 sales pitch by Preptel (a resume optimization company that went bankrupt in 2013). no research methodology was ever published. however, a separate stat holds more weight: **88% of employers report losing qualified candidates due to ATS filtering** that doesn't align with job description criteria.

---

## market share

### ATS market share (2024-2025 data)

**overall market (all company sizes):**

| rank | platform | market share |
|------|----------|-------------|
| 1 | iCIMS | 10.7% |
| 2 | Oracle (Taleo + ORC) | ~9% |
| 3 | Workday | ~8% |
| 4 | Greenhouse | ~6% |
| 5 | Lever | ~5% |
| 6 | SmartRecruiters | ~4% |
| 7 | ADP Recruiting | ~3% |
| 8 | Ceridian Dayforce | ~3% |
| 9 | SAP SuccessFactors | ~3% |
| 10 | Bullhorn | ~2% |

top 10 = 51.1% of total market. the other ~49% is hundreds of smaller vendors.

**Fortune 500 specifically:**

| platform | Fortune 500 usage |
|----------|------------------|
| Workday | 37.1% |
| SAP SuccessFactors | 13.4% |
| Taleo/Oracle | significant (legacy) |
| iCIMS | significant |

the ATSs with the largest clients are BrassRing (IBM Kenexa), Taleo/Oracle, and Workday.

**total market size:** ~$2.5B in 2024, projected $3.6B by 2029 (7.6% CAGR).

---

## key takeaways for our scoring engine

### what we should simulate

based on this research, our screener should model these distinct scoring dimensions:

1. **keyword match score** (the baseline all ATS use)
   - exact keyword matching with TF-IDF weighting
   - check for required skills, preferred skills, and nice-to-have skills
   - weight by frequency and placement (title/summary > body text)
   - handle abbreviations and common synonyms

2. **section completeness score** (parsing quality)
   - does the resume have parseable contact info?
   - are standard sections present (experience, education, skills)?
   - are dates parseable?
   - would this resume break common parsers? (tables, columns, images)

3. **qualification match score** (knockout filters)
   - minimum education level
   - minimum years of experience
   - required certifications
   - required skills vs preferred skills

4. **semantic similarity score** (modern AI-enhanced ATS)
   - cosine similarity between resume and job description embeddings
   - skill taxonomy matching (related skills, not just exact matches)
   - title/role similarity (normalized)

5. **experience relevance score** (Taleo-style)
   - recency weighting (recent experience matters more)
   - management level match
   - industry match
   - progression/trajectory

### what NOT to simulate

- auto-rejection based purely on keyword count (most ATS don't actually do this)
- a single "ATS score" that determines pass/fail (this is a myth for most platforms)
- image/graphic detection penalties (parsers just ignore them, they don't penalize)
- the idea that PDFs are always worse than DOCX (modern parsers handle both fine)

### critical design decisions

1. **our scoring should be multi-dimensional, not a single number.** real ATS platforms score across multiple axes (Taleo: profile/education/experience/skills. Textkernel: 8 categories with weights).

2. **keyword matching is still the foundation.** even AI-enhanced platforms like iCIMS and Taleo start with keyword density. semantic matching enhances it but doesn't replace it.

3. **knockout filters are binary, not scored.** if a job requires a PE license and you don't have one, no amount of keyword matching saves you. these should be hard pass/fail checks separate from the score.

4. **the biggest real-world filtering mechanism is recruiter behavior, not algorithms.** Greenhouse's co-founder confirmed that recruiters often stop reviewing after finding enough good candidates. our tool should communicate this reality.

5. **different ATS platforms behave very differently.** Taleo actively scores and can auto-reject. Greenhouse explicitly requires human review. our engine should either pick a middle ground or let users select which ATS behavior to simulate.

---

## sources

- [Textkernel (Sovren) Parsing Platform](https://www.textkernel.com/sovren/)
- [Textkernel Search & Match Scoring](https://developer.textkernel.com/tx-platform/v10/search-match/overview/querying/)
- [Textkernel Differentiators](https://developer.textkernel.com/tx-platform/v10/search-match/overview/differentiators/)
- [Textkernel LLM Parser](https://www.textkernel.com/learn-support/blog/textkernel-introduces-llm-parser-a-leap-forward-in-resume-parsing-and-recruitment-technologystart-parsing-with-llm-parser/)
- [Taleo Scoring - Jobscan](https://www.jobscan.co/blog/taleo-popular-ats-ranks-job-applications/)
- [Taleo Candidate and Requisition Matching - Oracle Docs](https://docs.oracle.com/en/cloud/saas/taleo-enterprise/20a/otrcg/candidate-and-requisition-matching.html)
- [Taleo Prescreening - Oracle Docs](https://docs.oracle.com/cloud/18a/taleo/OTREC/_prescreening_ug.htm)
- [Oracle Recruiting Cloud + Textkernel](https://www.textkernel.com/learn-support/blog/oracle-recruiting-cloud-resume-parsing/)
- [iCIMS Talent Cloud AI](https://community.icims.com/s/article/Understanding-iCIMS-Talent-Cloud-AI)
- [iCIMS AI Candidate Screening](https://integralrecruiting.com/ai-candidate-screening-how-does-icims-compare/)
- [Greenhouse Structured Hiring Guide](https://support.greenhouse.io/hc/en-us/articles/360039539772-Structured-hiring-guide)
- [Greenhouse Scorecard Overview](https://support.greenhouse.io/hc/en-us/articles/4414777492891-Scorecard-overview)
- [Greenhouse ATS - Jon Stross Interview](https://www.briefcasecoach.com/how-an-applicant-tracking-system-works-interview-greenhouse-founder-jon-stross/)
- [Greenhouse Resume Keyword Search](https://support.greenhouse.io/hc/en-us/articles/115004600186-Search-resumes-for-keywords)
- [Lever ATS - Jobscan](https://www.jobscan.co/blog/lever-ats/)
- [SAP SuccessFactors Resume Parsing Config](https://help.sap.com/docs/successfactors-recruiting/setting-up-and-maintaining-sap-successfactors-recruiting/configuring-resume-parsing)
- [RChilli for SAP SuccessFactors](https://www.rchilli.com/our-partners/sap-successfactors)
- [RChilli AI Search & Match](https://www.rchilli.com/sap-successfactors/search-match)
- [ADP Resume Formatting Guide](https://ireformat.com/ats/adp-workforce-now)
- [BambooHR ATS API](https://developers.getknit.dev/docs/bamboohr-ats-usecases)
- [Affinda Resume Parser](https://www.affinda.com/resume-parser)
- [Affinda Documentation](https://docs.affinda.com/resumes/integration)
- [Workday HiredScore Acquisition - Josh Bersin](https://joshbersin.com/2024/03/workday-to-acquire-hiredscore-a-potential-shakeup-in-hr-technology/)
- [Workday HiredScore Capabilities](https://www.suretysystems.com/insights/workday-hiredscore-revolutionizing-talent-acquisition-and-management-with-ai/)
- [HiredScore Responsible AI](https://diginomica.com/workday-launches-new-ai-capabilities-hiring-and-talent-management-following-hiredscore-acquisition)
- [Eightfold AI Talent Matching](https://eightfold.ai/engineering-blog/ai-powered-talent-matching-the-tech-behind-smarter-and-fairer-hiring/)
- [NLP vs Traditional Resume Screening](https://talentbusinesspartners.com/articles/how-nlp-beats-traditional-resume-screening-a-technical-analysis/)
- [Semantic Search vs Keyword Matching - Brainner](https://www.brainner.ai/blog/article/the-benefits-of-semantic-search-over-keyword-matching-in-resume-screening)
- [ATS Market Share - Jobscan 2025 Report](https://www.jobscan.co/blog/fortune-500-use-applicant-tracking-systems/)
- [ATS Market Size - Apps Run The World](https://www.appsruntheworld.com/top-10-hcm-software-vendors-in-applicant-tracking-market-segment/)
- [ATS Rejection Myth - The Interview Guys](https://blog.theinterviewguys.com/ats-resume-rejection-myth/)
- [ATS Rejection Reasons](https://www.davron.net/ats-systems-explained-75-percent-resumes-rejected/)
- [Resume File Types Guide](https://www.recrew.ai/blog/7-resume-file-types-the-definitive-guide)
- [Resume2Vec Academic Paper](https://www.mdpi.com/2079-9292/14/4/794)
