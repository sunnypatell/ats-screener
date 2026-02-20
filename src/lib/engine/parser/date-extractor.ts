import type { DateRange } from './types';

const MONTH_NAMES = [
	'january', 'february', 'march', 'april', 'may', 'june',
	'july', 'august', 'september', 'october', 'november', 'december'
];

const MONTH_ABBREVS = [
	'jan', 'feb', 'mar', 'apr', 'may', 'jun',
	'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];

const CURRENT_INDICATORS = /\b(present|current|now|ongoing|today)\b/i;

// "Jan 2023 - Present", "January 2023 - December 2024", "01/2023 - 12/2024"
const DATE_RANGE_PATTERNS = [
	// Month Year - Month Year (or Present)
	/(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*\.?\s*\d{4})\s*[-–—~to]+\s*(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*\.?\s*\d{4}|present|current|now|ongoing|today)/gi,

	// MM/YYYY - MM/YYYY (or Present)
	/\d{1,2}\/\d{4}\s*[-–—~to]+\s*(?:\d{1,2}\/\d{4}|present|current|now|ongoing|today)/gi,

	// Year - Year (or Present)
	/\b(20\d{2}|19\d{2})\s*[-–—~to]+\s*(?:(20\d{2}|19\d{2})|present|current|now|ongoing|today)\b/gi,

	// Season Year - Season Year
	/(?:spring|summer|fall|autumn|winter)\s*\d{4}\s*[-–—~to]+\s*(?:(?:spring|summer|fall|autumn|winter)\s*\d{4}|present|current|now)/gi,

	// standalone "Month Year" (single date)
	/(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*\.?\s*\d{4}/gi
];

/**
 * extracts all date ranges from a block of text.
 * handles various formats: "Jan 2023 - Present", "2022 - 2024", "01/2023 - 12/2024"
 * prioritizes range patterns over standalone dates to avoid duplicates.
 */
export function extractDateRanges(text: string): DateRange[] {
	const ranges: DateRange[] = [];
	// track which character positions have already been matched
	const matchedSpans: Array<[number, number]> = [];

	for (const pattern of DATE_RANGE_PATTERNS) {
		const matches = text.matchAll(new RegExp(pattern));

		for (const match of matches) {
			const raw = match[0].trim();
			const start = match.index!;
			const end = start + match[0].length;

			// skip if this overlaps with an already-matched span
			const overlaps = matchedSpans.some(
				([s, e]) => start < e && end > s
			);
			if (overlaps) continue;

			const range = parseDateRange(raw);
			if (range) {
				ranges.push(range);
				matchedSpans.push([start, end]);
			}
		}
	}

	return ranges;
}

/**
 * parses a date range string into a structured DateRange.
 */
function parseDateRange(raw: string): DateRange | null {
	const isCurrent = CURRENT_INDICATORS.test(raw);

	// split on common separators
	const parts = raw.split(/\s*[-–—~]\s*|\s+to\s+/i);

	if (parts.length >= 2) {
		return {
			start: normalizeDate(parts[0].trim()),
			end: isCurrent ? null : normalizeDate(parts[1].trim()),
			isCurrent
		};
	}

	// single date
	return {
		start: normalizeDate(raw),
		end: null,
		isCurrent: false
	};
}

/**
 * normalizes a date string to "YYYY-MM" or "YYYY" format.
 */
function normalizeDate(dateStr: string): string | null {
	const cleaned = dateStr.trim().toLowerCase();

	if (CURRENT_INDICATORS.test(cleaned)) return null;

	// try MM/YYYY
	const slashMatch = cleaned.match(/(\d{1,2})\/(\d{4})/);
	if (slashMatch) {
		return `${slashMatch[2]}-${slashMatch[1].padStart(2, '0')}`;
	}

	// try Month Year
	for (let i = 0; i < MONTH_NAMES.length; i++) {
		const name = MONTH_NAMES[i];
		const abbrev = MONTH_ABBREVS[i];
		const monthNum = String(i + 1).padStart(2, '0');

		if (cleaned.includes(name) || cleaned.startsWith(abbrev)) {
			const yearMatch = cleaned.match(/\d{4}/);
			if (yearMatch) return `${yearMatch[0]}-${monthNum}`;
		}
	}

	// try standalone year
	const yearMatch = cleaned.match(/^(19|20)\d{2}$/);
	if (yearMatch) return yearMatch[0];

	// try season year
	const seasonMatch = cleaned.match(/(spring|summer|fall|autumn|winter)\s*(\d{4})/i);
	if (seasonMatch) {
		const seasonMonths: Record<string, string> = {
			spring: '03',
			summer: '06',
			fall: '09',
			autumn: '09',
			winter: '12'
		};
		const month = seasonMonths[seasonMatch[1].toLowerCase()];
		return `${seasonMatch[2]}-${month}`;
	}

	return null;
}

/**
 * extracts the first date range found in a line of text.
 * useful for parsing experience/education entries.
 */
export function extractFirstDateRange(text: string): DateRange | null {
	const ranges = extractDateRanges(text);
	return ranges.length > 0 ? ranges[0] : null;
}
