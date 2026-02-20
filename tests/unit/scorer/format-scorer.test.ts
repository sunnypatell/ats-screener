import { describe, it, expect } from 'vitest';
import { scoreFormatting } from '$engine/scorer/format-scorer';
import type { ScoringInput } from '$engine/scorer/types';

function makeInput(overrides: Partial<ScoringInput> = {}): ScoringInput {
	return {
		resumeText: 'Software Engineer with 5 years of experience in building scalable applications.',
		resumeSkills: ['javascript', 'react', 'node.js'],
		resumeSections: ['contact', 'experience', 'education', 'skills'],
		experienceBullets: ['Led a team of 5 engineers to deliver a product on time'],
		educationText: 'Bachelor of Science in Computer Science, University of Toronto, 2020',
		hasMultipleColumns: false,
		hasTables: false,
		hasImages: false,
		pageCount: 1,
		wordCount: 450,
		...overrides
	};
}

describe('scoreFormatting', () => {
	it('gives high score for clean single-column resume', () => {
		const result = scoreFormatting(makeInput(), 0.9);
		expect(result.score).toBeGreaterThanOrEqual(90);
		expect(result.issues).toHaveLength(0);
		expect(result.details.some((d) => d.includes('clean single-column'))).toBe(true);
	});

	it('penalizes multi-column layouts scaled by strictness', () => {
		const strict = scoreFormatting(makeInput({ hasMultipleColumns: true }), 0.9);
		const lenient = scoreFormatting(makeInput({ hasMultipleColumns: true }), 0.35);

		expect(strict.score).toBeLessThan(lenient.score);
		expect(strict.issues).toContain('multi-column layout detected');
	});

	it('penalizes tables', () => {
		const result = scoreFormatting(makeInput({ hasTables: true }), 0.9);
		expect(result.issues).toContain('tables detected in resume');
		expect(result.score).toBeLessThan(100);
	});

	it('penalizes images', () => {
		const result = scoreFormatting(makeInput({ hasImages: true }), 0.9);
		expect(result.issues).toContain('images or graphics detected');
	});

	it('penalizes resumes longer than 2 pages', () => {
		const result = scoreFormatting(makeInput({ pageCount: 4 }), 0.9);
		expect(result.issues.some((i) => i.includes('4 pages'))).toBe(true);
	});

	it('penalizes very short resumes', () => {
		const result = scoreFormatting(makeInput({ wordCount: 80 }), 0.9);
		expect(result.issues).toContain('resume appears very short');
	});

	it('penalizes very long resumes', () => {
		const result = scoreFormatting(makeInput({ wordCount: 2000 }), 0.9);
		expect(result.issues).toContain('resume is quite long');
	});

	it('never returns score below 0 or above 100', () => {
		const worst = scoreFormatting(
			makeInput({
				hasMultipleColumns: true,
				hasTables: true,
				hasImages: true,
				pageCount: 5,
				wordCount: 50
			}),
			1.0
		);
		expect(worst.score).toBeGreaterThanOrEqual(0);
		expect(worst.score).toBeLessThanOrEqual(100);
	});
});
