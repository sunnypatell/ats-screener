// prompt templates for multi-provider LLM scoring
// these prompts are built on real ATS platform research (see /research/)
// they encode actual documented parsing, matching, and scoring behavior

export function buildFullScoringPrompt(resumeText: string, jobDescription?: string): string {
	const resumeSlice = resumeText.slice(0, 6000);
	const jdSlice = jobDescription?.slice(0, 4000);

	const jdSection = jdSlice
		? `
<JOB_DESCRIPTION>
${jdSlice}
</JOB_DESCRIPTION>

MODE: targeted scoring. match the resume against this specific job description. extract required and preferred skills from the JD. keyword match scores must reflect actual overlap between resume content and JD requirements.`
		: `
MODE: general ATS readiness. no job description provided. evaluate formatting, structure, and professional keyword density for general ATS compatibility across industries. assess how well this resume would parse and surface in recruiter keyword searches for roles matching the candidate's apparent experience level and field.`;

	return `You are a senior talent acquisition technology analyst who has worked hands-on with all 6 of these enterprise ATS/HCMS platforms. You understand their internal parsing engines, matching algorithms, and scoring mechanisms from real implementation experience and official documentation.

Your job: analyze the resume below from the perspective of each platform's ACTUAL behavior. Not generic ATS advice. Not made-up numbers. Real, differentiated analysis grounded in how these systems work.

<RESUME>
${resumeSlice}
</RESUME>
${jdSection}

---

## PLATFORM SPECIFICATIONS (from documented behavior)

### 1. WORKDAY RECRUITING (37.1% of Fortune 500)

PARSER: proprietary, not publicly documented as using Textkernel/Sovren. DOCX preferred over PDF. ~30% of applications flagged as unparseable due to formatting.

WHAT BREAKS PARSING:
- multi-column layouts: content merges from both columns into same line, producing garbled output
- tables: scramble job chronology and company associations
- headers/footers: content placed there is SKIPPED ENTIRELY (name/contact info in header = invisible)
- images, graphics, skill bars, logos: completely ignored
- text boxes: may be skipped entirely
- non-standard fonts/decorative bullets: can render as gibberish
- CRITICAL: skills sections are NOT reliably parsed. skills must appear in experience bullet points to be captured
- non-standard section headings (e.g., "My Journey" instead of "Work Experience") reduce accuracy significantly
- date format preference: MM/YYYY. non-standard formats cause incorrect tenure calculation

MATCHING: base system is keyword-only. HiredScore (acquired 2024) adds semantic ML matching with relationship clusters. mentioning "cross-functional collaboration," "stakeholder alignment," and "delivery optimization" together scores better than repeating "project management" five times.

SCORING: no native scoring without HiredScore. with it, candidates get transparent, explainable AI scores based on role relevance and historical hiring signals. without it, candidates appear in application order and are found via keyword search.

AUTO-REJECT: only through configurable knockout questions. no auto-reject on content alone.

### 2. ORACLE TALEO (legacy enterprise, being sunset for ORC)

PARSER: proprietary OCR-based engine. notoriously fragile. strips HTML, special characters, certain fonts. known failure: dates before employer names caused entire experience sections to vanish.

WHAT BREAKS PARSING:
- graphics, charts, images: cannot be read at all
- fancy fonts, colored text, elaborate bullet points: cause parsing errors
- date-position sensitivity: dates placed before employer names has caused entire work experience sections to be lost
- multiple degrees sometimes not parsed (candidate appears to have no education)

MATCHING: LITERAL EXACT KEYWORD MATCH at base level. this is the #1 complaint. "project manager" and "project management" are treated as entirely different terms. "CPA" and "Certified Public Accountant" don't match. tense variations ("managed" vs "managing") don't match. the newer ORC platform has ML-based Suggested Candidates that CAN find similarities.

SCORING: THE MOST SCORE-HEAVY ATS. four mechanisms:
1. Req Rank: percentage score from keyword overlap (visible to recruiters - low % = immediate dismissal)
2. ACE prescreening: Required (must match) + Asset (nice-to-have) + Weight (numerical importance). candidates classified as ACE / minimally qualified / other
3. Competencies: scored on proficiency (None/Beginner/Intermediate/Advanced/Expert), years, recency, interest
4. Disqualification questions: INSTANT AUTOMATIC REJECTION. wrong answer = exited from process immediately

AUTO-REJECT: YES. disqualification questions cause instant, automatic exit. this is the hardest filter in any ATS.

### 3. iCIMS (10.7% overall market, #1 ATS by count)

PARSER: HireAbility ALEX (acquired). grammar-based NLP parser that assigns meaning based on CONTEXT, not just pattern matching. 50+ languages. keyword-density algorithm counts frequency AND placement. section-recognition engine favors clean headings, simple fonts, standard bullets.

MATCHING: ensemble ML trained across 4,000+ customers and hundreds of millions of data points. semantic relationship analysis, not just keywords. auto-generates skills list from full resume text (not just skills section). AI analyzes related skills, experiences, and qualities of past successful hires.

SCORING: Role Fit algorithm assigns compatibility scores. categorizes candidates into talent pools by role, skills, location, education. learns from employer and job-seeker activity across the entire iCIMS customer base.

AUTO-REJECT: no evidence of auto-reject on score alone. AI is advisory. humans make final decisions. NYC AEDT bias-audit compliant.

### 4. GREENHOUSE (popular with tech companies, mid-market)

PARSER: in-house fine-tuned LLM models (modular, task-specific) + OpenAI integration. most modern parser of the six. cannot parse images at all. extracts skills, job titles, years of experience, start/end dates, company names.

MATCHING: semantic embedding matching. recognizes that "software engineer" and "web developer" are related to "software developer." provides highlighted resume terms showing both exact matches and semantically similar matches. recruiter can do boolean keyword search with Required (AND) and Preferred (OR) logic.

SCORING: CRITICAL - Greenhouse historically did NOT score candidates. co-founder Jon Stross: "we don't have some magic AI that judges applicants." candidates appear in order they applied. NEW: Talent Matching (2024-2025) categorizes as Strong/Good/Partial/Limited Match with calibrated criteria and weights. but interview scorecards (human 5-point rating) remain the primary evaluation method.

AUTO-REJECT: NO, by design. human intervention required at every step. this is a core product principle. the biggest risk is the recruiter stopping after finding enough "pretty good" candidates from the first batch.

### 5. LEVER (by Employ, popular with startups)

PARSER: proprietary built-in parser. can parse columns and tables (unlike most competitors, though imperfectly). cannot parse images. best results with single-column, left-aligned layouts.

MATCHING: keyword search with word stemming. searching "collaborating" matches "collaborate," "collaboration," "collaborated." CANNOT identify abbreviations: "CPA" and "Certified Public Accountant" are different. "PM" won't match "Project Manager." pulls keywords from ALL parseable content.

SCORING: NO scoring or ranking whatsoever. no candidate-to-job matching. no automated screening. entirely dependent on recruiter search behavior. if the recruiter doesn't search for the right terms, qualified candidates are invisible.

AUTO-REJECT: NO automated screening at all. the least AI-heavy of all six.

### 6. SAP SUCCESSFACTORS (13.4% of Fortune 500)

PARSER: Textkernel (officially documented by SAP). 15 supported languages. processes 2B+ resumes/year. 95%+ accuracy on critical data points.

WHAT BREAKS PARSING:
- scanned/image PDFs: explicitly will NOT parse
- Mobile Apply: parsing "does not work 100%" when enabled
- picklist fields: system expects option ID not label, causes silent failures
- LinkedIn Apply: can erase/overwrite fields
- API-submitted and agency-submitted resumes: bypass parser entirely
- pre-populated fields: parser won't update them (first data wins)

MATCHING: base is keyword search. AI Skills Matching (with AI Units license) adds semantic skill-to-job alignment. Joule AI powers skills extraction, matching, and ranking.

SCORING: stack ranking from best-fit to least-fit with AI Units license. scoring factors: skills alignment, experience relevance, education match. uses organization's skills framework as reference taxonomy.

AUTO-REJECT: configurable screening questions. most filtering is through recruiter search behavior.

---

## SCORING INSTRUCTIONS

For each of the 6 systems, evaluate these dimensions:

**formatting** (0-100): how well this resume would parse through THIS system's specific parser
- Workday: penalize headers/footers for contact info, multi-column, tables, non-standard headings, skills-only sections (skills must be in experience bullets)
- Taleo: penalize any special formatting, graphics, non-standard fonts. MOST strict parser
- iCIMS: ALEX parser is more forgiving. penalize only major formatting issues
- Greenhouse: LLM-based parser is most modern/resilient. mainly penalize image-based content
- Lever: can handle some columns/tables. penalize images and non-standard characters
- SuccessFactors: Textkernel is solid. penalize scanned PDFs, image content

**keywordMatch** (0-100): ${jdSlice ? "how well resume keywords match the JD requirements, weighted by this platform's matching strategy" : "keyword density and professional terminology quality for the candidate's apparent field"}
- Taleo: ONLY count exact keyword matches. "project management" and "project manager" are DIFFERENT
- Lever: use word stemming (variations of same root word count). but abbreviations are separate terms
- iCIMS: semantic matching. related skills and contextual evidence count
- Greenhouse: embedding-based semantic matching. related terms are recognized
- Workday (base): keyword-only. (with HiredScore): semantic relationship clusters
- SuccessFactors: taxonomy normalization. "Software Engineer," "Application Developer," and "Backend Developer" map to same concept

**sections** (0-100): presence of standard parseable sections
- all systems: contact info, experience, education, skills are expected
- Workday specifically requires standard headings ("Experience", "Education", "Skills", "Certifications")
- certifications, projects, summary/objective are valued additions
- non-standard headings reduce scores on Workday and Taleo but not on Greenhouse/iCIMS

**experience** (0-100): quality and relevance of experience descriptions
- quantified achievements (numbers, percentages, metrics) - all systems value this
- action verbs at start of bullets
- recency weighting: recent experience matters more
- ${jdSlice ? 'relevance to the job description requirements' : 'depth and specificity of technical/professional content'}
- Taleo: competency proficiency levels matter (years, recency, skill level)

**education** (0-100): education completeness and relevance
- degree present and parseable
- field of study relevant to ${jdSlice ? 'the job requirements' : "the candidate's career path"}
- dates present and parseable
- GPA, honors if applicable

**overallScore** (0-100): weighted composite reflecting THIS platform's specific scoring philosophy
- Taleo: weight keyword match highest (it's the most keyword-dependent). education and experience scored independently with granular criteria. overall = weighted combination of all dimensions
- iCIMS: balance between AI semantic matching and keyword density. sections and formatting matter because the parser feeds the AI
- Workday (assume HiredScore enabled): semantic relationship clusters weight experience context heavily. formatting is critical because ~30% of resumes fail to parse
- Greenhouse: since it doesn't auto-score, the overall represents "likelihood of surfacing in recruiter keyword search and making it through initial human review." keyword presence for searchability + clear communication for human reader
- Lever: represents "likelihood of surfacing in recruiter keyword search." word stemming helps but abbreviation blindness hurts. formatting is less critical (more tolerant parser)
- SuccessFactors: Textkernel's scoring combines skills, titles, education, experience, industry. taxonomy normalization means related terms count

CRITICAL RULES:
- Scores MUST vary meaningfully between platforms. Taleo should almost always score differently from Greenhouse because they work fundamentally differently
- A well-formatted corporate resume should score highest on Workday/Taleo and potentially lower on Greenhouse (if it lacks clear communication value beyond keywords)
- A creative/modern resume should score lower on Taleo/Workday (parsing breaks) and higher on Greenhouse/Lever
- Taleo should have the widest score variation across dimensions because it computes granular independent scores
- Greenhouse scores should reflect human readability and keyword searchability, not algorithmic matching
- DO NOT give all systems similar scores. if you find yourself giving 70-80 to all six, you're doing it wrong
- ${jdSlice ? 'For targeted scoring: extract actual keywords from the JD. matched/missing keywords must be REAL terms from the JD, not made up' : "For general scoring: keywords should reflect industry-standard terminology for the candidate's apparent field"}
- each platform gets MAXIMUM 2 suggestions. total across all 6 should not exceed 8-10 unique tips. deduplicate similar advice across platforms
- suggestions must be specific and actionable. "add Kubernetes to your skills section" not "add more keywords"
- suggestions must reference the actual platform behavior. e.g., for Taleo: "include both 'PM' and 'Project Manager' because Taleo uses literal keyword matching"

**passesFilter thresholds** (reflects each platform's filtering philosophy):
- Taleo: true if overallScore >= 75 (strictest auto-scorer, visible Req Rank)
- Workday: true if overallScore >= 70 (strict parsing, knockout questions)
- SuccessFactors: true if overallScore >= 65 (stack ranking with AI, moderate)
- iCIMS: true if overallScore >= 60 (AI is advisory, not auto-reject)
- Greenhouse: true if overallScore >= 50 (no auto-filter by design, human review)
- Lever: true if overallScore >= 50 (no automated screening at all)

---

Respond ONLY with valid JSON matching this exact structure. no markdown fences, no explanation, no extra text before or after the JSON:

{
  "results": [
    {
      "system": "Workday",
      "vendor": "Workday Inc.",
      "overallScore": 75,
      "passesFilter": true,
      "breakdown": {
        "formatting": { "score": 80, "issues": ["specific issue for this platform"], "details": ["what the parser would do with this resume"] },
        "keywordMatch": { "score": 70, "matched": ["actual skills/terms found"], "missing": ["important terms not found"], "synonymMatched": ["terms matching semantically on platforms that support it"] },
        "sections": { "score": 85, "present": ["experience", "education", "skills"], "missing": ["summary"] },
        "experience": { "score": 75, "quantifiedBullets": 5, "totalBullets": 10, "actionVerbCount": 7, "highlights": ["notable strength"] },
        "education": { "score": 90, "notes": ["observation about education section"] }
      },
      "suggestions": ["specific actionable suggestion referencing this platform's actual behavior"]
    }
  ]
}

Return exactly 6 results in order: Workday, Taleo, iCIMS, Greenhouse, Lever, SuccessFactors.`;
}

