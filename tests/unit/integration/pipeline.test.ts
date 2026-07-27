/* eslint-disable no-console */
import { describe, expect, it } from 'vitest';
import { parseJobDescription } from '$engine/job-parser/extractor';
import { scoreResume } from '$engine/scorer/engine';
import type { ScoringInput } from '$engine/scorer/types';

describe('full pipeline: scoring input -> results', () => {
	const goodResume: ScoringInput = {
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
			'Mentored 5 junior developers through structured onboarding program'
		],
		experienceEntries: [
			{
				title: 'Software Engineer',
				company: 'Example',
				start: '2019-01',
				end: '2024-12',
				isCurrent: false,
				text: 'Software Engineer building web applications and APIs'
			}
		],
		educationText:
			'Bachelor of Science in Computer Science, University of Waterloo, 2019, GPA: 3.7/4.0',
		educationEntries: [
			{
				degree: 'Bachelor of Science',
				field: 'Computer Science',
				institution: 'University of Waterloo',
				text: 'Bachelor of Science in Computer Science, University of Waterloo, 2019'
			}
		],
		hasMultipleColumns: false,
		hasTables: false,
		hasImages: false,
		pageCount: 1,
		wordCount: 500
	};

	it('scores a resume without a job description without fake keyword points', () => {
		const results = scoreResume(goodResume);
		expect(results).toHaveLength(7);
		expect(results.some((result) => result.system === 'Gupy-like')).toBe(true);
		for (const result of results) {
			expect(result.overallScore).toBeGreaterThanOrEqual(0);
			expect(result.overallScore).toBeLessThanOrEqual(100);
			expect(result.breakdown.keywordMatch.score).toBe(0);
		}
		const average = results.reduce((sum, result) => sum + result.overallScore, 0) / results.length;
		expect(average).toBeGreaterThan(50);
	});

	it('scores a resume against a target job', () => {
		const job = `
			Senior Software Engineer
			Requirements:
			- 5+ years experience in JavaScript, TypeScript, React, Node.js, AWS and microservices
			- Bachelor's degree in Computer Science
			Preferred:
			- Docker, Kubernetes, PostgreSQL and Redis
		`;
		const results = scoreResume({ ...goodResume, jobDescription: job });
		expect(results).toHaveLength(7);
		for (const result of results) {
			expect(result.overallScore).toBeGreaterThanOrEqual(0);
			expect(result.overallScore).toBeLessThanOrEqual(100);
			expect(result.breakdown.keywordMatch.matched.length).toBeGreaterThan(0);
		}
		const gupy = results.find((result) => result.system === 'Gupy-like')!;
		expect(gupy.breakdown.keywordMatch.score).toBeGreaterThan(60);
		expect(gupy.breakdown.experience.score).toBeGreaterThan(60);
	});

	it('gives lower scores to a weak resume', () => {
		const weak: ScoringInput = {
			resumeText: 'I am a hard worker. I want a job. Please hire me.',
			resumeSkills: [],
			resumeSections: [],
			experienceBullets: [],
			educationText: '',
			hasMultipleColumns: true,
			hasTables: true,
			hasImages: true,
			pageCount: 4,
			wordCount: 15
		};
		const goodAverage = average(scoreResume(goodResume));
		const weakAverage = average(scoreResume(weak));
		expect(goodAverage).toBeGreaterThan(weakAverage);
	});

	it('produces deterministic results', () => {
		const first = scoreResume(goodResume);
		const second = scoreResume(goodResume);
		expect(first.map((result) => result.overallScore)).toEqual(
			second.map((result) => result.overallScore)
		);
	});

	it('produces different scores per ATS profile', () => {
		const scores = scoreResume(goodResume).map((result) => result.overallScore);
		expect(new Set(scores).size).toBeGreaterThan(1);
	});
});

describe('job description parser', () => {
	it('extracts English engineering requirements', () => {
		const parsed = parseJobDescription(`
			Senior Software Engineer
			Requirements:
			- 5+ years experience in JavaScript, TypeScript, React, Node.js, AWS, Docker and Kubernetes
			- Bachelor's degree in Computer Science
			Preferred:
			- Redis and PostgreSQL
		`);
		expect(parsed.extractedSkills.length).toBeGreaterThan(0);
		expect(parsed.requiredSkills.length).toBeGreaterThan(0);
		expect(parsed.preferredSkills).toEqual(expect.arrayContaining(['Redis', 'PostgreSQL']));
		expect(parsed.experienceLevel).toBe('senior');
		expect(parsed.minimumExperienceYears).toBe(5);
		expect(parsed.educationRequirement).toBe('bachelor');
		expect(parsed.roleType).toBe('engineering');
		expect(parsed.language).toBe('en');
	});

	it('extracts Portuguese requirements and desired skills', () => {
		const parsed = parseJobDescription(`
			Desenvolvedor Backend Sênior
			Requisitos obrigatórios:
			- 4 anos de experiência com TypeScript, Node.js, PostgreSQL e APIs REST
			- Graduação em Análise e Desenvolvimento de Sistemas
			Diferenciais:
			- Docker e Kubernetes
		`);
		expect(parsed.requiredSkills).toEqual(
			expect.arrayContaining(['TypeScript', 'Node.js', 'PostgreSQL'])
		);
		expect(parsed.preferredSkills).toEqual(expect.arrayContaining(['Docker', 'Kubernetes']));
		expect(parsed.minimumExperienceYears).toBe(4);
		expect(parsed.experienceLevel).toBe('mid');
		expect(parsed.educationRequirement).toBe('bachelor');
		expect(parsed.roleType).toBe('engineering');
		expect(parsed.language).toBe('pt-BR');
	});

	it('extracts healthcare and finance contexts', () => {
		const nursing = parseJobDescription(`
			Registered Nurse - ICU
			Requirements: 3+ years ICU experience and Bachelor of Science in Nursing
		`);
		expect(nursing.experienceLevel).toBe('mid');
		expect(nursing.roleType).toBe('healthcare');

		const finance = parseJobDescription(`
			Senior Financial Analyst
			Requirements: CPA, 5+ years in financial analysis, Excel, SAP and Master's degree
		`);
		expect(finance.experienceLevel).toBe('senior');
		expect(finance.roleType).toBe('finance');
		expect(finance.educationRequirement).toBe('master');
	});
});

function average(results: ReturnType<typeof scoreResume>): number {
	return results.reduce((sum, result) => sum + result.overallScore, 0) / results.length;
}
