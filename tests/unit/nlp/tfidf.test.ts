import { describe, it, expect } from 'vitest';
import { computeTF, computeKeywordOverlap, extractKeyTerms } from '$engine/nlp/tfidf';

describe('tfidf', () => {
	it('computes term frequency', () => {
		const tf = computeTF('python python python java java');

		const pythonTF = tf.find((t) => t.term === 'python');
		const javaTF = tf.find((t) => t.term === 'java');

		expect(pythonTF).toBeDefined();
		expect(javaTF).toBeDefined();
		expect(pythonTF!.count).toBe(3);
		expect(javaTF!.count).toBe(2);
		expect(pythonTF!.tf).toBeGreaterThan(javaTF!.tf);
	});

	it('computes keyword overlap', () => {
		const resume = 'experienced python developer with react and node.js';
		const jd = 'looking for python react typescript developer';

		const overlap = computeKeywordOverlap(resume, jd);

		expect(overlap.matched).toContain('python');
		expect(overlap.matched).toContain('react');
		expect(overlap.matched).toContain('developer');
		expect(overlap.missing).toContain('typescript');
		expect(overlap.score).toBeGreaterThan(0);
		expect(overlap.score).toBeLessThanOrEqual(1);
	});

	it('returns 0 score for no overlap', () => {
		const resume = 'java spring hibernate';
		const jd = 'python django flask';

		const overlap = computeKeywordOverlap(resume, jd);

		expect(overlap.matched.length).toBe(0);
		expect(overlap.score).toBe(0);
	});

	it('returns 1.0 score for perfect overlap', () => {
		const text = 'python react typescript';

		const overlap = computeKeywordOverlap(text, text);

		expect(overlap.score).toBe(1);
		expect(overlap.missing.length).toBe(0);
	});

	it('extracts key terms', () => {
		const text = 'experienced software engineer with python, react, and machine learning skills';
		const terms = extractKeyTerms(text, 5);

		expect(terms.length).toBeLessThanOrEqual(5);
		expect(terms.length).toBeGreaterThan(0);
	});
});
