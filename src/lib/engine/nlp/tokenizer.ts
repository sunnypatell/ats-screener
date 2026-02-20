// stop words to exclude from keyword analysis (common english words with no semantic weight)
const STOP_WORDS = new Set([
	'a',
	'an',
	'the',
	'and',
	'or',
	'but',
	'in',
	'on',
	'at',
	'to',
	'for',
	'of',
	'with',
	'by',
	'from',
	'as',
	'is',
	'was',
	'are',
	'were',
	'be',
	'been',
	'being',
	'have',
	'has',
	'had',
	'do',
	'does',
	'did',
	'will',
	'would',
	'could',
	'should',
	'may',
	'might',
	'shall',
	'can',
	'need',
	'not',
	'no',
	'nor',
	'so',
	'if',
	'then',
	'than',
	'too',
	'very',
	'just',
	'about',
	'above',
	'after',
	'again',
	'all',
	'also',
	'am',
	'any',
	'because',
	'before',
	'between',
	'both',
	'each',
	'few',
	'further',
	'get',
	'got',
	'here',
	'how',
	'i',
	'into',
	'it',
	'its',
	'me',
	'more',
	'most',
	'my',
	'myself',
	'now',
	'only',
	'other',
	'our',
	'out',
	'over',
	'own',
	'same',
	'she',
	'he',
	'her',
	'him',
	'his',
	'some',
	'such',
	'that',
	'their',
	'them',
	'there',
	'these',
	'they',
	'this',
	'those',
	'through',
	'under',
	'until',
	'up',
	'us',
	'we',
	'what',
	'when',
	'where',
	'which',
	'while',
	'who',
	'whom',
	'why',
	'you',
	'your',
	'etc',
	'ie',
	'eg',
	'per',
	'via'
]);

export interface Token {
	raw: string;
	normalized: string;
	position: number;
}

// tokenizes text into terms: lowercase, strip punctuation, filter stop words
export function tokenize(text: string): Token[] {
	const words = text.split(/[\s,;|]+/);
	const tokens: Token[] = [];

	for (let i = 0; i < words.length; i++) {
		const raw = words[i];
		// strip leading/trailing punctuation but preserve internal hyphens and dots
		const cleaned = raw.replace(/^[^a-zA-Z0-9#+]+|[^a-zA-Z0-9#+]+$/g, '');
		if (cleaned.length === 0) continue;

		const normalized = cleaned.toLowerCase();
		if (STOP_WORDS.has(normalized)) continue;
		if (normalized.length < 2) continue;

		tokens.push({ raw: cleaned, normalized, position: i });
	}

	return tokens;
}

// extracts n-grams (multi-word phrases) for matching compound skills
export function extractNgrams(text: string, n: number): string[] {
	const words = text
		.toLowerCase()
		.split(/[\s,;|]+/)
		.map((w) => w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''))
		.filter((w) => w.length > 0);

	if (words.length < n) return [];

	const ngrams: string[] = [];
	for (let i = 0; i <= words.length - n; i++) {
		const gram = words.slice(i, i + n).join(' ');
		// skip n-grams that are entirely stop words
		const hasContent = words.slice(i, i + n).some((w) => !STOP_WORDS.has(w));
		if (hasContent) ngrams.push(gram);
	}

	return ngrams;
}

// extracts unique terms combining unigrams, bigrams, and trigrams
export function extractTerms(text: string): string[] {
	const tokens = tokenize(text);
	const unigrams = tokens.map((t) => t.normalized);
	const bigrams = extractNgrams(text, 2);
	const trigrams = extractNgrams(text, 3);

	const all = [...unigrams, ...bigrams, ...trigrams];
	return [...new Set(all)];
}

// normalizes text for comparison: lowercase, trim, collapse whitespace
export function normalizeText(text: string): string {
	return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

export { STOP_WORDS };
