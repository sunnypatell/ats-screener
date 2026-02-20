import { describe, it, expect } from 'vitest';
import { detectIndustry, getIndustrySkills, getSkillDomain } from '$engine/nlp/skills-taxonomy';

describe('skills-taxonomy', () => {
	it('detects technology industry from tech resume', () => {
		const text =
			'software engineer with experience in react, node.js, postgresql, docker, kubernetes';
		const industries = detectIndustry(text);

		expect(industries[0].industry).toBe('technology');
	});

	it('detects finance industry from finance resume', () => {
		const text =
			'financial analyst experienced in financial modeling, valuation, dcf analysis, bloomberg terminal';
		const industries = detectIndustry(text);

		expect(industries[0].industry).toBe('finance');
	});

	it('detects healthcare industry from medical resume', () => {
		const text =
			'registered nurse with experience in patient care, ehr, epic, hipaa compliance, bls certified';
		const industries = detectIndustry(text);

		expect(industries[0].industry).toBe('healthcare');
	});

	it('detects marketing industry from marketing resume', () => {
		const text =
			'digital marketer skilled in seo, sem, google analytics, content marketing, email marketing';
		const industries = detectIndustry(text);

		expect(industries[0].industry).toBe('marketing');
	});

	it('returns skills for a given industry', () => {
		const techSkills = getIndustrySkills('technology');

		expect(techSkills).toContain('react');
		expect(techSkills).toContain('python');
		expect(techSkills).toContain('docker');
		expect(techSkills.length).toBeGreaterThan(50);
	});

	it('finds domain for a specific skill', () => {
		expect(getSkillDomain('react')).toBe('frontend development');
		expect(getSkillDomain('docker')).toBe('cloud and devops');
		expect(getSkillDomain('financial modeling')).toBe('financial analysis');
		expect(getSkillDomain('patient care')).toBe('clinical');
	});

	it('returns null for unknown skills', () => {
		expect(getSkillDomain('unknownskill123')).toBeNull();
	});
});
