import { parsePDF } from './pdf-parser';
import { parseDOCX } from './docx-parser';
import { detectSections } from './section-detector';
import { extractContact } from './contact-extractor';
import { extractDateRanges, extractFirstDateRange } from './date-extractor';
import type {
	ParseResult,
	ParsedResume,
	ExperienceEntry,
	EducationEntry,
	ProjectEntry,
	CertificationEntry,
	ResumeSection
} from './types';

// main entry point: parses PDF/DOCX into structured ParsedResume
export async function parseResume(file: File): Promise<ParseResult> {
	const errors: string[] = [];
	const warnings: string[] = [];

	const fileType = getFileType(file);
	if (!fileType) {
		return {
			success: false,
			resume: null,
			errors: [`unsupported file type: ${file.type || file.name.split('.').pop()}`],
			warnings: []
		};
	}

	try {
		let text: string;
		let lines: string[];
		let pageCount = 1;
		let hasMultipleColumns = false;
		let hasTables = false;
		let hasImages = false;

		if (fileType === 'pdf') {
			const result = await parsePDF(file);
			text = result.text;
			lines = result.lines;
			pageCount = result.pageCount;
			hasMultipleColumns = result.hasMultipleColumns;
			hasTables = result.hasTables;
			hasImages = result.hasImages;
		} else {
			const result = await parseDOCX(file);
			text = result.text;
			lines = result.lines;
			hasTables = result.hasTables;
			hasImages = result.hasImages;
		}

		if (text.trim().length === 0) {
			return {
				success: false,
				resume: null,
				errors: [
					'could not extract any text from the file. it may be an image-based PDF or corrupted.'
				],
				warnings: []
			};
		}

		if (hasMultipleColumns) {
			warnings.push('detected multi-column layout. text extraction order may be affected.');
		}

		if (hasTables) {
			warnings.push(
				'detected tables in the document. most ATS systems struggle with tabular layouts.'
			);
		}

		const contact = extractContact(lines);
		const sections = detectSections(lines);
		const experience = extractExperience(sections);
		const education = extractEducation(sections);
		const projects = extractProjects(sections);
		const certifications = extractCertifications(sections);
		const skills = extractSkills(sections);
		const summary = extractSummary(sections);

		const resume: ParsedResume = {
			rawText: text,
			lines,
			contact,
			sections,
			experience,
			education,
			projects,
			certifications,
			skills,
			summary,
			metadata: {
				fileType,
				pageCount,
				wordCount: text.split(/\s+/).filter(Boolean).length,
				lineCount: lines.length,
				hasMultipleColumns,
				hasTables,
				hasImages
			}
		};

		return { success: true, resume, errors, warnings };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'unknown parsing error';
		return {
			success: false,
			resume: null,
			errors: [`failed to parse ${fileType.toUpperCase()}: ${message}`],
			warnings: []
		};
	}
}

function getFileType(file: File): 'pdf' | 'docx' | null {
	if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) return 'pdf';
	if (
		file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
		file.name.endsWith('.docx')
	)
		return 'docx';
	return null;
}

// extracts structured experience entries from experience sections
function extractExperience(sections: ResumeSection[]): ExperienceEntry[] {
	const expSections = sections.filter((s) => s.type === 'experience');
	const entries: ExperienceEntry[] = [];

	for (const section of expSections) {
		const blocks = splitIntoEntries(section.content);

		for (const block of blocks) {
			const lines = block.split('\n').filter((l) => l.trim());
			if (lines.length === 0) continue;

			const firstLine = lines[0];
			const secondLine = lines.length > 1 ? lines[1] : '';
			const headerText = firstLine + ' ' + secondLine;

			const dateRange = extractFirstDateRange(headerText);
			const { title, company } = parseJobHeader(firstLine, secondLine);

			const bullets = lines
				.slice(title && company ? 2 : 1)
				.map((l) => l.replace(/^[\s•\-*·▪►➤○●]\s*/, '').trim())
				.filter((l) => l.length > 0);

			entries.push({
				title,
				company,
				dates: dateRange || { start: null, end: null, isCurrent: false },
				bullets,
				rawText: block
			});
		}
	}

	return entries;
}

