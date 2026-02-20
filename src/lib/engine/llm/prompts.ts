/**
 * prompt templates for Gemini 2.0 Flash.
 * designed to extract structured data from unstructured text.
 * works across any industry and role type.
 */

export function buildJDAnalysisPrompt(jobDescription: string): string {
	return `analyze this job description and extract structured requirements. respond ONLY with valid JSON, no markdown fences.

job description:
${jobDescription}

respond with this exact JSON structure:
{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill1", "skill2"],
  "experienceLevel": "entry/mid/senior/lead/executive",
  "educationRequirement": "specific degree or 'not specified'",
  "industryContext": "industry name",
  "roleType": "engineering/sales/marketing/finance/healthcare/legal/operations/education/design/other"
}

rules:
- extract skills as they appear in the JD (exact terms)
- required = explicitly stated as required/must-have
- preferred = nice-to-have/preferred/bonus
- be specific about experience level based on years mentioned or seniority terms
- detect industry from context clues even if not explicitly stated`;
}

export function buildSemanticMatchPrompt(
	resumeSkills: string[],
	jobDescription: string,
	resumeText: string
): string {
	return `compare this resume against the job description. identify semantic skill matches that exact keyword matching would miss. respond ONLY with valid JSON, no markdown fences.

resume skills: ${resumeSkills.join(', ')}

resume excerpt (first 2000 chars):
${resumeText.slice(0, 2000)}

job description:
${jobDescription}

respond with this exact JSON structure:
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

rules:
- only include matches with confidence >= 0.6
- focus on skills that wouldn't be caught by keyword matching
- examples: "project management" matched by "led cross-functional team of 12"
- examples: "data analysis" matched by "built dashboards tracking KPIs"
- be conservative with confidence scores`;
}

export function buildSuggestionsPrompt(
	resumeText: string,
	jobDescription: string,
	currentScore: number
): string {
	return `given this resume and job description, provide specific, actionable suggestions to improve ATS compatibility. respond ONLY with valid JSON, no markdown fences.

current ATS score: ${currentScore}/100

resume excerpt (first 2000 chars):
${resumeText.slice(0, 2000)}

job description:
${jobDescription}

respond with this exact JSON structure:
{
  "suggestions": [
    "specific actionable suggestion 1",
    "specific actionable suggestion 2"
  ]
}

rules:
- max 5 suggestions, prioritized by impact
- be specific: "add 'Kubernetes' to your skills section" not "add more keywords"
- focus on what's missing from the JD that could be added
- suggest reformatting only if the resume text shows formatting issues
- consider the industry context when making suggestions`;
}