export function buildJDAnalysisPrompt(jobDescription: string): string {
	return `You are a talent acquisition specialist. Analyze this job description and extract structured requirements. Be precise about what's required vs. preferred.

<JOB_DESCRIPTION>
${jobDescription.slice(0, 4000)}
</JOB_DESCRIPTION>

Respond ONLY with valid JSON, no markdown fences, no extra text:

{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill1", "skill2"],
  "experienceLevel": "entry/mid/senior/lead/executive",
  "yearsRequired": "number or range as stated, or 'not specified'",
  "educationRequirement": "specific degree requirement or 'not specified'",
  "industryContext": "industry name",
  "roleType": "engineering/sales/marketing/finance/healthcare/legal/operations/education/design/other",
  "keyResponsibilities": ["top 3-5 responsibilities"],
  "dealbreakers": ["any explicitly stated must-haves or disqualifiers"]
}

Rules:
- required = explicitly stated as required/must-have/minimum
- preferred = nice-to-have/preferred/bonus/ideally/plus
- extract skills using the EXACT terms from the JD (important for keyword matching)
- include both abbreviated and full forms if present (e.g., both "AWS" and "Amazon Web Services")
- dealbreakers = things that would cause auto-disqualification (clearance requirements, licenses, relocation, etc.)
- be specific about experience level based on years mentioned or seniority terms`;
}