// parses title/company from header. handles "Title | Co", "Title at Co", "Title, Co", two-line
function parseJobHeader(line1: string, line2: string): { title: string; company: string } {
	// remove date patterns from lines for cleaner parsing
	const cleanLine1 = line1
		.replace(
			/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}\s*[-–—]\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|present|current|now)/gi,
			''
		)
		.trim();
	const cleanLine2 = line2
		.replace(
			/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}\s*[-–—]\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|present|current|now)/gi,
			''
		)
		.trim();

	// try "Title | Company" or "Title - Company"
	const separatorMatch = cleanLine1.match(/^(.+?)\s*[|–—]\s*(.+)$/);
	if (separatorMatch) {
		return { title: separatorMatch[1].trim(), company: separatorMatch[2].trim() };
	}

	// try "Title at Company"
	const atMatch = cleanLine1.match(/^(.+?)\s+at\s+(.+)$/i);
	if (atMatch) {
		return { title: atMatch[1].trim(), company: atMatch[2].trim() };
	}

	// try "Title, Company"
	const commaMatch = cleanLine1.match(/^(.+?),\s*(.+)$/);
	if (commaMatch && commaMatch[2].length > 2) {
		return { title: commaMatch[1].trim(), company: commaMatch[2].trim() };
	}

	// two-line format: line1 is company or title, line2 is the other
	if (cleanLine1 && cleanLine2) {
		return { title: cleanLine2 || cleanLine1, company: cleanLine1 };
	}

	return { title: cleanLine1, company: '' };
}

// extracts structured education entries from education sections
function extractEducation(sections: ResumeSection[]): EducationEntry[] {
	const eduSections = sections.filter((s) => s.type === 'education');
	const entries: EducationEntry[] = [];

	for (const section of eduSections) {
		const blocks = splitIntoEntries(section.content);

		for (const block of blocks) {
			const lines = block.split('\n').filter((l) => l.trim());
			if (lines.length === 0) continue;

			const fullText = lines.join(' ');
			const dateRange = extractFirstDateRange(fullText);
			const { degree, field, institution } = parseEduHeader(lines);
			const gpa = extractGPA(fullText);
			const honors = extractHonors(lines);

			entries.push({
				degree,
				field,
				institution,
				dates: dateRange || { start: null, end: null, isCurrent: false },
				gpa,
				honors,
				rawText: block
			});
		}
	}

	return entries;
}

function parseEduHeader(lines: string[]): { degree: string; field: string; institution: string } {
	const degreePatterns =
		/\b(ph\.?d\.?|doctor|master'?s?|m\.?s\.?|m\.?a\.?|m\.?b\.?a\.?|bachelor'?s?|b\.?s\.?|b\.?a\.?|b\.?eng\.?|associate'?s?|a\.?s\.?|a\.?a\.?|diploma)\b/i;

	let degree = '';
	let field = '';
	let institution = '';

	for (const line of lines) {
		const cleaned = line.replace(/\d{4}\s*[-–—]\s*(?:\d{4}|present|current)/gi, '').trim();

		if (degreePatterns.test(cleaned) && !degree) {
			const match = cleaned.match(degreePatterns);
			if (match) {
				degree = match[0];
				// field often follows "in" or "of"
				const fieldMatch = cleaned.match(/(?:in|of)\s+(.+?)(?:\s*[-–—,|]|$)/i);
				if (fieldMatch) field = fieldMatch[1].trim();
				// if degree is on a line with the institution
				const afterDegree = cleaned
					.replace(degreePatterns, '')
					.replace(/(?:in|of)\s+.+/, '')
					.trim();
				if (afterDegree && !institution)
					institution = afterDegree.replace(/^[-–—,|\s]+|[-–—,|\s]+$/g, '');
			}
		} else if (!institution && cleaned.length > 3) {
			institution = cleaned.replace(/^[-–—,|\s]+|[-–—,|\s]+$/g, '');
		}
	}

	// if we couldn't separate, use best guesses
	if (!degree && !institution) {
		institution = lines[0]?.trim() || '';
		if (lines.length > 1) degree = lines[1]?.trim() || '';
	}

	return { degree, field, institution };
}

function extractGPA(text: string): string | null {
	const gpaMatch = text.match(/(?:gpa|g\.p\.a\.?)\s*:?\s*(\d+\.?\d*)\s*(?:\/\s*(\d+\.?\d*))?/i);
	if (gpaMatch) {
		return gpaMatch[2] ? `${gpaMatch[1]}/${gpaMatch[2]}` : gpaMatch[1];
	}
	return null;
}

function extractHonors(lines: string[]): string[] {
	const honorsKeywords =
		/\b(cum laude|magna cum laude|summa cum laude|dean'?s?\s*list|honors?|distinction|valedictorian|salutatorian)\b/i;
	return lines.filter((l) => honorsKeywords.test(l)).map((l) => l.trim());
}

// extracts project entries from project sections
function extractProjects(sections: ResumeSection[]): ProjectEntry[] {
	const projSections = sections.filter((s) => s.type === 'projects');
	const entries: ProjectEntry[] = [];

	for (const section of projSections) {
		const blocks = splitIntoEntries(section.content);

		for (const block of blocks) {
			const lines = block.split('\n').filter((l) => l.trim());
			if (lines.length === 0) continue;

			const name = lines[0].replace(/^[\s•\-*]\s*/, '').trim();
			const bullets = lines
				.slice(1)
				.map((l) => l.replace(/^[\s•\-*·▪►➤○●]\s*/, '').trim())
				.filter(Boolean);
			const fullText = lines.join(' ');

			// extract technologies from parentheses or "Technologies:" prefix
			const techMatch = fullText.match(/(?:\(([^)]+)\)|technologies?\s*:?\s*(.+?)(?:\.|$))/i);
			const technologies = techMatch
				? (techMatch[1] || techMatch[2])
						.split(/[,|;]/)
						.map((t) => t.trim())
						.filter(Boolean)
				: [];

			const urlMatch = fullText.match(/https?:\/\/[^\s)]+/);

			entries.push({
				name,
				description: bullets.join(' '),
				technologies,
				bullets,
				url: urlMatch ? urlMatch[0] : null,
				rawText: block
			});
		}
	}

	return entries;
}

