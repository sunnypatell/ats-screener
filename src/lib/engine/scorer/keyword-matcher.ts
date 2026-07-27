import { tokenize } from '$engine/nlp/tokenizer';
import { computeKeywordOverlap } from '$engine/nlp/tfidf';
import { getCanonical, areSynonyms } from '$engine/nlp/synonyms';

interface KeywordMatchResult {
	score: number;
	matched: string[];
	missing: string[];
	synonymMatched: string[];
}

export function matchKeywords(
	resumeText: string,
	jobDescription: string,
	strategy: 'exact' | 'fuzzy' | 'semantic'
): KeywordMatchResult {
	// Keyword compatibility is undefined without a target job. The scoring engine
	// removes this dimension and re-normalizes the remaining weights.
	if (!jobDescription?.trim()) return { score: 0, matched: [], missing: [], synonymMatched: [] };

	const resumeTokens = tokenize(resumeText);
	const jdTokens = tokenize(jobDescription);
	const resumeTerms = new Set(resumeTokens.map((token) => token.normalized));
	const jdFrequency = new Map<string, number>();
	for (const token of jdTokens) jdFrequency.set(token.normalized, (jdFrequency.get(token.normalized) ?? 0) + 1);
	const jdTerms = [...jdFrequency.keys()].filter((term) => term.length >= 2);
	const resumeCanonicals = new Set(resumeTokens.map((token) => getCanonical(token.normalized)));
	const matched: string[] = [];
	const missing: string[] = [];
	const synonymMatched: string[] = [];

	for (const jdTerm of jdTerms) {
		if (resumeTerms.has(jdTerm)) {
			matched.push(jdTerm);
			continue;
		}
		if (strategy === 'exact') {
			missing.push(jdTerm);
			continue;
		}
		const canonical = getCanonical(jdTerm);
		if (resumeCanonicals.has(canonical) || [...resumeTerms].some((term) => areSynonyms(term, jdTerm))) {
			synonymMatched.push(jdTerm);
			continue;
		}
		if (strategy === 'semantic') {
			const partial = [...resumeTerms].some((term) => {
				const shortest = Math.min(term.length, jdTerm.length);
				return shortest >= 4 && (term.includes(jdTerm) || jdTerm.includes(term));
			});
			if (partial) {
				synonymMatched.push(jdTerm);
				continue;
			}
		}
		missing.push(jdTerm);
	}

	const totalWeight = jdTerms.reduce((sum, term) => sum + Math.min(3, jdFrequency.get(term) ?? 1), 0);
	if (!totalWeight) return { score: 0, matched, missing, synonymMatched };
	const exactWeight = matched.reduce((sum, term) => sum + Math.min(3, jdFrequency.get(term) ?? 1), 0);
	const synonymWeight = synonymMatched.reduce((sum, term) => sum + Math.min(3, jdFrequency.get(term) ?? 1) * 0.8, 0);
	return {
		score: Math.round(Math.min(100, ((exactWeight + synonymWeight) / totalWeight) * 100)),
		matched,
		missing,
		synonymMatched
	};
}

export function quickKeywordScore(resumeText: string, referenceText: string): number {
	return Math.round(computeKeywordOverlap(resumeText, referenceText).score * 100);
}
