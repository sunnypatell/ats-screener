import type { ResumeSection, SectionType } from './types';

/**
 * maps common resume section headers to their canonical types.
 * handles variations across industries and formats.
 */
const SECTION_PATTERNS: Record<SectionType, RegExp[]> = {
	contact: [
		/^(contact\s*(info(rmation)?)?|personal\s*(info(rmation)?|details))$/i
	],
	summary: [
		/^(summary|profile|about(\s*me)?|objective|professional\s*summary|career\s*summary|executive\s*summary|personal\s*statement)$/i
	],
	experience: [
		/^(experience|work\s*experience|professional\s*experience|employment(\s*history)?|work\s*history|relevant\s*experience|career\s*history)$/i
	],
	education: [
		/^(education|academic(\s*background)?|educational\s*background|qualifications|academic\s*qualifications)$/i
	],
	skills: [
		/^(skills|technical\s*skills|core\s*competencies|competencies|areas?\s*of\s*expertise|proficiencies|technologies|tools?\s*(&|and)\s*technologies)$/i
	],
	projects: [
		/^(projects|personal\s*projects|academic\s*projects|notable\s*projects|selected\s*projects|key\s*projects|side\s*projects)$/i
	],
	certifications: [
		/^(certifications?|licenses?(\s*(&|and)\s*certifications?)?|professional\s*certifications?|accreditations?)$/i
	],
	awards: [
		/^(awards?|honors?(\s*(&|and)\s*awards?)?|achievements?|recognition|scholarships?)$/i
	],
	publications: [
		/^(publications?|research|papers?|presentations?)$/i
	],
	volunteer: [
		/^(volunteer(ing)?(\s*experience)?|community\s*(service|involvement)|extracurricular(\s*activities)?)$/i
	],
	languages: [
		/^(languages?|language\s*proficiency)$/i
	],
	interests: [
		/^(interests?|hobbies(\s*(&|and)\s*interests?)?)$/i
	],
	unknown: []
};

/**
 * heuristics for identifying section headers:
 * - all caps or title case
 * - short (1-5 words)
 * - often followed by a colon or horizontal rule
 * - may be preceded by a blank line
 */
function isSectionHeader(line: string, prevLine: string | null, nextLine: string | null): boolean {
	const trimmed = line.trim();

	if (trimmed.length === 0 || trimmed.length > 80) return false;

	// check against known patterns
	const cleaned = trimmed.replace(/[:\-_|]/g, '').trim();
	for (const patterns of Object.values(SECTION_PATTERNS)) {
		if (patterns.some((p) => p.test(cleaned))) return true;
	}

	// heuristic: all caps, short, and looks like a header
	const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
	const isShort = trimmed.split(/\s+/).length <= 5;
	const hasNoNumbers = !/\d{3,}/.test(trimmed); // avoid matching phone numbers, dates
	const prevIsBlank = prevLine === null || prevLine.trim().length === 0;

	if (isAllCaps && isShort && hasNoNumbers && prevIsBlank) return true;

	// heuristic: title case, ends with colon
	if (trimmed.endsWith(':') && isShort) return true;

	// heuristic: line is visually separated and looks like a category label
	// must be preceded by blank line AND have content after it
	const isAlphaOnly = /^[a-zA-Z\s&,/]+$/.test(cleaned);
	const wordCount = cleaned.split(/\s+/).length;
	const nextIsContent = nextLine !== null && nextLine.trim().length > 0;
	// avoid matching personal names (typically 2-3 title-case words at document start)
	const isLikelyName = wordCount >= 2 && wordCount <= 3 && /^[A-Z][a-z]+ [A-Z]/.test(cleaned);

	if (isAlphaOnly && isShort && prevIsBlank && nextIsContent && !isLikelyName && cleaned.length > 2) return true;

	return false;
}

/**
 * classifies a section header string into a canonical section type.
 */
function classifySection(header: string): SectionType {
	const cleaned = header.replace(/[:\-_|]/g, '').trim();

	for (const [type, patterns] of Object.entries(SECTION_PATTERNS)) {
		if (patterns.some((p: RegExp) => p.test(cleaned))) {
			return type as SectionType;
		}
	}

	return 'unknown';
}

/**
 * detects and extracts sections from resume text.
 * returns an array of sections with their type, header, content, and line ranges.
 */
export function detectSections(lines: string[]): ResumeSection[] {
	const sections: ResumeSection[] = [];
	const headerIndices: { index: number; header: string; type: SectionType }[] = [];

	// first pass: identify all section headers
	for (let i = 0; i < lines.length; i++) {
		const prevLine = i > 0 ? lines[i - 1] : null;
		const nextLine = i < lines.length - 1 ? lines[i + 1] : null;

		if (isSectionHeader(lines[i], prevLine, nextLine)) {
			const type = classifySection(lines[i]);
			headerIndices.push({ index: i, header: lines[i].trim(), type });
		}
	}

	// if no headers detected, treat the entire text as a single unknown section
	if (headerIndices.length === 0) {
		return [
			{
				type: 'unknown',
				header: '',
				content: lines.join('\n'),
				startLine: 0,
				endLine: lines.length - 1
			}
		];
	}

	// extract content between headers
	// content before first header is often contact info
	if (headerIndices[0].index > 0) {
		const contactContent = lines.slice(0, headerIndices[0].index).join('\n').trim();
		if (contactContent.length > 0) {
			sections.push({
				type: 'contact',
				header: '',
				content: contactContent,
				startLine: 0,
				endLine: headerIndices[0].index - 1
			});
		}
	}

	for (let i = 0; i < headerIndices.length; i++) {
		const current = headerIndices[i];
		const nextIndex = i < headerIndices.length - 1 ? headerIndices[i + 1].index : lines.length;

		const contentLines = lines.slice(current.index + 1, nextIndex);
		const content = contentLines.join('\n').trim();

		sections.push({
			type: current.type,
			header: current.header,
			content,
			startLine: current.index,
			endLine: nextIndex - 1
		});
	}

	return sections;
}
