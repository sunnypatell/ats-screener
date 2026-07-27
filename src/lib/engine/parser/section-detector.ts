import type { ResumeSection, SectionType } from './types';

// Normalize headings before matching. PDF generators frequently prefix headings
// with emoji/icons and may emit accented characters in decomposed form.
function normalizeHeader(header: string): string {
	return header
		.normalize('NFKD')
		.replace(/\p{M}/gu, '')
		.replace(/[^\p{L}\p{N}&/+\s]/gu, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

// Maps common English and Portuguese resume section headers to canonical types.
const SECTION_PATTERNS: Record<SectionType, RegExp[]> = {
	contact: [
		/^(contact\s*(info(rmation)?)?|personal\s*(info(rmation)?|details))$/i,
		/^(contato|informacoes?\s*(pessoais|de\s*contato)|dados\s*pessoais)$/i
	],
	summary: [
		/^(summary|profile|about(\s*me)?|objective|professional\s*summary|career\s*summary|executive\s*summary|personal\s*statement)$/i,
		/^(resumo(\s*profissional)?|perfil\s*profissional|objetivo(\s*profissional)?|sobre\s*mim|apresentacao\s*profissional)$/i
	],
	experience: [
		/^(experience|work\s*experience|professional\s*experience|employment(\s*history)?|work\s*history|relevant\s*experience|career\s*history)$/i,
		/^(experiencia(\s*profissional)?|historico\s*profissional|historico\s*de\s*trabalho|trajetoria\s*profissional)$/i
	],
	education: [
		/^(education|academic(\s*background)?|educational\s*background|qualifications|academic\s*qualifications)$/i,
		/^(formacao(\s*academica)?|educacao|escolaridade|qualificacoes\s*academicas)$/i
	],
	skills: [
		/^(skills|technical\s*skills|core\s*competencies|competencies|areas?\s*of\s*expertise|proficiencies|technologies|tools?\s*(&|and)\s*technologies)$/i,
		/^(competencias(\s*tecnicas)?|habilidades(\s*tecnicas)?|conhecimentos(\s*tecnicos)?|tecnologias|ferramentas|tecnologias\s*(&|e)\s*ferramentas)$/i
	],
	projects: [
		/^(projects|personal\s*projects|academic\s*projects|notable\s*projects|selected\s*projects|key\s*projects|side\s*projects|technical\s*repositories|projects\s*(&|and)\s*(technical\s*)?repositories)$/i,
		/^(projetos|projetos\s*pessoais|projetos\s*academicos|projetos\s*tecnicos|repositorios\s*tecnicos|repositorios\s*(&|e)\s*projetos\s*tecnicos)$/i
	],
	certifications: [
		/^(certifications?|licenses?(\s*(&|and)\s*certifications?)?|professional\s*certifications?|accreditations?)$/i,
		/^(certificacoes?|licencas?(\s*(&|e)\s*certificacoes?)?|cursos\s*(&|e)\s*certificacoes?)$/i
	],
	awards: [
		/^(awards?|honors?(\s*(&|and)\s*awards?)?|achievements?|recognition|scholarships?)$/i,
		/^(premios?|honras?|conquistas?|reconhecimentos?)$/i
	],
	publications: [
		/^(publications?|research|papers?|presentations?)$/i,
		/^(publicacoes?|pesquisas?|artigos?|apresentacoes?)$/i
	],
	volunteer: [
		/^(volunteer(ing)?(\s*experience)?|community\s*(service|involvement)|extracurricular(\s*activities)?)$/i,
		/^(voluntariado|experiencia\s*voluntaria|trabalho\s*voluntario|atividades\s*extracurriculares)$/i
	],
	languages: [
		/^(languages?|language\s*proficiency)$/i,
		/^(idiomas?|proficiencia\s*em\s*idiomas?)$/i
	],
	interests: [
		/^(interests?|hobbies(\s*(&|and)\s*interests?)?)$/i,
		/^(interesses?|hobbies(\s*(&|e)\s*interesses?)?)$/i
	],
	unknown: []
};

// Checks if a line is a section header using pattern matching and heuristics.
function isSectionHeader(line: string, prevLine: string | null, nextLine: string | null): boolean {
	const trimmed = line.trim();
	if (trimmed.length === 0 || trimmed.length > 100) return false;

	const cleaned = normalizeHeader(trimmed);
	if (!cleaned) return false;

	for (const patterns of Object.values(SECTION_PATTERNS)) {
		if (patterns.some((p) => p.test(cleaned))) return true;
	}

	// Heuristic: all caps, short, and looks like a header.
	const isAllCaps = cleaned === cleaned.toUpperCase() && /\p{L}/u.test(cleaned);
	const isShort = cleaned.split(/\s+/).length <= 6;
	const hasNoNumbers = !/\d{3,}/.test(cleaned);
	const prevIsBlank = prevLine === null || prevLine.trim().length === 0;

	if (isAllCaps && isShort && hasNoNumbers && prevIsBlank) return true;

	// Heuristic: title case, ends with colon.
	if (trimmed.endsWith(':') && isShort) return true;

	// Heuristic: visually separated category label.
	const isAlphaOnly = /^[\p{L}\s&,/]+$/u.test(cleaned);
	const wordCount = cleaned.split(/\s+/).length;
	const nextIsContent = nextLine !== null && nextLine.trim().length > 0;
	const isLikelyName =
		wordCount >= 2 &&
		wordCount <= 5 &&
		/^\p{Lu}[\p{L}'-]+(?:\s+\p{Lu}[\p{L}'-]+)+$/u.test(cleaned);

	if (isAlphaOnly && isShort && prevIsBlank && nextIsContent && !isLikelyName && cleaned.length > 2)
		return true;

	return false;
}

function classifySection(header: string): SectionType {
	const cleaned = normalizeHeader(header);

	for (const [type, patterns] of Object.entries(SECTION_PATTERNS)) {
		if (patterns.some((p: RegExp) => p.test(cleaned))) return type as SectionType;
	}

	return 'unknown';
}

// Detects and extracts sections from resume lines with type, header, content, and line ranges.
export function detectSections(lines: string[]): ResumeSection[] {
	const sections: ResumeSection[] = [];
	const headerIndices: { index: number; header: string; type: SectionType }[] = [];

	for (let i = 0; i < lines.length; i++) {
		const prevLine = i > 0 ? lines[i - 1] : null;
		const nextLine = i < lines.length - 1 ? lines[i + 1] : null;

		if (isSectionHeader(lines[i], prevLine, nextLine)) {
			const type = classifySection(lines[i]);
			headerIndices.push({ index: i, header: lines[i].trim(), type });
		}
	}

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

	// Content before the first header is normally the contact block.
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
