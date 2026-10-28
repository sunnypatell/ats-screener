import { extractContact } from '$engine/parser/contact-extractor';

// gemini's unpaid tier may use inputs to improve google's products and lets human reviewers
// read them, so direct identifiers never leave the server. typed placeholders keep
// "contact info present" scoreable.

const EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PROFILE_URL = /(?:https?:\/\/)?(?:www\.)?(linkedin|github)\.com\/(?:in\/)?[\w-]+\/?/gi;
const URL = /https?:\/\/[^\s)>\]]+/g;
// a leading + is a strong enough signal to take any 8-15 digit run; the lookbehind spares "C++17"
const INTL_PHONE = /(?<![\w+])\+\d[\d\s().-]{6,18}\d/g;
// ten digits with optional separators, so date ranges, years and metrics are left alone
const PHONE = /(?:\b1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
// headings and titles the name heuristic would otherwise take for a two-word name
const NOT_A_NAME =
	/\b(resume|curriculum|vitae|cv|engineer|developer|manager|analyst|designer|consultant|specialist|scientist|intern|summary|profile|objective|experience|education|skills|contact)\b/i;

export function redactContactDetails(text: string): string {
	const { name } = extractContact(text.split('\n').filter((l) => !NOT_A_NAME.test(l)));
	const out = text
		.replace(EMAIL, '[email]')
		.replace(PROFILE_URL, (_, site: string) => `[${site.toLowerCase()}]`)
		.replace(URL, '[website]')
		.replace(INTL_PHONE, '[phone]')
		.replace(PHONE, '[phone]');
	return name ? out.replaceAll(name, '[name]') : out;
}
