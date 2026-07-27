import { extractFirstDateRange } from './date-extractor';
import { normalizeLines } from './text-normalizer';
import type { CertificationEntry, ProjectEntry, ResumeSection } from './types';

const BULLET = /^[\s•\-*·▪►➤○●]+/;

const SKILL_ALIASES: Record<string, string> = {
	golang: 'Go',
	go: 'Go',
	typescript: 'TypeScript',
	javascript: 'JavaScript',
	python: 'Python',
	tsx: 'TSX',
	react: 'React',
	'react native': 'React Native',
	'next.js': 'Next.js',
	nextjs: 'Next.js',
	'node.js': 'Node.js',
	nodejs: 'Node.js',
	html5: 'HTML5',
	html: 'HTML',
	css3: 'CSS3',
	css: 'CSS',
	'tailwind css': 'Tailwind CSS',
	express: 'Express',
	fastapi: 'FastAPI',
	'restful apis': 'REST APIs',
	'rest api': 'REST APIs',
	'apis rest': 'REST APIs',
	microservices: 'Microservices',
	'microsservicos em go': 'Go Microservices',
	postgresql: 'PostgreSQL',
	mysql: 'MySQL',
	mongodb: 'MongoDB',
	git: 'Git',
	github: 'GitHub',
	docker: 'Docker',
	postman: 'Postman',
	selenium: 'Selenium',
	playwright: 'Playwright',
	beautifulsoup: 'BeautifulSoup',
	'web scraping': 'Web Scraping'
};

export function extractSkills(sections: ResumeSection[]): string[] {
	const found: string[] = [];
	for (const section of sections.filter((item) => item.type === 'skills')) {
		for (const rawLine of section.content.split('\n')) {
			const line = rawLine.replace(BULLET, '').trim();
			const payload = line.includes(':') ? line.slice(line.indexOf(':') + 1) : line;
			const candidates = payload
				.replace(/[()]/g, ',')
				.split(/[,|;•·▪]/)
				.map((item) => item.trim().replace(/[.]$/, ''))
				.filter(
					(item) =>
						item.length >= 1 &&
						item.length <= 40 &&
						item.split(/\s+/).length <= 5
				);
			for (const candidate of candidates) {
				const key = candidate
					.normalize('NFKD')
					.replace(/\p{M}/gu, '')
					.toLowerCase();
				const canonical = SKILL_ALIASES[key] ?? candidate;
				if (
					!/workflow automation|automacao de fluxos|automação de fluxos/i.test(
						canonical
					)
				) {
					found.push(canonical);
				}
			}
		}
	}
	return deduplicate(found, (item) => item.toLowerCase());
}

export function extractProjects(sections: ResumeSection[]): ProjectEntry[] {
	const entries: ProjectEntry[] = [];
	for (const section of sections.filter((item) => item.type === 'projects')) {
		for (const block of splitGenericEntries(section.content)) {
			const lines = normalizeLines(block.split('\n'));
			if (!lines.length) continue;
			const name = lines[0].replace(BULLET, '').trim();
			const bullets = lines
				.slice(1)
				.map((line) => line.replace(BULLET, '').trim())
				.filter(Boolean);
			const full = lines.join(' ');
			const technologies = extractSkills([
				{
					type: 'skills',
					header: '',
					content: full,
					startLine: 0,
					endLine: 0
				}
			]);
			entries.push({
				name,
				description: bullets.join(' '),
				technologies,
				bullets,
				url: full.match(/https?:\/\/[^\s)]+/)?.[0] ?? null,
				rawText: block
			});
		}
	}
	return entries;
}

export function extractCertifications(sections: ResumeSection[]): CertificationEntry[] {
	const entries: CertificationEntry[] = [];
	for (const section of sections.filter((item) => item.type === 'certifications')) {
		for (const line of section.content
			.split('\n')
			.map((item) => item.replace(BULLET, '').trim())
			.filter(Boolean)) {
			const parts = line.split(/\s*[-–—|]\s*/);
			entries.push({
				name: parts[0],
				issuer: parts[1]?.replace(/\d{4}.*/, '').trim() ?? '',
				date: extractFirstDateRange(line)?.start ?? null,
				rawText: line
			});
		}
	}
	return entries;
}

function splitGenericEntries(content: string): string[] {
	const lines = content.split('\n');
	const entries: string[] = [];
	let current: string[] = [];
	for (const line of lines) {
		if (BULLET.test(line) && current.length) {
			entries.push(current.join('\n'));
			current = [];
		}
		if (line.trim()) current.push(line);
	}
	if (current.length) entries.push(current.join('\n'));
	return entries;
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