export function buildSemanticMatchPrompt(
	resumeSkills: string[],
	jobDescription: string,
	resumeText: string
): string {
	return `You are an expert at identifying transferable skills and semantic equivalences that keyword matching would miss. This is critical because systems like Taleo use literal matching and miss qualified candidates.

<RESUME_SKILLS>
${resumeSkills.join(', ')}
</RESUME_SKILLS>

<RESUME_EXCERPT>
${resumeText.slice(0, 2500)}
</RESUME_EXCERPT>

<JOB_DESCRIPTION>
${jobDescription.slice(0, 3000)}
</JOB_DESCRIPTION>

Respond ONLY with valid JSON, no markdown fences:

{
  "semanticMatches": [
    {
      "jdRequirement": "requirement from job description",
      "resumeEvidence": "what in the resume demonstrates this capability",
      "matchType": "synonym/transferable/implied/contextual",
      "confidence": 0.8
    }
  ],
  "missingWithNoEvidence": ["JD requirements with zero evidence in resume"],
  "overallFit": "one sentence assessment of candidate-role alignment"
}

Rules:
- only include matches with confidence >= 0.6
- matchType explains HOW the match works:
  - synonym: same skill, different name ("CI/CD" = "continuous integration")
  - transferable: related skill that transfers ("Django" experience supports "Flask" requirements)
  - implied: skill demonstrated through work but not explicitly listed ("team leadership" implied by "led a team of 8")
  - contextual: skill evident from project/role context ("agile" implied by sprint-based development work)
- be conservative with confidence. 0.9+ = essentially the same skill. 0.7-0.8 = strong evidence. 0.6 = reasonable inference
- missingWithNoEvidence should only list truly absent capabilities, not things that might be inferred`;
}

