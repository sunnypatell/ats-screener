import { tokenize } from './tokenizer';

interface TermFrequency {
	term: string;
	tf: number;
	count: number;
}

interface TFIDFScore {
	term: string;
	score: number;
	tf: number;
	idf: number;
}

// computes term frequency: TF = count of term / total terms in doc
export function computeTF(text: string): TermFrequency[] {
	const tokens = tokenize(text);
	const counts = new Map<string, number>();

	for (const token of tokens) {
		counts.set(token.normalized, (counts.get(token.normalized) || 0) + 1);
	}

	const total = tokens.length;
	const frequencies: TermFrequency[] = [];

	for (const [term, count] of counts) {
		frequencies.push({
			term,
			tf: count / total,
			count
		});
	}

	return frequencies.sort((a, b) => b.tf - a.tf);
}

// computes inverse document frequency: IDF = log(N / (1 + df)), +1 prevents div by zero
export function computeIDF(documents: string[]): Map<string, number> {
	const docCount = documents.length;
	const termDocCounts = new Map<string, number>();

	for (const doc of documents) {
		const tokens = tokenize(doc);
		const uniqueTerms = new Set(tokens.map((t) => t.normalized));

		for (const term of uniqueTerms) {
			termDocCounts.set(term, (termDocCounts.get(term) || 0) + 1);
		}
	}

	const idf = new Map<string, number>();
	for (const [term, df] of termDocCounts) {
		idf.set(term, Math.log(docCount / (1 + df)));
	}

	return idf;
}

// computes TF-IDF scores for a target doc against a corpus
// higher scores = important to target but uncommon across all docs
export function computeTFIDF(targetText: string, corpusTexts: string[]): TFIDFScore[] {
	const allDocs = [targetText, ...corpusTexts];
	const idfMap = computeIDF(allDocs);
	const tfList = computeTF(targetText);

	const scores: TFIDFScore[] = [];

	for (const { term, tf } of tfList) {
		const idf = idfMap.get(term) || 0;
		scores.push({
			term,
			score: tf * idf,
			tf,
			idf
		});
	}

	return scores.sort((a, b) => b.score - a.score);
}

// computes keyword overlap between two texts: matched terms, missing terms, similarity score
export function computeKeywordOverlap(
	sourceText: string,
	targetText: string
): {
	matched: string[];
	missing: string[];
	score: number;
} {
	const sourceTokens = tokenize(sourceText);
	const targetTokens = tokenize(targetText);

	const sourceTerms = new Set(sourceTokens.map((t) => t.normalized));
	const targetTerms = new Set(targetTokens.map((t) => t.normalized));

	const matched: string[] = [];
	const missing: string[] = [];

	for (const term of targetTerms) {
		if (sourceTerms.has(term)) {
			matched.push(term);
		} else {
			missing.push(term);
		}
	}

	const score = targetTerms.size > 0 ? matched.length / targetTerms.size : 0;

	return { matched, missing, score };
}

// extracts the most important terms in a doc using TF-IDF (key skills/requirements)
export function extractKeyTerms(text: string, topN: number = 20): string[] {
	// use the text as both target and a minimal corpus
	// the IDF won't be meaningful with a single doc, so we rely mainly on TF
	const tf = computeTF(text);
	return tf.slice(0, topN).map((t) => t.term);
}
