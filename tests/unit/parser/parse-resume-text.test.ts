import { describe, it, expect } from 'vitest';
import { parseResumeText } from '../../../src/lib/engine/parser';

describe('parseResumeText: empty input', () => {
	it('returns success: false on empty string', () => {
		const result = parseResumeText('');
		expect(result.success).toBe(false);
		expect(result.resume).toBeNull();
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it('returns success: false on whitespace-only input', () => {
		const result = parseResumeText('   \n\n   \t  ');
		expect(result.success).toBe(false);
		expect(result.resume).toBeNull();
	});
});

describe('parseResumeText: structural extraction', () => {
	const sampleResume = `Sunny Patel
sunnypatel@example.com
Toronto, ON

EXPERIENCE
Software Engineer at Acme Corp
Jan 2024 - Present
- Built a thing that scales to 50k users
- Shipped a feature that reduced costs by 30%

EDUCATION
Bachelor of Science in Computer Science
University of Toronto
2020 - 2024
GPA: 3.9/4.0

SKILLS
JavaScript, TypeScript, Python, Svelte, React, Node.js
`;

	it('returns success: true on a normal resume', () => {
		const result = parseResumeText(sampleResume);
		expect(result.success).toBe(true);
		expect(result.resume).not.toBeNull();
	});

	it('extracts the raw text and lines', () => {
		const result = parseResumeText(sampleResume);
		expect(result.resume?.rawText).toContain('Sunny Patel');
		expect(result.resume?.rawText).toContain('Software Engineer');
		expect(result.resume?.lines.length).toBeGreaterThan(5);
	});

	it('detects experience and education sections', () => {
		const result = parseResumeText(sampleResume);
		const sectionTypes = result.resume?.sections.map((s) => s.type) ?? [];
		expect(sectionTypes).toContain('experience');
		expect(sectionTypes).toContain('education');
	});

	it('extracts at least one experience entry', () => {
		const result = parseResumeText(sampleResume);
		expect(result.resume?.experience.length).toBeGreaterThan(0);
	});

	it('extracts skills from the skills section', () => {
		const result = parseResumeText(sampleResume);
		const skills = result.resume?.skills.map((s) => s.toLowerCase()) ?? [];
		expect(skills.length).toBeGreaterThan(0);
		expect(skills.some((s) => s.includes('javascript') || s.includes('typescript'))).toBe(true);
	});
});

describe('parseResumeText: metadata', () => {
	it('counts words correctly', () => {
		const result = parseResumeText('one two three four five');
		expect(result.resume?.metadata.wordCount).toBe(5);
	});

	it('reports a line count matching the input', () => {
		const result = parseResumeText('line one\nline two\nline three');
		expect(result.resume?.metadata.lineCount).toBe(3);
	});

	it('reports zero columns / tables / images for plain text input', () => {
		const result = parseResumeText('plain text resume content');
		expect(result.resume?.metadata.hasMultipleColumns).toBe(false);
		expect(result.resume?.metadata.hasTables).toBe(false);
		expect(result.resume?.metadata.hasImages).toBe(false);
	});

	it('estimates pageCount as at least 1', () => {
		const result = parseResumeText('short');
		expect(result.resume?.metadata.pageCount).toBeGreaterThanOrEqual(1);
	});

	it('estimates pageCount higher for longer input', () => {
		// 600 short words; 500-wpm heuristic gives ceil(600/500) = 2
		const longText = Array.from({ length: 600 }, () => 'word').join(' ');
		const result = parseResumeText(longText);
		expect(result.resume?.metadata.pageCount).toBeGreaterThanOrEqual(2);
	});

	it('normalizes CRLF line endings to LF', () => {
		const result = parseResumeText('line one\r\nline two\r\n');
		expect(result.resume?.lines.length).toBe(2);
		expect(result.resume?.rawText).not.toContain('\r');
	});
});

describe('parseResumeText: result shape compatibility', () => {
	it('returns the same ParseResult shape as the file-based parser', () => {
		const result = parseResumeText('test resume content with experience and skills');
		expect(result).toHaveProperty('success');
		expect(result).toHaveProperty('resume');
		expect(result).toHaveProperty('errors');
		expect(result).toHaveProperty('warnings');
		expect(Array.isArray(result.errors)).toBe(true);
		expect(Array.isArray(result.warnings)).toBe(true);
	});

	it('populates every ParsedResume top-level field', () => {
		const result = parseResumeText('test resume');
		const r = result.resume;
		expect(r).not.toBeNull();
		if (!r) return;
		expect(r.rawText).toBeDefined();
		expect(Array.isArray(r.lines)).toBe(true);
		expect(r.contact).toBeDefined();
		expect(Array.isArray(r.sections)).toBe(true);
		expect(Array.isArray(r.experience)).toBe(true);
		expect(Array.isArray(r.education)).toBe(true);
		expect(Array.isArray(r.projects)).toBe(true);
		expect(Array.isArray(r.certifications)).toBe(true);
		expect(Array.isArray(r.skills)).toBe(true);
		expect(r.metadata).toBeDefined();
	});
});
