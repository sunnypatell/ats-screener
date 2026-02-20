import type { ParsedJobDescription } from './types';
import { tokenize, extractNgrams } from '$engine/nlp/tokenizer';
import { detectIndustry, getIndustrySkills } from '$engine/nlp/skills-taxonomy';

// rule-based JD extractor. LLM enhancement happens server-side. works for any industry
export function parseJobDescription(text: string): ParsedJobDescription {
	const lower = text.toLowerCase();

	// extract all meaningful tokens
	const tokens = tokenize(text);
	const terms = [...new Set(tokens.map((t) => t.normalized))];

	// extract bigrams and trigrams for multi-word skills
	const bigrams = extractNgrams(text, 2);
	const trigrams = extractNgrams(text, 3);

	// detect industry context
	const industries = detectIndustry(text);
	const industryContext = industries.length > 0 ? industries[0].industry : 'general';

	// get known skills for detected industry
	const industrySkills =
		industries.length > 0
			? getIndustrySkills(industries[0].industry).map((s) => s.toLowerCase())
			: [];

	// extract skills by matching against taxonomy + common patterns
	const extractedSkills = extractSkills(terms, bigrams, trigrams, industrySkills);

	// separate required vs preferred
	const { required, preferred } = categorizeSkills(text, extractedSkills);

	// detect experience level
	const experienceLevel = detectExperienceLevel(lower);
	const educationRequirement = detectEducationRequirement(lower);
	const roleType = detectRoleType(lower);

	// extract key phrases (important multi-word terms from the JD)
	const keyPhrases = [...bigrams, ...trigrams].filter((phrase) => isKeyPhrase(phrase)).slice(0, 20);

	return {
		rawText: text,
		extractedSkills,
		requiredSkills: required,
		preferredSkills: preferred,
		experienceLevel,
		educationRequirement,
		industryContext,
		roleType,
		keyPhrases
	};
}

function extractSkills(
	terms: string[],
	bigrams: string[],
	trigrams: string[],
	industrySkills: string[]
): string[] {
	const skills = new Set<string>();
	const industrySet = new Set(industrySkills);

	// match single terms against industry taxonomy
	for (const term of terms) {
		if (industrySet.has(term) && term.length >= 2) {
			skills.add(term);
		}
	}

	// match multi-word terms
	for (const phrase of [...bigrams, ...trigrams]) {
		if (industrySet.has(phrase)) {
			skills.add(phrase);
		}
	}

	// also catch common skill patterns not in taxonomy
	const skillPatterns = [
		// tech
		/\b(?:python|java|javascript|typescript|react|angular|vue|node\.?js|go|rust|swift|kotlin|ruby|php|c\+\+|c#|\.net|sql|nosql|mongodb|postgresql|redis|docker|kubernetes|aws|azure|gcp|terraform|jenkins|git|linux)\b/gi,
		// data/ml
		/\b(?:machine learning|deep learning|data science|nlp|natural language|computer vision|tensorflow|pytorch|pandas|spark|hadoop|tableau|power bi|etl)\b/gi,
		// business
		/\b(?:salesforce|hubspot|sap|oracle|quickbooks|excel|powerpoint|jira|confluence|asana|slack)\b/gi,
		// certifications
		/\b(?:cpa|pmp|aws certified|google certified|azure certified|cissp|ceh|six sigma|scrum master|agile)\b/gi
	];

	for (const pattern of skillPatterns) {
		const matches = terms.join(' ').match(pattern);
		if (matches) {
			for (const match of matches) {
				skills.add(match.toLowerCase());
			}
		}
	}

	return [...skills];
}

function categorizeSkills(
	text: string,
	skills: string[]
): { required: string[]; preferred: string[] } {
	const lines = text.split('\n');
	const required: string[] = [];
	const preferred: string[] = [];

	// find sections
	let inRequired = false;
	let inPreferred = false;

	for (const line of lines) {
		const lower = line.toLowerCase().trim();

		// detect section headers
		if (/(?:required|must have|minimum|essential|requirements)\b/.test(lower)) {
			inRequired = true;
			inPreferred = false;
		} else if (/(?:preferred|nice to have|bonus|desired|plus|ideal)\b/.test(lower)) {
			inRequired = false;
			inPreferred = true;
		}

		// check which skills appear in this line
		for (const skill of skills) {
			if (lower.includes(skill)) {
				if (inPreferred && !inRequired) {
					if (!preferred.includes(skill)) preferred.push(skill);
				} else {
					// default to required if section is ambiguous or explicitly required
					if (!required.includes(skill)) required.push(skill);
				}
			}
		}
	}

	// any skills not categorized go to required by default
	for (const skill of skills) {
		if (!required.includes(skill) && !preferred.includes(skill)) {
			required.push(skill);
		}
	}

	return { required, preferred };
}

function detectExperienceLevel(text: string): string {
	if (/\b(?:director|vp|vice president|head of|chief)\b/.test(text)) return 'executive';
	if (/\b(?:lead|principal|staff|architect)\b/.test(text)) return 'lead';
	if (/\b(?:senior|sr\.?)\b/.test(text) || /\b[5-9]\+?\s*(?:years?|yrs?)\b/.test(text))
		return 'senior';
	if (/\b[3-4]\+?\s*(?:years?|yrs?)\b/.test(text)) return 'mid';
	if (/\b(?:junior|jr\.?|entry)\b/.test(text) || /\b[0-2]\+?\s*(?:years?|yrs?)\b/.test(text))
		return 'entry';
	if (/\b(?:intern|internship|co-op|new grad)\b/.test(text)) return 'entry';
	return 'mid';
}

function detectEducationRequirement(text: string): string {
	if (/\b(?:ph\.?d|doctorate)\b/.test(text)) return 'PhD';
	if (/\b(?:master'?s?|mba|m\.s\.?|m\.a\.?)\b/.test(text)) return "Master's degree";
	if (/\b(?:bachelor'?s?|b\.s\.?|b\.a\.?|degree)\b/.test(text)) return "Bachelor's degree";
	if (/\b(?:associate'?s?)\b/.test(text)) return "Associate's degree";
	return 'not specified';
}

function detectRoleType(text: string): string {
	if (
		/\b(?:engineer|developer|programmer|devops|sre|software|frontend|backend|fullstack)\b/.test(
			text
		)
	)
		return 'engineering';
	if (/\b(?:sales|account executive|business development)\b/.test(text)) return 'sales';
	if (/\b(?:market|brand|content|seo|social media)\b/.test(text)) return 'marketing';
	if (/\b(?:financial|finance|accounting|audit|tax|treasury|cpa|cfa)\b/.test(text))
		return 'finance';
	if (/\b(?:nurse|physician|clinical|patient|healthcare)\b/.test(text)) return 'healthcare';
	if (/\b(?:legal|attorney|counsel|compliance)\b/.test(text)) return 'legal';
	if (/\b(?:operat|supply chain|logistics|procurement)\b/.test(text)) return 'operations';
	if (/\b(?:design|ux|ui|graphic|creative)\b/.test(text)) return 'design';
	return 'other';
}

function isKeyPhrase(phrase: string): boolean {
	const words = phrase.split(' ');
	// filter out phrases that are too generic
	const genericWords = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'will', 'you', 'are']);
	if (words.every((w) => genericWords.has(w))) return false;
	if (words.some((w) => w.length <= 1)) return false;
	return true;
}
