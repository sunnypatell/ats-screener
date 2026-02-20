import { describe, it, expect } from 'vitest';
import { tokenize, extractNgrams, extractTerms } from '$engine/nlp/tokenizer';

describe('tokenizer', () => {
	it('tokenizes basic text', () => {
		const tokens = tokenize('JavaScript developer with React experience');
		const terms = tokens.map((t) => t.normalized);

		expect(terms).toContain('javascript');
		expect(terms).toContain('developer');
		expect(terms).toContain('react');
		expect(terms).toContain('experience');
	});

	it('filters stop words', () => {
		const tokens = tokenize('I am a software engineer with the best skills');
		const terms = tokens.map((t) => t.normalized);

		expect(terms).not.toContain('am');
		expect(terms).not.toContain('the');
		expect(terms).not.toContain('with');
		expect(terms).toContain('software');
		expect(terms).toContain('engineer');
	});

	it('preserves special characters in tech terms', () => {
		const tokens = tokenize('C++ and C# development');
		const terms = tokens.map((t) => t.normalized);

		expect(terms).toContain('c++');
		expect(terms).toContain('c#');
	});

	it('removes single-character tokens', () => {
		const tokens = tokenize('a b c development');
		const terms = tokens.map((t) => t.normalized);

		expect(terms.length).toBe(1);
		expect(terms[0]).toBe('development');
	});

	it('extracts bigrams', () => {
		const ngrams = extractNgrams('machine learning engineer', 2);

		expect(ngrams).toContain('machine learning');
		expect(ngrams).toContain('learning engineer');
	});

	it('extracts trigrams', () => {
		const ngrams = extractNgrams('natural language processing', 3);

		expect(ngrams).toContain('natural language processing');
	});

	it('extractTerms combines unigrams, bigrams, and trigrams', () => {
		const terms = extractTerms('machine learning engineer');

		expect(terms).toContain('machine');
		expect(terms).toContain('learning');
		expect(terms).toContain('machine learning');
	});
});
