import type { LLMAnalysis, LLMRequestPayload } from './types';
import { tokenize } from '$engine/nlp/tokenizer';
import { detectIndustry } from '$engine/nlp/skills-taxonomy';

// rule-based fallback when LLM is unavailable. deterministic, uses NLP engine directly
export function generateFallbackAnalysis(payload: LLMRequestPayload): LLMAnalysis {
	const { resumeText, jobDescription, resumeSkills } = payload;

	const jdTokens = tokenize(jobDescription);
	const jdTerms = [...new Set(jdTokens.map((t) => t.normalized))];
	const resumeTokens = new Set(tokenize(resumeText).map((t) => t.normalized));

	// extract skills from JD by matching known skill patterns
	const potentialSkills = jdTerms.filter((t) => t.length >= 2 && !isCommonWord(t));

	// detect experience level from JD
	const experienceLevel = detectExperienceLevel(jobDescription);
	const educationReq = detectEducationRequirement(jobDescription);
	const industries = detectIndustry(jobDescription);
	const industryContext = industries.length > 0 ? industries[0].industry : 'general';

	// find semantic-ish matches (terms in resume that relate to JD terms)
	const semanticMatches = potentialSkills
		.filter((skill) => !resumeTokens.has(skill))
		.filter((skill) => {
			// check if the resume contains related terms
			const resumeLower = resumeText.toLowerCase();
			return resumeLower.includes(skill) || partialMatch(skill, resumeTokens);
		})
		.map((skill) => ({
			skill,
			resumeEvidence: `found related content in resume`,
			confidence: 0.6
		}));

	// generate suggestions
	const missingTerms = potentialSkills.filter((t) => !resumeTokens.has(t)).slice(0, 5);
	const suggestions: string[] = [];

	if (missingTerms.length > 0) {
		suggestions.push(
			`consider adding these terms from the job description: ${missingTerms.join(', ')}`
		);
	}

	if (!resumeSkills.length) {
		suggestions.push(
			'add a dedicated skills section listing your technical and professional skills'
		);
	}

	if (experienceLevel === 'senior' || experienceLevel === 'lead') {
		suggestions.push('emphasize leadership experience and quantified impact for this senior role');
	}

	if (resumeText.length < 500) {
		suggestions.push(
			'your resume appears short. add more detail about your experience and achievements'
		);
	}

	return {
		extractedRequirements: {
			requiredSkills: potentialSkills.slice(0, 10),
			preferredSkills: potentialSkills.slice(10, 15),
			experienceLevel,
			educationRequirement: educationReq,
			industryContext,
			roleType: detectRoleType(jobDescription)
		},
		semanticMatches,
		suggestions,
		overallAssessment: `rule-based analysis (LLM unavailable). detected ${industries.length > 0 ? industries[0].industry : 'general'} industry context.`
	};
}

function detectExperienceLevel(text: string): string {
	const lower = text.toLowerCase();
	if (/\b(?:director|vp|vice president|head of|chief)\b/.test(lower)) return 'executive';
	if (/\b(?:lead|principal|staff|architect)\b/.test(lower)) return 'lead';
	if (/\b(?:senior|sr\.?|8\+|7\+|6\+|5\+)\s*(?:years?|yrs?)?\b/.test(lower)) return 'senior';
	if (/\b(?:mid|3\+|4\+)\s*(?:years?|yrs?)?\b/.test(lower)) return 'mid';
	if (/\b(?:junior|jr\.?|entry|0-2|1-2|1\+|2\+)\s*(?:years?|yrs?)?\b/.test(lower)) return 'entry';
	if (/\b(?:intern|internship|co-op|new grad|graduate)\b/.test(lower)) return 'entry';
	return 'mid';
}

function detectEducationRequirement(text: string): string {
	const lower = text.toLowerCase();
	if (/\b(?:ph\.?d|doctorate)\b/.test(lower)) return 'PhD';
	if (/\b(?:master'?s?|mba|m\.s\.?|m\.a\.?)\b/.test(lower)) return "Master's degree";
	if (/\b(?:bachelor'?s?|b\.s\.?|b\.a\.?|degree)\b/.test(lower)) return "Bachelor's degree";
	if (/\b(?:associate'?s?)\b/.test(lower)) return "Associate's degree";
	return 'not specified';
}

function detectRoleType(text: string): string {
	const lower = text.toLowerCase();
	if (
		/\b(?:engineer|developer|programmer|devops|sre|software|frontend|backend|fullstack)\b/.test(
			lower
		)
	)
		return 'engineering';
	if (/\b(?:sales|account executive|business development|bdr|sdr)\b/.test(lower)) return 'sales';
	if (/\b(?:market|brand|content|seo|social media|campaign)\b/.test(lower)) return 'marketing';
	if (/\b(?:financ|account|audit|tax|treasury|controller)\b/.test(lower)) return 'finance';
	if (/\b(?:nurse|physician|clinical|patient|healthcare|medical)\b/.test(lower))
		return 'healthcare';
	if (/\b(?:legal|attorney|counsel|compliance|paralegal)\b/.test(lower)) return 'legal';
	if (/\b(?:operat|supply chain|logistics|procurement|warehouse)\b/.test(lower))
		return 'operations';
	if (/\b(?:design|ux|ui|graphic|creative|visual)\b/.test(lower)) return 'design';
	if (/\b(?:teach|professor|instructor|education|curriculum)\b/.test(lower)) return 'education';
	if (/\b(?:human resources|hr|recruit|talent|people)\b/.test(lower)) return 'hr';
	return 'other';
}

function isCommonWord(word: string): boolean {
	const common = new Set([
		'the',
		'and',
		'for',
		'with',
		'will',
		'you',
		'are',
		'our',
		'this',
		'that',
		'have',
		'from',
		'not',
		'but',
		'what',
		'all',
		'can',
		'had',
		'one',
		'each',
		'which',
		'their',
		'about',
		'other',
		'into',
		'more',
		'some',
		'has',
		'its',
		'than',
		'who',
		'would',
		'make',
		'like',
		'time',
		'just',
		'know',
		'take',
		'come',
		'could',
		'them',
		'see',
		'been',
		'work',
		'ability',
		'experience',
		'required',
		'preferred',
		'must',
		'including',
		'minimum',
		'requirements',
		'qualifications',
		'strong',
		'excellent',
		'proven',
		'looking',
		'join',
		'team',
		'role',
		'position',
		'candidate',
		'responsibilities',
		'duties',
		'skills',
		'years'
	]);
	return common.has(word);
}

function partialMatch(term: string, resumeTokens: Set<string>): boolean {
	if (term.length < 4) return false;
	for (const rToken of resumeTokens) {
		if (rToken.includes(term) || term.includes(rToken)) {
			if (Math.min(rToken.length, term.length) >= 3) return true;
		}
	}
	return false;
}
