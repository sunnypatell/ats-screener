// prompt templates for multi-provider LLM scoring

export function buildFullScoringPrompt(resumeText: string, jobDescription?: string): string {
	const jdSection = jobDescription
		? `
JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

MODE: targeted scoring - match resume against this specific job description`
		: `
MODE: general ATS readiness - no job description provided, evaluate for general ATS compatibility`;

	return `You are an expert ATS/HCMS analyst with deep knowledge of how enterprise applicant tracking systems actually parse, filter, and score resumes. Your analysis must be grounded in how these platforms really work, not generic advice.

RESUME TEXT:
${resumeText.slice(0, 5000)}
${jdSection}

Analyze this resume from the perspective of 6 real enterprise ATS platforms. Each platform has fundamentally different scoring behavior based on actual documented behavior:

1. **Workday** (37.1% of Fortune 500) - proprietary parser tightly integrated with Workday HCM. historically relied on keyword search + manual filtering. now has HiredScore AI (acquired 2024) which provides explainable, auditable AI-driven candidate matching. NOT generative AI. scores based strictly on criteria in the job description. expects standard section headings ("Experience", "Education", "Skills"). single-column, text-based resumes in DOCX/PDF parse best. tables, columns, text boxes, and graphics break parsing. key weakness: nontraditional headings and complex formatting may not parse at all.

2. **Taleo** (Oracle, legacy enterprise) - one of the ONLY major ATS platforms that actually auto-scores candidates with a visible Req Rank percentage. four scoring mechanisms: Req Rank (keyword overlap %), Candidate Suggestions (ML-based 0-3 stars across profile/education/experience/skills), Prescreening Questions (weighted scoring), Knockout Questions (binary pass/fail). the ML-based suggestions CAN find semantic similarities (terms don't need exact matches). knockout questions cause instant disqualification. strips HTML tags, special characters, unusual fonts.

3. **iCIMS** (10.7% overall market share, #1 ATS) - has a "Role Fit" score using AI that evaluates experience match, skills match, and overall tier. keyword-density algorithm counts frequency AND placement of terms. section-recognition engine favors clean headings, simple fonts, standard bullets. AI goes beyond keywords to analyze related skills and qualities. auto-generates skills list from full resume text (not just skills section). combines proprietary algorithms with third-party ML.

4. **Greenhouse** (popular with tech/startups) - CRITICAL: Greenhouse fundamentally does NOT auto-score or auto-rank candidates. per co-founder Jon Stross, "we don't have some magic AI." candidates appear in order they applied. recruiters manually review and use keyword search with Required (AND) and Preferred (OR) boolean logic. the real "scoring" happens during interviews via structured scorecards (5-point scale). Talent Matching extracts skills/titles/experience as structured data for filtering. the biggest risk: recruiter stops reviewing after finding enough good candidates.

5. **Lever** (by Employ, popular with startups) - confirmed to use Sovren/Textkernel for parsing. does NOT automatically rank resumes against job descriptions. search supports word stemming ("collaborating" finds "collaborate") but CANNOT identify abbreviations ("PM" won't match "Project Manager"). recruiters manually assign scores. focuses on relationship management (CRM-like) rather than automated scoring. newer AI features analyze project complexity and impact.

6. **SuccessFactors** (SAP, 13.4% of Fortune 500) - weak native parsing, relies on RChilli as primary third-party parser. RChilli parses 200+ fields, 40+ languages, normalizes to standardized taxonomy. AI match scores with full breakdowns: skill match, title relevance, location, education, years of experience. goes beyond keywords via context, synonyms, and normalized taxonomy. identifies both stated AND implied skills. scanned PDFs will NOT parse (native lacks OCR). resume parsing breaks when Mobile Apply is enabled.

For each system, evaluate these dimensions (modeled after Textkernel's 8-category scoring):
- **formatting** (0-100): parseability by this system's specific parser. considers layout, encoding, section detection
- **keywordMatch** (0-100): ${jobDescription ? 'how well resume keywords match the JD requirements' : 'keyword density and professional terminology quality'}. includes TF-IDF weighting, synonym recognition where applicable
- **sections** (0-100): presence of standard parseable sections (contact, experience, education, skills, certifications)
- **experience** (0-100): quality of experience descriptions. quantified achievements, action verbs, recency weighting, management level
- **education** (0-100): education completeness, degree relevance, field match
- **overall** (0-100): weighted composite score reflecting this platform's specific scoring behavior

Also provide:
- matched keywords: skills/terms found in resume${jobDescription ? ' that match the JD' : ''}
- missing keywords: important terms ${jobDescription ? 'from the JD ' : ''}not found (including synonyms that would match on semantic platforms)
- synonymMatched: terms that match semantically but not via exact keywords (only on platforms that support this: Taleo ML, iCIMS, SuccessFactors with RChilli)
- present sections: detected resume sections
- missing sections: sections this specific ATS expects
- formatting issues: specific parsing problems for this platform
- experience highlights: notable strengths
- education notes: observations
- 3-5 specific, actionable suggestions per system grounded in how that system actually works

Respond ONLY with valid JSON matching this exact structure (no markdown fences, no extra text):

{
  "results": [
    {
      "system": "Workday",
      "vendor": "Workday Inc.",
      "overallScore": 75,
      "passesFilter": true,
      "breakdown": {
        "formatting": { "score": 80, "issues": ["issue1"], "details": ["detail1"] },
        "keywordMatch": { "score": 70, "matched": ["skill1"], "missing": ["skill2"], "synonymMatched": ["synonym1"] },
        "sections": { "score": 85, "present": ["experience", "education"], "missing": ["summary"] },
        "experience": { "score": 75, "quantifiedBullets": 5, "totalBullets": 10, "actionVerbCount": 7, "highlights": ["highlight1"] },
        "education": { "score": 90, "notes": ["note1"] }
      },
      "suggestions": ["suggestion1", "suggestion2"]
    }
  ]
}

Scoring rules:
- passesFilter: Workday/Taleo/SuccessFactors are strict (true if overallScore >= 70). iCIMS is moderate (true if >= 65). Greenhouse/Lever are lenient (true if >= 55) but remember Greenhouse doesn't auto-filter
- Scores MUST vary meaningfully between platforms. a creative resume should score high on Greenhouse/Lever and low on Taleo/Workday. a perfectly structured corporate resume should score high on Workday/Taleo and similar on Greenhouse
- Taleo should have the most variation in scores because it actually computes granular scores across profile/education/experience/skills independently
- Greenhouse suggestions should focus on keyword search optimization and structured interview preparation, NOT parsing
- Lever suggestions should account for word stemming support and abbreviation blindness
- SuccessFactors suggestions should reference RChilli's taxonomy normalization behavior
- ${jobDescription ? 'Extract keywords from the job description. for keyword match, distinguish between required skills (must-have) and preferred skills (nice-to-have)' : 'Assess keywords based on industry standards detected from resume content'}
- Be specific and grounded. reference the actual platform behavior, not generic ATS advice
- Return exactly 6 results, one per system, in the order listed above`;
}

