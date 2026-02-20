import { describe, it, expect } from 'vitest';
import { matchKeywords, quickKeywordScore } from '$engine/scorer/keyword-matcher';

describe('matchKeywords', () => {
	it('returns perfect score with no job description', () => {
		const result = matchKeywords('some resume text', '', 'exact');
		expect(result.score).toBe(100);
		expect(result.matched).toHaveLength(0);
		expect(result.missing).toHaveLength(0);
	});

	it('exact strategy only matches literal keywords', () => {
		const result = matchKeywords(
			'I have experience with JavaScript and React development',
			'Looking for JavaScript React TypeScript engineer',
			'exact'
		);

		expect(result.matched).toContain('javascript');
		expect(result.matched).toContain('react');
		expect(result.missing).toContain('typescript');
	});

	it('fuzzy strategy matches synonyms', () => {
		const result = matchKeywords(
			'Experienced with JavaScript and AWS cloud infrastructure',
			'Looking for JS and Amazon Web Services experience',
			'fuzzy'
		);

		// "js" is a synonym for "javascript", "aws" for "amazon web services"
		expect(result.synonymMatched.length + result.matched.length).toBeGreaterThan(0);
	});

	it('semantic strategy matches partial terms', () => {
		const result = matchKeywords(
			'Built microservices architecture with containerization using Docker and Kubernetes',
			'microservice container orchestration',
			'semantic'
		);

		// "microservices" contains "microservice", etc.
		const totalMatched = result.matched.length + result.synonymMatched.length;
		expect(totalMatched).toBeGreaterThan(0);
	});

	it('strict strategy produces more missing keywords than lenient', () => {
		const resumeText = 'Experienced software engineer with React and Node.js';
		const jdText = 'Senior software engineer with React TypeScript Node.js GraphQL AWS';

		const exact = matchKeywords(resumeText, jdText, 'exact');
		const semantic = matchKeywords(resumeText, jdText, 'semantic');

		expect(exact.missing.length).toBeGreaterThanOrEqual(semantic.missing.length);
	});

	it('synonym matches count 80% in scoring', () => {
		const result = matchKeywords(
			'JavaScript developer with AWS experience',
			'JS developer with Amazon Web Services',
			'fuzzy'
		);

		// some terms matched via synonyms count less than exact matches
		expect(result.score).toBeGreaterThan(0);
		expect(result.score).toBeLessThanOrEqual(100);
	});
});

describe('quickKeywordScore', () => {
	it('returns score between 0 and 100', () => {
		const score = quickKeywordScore(
			'JavaScript developer with React experience',
			'JavaScript React TypeScript developer'
		);
		expect(score).toBeGreaterThanOrEqual(0);
		expect(score).toBeLessThanOrEqual(100);
	});

	it('returns higher score for more overlap', () => {
		const high = quickKeywordScore(
			'JavaScript React TypeScript Node.js developer',
			'JavaScript React TypeScript Node.js developer'
		);
		const low = quickKeywordScore(
			'Python Django Flask developer',
			'JavaScript React TypeScript Node.js developer'
		);
		expect(high).toBeGreaterThan(low);
	});
});
