import { extractFirstDateRange, stripDateRanges } from './date-extractor';
import { normalizeLines } from './text-normalizer';
import type { EducationEntry, ResumeSection } from './types';

const BULLET = /^[\s•\-*·▪►➤○●]+/;
const DEGREE_PATTERN = /\b(?:ph\.?d\.?|doctorate|doctor|doutorado|master'?s?|mestrado|mba|bachelor'?s?|bacharelado|licenciatura|associate'?s?|tecnologia|tecnologo|tecnólogo|technical degree|ensino tecnico|ensino técnico|curso tecnico|curso técnico|diploma|certificate|certificado|especializacao|especialização|pos-graduacao|pós-graduação)\b/i;

export function extractEducationEntries(sections: ResumeSection[]): EducationEntry[] {
	const entries: EducationEntry[] = [];
	for (const section of sections.filter((item) => item.type === 'education')) {
		for (const block of splitEntries(section.content)) {
			const lines = normalizeLines(block.split('\n'));
			const full = lines.join(' ');
			const degree = full.match(DEGREE_PATTERN)?.[0] ?? '';
			const fieldMatch = full.match(
				/(?:\bin\b|\bem\b|\bof\b)\s+([^|—–,]+?)(?=\s+(?:faculdade|universidade|university|college|senai|instituto|institute)\b|\||—|–|\b(?:expected|previsao|previsão|completed|concluido|concluído)\b|$)/i
			);
			const institutionMatch = full.match(
				/\b(?:Faculdade|Universidade|University|College|Instituto|Institute|SENAI|SENAC|IFSP|USP|UNESP|UNICAMP)[^|—–]*?(?=\s*(?:\||—|–|Expected|Previs|Completed|Conclu|\(|$))/i
			);
			const institution = institutionMatch?.[0].trim() ?? inferInstitution(lines, degree);
			const field = fieldMatch?.[1].trim() ?? inferField(full, degree);
			entries.push({
				degree,
				field,
				institution,
				dates: extractFirstDateRange(full) ?? { start: null, end: null, isCurrent: false },
				gpa: extractGPA(full),
				honors: lines.filter((line) =>
					/cum laude|dean'?s list|honors?|distinction|honras?|destaque academico/i.test(line)
				),
				rawText: block
			});
		}
	}
	return deduplicate(
		entries.filter((entry) => entry.degree || entry.institution),
		(entry) => `${entry.degree}|${entry.institution}|${entry.dates.start}`.toLowerCase()
	);
}

function splitEntries(content: string): string[] {
	const lines = normalizeLines(content.split('\n'));
	const entries: string[] = [];
	let current: string[] = [];
	for (const line of lines) {
		const startsEntry = BULLET.test(line) && DEGREE_PATTERN.test(line.replace(BULLET, ''));
		if (startsEntry && current.length) {
			entries.push(current.join('\n'));
			current = [];
		}
		current.push(line);
	}
	if (current.length) entries.push(current.join('\n'));
	return entries.filter(
		(entry) =>
			DEGREE_PATTERN.test(entry) ||
			/universidade|university|faculdade|college|senai/i.test(entry)
	);
}

function inferInstitution(lines: string[], degree: string): string {
	for (const line of lines) {
		const clean = line.replace(BULLET, '').trim();
		if (
			clean === degree ||
			DEGREE_PATTERN.test(clean) ||
			/^principais|^key coursework/i.test(clean)
		) {
			continue;
		}
		if (
			/\b(?:faculdade|universidade|university|college|senai|senac|instituto|institute)\b/i.test(clean)
		) {
			return stripDateRanges(clean).split(/\||—|–/)[0].trim();
		}
	}
	return '';
}

function inferField(text: string, degree: string): string {
	const clean = text.replace(degree, ' ');
	const known = clean.match(
		/\b(?:Systems Analysis and Development|Analise e Desenvolvimento de Sistemas|Análise e Desenvolvimento de Sistemas|Computer Science|Software Engineering|Engenharia de Software|Railway Transportation|Transporte Ferroviario|Transporte Ferroviário)\b/i
	);
	return known?.[0] ?? '';
}

function extractGPA(text: string): string | null {
	const match = text.match(
		/(?:gpa|media|média)\s*:?[ ]*(\d+[.,]?\d*)\s*(?:\/\s*(\d+[.,]?\d*))?/i
	);
	return match ? (match[2] ? `${match[1]}/${match[2]}` : match[1]) : null;
}

function deduplicate<T>(values: T[], key: (value: T) => string): T[] {
	const seen = new Set<string>();
	return values.filter((value) => {
		const current = key(value);
		if (!current || seen.has(current)) return false;
		seen.add(current);
		return true;
	});
}