// extracts certifications from certification sections
function extractCertifications(sections: ResumeSection[]): CertificationEntry[] {
	const certSections = sections.filter((s) => s.type === 'certifications');
	const entries: CertificationEntry[] = [];

	for (const section of certSections) {
		const lines = section.content.split('\n').filter((l) => l.trim());

		for (const line of lines) {
			const cleaned = line.replace(/^[\s•\-*·▪►➤○●]\s*/, '').trim();
			if (cleaned.length === 0) continue;

			// try to split "Certification Name - Issuer"
			const parts = cleaned.split(/\s*[-–—|]\s*/);
			const dateRange = extractFirstDateRange(cleaned);

			entries.push({
				name: parts[0].trim(),
				issuer: parts.length > 1 ? parts[1].replace(/\d{4}.*/, '').trim() : '',
				date: dateRange?.start || null,
				rawText: cleaned
			});
		}
	}

	return entries;
}

// extracts skills from skills sections. handles comma-separated, bullets, "Category: skill1, skill2"
function extractSkills(sections: ResumeSection[]): string[] {
	const skillSections = sections.filter((s) => s.type === 'skills');
	const skills: string[] = [];

	for (const section of skillSections) {
		const lines = section.content.split('\n').filter((l) => l.trim());

		for (const line of lines) {
			const cleaned = line.replace(/^[\s•\-*·▪►➤○●]\s*/, '').trim();
			if (cleaned.length === 0) continue;

			// handle "Category: skill1, skill2, skill3" format
			const colonSplit = cleaned.split(':');
			const skillPart = colonSplit.length > 1 ? colonSplit.slice(1).join(':') : cleaned;

			// split on commas, pipes, semicolons, or bullet-like separators
			const items = skillPart
				.split(/[,|;•·▪]/)
				.map((s) => s.trim())
				.filter((s) => s.length > 0 && s.length < 50);

			skills.push(...items);
		}
	}

	// deduplicate (case-insensitive)
	const seen = new Set<string>();
	return skills.filter((skill) => {
		const key = skill.toLowerCase();
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

// extracts the summary/objective section text
function extractSummary(sections: ResumeSection[]): string | null {
	const summarySection = sections.find((s) => s.type === 'summary');
	return summarySection ? summarySection.content.trim() : null;
}

// splits section content into entries using blank lines and date-containing headers as boundaries
function splitIntoEntries(content: string): string[] {
	const lines = content.split('\n');
	const entries: string[] = [];
	let current: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();

		// blank line might separate entries
		if (trimmed.length === 0) {
			if (current.length > 0) {
				entries.push(current.join('\n'));
				current = [];
			}
			continue;
		}

		// a line with a date range at the start of a new entry
		const hasDate = extractDateRanges(trimmed).length > 0;
		const isBullet = /^[\s•\-*·▪►➤○●]/.test(line);

		if (hasDate && !isBullet && current.length > 0 && current.some((l) => l.trim().length > 0)) {
			// check if the previous entry has bullets (indicating it's complete)
			const prevHasBullets = current.some((l) => /^[\s•\-*·▪►➤○●]/.test(l));
			if (prevHasBullets) {
				entries.push(current.join('\n'));
				current = [];
			}
		}

		current.push(line);
	}

	if (current.length > 0) {
		entries.push(current.join('\n'));
	}

	return entries.filter((e) => e.trim().length > 0);
}

export { parsePDF } from './pdf-parser';
export { parseDOCX } from './docx-parser';
export { detectSections } from './section-detector';
export { extractContact } from './contact-extractor';
export { extractDateRanges, extractFirstDateRange } from './date-extractor';
export type * from './types';
