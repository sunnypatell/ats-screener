import { tokenize } from '$engine/nlp/tokenizer';
import { computeKeywordOverlap } from '$engine/nlp/tfidf';
import { getCanonical, areSynonyms } from '$engine/nlp/synonyms';

interface KeywordMatchResult {
	score: number;
	matched: string[];
	missing: string[];
	synonymMatched: string[];
}

// matches resume keywords against JD keywords using exact, fuzzy, or semantic strategy
// strategy reflects real ATS strictness (exact for Workday/Taleo, semantic for Greenhouse/Lever)
export function matchKeywords(
	resumeText: string,
	jobDescription: string,
	strategy: 'exact' | 'fuzzy' | 'semantic'
): KeywordMatchResult {
	if (!jobDescription || jobDescription.trim().length === 0) {
		return { score: 100, matched: [], missing: [], synonymMatched: [] };
	}

	// extract tokens from both texts
	const resumeTokens = tokenize(resumeText);
	const jdTokens = tokenize(jobDescription);

	const resumeTerms = new Set(resumeTokens.map((t) => t.normalized));
	const jdTerms = [...new Set(jdTokens.map((t) => t.normalized))];

	// also extract canonical forms for synonym matching
	const resumeCanonicals = new Set(resumeTokens.map((t) => getCanonical(t.normalized)));

	const matched: string[] = [];
	const missing: string[] = [];
	const synonymMatched: string[] = [];

	for (const jdTerm of jdTerms) {
		// exact match
		if (resumeTerms.has(jdTerm)) {
			matched.push(jdTerm);
			continue;
		}

		if (strategy === 'exact') {
			missing.push(jdTerm);
			continue;
		}

		// fuzzy: check synonym database
		const jdCanonical = getCanonical(jdTerm);
		if (resumeCanonicals.has(jdCanonical)) {
			synonymMatched.push(jdTerm);
			continue;
		}

		// also check if any resume term is a synonym of the JD term
		let foundSynonym = false;
		for (const resumeTerm of resumeTerms) {
			if (areSynonyms(resumeTerm, jdTerm)) {
				synonymMatched.push(jdTerm);
				foundSynonym = true;
				break;
			}
		}
		if (foundSynonym) continue;

		if (strategy === 'fuzzy') {
			missing.push(jdTerm);
			continue;
		}

		// semantic: partial string matching (contains, prefix)
		let foundPartial = false;
		for (const resumeTerm of resumeTerms) {
			// check if either term contains the other
			if (resumeTerm.includes(jdTerm) || jdTerm.includes(resumeTerm)) {
				if (Math.min(resumeTerm.length, jdTerm.length) >= 3) {
					synonymMatched.push(jdTerm);
					foundPartial = true;
					break;
				}
			}
		}
		if (foundPartial) continue;

		// also check the full resume text for multi-word JD terms
		if (jdTerm.length >= 4 && resumeText.toLowerCase().includes(jdTerm)) {
			matched.push(jdTerm);
			continue;
		}

		missing.push(jdTerm);
	}

	// calculate score
	const totalJdTerms = jdTerms.length;
	if (totalJdTerms === 0) return { score: 100, matched, missing, synonymMatched };

	// exact matches count full, synonym matches count 80%
	const effectiveMatches = matched.length + synonymMatched.length * 0.8;
	const score = Math.round(Math.min(100, (effectiveMatches / totalJdTerms) * 100));

	return { score, matched, missing, synonymMatched };
}

// quick keyword overlap check without synonym matching, used for no-JD scoring mode
export function quickKeywordScore(resumeText: string, referenceText: string): number {
	const overlap = computeKeywordOverlap(resumeText, referenceText);
	return Math.round(overlap.score * 100);
}
