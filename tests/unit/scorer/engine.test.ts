import { describe, it, expect } from 'vitest';
import { scoreResume, scoreAgainstProfile } from '$engine/scorer/engine';
import { WORKDAY_PROFILE, LEVER_PROFILE, ALL_PROFILES } from '$engine/scorer/profiles';
import type { ScoringInput } from '$engine/scorer/types';

function makeGoodInput(): ScoringInput {
	return {
		resumeText: `
			Software Engineer with 5 years of experience building scalable web applications.
			Proficient in JavaScript, TypeScript, React, Node.js, and AWS.
			Led development of microservices architecture serving 1M+ users.
			Reduced page load time by 45% through performance optimization.
			Managed team of 8 engineers delivering quarterly releases.
			Bachelor of Science in Computer Science, University of Waterloo, 2019.
		`,
		resumeSkills: [
			'javascript',
			'typescript',
			'react',
			'node.js',
			'aws',
			'docker',
			'kubernetes',
			'postgresql',
			'redis',
			'graphql'
		],
		resumeSections: ['contact', 'summary', 'experience', 'education', 'skills', 'projects'],
		experienceBullets: [
			'Led development of microservices architecture serving 1M+ users',
			'Reduced page load time by 45% through performance optimization',
			'Managed team of 8 engineers delivering quarterly releases',
			'Implemented CI/CD pipeline reducing deploy time by 70%',
			'Architected real-time data pipeline processing 500K events/day',
			'Mentored 5 junior developers through structured onboarding program',
			'Delivered 3 major product launches generating $2M in revenue',
			'Optimized database queries reducing response time from 800ms to 120ms'
		],
		educationText:
			'Bachelor of Science in Computer Science, University of Waterloo, 2019, GPA: 3.7/4.0',
		hasMultipleColumns: false,
		hasTables: false,
		hasImages: false,
		pageCount: 1,
		wordCount: 500,
		jobDescription: 'Software engineer with JavaScript TypeScript React Node.js experience'
	};
}

function makePoorInput(): ScoringInput {
	return {
		resumeText: 'I am a hard worker and I want a job.',
		resumeSkills: [],
		resumeSections: [],
		experienceBullets: [],
		educationText: '',
		hasMultipleColumns: true,
		hasTables: true,
		hasImages: true,
		pageCount: 4,
		wordCount: 50,
		jobDescription: 'Senior software engineer with 10 years of experience in distributed systems'
	};
}

describe('scoreResume', () => {
	it('returns results for all 6 ATS profiles', () => {
		const results = scoreResume(makeGoodInput());
		expect(results).toHaveLength(6);

		const names = results.map((r) => r.system);
		expect(names).toContain('Workday');
		expect(names).toContain('Taleo');
		expect(names).toContain('iCIMS');
		expect(names).toContain('Greenhouse');
		expect(names).toContain('Lever');
		expect(names).toContain('SuccessFactors');
	});

	it('produces scores between 0 and 100', () => {
		const results = scoreResume(makeGoodInput());
		for (const result of results) {
			expect(result.overallScore).toBeGreaterThanOrEqual(0);
			expect(result.overallScore).toBeLessThanOrEqual(100);
		}
	});

	it('is deterministic (same input = same output)', () => {
		const input = makeGoodInput();
		const results1 = scoreResume(input);
		const results2 = scoreResume(input);

		for (let i = 0; i < results1.length; i++) {
			expect(results1[i].overallScore).toBe(results2[i].overallScore);
			expect(results1[i].system).toBe(results2[i].system);
			expect(results1[i].passesFilter).toBe(results2[i].passesFilter);
		}
	});

	it('gives higher scores to well-formatted resumes', () => {
		const good = scoreResume(makeGoodInput());
		const poor = scoreResume(makePoorInput());

		const goodAvg = good.reduce((sum, r) => sum + r.overallScore, 0) / good.length;
		const poorAvg = poor.reduce((sum, r) => sum + r.overallScore, 0) / poor.length;

		expect(goodAvg).toBeGreaterThan(poorAvg);
	});

	it('strict systems score lower than lenient ones for borderline resumes', () => {
		const results = scoreResume(makePoorInput());
		const workdayScore = results.find((r) => r.system === 'Workday')!.overallScore;
		const leverScore = results.find((r) => r.system === 'Lever')!.overallScore;

		// lever is much more lenient, so it should score higher (or at least equal)
		expect(leverScore).toBeGreaterThanOrEqual(workdayScore);
	});

	it('includes vendor info for each result', () => {
		const results = scoreResume(makeGoodInput());
		for (const result of results) {
			expect(result.vendor).toBeTruthy();
			expect(result.system).toBeTruthy();
		}
	});
});

describe('scoreAgainstProfile', () => {
	it('returns complete breakdown structure', () => {
		const result = scoreAgainstProfile(makeGoodInput(), WORKDAY_PROFILE);

		expect(result.breakdown).toBeDefined();
		expect(result.breakdown.formatting).toBeDefined();
		expect(result.breakdown.keywordMatch).toBeDefined();
		expect(result.breakdown.sections).toBeDefined();
		expect(result.breakdown.experience).toBeDefined();
		expect(result.breakdown.education).toBeDefined();
	});

	it('generates suggestions for low-scoring areas', () => {
		const result = scoreAgainstProfile(makePoorInput(), WORKDAY_PROFILE);
		expect(result.suggestions.length).toBeGreaterThan(0);
	});

	it('passesFilter reflects the profile passing score', () => {
		const good = scoreAgainstProfile(makeGoodInput(), LEVER_PROFILE);
		// a well-built resume against Lever (passingScore 50) should pass
		expect(good.passesFilter).toBe(true);
	});

	it('applies profile-specific keyword strategy', () => {
		const input = makeGoodInput();

		const workday = scoreAgainstProfile(input, WORKDAY_PROFILE);
		const lever = scoreAgainstProfile(input, LEVER_PROFILE);

		// both should have keyword match data
		expect(workday.breakdown.keywordMatch).toBeDefined();
		expect(lever.breakdown.keywordMatch).toBeDefined();
	});
});

describe('ATS profile definitions', () => {
	it('all profiles have weights summing to 1.0', () => {
		for (const profile of ALL_PROFILES) {
			const { weights } = profile;
			const sum =
				weights.formatting +
				weights.keywordMatch +
				weights.sectionCompleteness +
				weights.experienceRelevance +
				weights.educationMatch +
				weights.quantification;
			expect(sum).toBeCloseTo(1.0, 2);
		}
	});

	it('all profiles have a passing score between 0 and 100', () => {
		for (const profile of ALL_PROFILES) {
			expect(profile.passingScore).toBeGreaterThanOrEqual(0);
			expect(profile.passingScore).toBeLessThanOrEqual(100);
		}
	});

	it('all profiles have a valid keyword strategy', () => {
		for (const profile of ALL_PROFILES) {
			expect(['exact', 'fuzzy', 'semantic']).toContain(profile.keywordStrategy);
		}
	});

	it('all profiles have at least one required section', () => {
		for (const profile of ALL_PROFILES) {
			expect(profile.requiredSections.length).toBeGreaterThan(0);
		}
	});

	it('strict profiles have higher parsing strictness', () => {
		const workday = ALL_PROFILES.find((p) => p.name === 'Workday')!;
		const lever = ALL_PROFILES.find((p) => p.name === 'Lever')!;

		expect(workday.parsingStrictness).toBeGreaterThan(lever.parsingStrictness);
	});
});
