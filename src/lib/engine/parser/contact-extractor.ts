import type { ContactInfo } from './types';
import { normalizeContactText, normalizeTextFragment } from './text-normalizer';

const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,24}\b/i;
const PHONE_REGEX = /(?:\+\s?\d{1,3}[\s.-]*)?(?:\(?\d{2,3}\)?[\s.-]*)?\d{4,5}[\s.-]*\d{4}\b/;
const LINKEDIN_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in\/)?[\w-]+\/?/i;
const GITHUB_REGEX = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+\/?/i;
const WEBSITE_REGEX = /(?:https?:\/\/|www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s|]*)?/i;

export function extractContact(lines: string[]): ContactInfo {
	const searchLines = lines.slice(0, Math.min(lines.length, 20));
	const searchText = normalizeContactText(searchLines);

	const email = extractFirst(searchText, EMAIL_REGEX);
	const phone = normalizePhone(extractFirst(searchText, PHONE_REGEX));
	const linkedin = extractLinkedIn(searchText);
	const github = extractFirst(searchText, GITHUB_REGEX);
	const websiteCandidate = extractFirst(searchText, WEBSITE_REGEX);
	const website =
		websiteCandidate && !/(?:linkedin|github)\.com/i.test(websiteCandidate)
			? websiteCandidate
			: null;
	const name = extractName(searchLines);
	const location = extractLocation(searchLines);

	return { name, email, phone, linkedin, github, website, location };
}

function extractLinkedIn(text: string): string | null {
	const standard = extractFirst(text, LINKEDIN_REGEX);
	if (standard) return standard;
	const fallback = /linkedin\s*\.?\s*com\s*\/\s*(?:in\s*\/\s*)?([\w-]+)/i;
	const match = text.match(fallback);
	return match ? `linkedin.com/in/${match[1]}` : null;
}

function extractFirst(text: string, regex: RegExp): string | null {
	const match = text.match(regex);
	return match ? match[0].trim().replace(/[),.;]+$/, '') : null;
}

function normalizePhone(phone: string | null): string | null {
	if (!phone) return null;
	const digits = phone.replace(/\D/g, '');
	if (digits.length < 10 || digits.length > 15) return null;
	return phone.replace(/\s+/g, ' ').trim();
}

function extractName(lines: string[]): string | null {
	for (const original of lines.slice(0, 6)) {
		const trimmed = normalizeTextFragment(original)
			.replace(/^[^\p{L}]+/u, '')
			.trim();
		if (!trimmed || trimmed.length > 70) continue;
		if (EMAIL_REGEX.test(trimmed) || PHONE_REGEX.test(trimmed)) continue;
		if (/https?:\/\/|linkedin|github|whatsapp|software developer|desenvolvedor/i.test(trimmed)) {
			continue;
		}
		const words = trimmed.split(/\s+/);
		if (words.length < 2 || words.length > 6) continue;
		if (words.every((word) => /^[\p{L}][\p{L}.'-]*$/u.test(word))) {
			return trimmed;
		}
	}
	return null;
}

function extractLocation(lines: string[]): string | null {
	const patterns = [
		/\b(?:São Paulo|Rio de Janeiro|Belo Horizonte|Curitiba|Brasília|Porto Alegre|Salvador|Recife)(?:,\s*[A-Z]{2})?/iu,
		/\b\p{Lu}[\p{L}.'-]*(?:\s+\p{Lu}?[\p{L}.'-]*){0,3},\s*[A-Z]{2}\b/u,
		/\b\p{Lu}[\p{L}.'-]*(?:\s+\p{Lu}?[\p{L}.'-]*){0,3},\s*\p{Lu}[\p{L}.'-]*(?:\s+\p{Lu}?[\p{L}.'-]*){0,2}\b/u
	];
	for (const line of lines.slice(0, 12)) {
		const sanitized = normalizeTextFragment(line)
			.replace(EMAIL_REGEX, ' ')
			.replace(PHONE_REGEX, ' ')
			.replace(LINKEDIN_REGEX, ' ')
			.replace(GITHUB_REGEX, ' ')
			.replace(/\b(?:email|e-mail|whatsapp|phone|telefone|linkedin|github)\s*:?/gi, ' ')
			.replace(/\s+/g, ' ');
		for (const pattern of patterns) {
			const match = sanitized.match(pattern);
			if (match && match[0].length >= 5 && match[0].length < 70) {
				return match[0].trim();
			}
		}
	}
	return null;
}
