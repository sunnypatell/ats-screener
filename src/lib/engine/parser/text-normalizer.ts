const LABELS = [
	'Email',
	'E-mail',
	'GitHub',
	'LinkedIn',
	'WhatsApp',
	'Telefone',
	'Phone',
	'Mobile',
	'Celular'
];

const LIGATURES: Record<string, string> = {
	'ﬁ': 'fi',
	'ﬂ': 'fl',
	'ﬀ': 'ff',
	'ﬃ': 'ffi',
	'ﬄ': 'ffl'
};

export function normalizeTextFragment(value: string): string {
	let text = value.normalize('NFKC');
	for (const [from, to] of Object.entries(LIGATURES)) text = text.replaceAll(from, to);
	return text
		.replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
		.replace(/[‐‑‒]/g, '-')
		.replace(/[“”]/g, '"')
		.replace(/[‘’]/g, "'")
		.replace(/\u00a0/g, ' ')
		.replace(/[ \t]+/g, ' ')
		.trim();
}

export function normalizeLines(lines: string[]): string[] {
	const normalized = lines.map(normalizeTextFragment).filter(Boolean);
	return repairWrappedTokens(normalized);
}

function repairWrappedTokens(lines: string[]): string[] {
	const result: string[] = [];
	for (const line of lines) {
		const previous = result[result.length - 1];
		if (
			previous &&
			/[A-Za-zÀ-ÿ0-9]-$/.test(previous) &&
			/^[a-zà-ÿ]/.test(line) &&
			!/@|https?:|www\./i.test(previous)
		) {
			result[result.length - 1] = previous.slice(0, -1) + line;
			continue;
		}
		result.push(line);
	}
	return result;
}

export function normalizeContactText(lines: string[]): string {
	let text = normalizeLines(lines).join(' | ');
	const labels = LABELS.join('|').replace('-', '\\-');
	text = text.replace(new RegExp(`(?<=[A-Za-z0-9._%+@/-])(?=(?:${labels})\\s*:?)`, 'gi'), ' | ');
	text = text.replace(/\s*\|\s*/g, ' | ');
	return text;
}

export function detectLanguage(text: string): 'pt-BR' | 'en' {
	const normalized = text.toLocaleLowerCase('pt-BR');
	const pt = (normalized.match(/\b(?:experiência|formação|habilidades|competências|desenvolvimento|atuação|curso|presente|conclusão|dados|projetos)\b/g) || []).length;
	const en = (normalized.match(/\b(?:experience|education|skills|development|present|summary|projects|degree|responsibilities|professional)\b/g) || []).length;
	return pt > en ? 'pt-BR' : 'en';
}

export function textQualityScore(text: string, lines: string[]): number {
	if (!text.trim()) return 0;
	const chars = text.length;
	const words = text.split(/\s+/).filter(Boolean).length;
	const replacement = (text.match(/�/g) || []).length;
	const controls = (text.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g) || []).length;
	const alphaNumeric = (text.match(/[\p{L}\p{N}]/gu) || []).length;
	const readableRatio = alphaNumeric / Math.max(1, chars);
	let score = 100;
	if (chars < 120) score -= 45;
	if (words < 25) score -= 30;
	if (lines.length < 6) score -= 20;
	score -= Math.min(30, replacement * 5 + controls * 3);
	if (readableRatio < 0.45) score -= 25;
	return Math.max(0, Math.min(100, Math.round(score)));
}
