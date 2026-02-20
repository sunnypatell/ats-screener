// prompt templates for multi-provider LLM scoring

export function buildFullScoringPrompt(resumeText: string, jobDescription?: string): string {
	const jdSection = jobDescription
		? `
JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

MODE: targeted scoring (match resume against this specific job)`
		: `
MODE: general ATS readiness (no job description provided, score for general ATS compatibility)`;

	return `You are an expert ATS (Applicant Tracking System) analyst. Analyze this resume against 6 real enterprise ATS platforms and return structured scoring results.

RESUME TEXT:
${resumeText.slice(0, 4000)}
${jdSection}

Score the resume from each ATS system's perspective. Each system parses and evaluates resumes differently:

1. **Workday** (by Workday Inc.) - very strict parser, prefers single-column layouts, exact keyword matching, hates creative formatting, tables, or multi-column layouts
2. **Taleo** (by Oracle) - strict boolean keyword filtering, very filter-driven, penalizes missing standard sections heavily
3. **iCIMS** (by iCIMS) - medium strictness, AI-assisted matching, more format-tolerant than Workday/Taleo, fuzzy keyword matching
4. **Greenhouse** (by Greenhouse Software) - lenient, modern, uses structured scorecards, semantic keyword understanding, startup-friendly
5. **Lever** (by Lever/Employ) - lenient, context-based matching, good with varied formats, understands transferable skills
6. **SuccessFactors** (by SAP) - strict enterprise system, structured-data focused, exact keyword matching, requires standard resume structure

For each system, evaluate:
- **formatting** (0-100): How well the resume format works with this system's parser
- **keywordMatch** (0-100): How well resume keywords align with ${jobDescription ? 'the job requirements' : 'general professional standards'}
- **sections** (0-100): Whether required sections are present and properly structured
- **experience** (0-100): Quality of experience descriptions (quantification, action verbs, relevance)
- **education** (0-100): Education section completeness and relevance
- **overall** (0-100): Weighted overall score for this system

Also provide:
- matched keywords (skills/terms found in resume${jobDescription ? ' that match the JD' : ''})
- missing keywords (important terms ${jobDescription ? 'from the JD ' : ''}not found in resume)
- present sections (detected resume sections)
- missing sections (sections this ATS expects but are missing)
- formatting issues (specific problems)
- experience highlights (notable strengths)
- education notes (observations)
- 3-5 specific, actionable suggestions per system

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

Rules:
- passesFilter = true if overallScore >= 70 for strict systems (Workday, Taleo, SuccessFactors) or >= 60 for lenient systems (iCIMS, Greenhouse, Lever)
- Be realistic and varied. Different systems SHOULD give different scores
- Strict systems (Workday, Taleo) should score lower for creative/non-standard resumes
- Lenient systems (Greenhouse, Lever) should be more forgiving
- Suggestions must be specific and actionable, not generic
- ${jobDescription ? 'Keywords should be extracted from the job description' : 'Keywords should be based on general professional/industry standards detected from the resume content'}
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