export function buildJDAnalysisPrompt(jobDescription: string): string {
	return `Analyze this job description and extract structured requirements. Respond ONLY with valid JSON, no markdown fences.

Job description:
${jobDescription}

Respond with this exact JSON structure:
{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill1", "skill2"],
  "experienceLevel": "entry/mid/senior/lead/executive",
  "educationRequirement": "specific degree or 'not specified'",
  "industryContext": "industry name",
  "roleType": "engineering/sales/marketing/finance/healthcare/legal/operations/education/design/other"
}

Rules:
- Extract skills as they appear in the JD (exact terms)
- Required = explicitly stated as required/must-have
- Preferred = nice-to-have/preferred/bonus
- Be specific about experience level based on years mentioned or seniority terms
- Detect industry from context clues even if not explicitly stated`;
}

export function buildSemanticMatchPrompt(
	resumeSkills: string[],
	jobDescription: string,
	resumeText: string
): string {
	return `Compare this resume against the job description. Identify semantic skill matches that exact keyword matching would miss. Respond ONLY with valid JSON, no markdown fences.

Resume skills: ${resumeSkills.join(', ')}

Resume excerpt (first 2000 chars):
${resumeText.slice(0, 2000)}

Job description:
${jobDescription}

Respond with this exact JSON structure:
{
  "semanticMatches": [
    {
      "skill": "skill from JD",
      "resumeEvidence": "what in the resume demonstrates this skill",
      "confidence": 0.8
    }
  ],
  "overallAssessment": "one sentence summary of fit"
}

Rules:
- Only include matches with confidence >= 0.6
- Focus on skills that wouldn't be caught by keyword matching
- Examples: "project management" matched by "led cross-functional team of 12"
- Examples: "data analysis" matched by "built dashboards tracking KPIs"
- Be conservative with confidence scores`;
}

export function buildSuggestionsPrompt(
	resumeText: string,
	jobDescription: string,
	currentScore: number
): string {
	return `Given this resume and job description, provide specific, actionable suggestions to improve ATS compatibility. Respond ONLY with valid JSON, no markdown fences.

Current ATS score: ${currentScore}/100

Resume excerpt (first 2000 chars):
${resumeText.slice(0, 2000)}

Job description:
${jobDescription}

Respond with this exact JSON structure:
{
  "suggestions": [
    "specific actionable suggestion 1",
    "specific actionable suggestion 2"
  ]
}

Rules:
- Max 5 suggestions, prioritized by impact
- Be specific: "add 'Kubernetes' to your skills section" not "add more keywords"
- Focus on what's missing from the JD that could be added
- Suggest reformatting only if the resume text shows formatting issues
- Consider the industry context when making suggestions`;
}
