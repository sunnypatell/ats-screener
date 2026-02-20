import { describe, it, expect } from 'vitest';
import { scoreSections } from '$engine/scorer/section-scorer';

describe('scoreSections', () => {
	it('returns 100 when all required sections are present', () => {
		const result = scoreSections(
			['contact', 'experience', 'education', 'skills'],
			['contact', 'experience', 'education', 'skills']
		);
		expect(result.score).toBe(100);
		expect(result.missing).toHaveLength(0);
		expect(result.present).toHaveLength(4);
	});

	it('returns 0 when no required sections are present', () => {
		const result = scoreSections(
			['projects', 'summary'],
			['contact', 'experience', 'education', 'skills']
		);
		expect(result.score).toBe(0);
		expect(result.missing).toHaveLength(4);
	});

	it('returns partial score for some missing sections', () => {
		const result = scoreSections(
			['contact', 'experience'],
			['contact', 'experience', 'education', 'skills']
		);
		expect(result.score).toBe(50);
		expect(result.present).toEqual(['contact', 'experience']);
		expect(result.missing).toEqual(['education', 'skills']);
	});

	it('handles case-insensitive matching', () => {
		const result = scoreSections(
			['Contact', 'EXPERIENCE', 'Education'],
			['contact', 'experience', 'education']
		);
		expect(result.score).toBe(100);
	});

	it('returns 100 when no sections are required', () => {
		const result = scoreSections(['experience'], []);
		expect(result.score).toBe(100);
	});

	it('handles extra sections without penalizing', () => {
		const result = scoreSections(
			['contact', 'experience', 'education', 'skills', 'projects', 'certifications'],
			['experience', 'education']
		);
		expect(result.score).toBe(100);
		expect(result.present).toEqual(['experience', 'education']);
	});
});