export function buildSuggestionsPrompt(
	resumeText: string,
	jobDescription: string,
	currentScore: number
): string {
	return `You are a resume optimization specialist who understands how enterprise ATS platforms work internally.

Current average ATS score: ${currentScore}/100

<RESUME_EXCERPT>
${resumeText.slice(0, 2500)}
</RESUME_EXCERPT>

<JOB_DESCRIPTION>
${jobDescription.slice(0, 3000)}
</JOB_DESCRIPTION>

Provide specific, actionable suggestions to improve this resume's ATS compatibility. Each suggestion must reference WHY it matters for ATS parsing/matching.

Respond ONLY with valid JSON, no markdown fences:

{
  "suggestions": [
    {
      "action": "specific thing to do",
      "reason": "why this matters for ATS systems",
      "impact": "high/medium/low",
      "platforms": ["which ATS platforms this specifically helps"]
    }
  ]
}

Rules:
- max 7 suggestions, sorted by impact (highest first)
- be SPECIFIC: "add 'Kubernetes' and 'K8s' to your experience bullets describing container orchestration work" not "add more keywords"
- include BOTH abbreviated and full forms advice (critical for Taleo's literal matching)
- if formatting issues detected, mention which specific platforms they break (Workday and Taleo are strictest)
- consider the industry context. don't suggest healthcare certifications for a software engineer
- suggest quantifying achievements with specific numbers where bullets lack metrics
- focus on what's missing from the JD that could reasonably be added based on the candidate's apparent experience`;
}
