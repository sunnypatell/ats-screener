import { describe, it, expect } from 'vitest';
import { generateFallbackAnalysis } from '$engine/llm/fallback';
import type { LLMRequestPayload } from '$engine/llm/types';

function makePayload(over: Partial<LLMRequestPayload> = {}): LLMRequestPayload {
	return {
		resumeText:
			'Software engineer with 5 years experience in JavaScript, React, Node.js. Built scalable APIs and led a team of 4 engineers.',
		jobDescription:
			'Looking for a senior software engineer with 7+ years experience in JavaScript, React, Node.js, AWS, and Docker.',
		resumeSkills: ['javascript', 'react', 'node.js'],
		mode: 'analyze-jd',
		...over
	};
}

describe('generateFallbackAnalysis: shape', () => {
	it('returns a complete LLMAnalysis shape', () => {
		const result = generateFallbackAnalysis(makePayload());
		expect(result.extractedRequirements).toBeDefined();
		expect(result.extractedRequirements.requiredSkills).toBeInstanceOf(Array);
		expect(result.extractedRequirements.preferredSkills).toBeInstanceOf(Array);
		expect(typeof result.extractedRequirements.experienceLevel).toBe('string');
		expect(typeof result.extractedRequirements.educationRequirement).toBe('string');
		expect(typeof result.extractedRequirements.industryContext).toBe('string');
		expect(typeof result.extractedRequirements.roleType).toBe('string');
		expect(result.semanticMatches).toBeInstanceOf(Array);
		expect(result.suggestions).toBeInstanceOf(Array);
		expect(typeof result.overallAssessment).toBe('string');
	});

	it('always references LLM unavailable in the assessment text', () => {
		const result = generateFallbackAnalysis(makePayload());
		expect(result.overallAssessment.toLowerCase()).toContain('llm unavailable');
	});

	it('caps requiredSkills at 10 and preferredSkills at 5', () => {
		const longJD = Array.from({ length: 30 }, (_, i) => `customterm${i}`).join(' ');
		const result = generateFallbackAnalysis(makePayload({ jobDescription: longJD }));
		expect(result.extractedRequirements.requiredSkills.length).toBeLessThanOrEqual(10);
		expect(result.extractedRequirements.preferredSkills.length).toBeLessThanOrEqual(5);
	});
});

describe('generateFallbackAnalysis: experience level detection', () => {
	it('detects senior from "senior" keyword', () => {
		const result = generateFallbackAnalysis(
			makePayload({ jobDescription: 'senior engineer with 7+ years experience' })
		);
		expect(result.extractedRequirements.experienceLevel).toBe('senior');
	});

	it('detects entry-level from intern/new grad keywords', () => {
		const result = generateFallbackAnalysis(
			makePayload({ jobDescription: 'looking for an intern or new grad' })
		);
		expect(result.extractedRequirements.experienceLevel).toBe('entry');
	});

	it('detects executive level from VP/director keywords', () => {
		const result = generateFallbackAnalysis(
			makePayload({ jobDescription: 'VP of engineering, head of platform' })
		);
		expect(result.extractedRequirements.experienceLevel).toBe('executive');
	});

	it('detects lead level from "principal" keyword', () => {
		const result = generateFallbackAnalysis(
			makePayload({ jobDescription: 'principal engineer driving architecture' })
		);
		expect(result.extractedRequirements.experienceLevel).toBe('lead');
	});

	it('falls back to mid level when no signal', () => {
		const result = generateFallbackAnalysis(
			makePayload({ jobDescription: 'we want a teammate who writes clean code' })
		);
		expect(result.extractedRequirements.experienceLevel).toBe('mid');
	});
});

describe('generateFallbackAnalysis: education detection', () => {
	it('detects PhD requirement', () => {
		const result = generateFallbackAnalysis(
			makePayload({ jobDescription: 'PhD in computer science required' })
		);
		expect(result.extractedRequirements.educationRequirement).toBe('PhD');
	});

	it("detects Master's requirement", () => {
		const result = generateFallbackAnalysis(
			makePayload({ jobDescription: "Master's degree or MBA preferred" })
		);
		expect(result.extractedRequirements.educationRequirement).toBe("Master's degree");
	});

	it("detects Bachelor's requirement", () => {
		const result = generateFallbackAnalysis(
			makePayload({ jobDescription: 'Bachelor of Science in CS or equivalent' })
		);
		expect(result.extractedRequirements.educationRequirement).toBe("Bachelor's degree");
	});

	it('returns "not specified" when JD has no education signal', () => {
		const result = generateFallbackAnalysis(
			makePayload({ jobDescription: 'experienced engineer needed' })
		);
		expect(result.extractedRequirements.educationRequirement).toBe('not specified');
	});
});

describe('generateFallbackAnalysis: role type detection', () => {
	it('identifies engineering roles', () => {
		const result = generateFallbackAnalysis(
			makePayload({ jobDescription: 'frontend developer building React apps' })
		);
		expect(result.extractedRequirements.roleType).toBe('engineering');
	});

	it('identifies healthcare roles', () => {
		const result = generateFallbackAnalysis(
			makePayload({ jobDescription: 'registered nurse with clinical experience' })
		);
		expect(result.extractedRequirements.roleType).toBe('healthcare');
	});

	it('identifies sales roles', () => {
		const result = generateFallbackAnalysis(
			makePayload({ jobDescription: 'account executive driving new business' })
		);
		expect(result.extractedRequirements.roleType).toBe('sales');
	});

	it('identifies design roles', () => {
		const result = generateFallbackAnalysis(
			makePayload({ jobDescription: 'UX designer leading product visuals' })
		);
		expect(result.extractedRequirements.roleType).toBe('design');
	});

	it('returns "other" for ambiguous JDs', () => {
		const result = generateFallbackAnalysis(
			makePayload({ jobDescription: 'we want a self-starter who gets things done' })
		);
		expect(result.extractedRequirements.roleType).toBe('other');
	});
});

describe('generateFallbackAnalysis: suggestions', () => {
	it('suggests missing JD terms when not in resume', () => {
		const result = generateFallbackAnalysis(
			makePayload({
				resumeText: 'Software engineer with JavaScript experience',
				jobDescription: 'Need experience in JavaScript, Kubernetes, Terraform, Vault'
			})
		);
		const text = result.suggestions.join(' ').toLowerCase();
		// at least one of the missing terms should be referenced
		const hasMissing =
			text.includes('kubernetes') || text.includes('terraform') || text.includes('vault');
		expect(hasMissing).toBe(true);
	});

	it('suggests adding a skills section when resumeSkills is empty', () => {
		const result = generateFallbackAnalysis(makePayload({ resumeSkills: [] }));
		const hasSkillsSuggestion = result.suggestions.some((s) =>
			s.toLowerCase().includes('skills section')
		);
		expect(hasSkillsSuggestion).toBe(true);
	});

	it('suggests more detail for very short resumes', () => {
		const result = generateFallbackAnalysis(makePayload({ resumeText: 'Short resume.' }));
		const hasShortSuggestion = result.suggestions.some((s) => s.toLowerCase().includes('short'));
		expect(hasShortSuggestion).toBe(true);
	});

	it('suggests leadership emphasis for senior/lead roles', () => {
		const result = generateFallbackAnalysis(
			makePayload({ jobDescription: 'senior staff engineer leading the platform team' })
		);
		const hasLeadership = result.suggestions.some((s) => s.toLowerCase().includes('leadership'));
		expect(hasLeadership).toBe(true);
	});
});
