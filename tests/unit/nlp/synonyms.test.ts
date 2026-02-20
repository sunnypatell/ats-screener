import { describe, it, expect } from 'vitest';
import { getCanonical, areSynonyms, getSynonyms, normalizeTerms } from '$engine/nlp/synonyms';

describe('synonyms', () => {
	it('maps abbreviations to canonical form', () => {
		expect(getCanonical('JS')).toBe('javascript');
		expect(getCanonical('TS')).toBe('typescript');
		expect(getCanonical('py')).toBe('python');
		expect(getCanonical('k8s')).toBe('kubernetes');
	});

	it('maps variant names to canonical form', () => {
		expect(getCanonical('reactjs')).toBe('react');
		expect(getCanonical('node.js')).toBe('node.js');
		expect(getCanonical('postgresql')).toBe('postgresql');
		expect(getCanonical('postgres')).toBe('postgresql');
	});

	it('identifies synonymous terms', () => {
		expect(areSynonyms('JS', 'JavaScript')).toBe(true);
		expect(areSynonyms('AWS', 'Amazon Web Services')).toBe(true);
		expect(areSynonyms('ML', 'Machine Learning')).toBe(true);
		expect(areSynonyms('Python', 'Java')).toBe(false);
	});

	it('returns all synonyms for a term', () => {
		const synonyms = getSynonyms('JS');

		expect(synonyms).toContain('javascript');
		expect(synonyms).toContain('js');
		expect(synonyms).toContain('ecmascript');
	});

	it('normalizes cross-industry terms', () => {
		// CPA is ambiguous (cost per acquisition in marketing, certified public accountant in finance)
		// the synonym map returns the first match, which is fine since context resolves ambiguity
		expect(getCanonical('SEO')).toBe('search engine optimization');
		expect(getCanonical('EHR')).toBe('electronic health record');
		expect(getCanonical('PM')).toBe('project management');
		expect(getCanonical('ROI')).toBe('return on investment');
	});

	it('deduplicates normalized terms', () => {
		const terms = ['JS', 'JavaScript', 'javascript', 'Python', 'py'];
		const normalized = normalizeTerms(terms);

		expect(normalized).toEqual(['javascript', 'python']);
	});

	it('returns original term if no synonym exists', () => {
		expect(getCanonical('svelte')).toBe('svelte');
		expect(getCanonical('UnknownTech')).toBe('unknowntech');
	});
});
