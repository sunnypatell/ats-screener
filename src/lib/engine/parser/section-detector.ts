import type { ResumeSection, SectionType } from './types';
import { normalizeTextFragment } from './text-normalizer';

export function normalizeHeader(header: string): string {
	return normalizeTextFragment(header)
		.normalize('NFKD')
		.replace(/\p{M}/gu, '')
		.replace(/[^\p{L}\p{N}&/+\s]/gu, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

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
		/^(experience|work\s*experience|professional\s*experience|employment(\s*history)?|work\s*history|relevant\s*experience|career\s*history|additional\s*experience)$/i,
		/^(experiencia(s)?(\s*profissional(is)?)?|historico\s*profissional|historico\s*de\s*trabalho|trajetoria\s*profissional|outras?\s*experiencias?\s*profissionais?)$/i
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
		/^(certifications?|licenses?(\s*(&|and)\s*certifications?)?|professional\s*certifications?|accreditations?|courses?\s*(&|and)\s*certifications?)$/i,
		/^(certificacoes?|licencas?(\s*(&|e)\s*certificacoes?)?|cursos(\s*(&|e)\s*certificacoes?)?)$/i
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

function classifySection(header: string): SectionType {
	const cleaned = normalizeHeader(header);
	for (const [type, patterns] of Object.entries(SECTION_PATTERNS)) {
		if (patterns.some((pattern) => pattern.test(cleaned))) return type as SectionType;
	}
	return 'unknown';
}

function looksLikePersonName(line: string, index: number): boolean {
	if (index > 4) return false;
	const cleaned = normalizeHeader(line);
	const words = cleaned.split(/\s+/).filter(Boolean);
	if (words.length < 2 || words.length > 6) return false;
	if (/\d|@|linkedin|github|developer|desenvolvedor|engineer/i.test(cleaned)) return false;
	return words.every((word) => /^\p{L}[\p{L}'-]*$/u.test(word));
}

function isSectionHeader(lines: string[], index: number): boolean {
	const line = lines[index] ?? '';
	const trimmed = line.trim();
	if (!trimmed || trimmed.length > 100) return false;
	const cleaned = normalizeHeader(trimmed);
	if (!cleaned) return false;
	if (classifySection(cleaned) !== 'unknown') return true;
	if (looksLikePersonName(trimmed, index)) return false;
	if (index < 3) return false;
	const previousBlank = index === 0 || !lines[index - 1]?.trim();
	const nextHasContent = Boolean(lines[index + 1]?.trim());
	const short = cleaned.split(/\s+/).length <= 5;
	const allCaps = cleaned === cleaned.toUpperCase() && /\p{L}/u.test(cleaned);
	const colonHeading = trimmed.endsWith(':');
	return previousBlank && nextHasContent && short && (allCaps || colonHeading);
}

export function detectSections(lines: string[]): ResumeSection[] {
	const sections: ResumeSection[] = [];
	const headers: Array<{ index: number; header: string; type: SectionType }> = [];
	for (let index = 0; index < lines.length; index++) {
		if (!isSectionHeader(lines, index)) continue;
		headers.push({ index, header: lines[index].trim(), type: classifySection(lines[index]) });
	}
	if (headers.length === 0) {
		return [{ type: 'unknown', header: '', content: lines.join('\n'), startLine: 0, endLine: Math.max(0, lines.length - 1) }];
	}
	if (headers[0].index > 0) {
		const content = lines.slice(0, headers[0].index).join('\n').trim();
		if (content) sections.push({ type: 'contact', header: '', content, startLine: 0, endLine: headers[0].index - 1 });
	}
	for (let i = 0; i < headers.length; i++) {
		const current = headers[i];
		const end = i + 1 < headers.length ? headers[i + 1].index : lines.length;
		sections.push({
			type: current.type,
			header: current.header,
			content: lines.slice(current.index + 1, end).join('\n').trim(),
			startLine: current.index,
			endLine: end - 1
		});
	}
	const merged: ResumeSection[] = [];
	for (const section of sections.filter((section) => section.content || section.type === 'contact')) {
		const previous = merged[merged.length - 1];
		if (previous && previous.type === section.type && section.type !== 'unknown') {
			previous.content = [previous.content, section.content].filter(Boolean).join('\n');
			previous.endLine = section.endLine;
			continue;
		}
		merged.push(section);
	}
	return merged;
}
