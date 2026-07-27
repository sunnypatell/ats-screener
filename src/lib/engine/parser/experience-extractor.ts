import { extractDateRanges, extractFirstDateRange, stripDateRanges } from './date-extractor';
import { normalizeLines } from './text-normalizer';
import type { ExperienceEntry, ResumeSection } from './types';

const BULLET = /^[\s•\-*·▪►➤○●]+/;
const ROLE_WORDS = /\b(?:developer|engineer|analyst|assistant|manager|director|coordinator|specialist|consultant|intern|apprentice|representative|designer|architect|administrator|desenvolvedor|engenheiro|analista|auxiliar|assistente|gerente|diretor|coordenador|especialista|consultor|estagiario|estagiário|aprendiz|promotor|operador|tecnico|técnico|servicos gerais|serviços gerais)\b/i;

export function extractExperienceEntries(sections: ResumeSection[]): ExperienceEntry[] {
	const entries: ExperienceEntry[] = [];
	for (const section of sections.filter((item) => item.type === 'experience')) {
		for (const block of splitExperienceEntries(section.content)) {
			const parsed = parseExperienceBlock(block);
			if (parsed && (parsed.title || parsed.company)) entries.push(parsed);
		}
	}
	return deduplicate(
		entries,
		(entry) => `${entry.company}|${entry.title}|${entry.dates.start}`.toLowerCase()
	);
}

function splitExperienceEntries(content: string): string[] {
	const lines = normalizeLines(content.split('\n'));
	const entries: string[] = [];
	let current: string[] = [];
	const flush = () => {
		if (current.some((line) => line.trim())) entries.push(current.join('\n'));
		current = [];
	};

	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];
		const clean = line.replace(BULLET, '').trim();
		if (/^(additional experience|outras? experiencias? profissionais?)$/i.test(clean)) {
			flush();
			continue;
		}

		const combinedWithNext = `${clean} ${lines[index + 1] ?? ''}`;
		const hasDate = extractDateRanges(clean).length > 0;
		const isBullet = BULLET.test(line);
		const bulletEntry =
			isBullet &&
			/[—–|]/.test(clean) &&
			(hasDate || extractDateRanges(combinedWithNext).length > 0);
		if (bulletEntry) {
			flush();
			current = [line];
			continue;
		}

		const nextHasDate = Boolean(
			lines[index + 1] && extractDateRanges(lines[index + 1]).length
		);
		const header = !isBullet && looksLikeJobHeader(clean) && nextHasDate;
		if (header && current.length) flush();
		if (
			!isBullet &&
			looksLikeJobHeader(clean) &&
			current.some((value) => extractDateRanges(value).length > 0)
		) {
			flush();
		}
		current.push(line);
	}
	flush();
	return entries;
}

function looksLikeJobHeader(line: string): boolean {
	if (!line || line.length > 160 || extractDateRanges(line).length > 0) return false;
	if (/\s(?:—|–|\|)\s/.test(line)) return true;
	const relation = line.match(/^(.+?)\s+(?:at|na|no)\s+(.+)$/i);
	if (relation && ROLE_WORDS.test(relation[1])) return true;
	return ROLE_WORDS.test(line) && line.split(/\s+/).length <= 14;
}

function parseExperienceBlock(block: string): ExperienceEntry | null {
	const lines = normalizeLines(block.split('\n'))
		.map((line) => line.trim())
		.filter(Boolean);
	if (!lines.length) return null;
	const full = lines.join(' ');
	const dates = extractFirstDateRange(full) ?? {
		start: null,
		end: null,
		isCurrent: false
	};
	const compactAdditional = BULLET.test(lines[0]) && dates.start !== null;
	const dateIndex = lines.findIndex((line) => extractDateRanges(line).length > 0);
	const rawHeader = compactAdditional ? full : lines[0].replace(BULLET, '').trim();
	const headerWithoutDate = stripDateRanges(rawHeader)
		.replace(BULLET, '')
		.replace(/[()]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	const headerParts = headerWithoutDate
		.split(/\s+[—–]\s+/)
		.map((part) => part.trim())
		.filter(Boolean);
	const headerForIdentity = headerParts.slice(0, 2).join(' — ') || headerWithoutDate;
	const { title, company } = parseJobHeader(
		headerForIdentity,
		!compactAdditional && dateIndex > 1 ? lines[1] : ''
	);

	const bullets: string[] = [];
	if (headerParts.length >= 3) bullets.push(headerParts.slice(2).join(' — '));
	if (!compactAdditional) {
		let activeBullet = bullets.length ? bullets.length - 1 : -1;
		for (let index = 1; index < lines.length; index++) {
			if (index === dateIndex) continue;
			const original = lines[index];
			const clean = stripDateRanges(original.replace(BULLET, ''))
				.replace(/^[-–—|()\s]+|[-–—|()\s]+$/g, '')
				.trim();
			if (!clean || looksLikeJobHeader(clean)) continue;
			if (BULLET.test(original)) {
				bullets.push(clean);
				activeBullet = bullets.length - 1;
			} else if (activeBullet >= 0) {
				bullets[activeBullet] = `${bullets[activeBullet]} ${clean}`.replace(/\s+/g, ' ');
			} else {
				bullets.push(clean);
				activeBullet = 0;
			}
		}
	}
	return {
		title,
		company,
		dates,
		bullets: deduplicate(
			bullets.map((bullet) => bullet.trim()).filter(Boolean),
			(item) => item.toLowerCase()
		),
		rawText: block
	};
}

function parseJobHeader(
	line1: string,
	line2: string
): { title: string; company: string } {
	const first = stripDateRanges(line1).replace(BULLET, '').trim();
	const second = stripDateRanges(line2).replace(BULLET, '').trim();
	const relation = first.match(/^(.+?)\s+(?:at|na|no)\s+(.+)$/i);
	if (relation && ROLE_WORDS.test(relation[1])) {
		return { title: relation[1].trim(), company: relation[2].trim() };
	}
	const parts = first
		.split(/\s*(?:\||—|–)\s*/)
		.map((part) => part.trim())
		.filter(Boolean);
	if (parts.length >= 2) {
		const leftIsRole = ROLE_WORDS.test(parts[0]);
		const rightIsRole = ROLE_WORDS.test(parts[1]);
		if (rightIsRole && !leftIsRole) return { company: parts[0], title: parts[1] };
		return { title: parts[0], company: parts[1] };
	}
	if (first && second) {
		if (ROLE_WORDS.test(second) && !ROLE_WORDS.test(first)) {
			return { company: first, title: second };
		}
		return { title: first, company: second };
	}
	return ROLE_WORDS.test(first)
		? { title: first, company: '' }
		: { title: '', company: first };
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
