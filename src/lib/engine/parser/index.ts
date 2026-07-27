import { extractContact } from './contact-extractor';
import {
	extractCertifications,
	extractProjects,
	extractSkills
} from './content-extractors';
import { extractEducationEntries } from './education-extractor';
import { extractExperienceEntries } from './experience-extractor';
import { detectSections } from './section-detector';
import { detectLanguage, normalizeLines, textQualityScore } from './text-normalizer';
import type { ParsedResume, ParseResult } from './types';

interface BaseMetadata {
	fileType: 'pdf' | 'docx' | 'text';
	pageCount: number;
	hasMultipleColumns: boolean;
	hasTables: boolean;
	hasImages: boolean;
	extractionMethod: 'text-layer' | 'ocr' | 'docx' | 'pasted-text';
	baseQuality: number;
}

export async function parseResume(file: File): Promise<ParseResult> {
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
		let text = '';
		let lines: string[] = [];
		let pageCount = 1;
		let hasMultipleColumns = false;
		let hasTables = false;
		let hasImages = false;
		let extractionMethod: BaseMetadata['extractionMethod'] =
			fileType === 'pdf' ? 'text-layer' : 'docx';
		let baseQuality = 100;
		const warnings: string[] = [];

		if (fileType === 'pdf') {
			const { parsePDF } = await import('./pdf-parser');
			const result = await parsePDF(file);
			({ text, lines, pageCount, hasMultipleColumns, hasTables, hasImages } = result);
			baseQuality = result.quality;

			if (result.needsOCR) {
				const ocr = await requestOCR(file);
				if (ocr) {
					text = ocr.text;
					lines = ocr.lines;
					pageCount = ocr.pageCount;
					extractionMethod = 'ocr';
					baseQuality = textQualityScore(text, lines);
					hasMultipleColumns = false;
					hasTables = false;
					warnings.push(
						'text layer was low quality; self-hosted OCR (por+eng) was used'
					);
				} else {
					warnings.push('text layer quality is low and OCR was unavailable');
				}
			}
		} else {
			const { parseDOCX } = await import('./docx-parser');
			const result = await parseDOCX(file);
			({ text, lines, hasTables, hasImages } = result);
			baseQuality = textQualityScore(text, lines);
		}

		lines = normalizeLines(lines.length ? lines : text.split(/\r?\n/));
		text = lines.join('\n');
		if (!text.trim()) {
			return {
				success: false,
				resume: null,
				errors: ['could not extract readable text from the file'],
				warnings
			};
		}

		const resume = buildResume(text, lines, {
			fileType,
			pageCount,
			hasMultipleColumns,
			hasTables,
			hasImages,
			extractionMethod,
			baseQuality
		});

		if (hasMultipleColumns) {
			warnings.push('detected a probable multi-column layout');
		}
		if (hasTables) {
			warnings.push('detected repeated aligned columns that resemble a table');
		}
		if (resume.metadata.extractionQuality < 65) {
			warnings.push(
				'some extracted fields have low confidence; review the structured result'
			);
		}
		return { success: true, resume, errors: [], warnings };
	} catch (cause) {
		const message = cause instanceof Error ? cause.message : 'unknown parsing error';
		return {
			success: false,
			resume: null,
			errors: [`failed to parse ${fileType.toUpperCase()}: ${message}`],
			warnings: []
		};
	}
}

async function requestOCR(
	file: File
): Promise<{ text: string; lines: string[]; pageCount: number } | null> {
	try {
		const form = new FormData();
		form.set('file', file);
		const response = await fetch('/api/ocr', { method: 'POST', body: form });
		if (!response.ok) return null;
		const payload = (await response.json()) as {
			text?: string;
			lines?: string[];
			pageCount?: number;
		};
		if (!payload.text) return null;
		return {
			text: payload.text,
			lines: normalizeLines(payload.lines ?? payload.text.split(/\r?\n/)),
			pageCount: payload.pageCount ?? 1
		};
	} catch {
		return null;
	}
}

function getFileType(file: File): 'pdf' | 'docx' | null {
	const name = file.name.toLowerCase();
	if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
	if (
		file.type ===
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
		name.endsWith('.docx')
	) {
		return 'docx';
	}
	return null;
}

export function parseResumeText(rawText: string): ParseResult {
	const lines = normalizeLines(rawText.replace(/\r\n/g, '\n').split('\n'));
	const text = lines.join('\n');
	if (!text.trim()) {
		return {
			success: false,
			resume: null,
			errors: ['pasted resume text is empty'],
			warnings: []
		};
	}
	const wordCount = text.split(/\s+/).filter(Boolean).length;
	const resume = buildResume(text, lines, {
		fileType: 'text',
		pageCount: Math.max(1, Math.ceil(wordCount / 500)),
		hasMultipleColumns: false,
		hasTables: false,
		hasImages: false,
		extractionMethod: 'pasted-text',
		baseQuality: textQualityScore(text, lines)
	});
	return { success: true, resume, errors: [], warnings: [] };
}

function buildResume(
	text: string,
	lines: string[],
	metadata: BaseMetadata
): ParsedResume {
	const contact = extractContact(lines);
	const sections = detectSections(lines);
	const experience = extractExperienceEntries(sections);
	const education = extractEducationEntries(sections);
	const projects = extractProjects(sections);
	const certifications = extractCertifications(sections);
	const skills = extractSkills(sections);
	const summary =
		sections.find((section) => section.type === 'summary')?.content.trim() || null;
	const knownSections = sections.filter((section) => section.type !== 'unknown').length;
	const contactFields = Object.values(contact).filter(Boolean).length;
	const structureScore = Math.min(
		100,
		knownSections * 11 +
			Math.min(25, experience.length * 5) +
			Math.min(15, education.length * 7) +
			Math.min(15, skills.length) +
			Math.min(10, contactFields * 2)
	);
	const extractionQuality = Math.round(
		metadata.baseQuality * 0.55 + structureScore * 0.45
	);

	return {
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
			fileType: metadata.fileType,
			pageCount: metadata.pageCount,
			wordCount: text.split(/\s+/).filter(Boolean).length,
			lineCount: lines.length,
			hasMultipleColumns: metadata.hasMultipleColumns,
			hasTables: metadata.hasTables,
			hasImages: metadata.hasImages,
			extractionMethod: metadata.extractionMethod,
			extractionQuality,
			language: detectLanguage(text)
		}
	};
}

export { detectSections } from './section-detector';
export { extractContact } from './contact-extractor';
export { extractDateRanges, extractFirstDateRange } from './date-extractor';
export type * from './types';
