import { describe, it, expect } from 'vitest';
import { scoreEducation } from '$engine/scorer/education-scorer';

describe('scoreEducation', () => {
	it('returns low score for empty education', () => {
		const result = scoreEducation('');
		expect(result.score).toBeLessThanOrEqual(30);
		expect(result.notes.some((n) => n.includes('no education'))).toBe(true);
	});

	it('detects degree types', () => {
		const result = scoreEducation('Bachelor of Science in Computer Science, MIT, 2022');
		expect(result.notes.some((n) => n.includes('degree detected'))).toBe(true);
		expect(result.score).toBeGreaterThan(50);
	});

	it('detects institution names', () => {
		const result = scoreEducation('BS in Engineering, Massachusetts Institute of Technology');
		expect(result.score).toBeGreaterThan(40);
	});

	it('rewards graduation dates', () => {
		const withDate = scoreEducation('Bachelor of Science, University of Waterloo, 2023');
		const withoutDate = scoreEducation('Bachelor of Science, University of Waterloo');
		expect(withDate.score).toBeGreaterThan(withoutDate.score);
	});

	it('detects GPA', () => {
		const result = scoreEducation('BS Computer Science, Stanford University, 2022, GPA: 3.8/4.0');
		expect(result.notes.some((n) => n.includes('GPA'))).toBe(true);
	});

	it('flags low GPA', () => {
		const result = scoreEducation('BA in History, State University, 2021, GPA: 2.5/4.0');
		expect(result.notes.some((n) => n.includes('consider removing'))).toBe(true);
	});

	it('detects honors', () => {
		const result = scoreEducation(
			"Bachelor's in Biology, Harvard University, 2020, Magna Cum Laude, Dean's List"
		);
		expect(result.notes.some((n) => n.includes('honors'))).toBe(true);
		expect(result.score).toBeGreaterThan(60);
	});

	it('caps at 100', () => {
		const result = scoreEducation(
			"Ph.D. in Computer Science, Stanford University, 2023, GPA: 4.0/4.0, Summa Cum Laude, Dean's List"
		);
		expect(result.score).toBeLessThanOrEqual(100);
	});
});
