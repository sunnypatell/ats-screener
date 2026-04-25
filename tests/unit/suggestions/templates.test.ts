import { describe, it, expect } from 'vitest';
import { classifySuggestion, getExampleFor } from '../../../src/lib/engine/suggestions/templates';

describe('classifySuggestion', () => {
	it('detects quantification cues', () => {
		expect(classifySuggestion('Add quantified impact to your bullets')).toBe('quantification');
		expect(classifySuggestion('Include metrics and concrete outcomes')).toBe('quantification');
		expect(classifySuggestion('Measure your impact with numbers')).toBe('quantification');
	});

	it('detects action-verb cues', () => {
		expect(classifySuggestion('Use stronger action verbs')).toBe('action-verbs');
		expect(classifySuggestion('Avoid passive voice')).toBe('action-verbs');
	});

	it('detects skills-section cues', () => {
		expect(classifySuggestion('add a dedicated skills section')).toBe('skills-section');
		expect(classifySuggestion('list your skills near the top')).toBe('skills-section');
	});

	it('detects missing-keyword cues', () => {
		expect(classifySuggestion('consider adding these terms from the job description')).toBe(
			'missing-keywords'
		);
		expect(classifySuggestion('Missing keyword: Docker')).toBe('missing-keywords');
	});

	it('detects short-resume cues', () => {
		expect(classifySuggestion('your resume appears short')).toBe('short-resume');
		expect(classifySuggestion('Add more detail about your experience')).toBe('short-resume');
	});

	it('detects sections cues', () => {
		expect(classifySuggestion('use standard section headers')).toBe('sections');
		expect(classifySuggestion('section header is non-standard')).toBe('sections');
	});

	it('detects format cues', () => {
		expect(classifySuggestion('avoid multi-column layouts')).toBe('format');
		expect(classifySuggestion('Resume contains tables which ATS systems often misread')).toBe(
			'format'
		);
		expect(classifySuggestion('keep within page limit')).toBe('format');
	});

	it('returns null for ambiguous text', () => {
		expect(classifySuggestion('Make your resume better')).toBeNull();
		expect(classifySuggestion('')).toBeNull();
	});
});

describe('getExampleFor', () => {
	it('returns a fully-populated example for classified text', () => {
		const example = getExampleFor('Add quantified impact');
		expect(example).not.toBeNull();
		expect(example?.type).toBe('quantification');
		expect(example?.tip.length).toBeGreaterThan(0);
		expect(example?.before.length).toBeGreaterThan(0);
		expect(example?.after.length).toBeGreaterThan(0);
	});

	it('returns null for unclassifiable text', () => {
		expect(getExampleFor('whatever')).toBeNull();
	});

	it('every type maps to a fully-populated example', () => {
		const types = [
			'quantification',
			'action-verbs',
			'skills-section',
			'missing-keywords',
			'short-resume',
			'sections',
			'format'
		];
		const probes = [
			'add quantified impact',
			'use stronger action verbs',
			'add a skills section',
			'missing keywords',
			'resume is short',
			'use standard section headers',
			'avoid multi-column layouts'
		];
		for (let i = 0; i < types.length; i++) {
			const ex = getExampleFor(probes[i]);
			expect(ex?.type).toBe(types[i]);
			expect(ex?.tip.length).toBeGreaterThan(10);
			expect(ex?.before.length).toBeGreaterThan(0);
			expect(ex?.after.length).toBeGreaterThan(0);
		}
	});
});
