import { describe, it, expect } from 'vitest';
import { detectSections } from '$engine/parser/section-detector';

describe('section-detector', () => {
	it('detects standard section headers', () => {
		const lines = [
			'John Doe',
			'john@email.com',
			'',
			'EXPERIENCE',
			'Software Engineer at Google',
			'Jan 2023 - Present',
			'- Built scalable systems',
			'',
			'EDUCATION',
			'MIT',
			'BS Computer Science, 2022'
		];

		const sections = detectSections(lines);

		expect(sections.length).toBeGreaterThanOrEqual(3);

		const types = sections.map((s) => s.type);
		expect(types).toContain('contact');
		expect(types).toContain('experience');
		expect(types).toContain('education');
	});

	it('handles title-case headers with colons', () => {
		const lines = [
			'Jane Smith',
			'',
			'Skills:',
			'JavaScript, Python, React',
			'',
			'Projects:',
			'ATS Screener - resume parsing tool'
		];

		const sections = detectSections(lines);
		const types = sections.map((s) => s.type);

		expect(types).toContain('skills');
		expect(types).toContain('projects');
	});

	it('treats content before first header as contact info', () => {
		const lines = [
			'John Doe',
			'john@email.com | 555-1234',
			'linkedin.com/in/johndoe',
			'',
			'EXPERIENCE',
			'Some job details'
		];

		const sections = detectSections(lines);
		const contact = sections.find((s) => s.type === 'contact');

		expect(contact).toBeDefined();
		expect(contact!.content).toContain('John Doe');
		expect(contact!.content).toContain('john@email.com');
	});

	it('handles variations of section header names', () => {
		const lines = [
			'Name Here',
			'',
			'PROFESSIONAL EXPERIENCE',
			'Some experience',
			'',
			'ACADEMIC BACKGROUND',
			'Some education',
			'',
			'CORE COMPETENCIES',
			'Some skills',
			'',
			'NOTABLE PROJECTS',
			'Some projects'
		];

		const sections = detectSections(lines);
		const types = sections.map((s) => s.type);

		expect(types).toContain('experience');
		expect(types).toContain('education');
		expect(types).toContain('skills');
		expect(types).toContain('projects');
	});

	it('returns single unknown section if no headers found', () => {
		const lines = [
			'just some random text',
			'without any clear section structure',
			'more text here'
		];

		const sections = detectSections(lines);

		expect(sections.length).toBe(1);
		expect(sections[0].type).toBe('unknown');
	});

	it('detects certifications and awards sections', () => {
		const lines = [
			'Name',
			'',
			'CERTIFICATIONS',
			'AWS Solutions Architect',
			'',
			'HONORS & AWARDS',
			"Dean's List 2023"
		];

		const sections = detectSections(lines);
		const types = sections.map((s) => s.type);

		expect(types).toContain('certifications');
		expect(types).toContain('awards');
	});
});
