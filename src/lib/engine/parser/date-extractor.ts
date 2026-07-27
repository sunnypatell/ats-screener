import type { DateRange } from './types';

const MONTHS: Array<{ month: string; aliases: string[] }> = [
	{ month: '01', aliases: ['january', 'jan', 'janeiro'] },
	{ month: '02', aliases: ['february', 'feb', 'fevereiro', 'fev'] },
	{ month: '03', aliases: ['march', 'março', 'marco', 'mar'] },
	{ month: '04', aliases: ['april', 'apr', 'abril', 'abr'] },
	{ month: '05', aliases: ['may', 'maio', 'mai'] },
	{ month: '06', aliases: ['june', 'junho', 'jun'] },
	{ month: '07', aliases: ['july', 'julho', 'jul'] },
	{ month: '08', aliases: ['august', 'aug', 'agosto', 'ago'] },
	{ month: '09', aliases: ['september', 'sept', 'sep', 'setembro', 'set'] },
	{ month: '10', aliases: ['october', 'oct', 'outubro', 'out'] },
	{ month: '11', aliases: ['november', 'nov', 'novembro'] },
	{ month: '12', aliases: ['december', 'dec', 'dezembro', 'dez'] }
];

const MONTH_TOKEN = MONTHS.flatMap((entry) => entry.aliases)
	.sort((a, b) => b.length - a.length)
	.join('|');
const CURRENT_TOKEN = 'present|current|now|ongoing|today|presente|atual|hoje|em\\s+andamento';
const SEPARATOR = '(?:-|–|—|~|\\bto\\b|\\ba\\b|\\bat[eé]\\b)';
const CURRENT_INDICATORS = new RegExp(`\\b(?:${CURRENT_TOKEN})\\b`, 'i');

const DATE_RANGE_PATTERNS = [
	new RegExp(
		`(?:${MONTH_TOKEN})\\.?\\s*\\/?\\s*\\d{4}\\s*${SEPARATOR}\\s*(?:(?:${MONTH_TOKEN})\\.?\\s*\\/?\\s*\\d{4}|${CURRENT_TOKEN})`,
		'giu'
	),
	new RegExp(`\\d{1,2}\\/\\d{4}\\s*${SEPARATOR}\\s*(?:\\d{1,2}\\/\\d{4}|${CURRENT_TOKEN})`, 'giu'),
	new RegExp(`\\b(?:19|20)\\d{2}\\s*${SEPARATOR}\\s*(?:(?:19|20)\\d{2}|${CURRENT_TOKEN})\\b`, 'giu'),
	/(?:spring|summer|fall|autumn|winter)\s*\d{4}\s*(?:-|–|—|~|to)\s*(?:(?:spring|summer|fall|autumn|winter)\s*\d{4}|present|current|now)/giu,
	new RegExp(`(?:${MONTH_TOKEN})\\.?\\s*\\/?\\s*\\d{4}`, 'giu'),
	/\b(?:19|20)\d{2}\b/gu
];

export function extractDateRanges(text: string): DateRange[] {
	const ranges: DateRange[] = [];
	const matchedSpans: Array<[number, number]> = [];
	for (const pattern of DATE_RANGE_PATTERNS) {
		for (const match of text.matchAll(new RegExp(pattern.source, pattern.flags))) {
			const raw = match[0].trim();
			const start = match.index ?? 0;
			const end = start + match[0].length;
			if (matchedSpans.some(([s, e]) => start < e && end > s)) continue;
			const range = parseDateRange(raw);
			if (!range) continue;
			ranges.push(range);
			matchedSpans.push([start, end]);
		}
	}
	return ranges;
}

function parseDateRange(raw: string): DateRange | null {
	const isCurrent = CURRENT_INDICATORS.test(raw);
	const parts = raw.split(/\s*(?:-|–|—|~)\s*|\s+to\s+|\s+at[eé]\s+|\s+a\s+/iu);
	if (parts.length >= 2) {
		return {
			start: normalizeDate(parts[0]),
			end: isCurrent ? null : normalizeDate(parts[1]),
			isCurrent
		};
	}
	const start = normalizeDate(raw);
	return start ? { start, end: null, isCurrent: false } : null;
}

function normalizeDate(value: string): string | null {
	const cleaned = value
		.normalize('NFKD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.trim();
	if (CURRENT_INDICATORS.test(cleaned)) return null;
	const slash = cleaned.match(/\b(\d{1,2})\/(\d{4})\b/);
	if (slash) {
		const month = Number(slash[1]);
		if (month >= 1 && month <= 12) return `${slash[2]}-${String(month).padStart(2, '0')}`;
	}
	for (const entry of MONTHS) {
		if (entry.aliases.some((alias) => new RegExp(`\\b${alias.normalize('NFKD').replace(/\p{M}/gu, '')}\\b`, 'i').test(cleaned))) {
			const year = cleaned.match(/\b(?:19|20)\d{2}\b/);
			if (year) return `${year[0]}-${entry.month}`;
		}
	}
	const season = cleaned.match(/\b(spring|summer|fall|autumn|winter)\s*((?:19|20)\d{2})\b/i);
	if (season) {
		const seasonMonths: Record<string, string> = { spring: '03', summer: '06', fall: '09', autumn: '09', winter: '12' };
		return `${season[2]}-${seasonMonths[season[1].toLowerCase()]}`;
	}
	const year = cleaned.match(/^((?:19|20)\d{2})$/);
	return year ? year[1] : null;
}

export function extractFirstDateRange(text: string): DateRange | null {
	return extractDateRanges(text)[0] ?? null;
}

export function stripDateRanges(text: string): string {
	let result = text;
	for (const pattern of DATE_RANGE_PATTERNS.slice(0, 4)) result = result.replace(new RegExp(pattern.source, pattern.flags), ' ');
	return result.replace(/\s+/g, ' ').trim();
}
