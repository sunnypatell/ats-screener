import { describe, it, expect } from 'vitest';
import { scoreResume } from '$engine/scorer/engine';
import { parseJobDescription } from '$engine/job-parser/extractor';
import type { ScoringInput } from '$engine/scorer/types';

// end-to-end pipeline test: simulates what the scanner page does
// after parseResume() extracts data from a file

describe('full pipeline: scoring input -> results', () => {
	// simulates a well-structured software engineer resume
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
		educationText:
			'Bachelor of Science in Computer Science, University of Waterloo, 2019, GPA: 3.7/4.0',
		hasMultipleColumns: false,
		hasTables: false,
		hasImages: false,
		pageCount: 1,
		wordCount: 500
	};

	it('scores a resume without JD (general mode)', () => {
		const results = scoreResume(goodResume);

		// should return 6 results for 6 ATS profiles
		expect(results).toHaveLength(6);

		// every score should be between 0 and 100
		for (const r of results) {
			expect(r.overallScore).toBeGreaterThanOrEqual(0);
			expect(r.overallScore).toBeLessThanOrEqual(100);
			expect(r.breakdown).toBeDefined();
			expect(r.system).toBeTruthy();
			expect(r.vendor).toBeTruthy();
		}

		// a good resume should average above 50
		const avg = results.reduce((s, r) => s + r.overallScore, 0) / results.length;
		expect(avg).toBeGreaterThan(50);

		console.log('--- general mode scores ---');
		for (const r of results) {
			console.log(`  ${r.system} (${r.vendor}): ${r.overallScore} ${r.passesFilter ? '✓' : '✗'}`);
		}
		console.log(`  average: ${Math.round(avg)}`);
	});

	it('scores a resume with JD (targeted mode)', () => {
		const jd =
			'Looking for a Senior Software Engineer with 5+ years experience in JavaScript, TypeScript, React, Node.js, and AWS. Must have experience with microservices, CI/CD, and team leadership.';

		const results = scoreResume({ ...goodResume, jobDescription: jd });

		expect(results).toHaveLength(6);
		for (const r of results) {
			expect(r.overallScore).toBeGreaterThanOrEqual(0);
			expect(r.overallScore).toBeLessThanOrEqual(100);
			// with a matching JD, keyword scores should be higher
			expect(r.breakdown.keywordMatch.matched.length).toBeGreaterThan(0);
		}

		const avg = results.reduce((s, r) => s + r.overallScore, 0) / results.length;
		console.log('--- targeted mode scores ---');
		for (const r of results) {
			console.log(
				`  ${r.system}: ${r.overallScore} | keywords: ${r.breakdown.keywordMatch.matched.length} matched, ${r.breakdown.keywordMatch.missing.length} missing`
			);
		}
		console.log(`  average: ${Math.round(avg)}`);
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

		const good = scoreResume(goodResume);
		const bad = scoreResume(weak);

		const goodAvg = good.reduce((s, r) => s + r.overallScore, 0) / good.length;
		const badAvg = bad.reduce((s, r) => s + r.overallScore, 0) / bad.length;

		expect(goodAvg).toBeGreaterThan(badAvg);

		console.log('--- good vs weak ---');
		console.log(`  good avg: ${Math.round(goodAvg)}`);
		console.log(`  weak avg: ${Math.round(badAvg)}`);
		console.log(`  difference: ${Math.round(goodAvg - badAvg)} points`);
	});

	it('produces deterministic results', () => {
		const a = scoreResume(goodResume);
		const b = scoreResume(goodResume);

		for (let i = 0; i < a.length; i++) {
			expect(a[i].overallScore).toBe(b[i].overallScore);
			expect(a[i].passesFilter).toBe(b[i].passesFilter);
			expect(a[i].breakdown.formatting.score).toBe(b[i].breakdown.formatting.score);
			expect(a[i].breakdown.keywordMatch.score).toBe(b[i].breakdown.keywordMatch.score);
		}
	});

	it('produces different scores per ATS system', () => {
		const results = scoreResume(goodResume);
		const scores = results.map((r) => r.overallScore);
		// not all systems should give the exact same score
		const unique = new Set(scores);
		expect(unique.size).toBeGreaterThan(1);
	});
});

describe('job description parser', () => {
	it('extracts skills from a tech JD', () => {
		const jd = `
			Senior Software Engineer at Google
			Requirements:
			- 5+ years experience in JavaScript, TypeScript, React
			- Experience with Node.js, AWS, Docker, Kubernetes
			- Bachelor's degree in Computer Science or related field
			Preferred:
			- Experience with GraphQL, Redis, PostgreSQL
			- Agile/Scrum methodology
		`;

		const parsed = parseJobDescription(jd);
		expect(parsed.extractedSkills.length).toBeGreaterThan(0);
		expect(parsed.requiredSkills.length).toBeGreaterThan(0);
		expect(parsed.experienceLevel).toBe('senior');
		expect(parsed.educationRequirement).toContain("Bachelor");
		expect(parsed.roleType).toBe('engineering');

		console.log('--- parsed JD ---');
		console.log(`  skills: ${parsed.extractedSkills.join(', ')}`);
		console.log(`  required: ${parsed.requiredSkills.join(', ')}`);
		console.log(`  preferred: ${parsed.preferredSkills.join(', ')}`);
		console.log(`  level: ${parsed.experienceLevel}`);
		console.log(`  education: ${parsed.educationRequirement}`);
		console.log(`  role: ${parsed.roleType}`);
		console.log(`  industry: ${parsed.industryContext}`);
	});

	it('extracts skills from a non-tech JD (nursing)', () => {
		const jd = `
			Registered Nurse - ICU
			Requirements:
			- Active RN license
			- 3+ years ICU/Critical Care experience
			- BLS and ACLS certification required
			- Bachelor of Science in Nursing (BSN)
			Preferred:
			- CCRN certification
			- Epic EMR experience
		`;

		const parsed = parseJobDescription(jd);
		expect(parsed.experienceLevel).toBe('mid');
		expect(parsed.roleType).toBe('healthcare');

		console.log('--- nursing JD ---');
		console.log(`  skills: ${parsed.extractedSkills.join(', ')}`);
		console.log(`  level: ${parsed.experienceLevel}`);
		console.log(`  role: ${parsed.roleType}`);
		console.log(`  industry: ${parsed.industryContext}`);
	});

	it('extracts skills from a finance JD', () => {
		const jd = `
			Senior Financial Analyst
			Requirements:
			- CPA or CFA preferred
			- 5+ years in financial analysis or accounting
			- Advanced Excel, PowerPoint, SAP
			- MBA or Master's degree in Finance
		`;

		const parsed = parseJobDescription(jd);
		expect(parsed.experienceLevel).toBe('senior');
		expect(parsed.roleType).toBe('finance');
		expect(parsed.educationRequirement).toContain("Master");

		console.log('--- finance JD ---');
		console.log(`  skills: ${parsed.extractedSkills.join(', ')}`);
		console.log(`  level: ${parsed.experienceLevel}`);
		console.log(`  role: ${parsed.roleType}`);
		console.log(`  industry: ${parsed.industryContext}`);
	});
});
