# ATS Platform Research: Parsing, Scoring, and Filtering Behavior

> research date: 2026-02-20
> purpose: factual reference for building accurate ATS scoring prompts

---

## Table of Contents

1. [Workday Recruiting](#1-workday-recruiting)
2. [Oracle Taleo](#2-oracle-taleo)
3. [iCIMS](#3-icims)
4. [Greenhouse](#4-greenhouse)
5. [Lever](#5-lever)
6. [SAP SuccessFactors](#6-sap-successfactors)
7. [Third-Party Parsers Reference](#7-third-party-parsers-reference)
8. [Cross-System Patterns](#8-cross-system-patterns)

---

## 1. Workday Recruiting

### 1.1 Parsing Behavior

**parser engine:** Workday uses a **proprietary built-in parser**. the exact engine is not publicly disclosed, but it is not documented as using Sovren/Textkernel/DaXtra. third-party connectors (Parseur, HrFlow.ai) exist for organizations that want to supplement or replace the built-in parsing.

**text extraction:**
- reads text-based PDFs and DOCX files natively
- **DOCX is preferred** over PDF for cleaner parsing. multiple sources confirm DOCX parses more reliably, especially with complex layouts
- scanned/image-only PDFs are rejected outright or silently fail
- file size should stay under 2MB

**layout handling:**
- **multi-column layouts:** content is read linearly left-to-right, top-to-bottom. two-column resumes cause content from both columns to merge on the same line, producing garbled output
- **tables:** scramble job chronology and company associations. data gets interleaved incorrectly
- **headers/footers:** content placed in document headers/footers is **skipped entirely**. if your name and contact info live there, Workday won't see it
- **images/graphics:** completely ignored. pie charts, photos, icon-based skill bars, logos are all invisible to the parser
- **text boxes:** treated similarly to images in many cases; content may be skipped
- **non-standard fonts/decorative bullets:** can render as gibberish in parsed output

**field extraction:**
- extracts contact info, work experience (company, title, dates), education, and some skills
- **skills are NOT reliably parsed** from standalone skills sections. skills mentioned in experience bullet points are more reliably captured
- date format preference: **MM/YYYY**. non-standard formats like "2022-Present" or "January 2022" can cause incorrect tenure calculation
- non-standard section headings (e.g., "My Journey" instead of "Work Experience") reduce parsing accuracy significantly

**stat:** approximately 30% of applications are flagged as "unparseable" due to formatting errors ([source](https://ghostrez.com/blog/workday-resume-parsing/))

### 1.2 Keyword Matching Strategy

**base behavior:** Workday's native search is primarily **keyword-based**. recruiters search the parsed candidate database using keywords from the job description.

**matching type:** exact keyword matching at the base level. the system does not natively handle synonyms, abbreviations, or acronyms well without the HiredScore AI layer.

**best practice for candidates:** include both acronyms AND full terms (e.g., "CPA (Certified Public Accountant)") because the base search may not link them.

### 1.3 Scoring/Ranking Algorithm

**native Workday:** Workday's base recruiting module does **not** assign an automated match score or percentage ranking to candidates. candidates appear in the order they applied.

**HiredScore AI for Recruiting (acquired 2024):** this is where the real scoring happens for organizations that enable it.

- uses **proprietary ML (not generative AI)** deliberately for explainability and auditability
- analyzes candidate profiles against job requirements using **semantic relationship mapping**: clusters of related concepts score higher than repeated single keywords. e.g., mentioning "cross-functional collaboration," "stakeholder alignment," and "delivery optimization" together scores better than repeating "project management" five times
- provides transparent scoring with visible reasoning behind each candidate's rank
- scores candidates on **role relevance** and **historical performance signals** (what successful hires for similar roles looked like)
- **rediscovery:** can surface previously rejected candidates from the applicant pool who might fit new openings
- each candidate is scored only on criteria listed in the job requisition

**important:** HiredScore is an add-on. not all Workday customers use it. without it, there is no automated scoring.

### 1.4 Filtering Behavior

**what causes filtering out:**
- unparseable resume format (image PDF, complex graphics, broken encoding)
- missing contact information (especially if in header/footer)
- knockout questions: Workday supports configurable screening questions that can auto-disqualify
- recruiter keyword searches that don't match resume content

**no auto-reject on content:** Workday itself doesn't auto-reject based on keyword score. filtering happens through (a) parse failures and (b) recruiter manual/keyword search behavior.

### 1.5 Known Quirks and Limitations

- **skills section ignored:** Workday will not parse a standalone skills list. skills must appear contextually in experience sections
- **"Autofill with Resume" is unreliable:** candidates report it frequently misfills fields even with well-formatted resumes
- **date parsing is fragile:** mixed date formats within one resume reduce "timeline confidence" and can miscalculate tenure
- **creative headings fail:** "Professional Journey" instead of "Experience" will be missed
- **widely hated UX:** Workday's application process is notoriously painful for candidates. Blind (Teamblind) threads regularly call it "the most abysmal resume parsing technology"
- **manual re-entry required:** even with resume upload, candidates typically must re-enter work history manually

### 1.6 AI/ML Features

| feature | technology | status |
|---------|-----------|--------|
| HiredScore AI for Recruiting | proprietary ML (no GenAI), semantic matching | available since 2024 acquisition |
| candidate rediscovery | ML-based "fetch" feature scanning past applicant pools | active |
| recruiter AI coach | AI-powered guidance for recruiters | active |
| resume parsing | rule-based/proprietary (not ML-heavy) | built-in |

**sources:**
- [Workday ATS Guide 2025](https://www.atshiring.com/en/learn/workday-ats-guide-2025)
- [Workday Resume Parsing](https://ghostrez.com/blog/workday-resume-parsing/)
- [Workday HiredScore](https://www.suretysystems.com/insights/workday-hiredscore-revolutionizing-talent-acquisition-and-management-with-ai/)
- [HiredScore Fair AI](https://www.hiredscore.com/fair-ai-for-hr)
- [Diginomica: Workday AI Launch](https://diginomica.com/workday-launches-new-ai-capabilities-hiring-and-talent-management-following-hiredscore-acquisition)
- [Teal: Workday Resume](https://www.tealhq.com/post/workday-resume)
- [Resumly: Workday ATS](https://www.resumly.ai/blog/how-to-tailor-resumes-for-workday-ats-specifically)

---

## 2. Oracle Taleo

### 2.1 Parsing Behavior

**parser engine:** Taleo uses a **proprietary parsing algorithm**. it is not publicly documented as using Sovren or Textkernel natively. however, Oracle Recruiting Cloud (the successor to Taleo) can integrate with Textkernel and RChilli for enhanced parsing. Taleo's built-in parser uses **OCR** to convert uploaded files to text.

**text extraction:**
- accepts PDF and Word documents
- uses OCR to convert documents, meaning it's attempting character recognition rather than direct text extraction
- strips HTML tags, special characters, and certain fonts during processing

**layout handling:**
- graphics, charts, and images cannot be read at all
- fancy fonts, colored text, and elaborate bullet points cause parsing errors
- the parser is described as "notoriously picky" with formatting
- known failure: dates placed before employer names caused entire work experience sections to be lost
- known failure: multiple degrees were not parsed, making it appear the candidate had no education

**field extraction:**
- extracts job experience, education, skills, and contact information
- pre-populates application fields from parsed data
- can parse from email, uploaded files, and job board submissions

### 2.2 Keyword Matching Strategy

**matching type:** **literal keyword matching** at the base level. Taleo's native search is not intelligent about variants.

**critical limitation:** Taleo **cannot** natively recognize:
- plural vs. singular ("project manager" vs. "project management" are different)
- abbreviations vs. full terms ("CPA" vs. "Certified Public Accountant" are different)
- tense variations ("managed" vs. "managing")
- related terms or synonyms

**however:** Taleo's documentation notes that because machine learning is used in some newer features, "the terms don't have to be an exact match for the feature to find similarities in data." this appears to apply to the newer Oracle Recruiting Cloud "Suggested Candidates" feature rather than legacy Taleo keyword search.

**boolean search:** recruiters can use boolean operators to search the candidate database. percentage matching shows which and how many keywords appear in each resume.

### 2.3 Scoring/Ranking Algorithm

Taleo is **the most score-heavy ATS** among the six. it has a detailed, configurable prescreening and ranking system:

**ACE (Ace Candidate) prescreening system:**

the system classifies candidates into three tiers:

| tier | definition |
|------|-----------|
| **ACE candidates** | meet ALL required criteria + some/all asset criteria |
| **minimally qualified** | meet ALL required criteria but NO asset criteria |
| **other candidates** | do NOT meet all required criteria |

**scoring components:**

1. **disqualification questions:** single-answer questions with minimum requirements. wrong answer = **instant automatic rejection**. candidate is exited from the process immediately. these are the true "knockout" questions.

2. **prescreening questions:** multi-answer questions scored as:
   - **Required:** must be met (binary pass/fail)
   - **Asset:** nice-to-have, distinguishes candidates (scored)
   - **Weight:** numerical value giving more consideration to certain answers

3. **competencies:** evaluated on:
   - proficiency level (None / Beginner / Intermediate / Advanced / Expert)
   - years of experience (None / <1yr / 1-3yr / 3-5yr / 5yr+)
   - last used (Never / Current / Last Year / 1-3yr ago / 3-5yr ago)
   - interest level (None / Low / Medium / High)

**weight calculation:**
- points are assigned to answers and converted to percentages
- Result % = (points earned / total possible points) x 100
- example: if a candidate earns 6 out of 8 possible weighted points = 75%
- weights normalize to 100% automatically

**ACE alert:** configurable threshold triggers. can be set by:
- percentage threshold (e.g., "candidates achieving >= 75% result")
- asset count (e.g., "candidates with >= 3 of 5 assets")
- or both conditions combined (AND/OR logic)

**Oracle Recruiting Cloud "Suggested Candidates":** the newer ORC platform scores candidates on four criteria with 0-3 stars each:
- **Profile:** title and description match to requisition
- **Education:** degree level match
- **Experience:** relevant experience match
- **Skills:** skills alignment

### 2.4 Filtering Behavior

**what causes filtering out:**
- **disqualification questions:** wrong answer = instant, automatic exit from the process. this is the hardest filter in any ATS
- **Required criteria not met:** if any Required prescreening question is failed, candidate drops below ACE and minimally qualified tiers
- **keyword search misses:** literal matching means missing exact terms from the job description makes candidates invisible to recruiter searches
- format/parsing failures

**important:** Taleo is one of the few systems that genuinely auto-rejects candidates through its disqualification question mechanism. this is not just "sorting" but actual removal from consideration.

### 2.5 Known Quirks and Limitations

- **literal keyword matching** is the #1 complaint. "project manager" and "project management" are treated as entirely different terms
- **abbreviation blindness:** "CPA" and "Certified Public Accountant" don't match
- **date-position sensitivity:** putting dates before employer names has caused entire experience sections to vanish
- **formatting destruction:** Taleo strips formatting aggressively. recruiters report spending 15+ minutes per job description reformatting after paste
- **legacy system feel:** widely regarded as outdated. Oracle is actively migrating customers to Oracle Recruiting Cloud
- **duplicate profiles:** candidates who apply multiple times may create duplicate profiles that fragment their application history
- **req rank visibility:** the percentage match score is visible to recruiters, meaning a low % can cause immediate dismissal even if the candidate is qualified

### 2.6 AI/ML Features

| feature | technology | status |
|---------|-----------|--------|
| ACE prescreening | rule-based scoring with configurable weights | legacy, active |
| disqualification questions | rule-based auto-reject | legacy, active |
| Suggested Candidates (ORC) | ML-based 4-criteria star scoring | newer ORC platform |
| keyword search | literal matching with boolean operators | legacy |

**sources:**
- [Oracle Taleo Prescreening Documentation](https://docs.oracle.com/en/cloud/saas/taleo-enterprise/21b/otrec/candidate-prescreening.html)
- [Oracle Taleo Disqualification Questions](https://docs.oracle.com/en/cloud/saas/taleo-enterprise/21c/otfru/t-createdusqualificationquestioninlibrary.html)
- [Jobscan: Taleo Ranking](https://www.jobscan.co/blog/taleo-popular-ats-ranks-job-applications/)
- [JobTestPrep: Taleo](https://www.jobtestprep.com/taleo-applicant-tracking-system)
- [FlyRank: Taleo Plurals](https://www.flyrank.com/blogs/seo-hub/does-taleo-recognize-plural-versions-of-keywords)
- [Hireflow: Taleo Formatting](https://www.hireflow.net/blog/taleo-resume-formatting-rules)
- [Textkernel: ORC Parsing](https://www.textkernel.com/learn-support/blog/oracle-recruiting-cloud-resume-parsing/)

---

## 3. iCIMS

### 3.1 Parsing Behavior

**parser engine:** iCIMS uses **HireAbility's ALEX parser** (Automated Linguistic EXpert). iCIMS acquired HireAbility, and the parser is now integrated into the iCIMS Talent Cloud. additionally, iCIMS offers its own tool called **iResume**.

**ALEX parser details:**
- grammar-based parser that assigns meaning to terms based on **context**, not just pattern matching
- uses NLP techniques and pattern recognition with proprietary semantic parsing algorithms
- parses resumes in **50+ languages and dialects**, including multi-language resumes
- outputs structured data in HR-XML and JSON formats

**iResume capabilities:**
- accepts resumes in virtually any format: Word, Text, Rich-Text, HTML, TIF, PDF
- accepts from virtually any source: email, fax, job boards, direct upload
- can accept and parse e-fax and scanned resumes (unlike most systems)

**layout handling:**
- reads left-to-right; columns can cause data loss (though newer versions may handle simple columns better)
- text-based PDFs work, scanned images are generally ignored
- headers/footers may not be read for contact information
- handles Word documents better than PDFs overall

**field extraction:**
- contact information, skills, education, work history
- can profile candidates by skill matching
- auto-tags candidates to appropriate jobs
- uses a keyword-density algorithm and a section-recognition engine that favors clean headings, simple fonts, and standard bullet styles

### 3.2 Keyword Matching Strategy

**matching type:** **semantic AI matching** (evolved beyond pure keyword matching)

- modern iCIMS AI uses **semantic relationships** to uncover talent, not just keyword matching
- analyzes related skills, experiences, and qualities of past successful hires
- ensemble AI methodology trained across 4,000+ customers and hundreds of millions of data points
- covers job openings, applications, and hires for training data

**candidate ranking:**
- AI-based "Role Fit" algorithm matches applicant skills/experience to job requirements
- automatically assigns a **compatibility score** to indicate candidate-job alignment
- surfaces top candidates based on this score

### 3.3 Scoring/Ranking Algorithm

**AI candidate ranking:**
- uses an ensemble ML approach (multiple models working together)
- learns from employer and job-seeker activity across the iCIMS customer base
- assigns compatibility scores per role
- categorizes candidates into talent pools by: role, skills, location, education
- analyzes past applicants within pools to find matches for new openings

**factors considered:**
- skills alignment to job requirements
- experience relevance
- education match
- location
- historical hiring patterns (what successful hires looked like)

### 3.4 Filtering Behavior

**what causes filtering out:**
- resume parsing failure (image-only files, heavily formatted documents)
- missing contact information
- recruiter keyword searches that return no matches
- low compatibility scores may push candidates below visible thresholds
- configurable screening questions can filter candidates

**no documented auto-reject on score alone:** the AI ranking is designed as a sorting/prioritization tool. humans make final decisions.

### 3.5 Known Quirks and Limitations

- **UI complexity:** recruiters report the interface requires "so many clicks" to reach candidate profiles, with "overwhelming amount of features"
- **reporting difficulties:** pulling reports and extracting data is reportedly very difficult
- **training overhead:** significant training required for recruiters and hiring managers
- **PDF quirks:** the resume PDF reader is described as "a little quirky"
- **customization limits:** reported limitations in customization and reporting capabilities
- **technical disruptions:** platform can experience technical issues that disrupt recruitment flow

### 3.6 AI/ML Features

| feature | technology | status |
|---------|-----------|--------|
| ALEX resume parser | NLP + pattern recognition + semantic parsing | active (acquired HireAbility) |
| candidate ranking | ensemble ML, Role Fit algorithm | active |
| AI talent matching | semantic relationship analysis | active |
| talent pool categorization | ML-based classification | active |
| bias auditing | certified against TrustArc Responsible AI criteria | audited 2022, 2023 (NYC AEDT law compliant) |

**responsible AI note:** iCIMS identified its Candidate Ranking as an "Automated Employment Decision Tool" (AEDT) under NYC's bias-audit law and commissioned independent audits with favorable results.

**sources:**
- [iCIMS: CV/Resume Parsing](https://www.icims.com/blog/what-is-cv-resume-parsing/)
- [iCIMS AI Talent Explorer](https://community.icims.com/s/article/Understanding-iCIMS-Talent-Cloud-AI)
- [iCIMS AI Recruiting Software](https://www.icims.com/products/ai-recruiting-software/)
- [HireAbility ALEX Parser](https://www.hireability.com/products/)
- [Jobscan: iCIMS](https://www.jobscan.co/blog/icims-ats/)
- [iCIMS AI Candidate Screening Comparison](https://integralrecruiting.com/ai-candidate-screening-how-does-icims-compare/)
- [HR.com: iCIMS Parsing](https://www.hr.com/buyersguide/product/view/icims_inc_resume_parsing_and_processing)

---

## 4. Greenhouse

### 4.1 Parsing Behavior

**parser engine:** Greenhouse uses **in-house ML models** for resume parsing, supplemented by **OpenAI** for certain extraction tasks. it does NOT use Sovren/Textkernel natively, though integration connectors exist.

**technical architecture:**
- uses "a series of fine-tuned LLM models, each one trained for a specific extraction task" (modular approach)
- integrates with OpenAI (under a DPA that prohibits OpenAI from using the data for training)
- internal ML and LLM models are trained on anonymized/aggregated customer data
- generative AI has been added to the parsing process (launched 2024)

**text extraction:**
- parses both Word and PDF documents
- cannot parse images at all (Jon Stross, co-founder, confirms this directly)
- image uploads may cause application errors

**field extraction:**
- skills
- job titles
- years of experience
- employment start/end dates
- company names from employment history
- derived industry classifications

**layout handling:** standard ATS constraints apply (single-column preferred, no graphics, standard headings), but the ML-based parser is more resilient than rule-based parsers.

### 4.2 Keyword Matching Strategy

**matching type:** **semantic matching with embedding representations**

- uses embedding representations of skills and job titles for semantic matching
- can recognize that "software engineer" and "web developer" are related to "software developer"
- provides highlighted resume terms showing both **exact matches** and **semantically similar matches**
- recruiter can still do manual keyword filtering/searching

**this is a significant difference from Taleo's literal matching.**

### 4.3 Scoring/Ranking Algorithm

**critical distinction: Greenhouse historically did NOT score candidates.** Jon Stross (co-founder) has explicitly stated: "Greenhouse doesn't have some magic AI that judges applicants." he believes computer-generated relevancy scores introduce bias.

**however, Greenhouse launched "Talent Matching" (2024-2025):**

this is an opt-in AI feature, not automatic scoring:

1. **calibration setup:** hiring team defines objective criteria (skills, experience, job titles, optional industry) and assigns weights to each criterion
2. **AI categorization:** candidates are sorted into match categories:
   - **Strong Match**
   - **Good Match**
   - **Partial Match**
   - **Limited Match**
   - **Needs Manual Review** (no resume or opted out of AI evaluation)
3. **transparency features:**
   - highlighted resume terms (exact match vs. semantic match)
   - short summary justifying match result
   - list of matched skills, missing skills, and extracted-but-unused skills
4. **fairness guardrails:**
   - blocks attempts to add biased/protected attributes (e.g., gender)
   - warns if a skill could serve as a proxy for a protected attribute
   - warns if a skill can't be parsed from the resume
   - AI categorization only visible during initial review (hidden later to prevent biasing interviewers)

**interview scorecards (human scoring):**
- Greenhouse's primary evaluation method is **structured scorecards**
- hiring managers create skill/trait checklists for each role
- each interviewer independently rates candidates on a 5-point scale
- scorecards must be submitted before interviewers can see each other's ratings (prevents bias)
- this is human scoring, not algorithmic scoring

### 4.4 Filtering Behavior

**what causes filtering out:**
- **NO automatic rejection based on AI score.** the system explicitly requires human intervention to advance, reject, or hire
- optional knockout questions (e.g., relocation willingness) can be configured
- recruiter keyword searches determine visibility
- unparseable resumes (images, broken formats) obviously can't be found via search

**Greenhouse is philosophically opposed to auto-reject.** this is a core product principle.

### 4.5 Known Quirks and Limitations

- **no native scoring (until Talent Matching):** this can be a pro (less bias) or con (more manual work for high-volume roles)
- **image resumes break completely:** no OCR, no fallback
- **450+ integrations:** some third-party integrations DO add scoring (Skima AI, Needle, etc.), so behavior varies by company
- **resume anonymization:** Greenhouse can anonymize resumes during early screening to reduce bias, which means some parsed data is intentionally hidden
- **talent matching is new:** still being adopted, not universally enabled

### 4.6 AI/ML Features

| feature | technology | status |
|---------|-----------|--------|
| resume parsing | fine-tuned LLMs (modular, task-specific) + OpenAI | active |
| talent matching | semantic embedding, calibrated match categories | launched 2024-2025 |
| resume anonymization | GenAI-enhanced | active |
| interview scorecards | human-driven, structured evaluation | core product |
| candidate search | semantic search with keyword support | active |

**sources:**
- [Greenhouse: Talent Matching Data Processing FAQ](https://support.greenhouse.io/hc/en-us/articles/41131616864283-Talent-Matching-Data-Processing-FAQ)
- [Greenhouse: Talent Matching FAQ](https://support.greenhouse.io/hc/en-us/articles/41131886674075-Talent-Matching-FAQ)
- [Greenhouse AI/ML Security & Privacy](https://support.greenhouse.io/hc/en-us/articles/24315491395227-AI-ML-Security-Privacy)
- [Greenhouse: Embracing AI](https://www.greenhouse.com/blog/embracing-ai-in-our-hiring-software)
- [Briefcase Coach: Jon Stross Interview](https://www.briefcasecoach.com/how-an-applicant-tracking-system-works-interview-greenhouse-founder-jon-stross/)
- [Axios: How to Get Hired (Greenhouse)](https://www.axios.com/2024/04/11/how-to-get-hired-new-job-greenhouse)
- [Greenhouse Scorecard Overview](https://support.greenhouse.io/hc/en-us/articles/4414777492891-Scorecard-overview)

---

## 5. Lever

### 5.1 Parsing Behavior

**parser engine:** Lever uses its own **built-in parser**. the specific engine is not publicly documented as Sovren/Textkernel, though Textkernel lists pre-built connectors for Lever. the parser appears to be proprietary.

**text extraction:**
- parses PDF and Word documents
- extracts parseable information into corresponding database fields
- cannot parse images in resumes
- handles text-based content reasonably well

**layout handling:**
- **can parse columns and tables** (unlike many competitors), though formatting can be affected
- works best with proper column formatting in Word/Google Docs
- tables "might not be parsed correctly" in all cases
- images, graphics, and non-standard characters cause missing information
- best results with simple, single-column, left-aligned layouts

**this is notable: Lever is more tolerant of columns/tables than most ATS systems, though results are imperfect.**

### 5.2 Keyword Matching Strategy

**matching type:** **keyword matching with word stemming** (a meaningful differentiator)

**word stemming:**
- Lever's search algorithm supports word stemming, meaning it recognizes word variants
- searching for "collaborating" will also match "collaborate," "collaboration," "collaborated"
- this gives Lever higher keyword search accuracy compared to systems like Taleo

**limitations:**
- **cannot identify abbreviations.** "CPA" and "Certified Public Accountant" are still different searches
- pulls keywords from any parseable content in candidate profiles (not just specific sections)

### 5.3 Scoring/Ranking Algorithm

**Lever does NOT score or rank candidates against job descriptions.**

this is a fundamental architectural choice:
- no automated match score
- no percentage ranking
- no candidate-to-job-description matching
- candidates are not automatically sorted by relevance

**how recruiters find candidates instead:**
- manual keyword searches through the candidate database
- filtering by job title, years of experience, skills, education, location
- "fast resume review" feature for quickly scanning applications
- move forward, skip, or archive decisions are all manual

### 5.4 Filtering Behavior

**what causes filtering out:**
- recruiter keyword searches that miss the candidate's resume (the primary filter)
- unparseable resume content (images, complex formatting)
- Lever does NOT auto-reject candidates based on algorithms
- no documented knockout question system (screening is more manual)

**the main risk with Lever is invisibility, not rejection.** if a recruiter searches for "Python" and your resume says "python programming" the stemming should catch it. but if they search "AWS" and you wrote "Amazon Web Services," you're invisible.

### 5.5 Known Quirks and Limitations

- **no AI-powered resume screening:** lacks the advanced ML features of iCIMS or Workday+HiredScore
- **abbreviation blindness:** despite word stemming, abbreviations vs. full terms don't match
- **table parsing is inconsistent:** sometimes works, sometimes doesn't, depending on how the table was constructed
- **simple is better:** complex bullet styles, graphics, and non-standard characters break parsing
- **no match score means recruiter behavior matters more:** the quality of the recruiter's search queries is the primary determinant of who gets seen

### 5.6 AI/ML Features

| feature | technology | status |
|---------|-----------|--------|
| resume parsing | built-in parser (proprietary) | active |
| keyword search | word stemming (not full NLP) | active |
| fast resume review | UI feature for rapid scanning | active |
| AI/ML scoring | **none** | not available |

**Lever is the least AI-heavy of the six systems studied.** it's primarily a well-designed CRM/ATS hybrid that relies on human judgment rather than algorithmic scoring.

**sources:**
- [Jobscan: Lever ATS](https://www.jobscan.co/blog/lever-ats/)
- [Lever: Understanding Resume Parsing](https://help.lever.co/hc/en-us/articles/20087345054749-Understanding-Resume-Parsing)
- [Resumly: Lever ATS](https://www.resumly.ai/blog/how-to-tailor-resumes-for-lever-ats-specifically)

---

## 6. SAP SuccessFactors

### 6.1 Parsing Behavior

**parser engine:** **Textkernel** (confirmed in SAP documentation). this is the only system of the six where the third-party parser is explicitly documented.

**Textkernel capabilities:**
- processes 2+ billion resumes and job postings annually
- supports 29 languages (SAP limits to 15: Dutch, English, German, French, Spanish, Swedish, Danish, Polish, Romanian, Italian, Slovak, Czech, Russian, Portuguese, Chinese)
- over 95% accuracy for critical data points with standard parser; LLM parser reduces remaining errors by up to 30%

**text extraction:**
- text-based PDFs and Word documents
- **scanned/image PDFs do NOT parse** (explicitly documented as a known limitation)
- resumes submitted via API are NOT parsed
- agency-submitted candidate resumes are NOT parsed

**field extraction:**
- previous work experience
- current employer
- contact address
- education
- skills, certifications, licenses, job titles, locations (with RChilli integration)

**critical configuration requirements:**
- parsing works best when the customer's configuration has the **profile before the application** in the flow
- customers must complete a **standardization mapping** exercise to map parsed fields to their system fields
- **picklist fields do NOT work** with resume parsing (system expects option ID, not label)
- background fields already populated will NOT be overwritten by parsing

### 6.2 Keyword Matching Strategy

**base SuccessFactors:** standard keyword-based search with recruiter-driven queries.

**AI-powered matching (with AI Units license):**
- AI Skills Matching shows applicant skills vs. job required skills
- semantic understanding of skill relationships
- can recommend roles to candidates by matching extracted skills to open jobs

### 6.3 Scoring/Ranking Algorithm

**stack ranking (AI Units license required):**
- applicants are automatically sorted from **best fit to least fit** based on job requirements and skills framework
- Joule (SAP's AI assistant) powers: skills extraction, candidate-job matching, stack ranking, interview question generation

**scoring factors:**
- skills alignment with job description
- experience relevance
- education match
- uses the organization's skills framework as the reference taxonomy

**AI-generated interview insights:**
- generates comprehensive candidate assessments from interview feedback
- incorporates ratings, skill/competency remarks, interviewer notes, and recommendations

### 6.4 Filtering Behavior

**what causes filtering out:**
- resume parsing failure (scanned PDF, API submission, agency submission)
- Mobile Apply parsing issues (does not work 100% when Mobile Apply is enabled)
- picklist mapping failures (common configuration issue)
- missing standardization mapping = no parsed data at all
- recruiter keyword searches

### 6.5 Known Quirks and Limitations

- **Mobile Apply breaks parsing:** resume parsing "does not work 100% when Mobile Apply is enabled." it only parses background elements when background fields are empty
- **picklist field incompatibility:** a major gotcha. if a field uses a picklist, parsing expects the option ID, not the human-readable label. this causes silent failures
- **LinkedIn Apply conflicts:** when "Apply with LinkedIn" and resume parsing are both configured, some application fields get erased or overwritten
- **API-submitted resumes aren't parsed:** integrations that push resumes via API bypass the parser entirely
- **agency candidates excluded:** resumes submitted by agencies to job requisitions are not parsed
- **pre-populated fields skipped:** if a field already has data, the parser won't update it. this means the first data in wins, even if it's wrong
- **Textkernel dependency:** some users have reported systemic issues related to the Textkernel parsing vendor, including upload failures affecting multiple companies simultaneously
- **language limitations:** only 15 of Textkernel's 29 supported languages are enabled

### 6.6 AI/ML Features

| feature | technology | status |
|---------|-----------|--------|
| resume parsing | Textkernel (third-party) | active |
| stack ranking | SAP Joule AI, skills-based | available with AI Units license |
| skills matching | AI-powered semantic matching | available with AI Units license |
| candidate-job matching | ML-based recommendation engine | available with AI Units license |
| interview question generation | generative AI | available with AI Units license |
| interview insight generation | generative AI summarization | available with AI Units license |

**sources:**
- [SAP: Configuring Resume Parsing](https://help.sap.com/docs/successfactors-recruiting/setting-up-and-maintaining-sap-successfactors-recruiting/configuring-resume-parsing)
- [SAP: Working with Resume Parsing](https://help.sap.com/docs/SAP_SUCCESSFACTORS_RECRUITING/8477193265ea4172a1dda118505ca631/07b6d03076a149b78f4f7a615e3025fd.html)
- [Diokles: SAP AI Features](https://diokles.de/en_us/sap-ai-fatures-for-successfactors-recruiting/)
- [TalentTeam: AI Skill Matching](https://talenteam.com/blog/how-ai-powered-skill-matching-in-sap-successfactors-is-transforming-recruitment/)
- [SAP Community: AI-Assisted Screening](https://community.sap.com/t5/human-capital-management-blog-posts-by-members/getting-ready-for-ai-assisted-applicant-screening-in-sap-successfactors/ba-p/14200871)
- [SAP 2H 2024 Release](https://news.sap.com/2024/10/sap-successfactors-2h-2024-product-release/)
- [RChilli: SuccessFactors](https://www.rchilli.com/blog/how-rchilli-strengthens-sap-successfactors-recruitment-processes)

---

## 7. Third-Party Parsers Reference

### Parser Landscape

the major resume parsing engines used across the ATS industry:

| parser | owner | notable clients | languages | annual volume |
|--------|-------|----------------|-----------|--------------|
| **Textkernel** (+ Sovren) | Textkernel (acquired Sovren 2022) | SAP SuccessFactors, Adecco, Manpower, Randstad | 29 languages | 2B+ resumes/year |
| **HireAbility (ALEX)** | iCIMS (acquired) | iCIMS Talent Cloud, various independent apps | 50+ languages | not disclosed |
| **DaXtra** | DaXtra Technologies | Bullhorn | 150+ data fields | not disclosed |
| **RChilli** | RChilli | SAP SuccessFactors (add-on), Oracle Recruiting Cloud | 40+ languages | not disclosed |
| **Sovren** | Textkernel (merged) | CareerBuilder, Monster | 29 languages | merged with Textkernel |

### Key Technical Facts

**Textkernel/Sovren:**
- standard parser: 95%+ accuracy on critical data points
- LLM parser (powered by GPT-3.5): reduces remaining errors by up to 30%
- all parsing done in-memory (no data written to filesystem)
- outputs HR-XML and JSON
- supports HTTP POST and SOAP methods
- pre-built connectors for Greenhouse, Lever, Workday, and many others

**HireAbility ALEX:**
- grammar-based parsing (assigns meaning via context)
- NLP + pattern recognition + proprietary semantic algorithms
- 50+ languages including multi-language documents
- outputs HR-XML and JSON

**DaXtra:**
- 150+ data fields extracted
- cloud-based with candidate management features
- strong in staffing/recruitment agency market (Bullhorn integration)

### Which Systems Use Which Parsers

| ATS | primary parser | confirmed source |
|-----|---------------|-----------------|
| **Workday** | proprietary (undisclosed) | not publicly documented |
| **Taleo** | proprietary (undisclosed) | not publicly documented |
| **iCIMS** | HireAbility ALEX (acquired) | publicly documented |
| **Greenhouse** | in-house ML models + OpenAI | publicly documented |
| **Lever** | proprietary (undisclosed) | not publicly documented |
| **SuccessFactors** | Textkernel | officially documented by SAP |

---

## 8. Cross-System Patterns

### Universal Parsing Failures

these break ALL six systems:

1. **image-only/scanned PDFs:** no system handles these well. some silently fail, others reject outright
2. **content in headers/footers:** most parsers skip header/footer zones entirely
3. **graphics, charts, logos, photos:** universally invisible to parsers
4. **non-standard fonts:** can produce garbled output
5. **complex tables:** scramble data ordering in most systems

### Scoring Spectrum

from most automated scoring to least:

```
most automated                                         least automated
    |                                                         |
  Taleo  >  SuccessFactors  >  iCIMS  >  Workday*  >  Greenhouse  >  Lever
  (ACE +     (stack rank      (Role Fit   (*with        (Talent        (no
  req rank   with AI Units)   algorithm)  HiredScore)   Matching,      scoring)
  + disqual                                             opt-in)
  questions)
```

*Workday only scores if HiredScore is enabled. without it, Workday sits closer to Lever on this spectrum.

### Keyword Matching Sophistication

from most literal to most semantic:

```
most literal                                           most semantic
    |                                                         |
  Taleo  >  Lever  >  Workday(base)  >  SuccessFactors  >  Greenhouse  >  iCIMS
  (exact     (stemming  (keyword          (AI skills        (embedding    (ensemble ML
  match      but no     only)             matching          semantic      semantic
  only)      abbrevs)                     with AI Units)    matching)     relationships)
```

### Auto-Reject Capability

| system | can it auto-reject candidates? | mechanism |
|--------|-------------------------------|-----------|
| Taleo | **YES** | disqualification questions = instant exit |
| Workday | configurable | knockout questions (optional) |
| SuccessFactors | configurable | screening questions (optional) |
| iCIMS | no evidence of auto-reject | AI is advisory only |
| Greenhouse | **NO** (by design) | human decision required at every step |
| Lever | **NO** | no automated screening |

### File Format Recommendations

| system | best format | notes |
|--------|------------|-------|
| Workday | DOCX | DOCX preferred over PDF explicitly |
| Taleo | DOCX or simple PDF | OCR-based, keep it simple |
| iCIMS | Word | handles Word better than PDF |
| Greenhouse | Word or PDF | both work, can't do images |
| Lever | simple format | works with both, keep it clean |
| SuccessFactors | text-based PDF or DOCX | scanned PDFs explicitly fail |

### Implications for ATS Scoring Prompts

based on this research, scoring prompts should account for:

1. **Taleo is the strictest system.** it's the only one that genuinely auto-scores AND auto-rejects. prompts targeting Taleo should weight exact keyword matching heavily and penalize missing terms.

2. **Greenhouse is the most human-dependent.** scoring prompts for Greenhouse should focus on how well a resume communicates to a human reviewer (since that's who decides), with secondary weight on keyword presence for searchability.

3. **iCIMS has the most sophisticated AI.** scoring prompts should consider semantic relationships, not just exact keywords.

4. **Lever's word stemming matters.** prompts can be slightly more forgiving of word variations but should still penalize missing abbreviations/acronyms.

5. **Workday behavior depends entirely on whether HiredScore is enabled.** prompts should probably score for both scenarios (keyword-only and semantic).

6. **SuccessFactors' Textkernel parser is well-documented and reliable.** the main risks are configuration issues (picklists, mapping) rather than parser quality.

7. **across all systems:** single-column, standard headings, text-based PDFs or DOCX, no graphics, include both acronyms and full terms for critical credentials.
