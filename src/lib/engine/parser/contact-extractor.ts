import type { ContactInfo } from './types';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
const LINKEDIN_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+\/?/i;
const GITHUB_REGEX = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+\/?/i;
const WEBSITE_REGEX =
	/https?:\/\/(?!.*(?:linkedin|github)\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/\S*)?/i;

// extracts contact info from the top ~10 lines of the resume
export function extractContact(lines: string[]): ContactInfo {
	// contact info is almost always in the first 10 lines
	const searchLines = lines.slice(0, Math.min(lines.length, 15));
	const searchText = searchLines.join('\n');

	const email = extractFirst(searchText, EMAIL_REGEX);
	const phone = extractFirst(searchText, PHONE_REGEX);
	const linkedin = extractFirst(searchText, LINKEDIN_REGEX);
	const github = extractFirst(searchText, GITHUB_REGEX);
	const website = extractFirst(searchText, WEBSITE_REGEX);
	const name = extractName(searchLines);
	const location = extractLocation(searchLines);

	return { name, email, phone, linkedin, github, website, location };
}

function extractFirst(text: string, regex: RegExp): string | null {
	const match = text.match(regex);
	return match ? match[0].trim() : null;
}

// extracts candidate name from first few lines (short, non-url, 2-5 word line)
function extractName(lines: string[]): string | null {
	for (const line of lines.slice(0, 5)) {
		const trimmed = line.trim();
		if (trimmed.length === 0) continue;
		if (trimmed.length > 50) continue;

		// skip if it contains obvious non-name content
		if (EMAIL_REGEX.test(trimmed)) continue;
		if (PHONE_REGEX.test(trimmed)) continue;
		if (/https?:\/\//.test(trimmed)) continue;
		if (/linkedin|github/i.test(trimmed)) continue;

		// name should have 2-5 words, all alphabetic (with possible hyphens/periods)
		const words = trimmed.split(/\s+/);
		if (words.length >= 2 && words.length <= 5) {
			const allAlpha = words.every((w) => /^[a-zA-Z][a-zA-Z.\-']*$/.test(w));
			if (allAlpha) return trimmed;
		}
	}

	return null;
}

// extracts location from contact section (e.g. "City, State" or "City, ST ZIP")
function extractLocation(lines: string[]): string | null {
	const locationPatterns = [
		// City, ST
		/[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}\b/,
		// City, State
		/[A-Z][a-zA-Z\s]+,\s*[A-Z][a-z]+(?:\s[A-Z][a-z]+)?/,
		// City, ST ZIP
		/[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}\s+\d{5}/,
		// City, Country
		/[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+/
	];

	for (const line of lines.slice(0, 10)) {
		const trimmed = line.trim();
		// skip lines that are clearly not location
		if (EMAIL_REGEX.test(trimmed)) continue;
		if (PHONE_REGEX.test(trimmed)) continue;
		if (/https?:\/\//.test(trimmed)) continue;

		for (const pattern of locationPatterns) {
			const match = trimmed.match(pattern);
			if (match) {
				const loc = match[0].trim();
				// filter out false positives
				if (loc.length > 5 && loc.length < 60) return loc;
			}
		}
	}

	return null;
}
