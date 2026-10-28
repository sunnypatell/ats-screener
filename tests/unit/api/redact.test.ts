import { describe, expect, it } from 'vitest';
import { redactContactDetails } from '../../../src/routes/api/analyze/redact';

const resume = `Jordan Avery Whitfield
jordan.whitfield.dev@example.com | (416) 555-0142 | linkedin.com/in/jordan-whitfield | https://github.com/jwhitfield | Toronto, ON

EXPERIENCE
Senior Software Engineer, Northwind Payments, Jan 2021 - Present
- Cut p99 latency 38% across 10M+ requests/day, saving $1,200,000 over 2019-2021
- Shipped C++17 (2019-2021) and Python 3.12 services; GPA 3.8/4.0

REFERENCES
Jane Doe, jane.doe@corp.example.org, +44 20 7946 0958

Jordan Avery Whitfield - page 2`;

describe('redactContactDetails', () => {
	const out = redactContactDetails(resume);

	it('removes every direct identifier, including third-party references', () => {
		for (const pii of [
			'Jordan Avery Whitfield',
			'jordan.whitfield.dev@example.com',
			'555-0142',
			'jordan-whitfield',
			'jwhitfield',
			'jane.doe@corp.example.org',
			'7946 0958'
		]) {
			expect(out, pii).not.toContain(pii);
		}
	});

	it('leaves typed placeholders so contact info still reads as present', () => {
		expect(out.split('\n')[0]).toBe('[name]');
		expect(out.split('\n')[1]).toBe('[email] | [phone] | [linkedin] | [github] | Toronto, ON');
		expect(out).toContain('[name] - page 2');
	});

	it('keeps dates, metrics, versions and location the scorer depends on', () => {
		for (const kept of [
			'Jan 2021 - Present',
			'38%',
			'10M+',
			'$1,200,000',
			'2019-2021',
			'C++17 (2019-2021)',
			'Python 3.12',
			'GPA 3.8/4.0',
			'Toronto, ON'
		]) {
			expect(out, kept).toContain(kept);
		}
	});

	it('matches the common north american phone formats', () => {
		for (const phone of [
			'416-555-0142',
			'416.555.0142',
			'4165550142',
			'+1 416 555 0142',
			'1 (416) 555-0142'
		]) {
			expect(redactContactDetails(`call ${phone} today`), phone).toBe('call [phone] today');
		}
	});

	it('finds the real name when a title line comes first', () => {
		const titled =
			'Software Engineer\nPriya Raman\npriya@example.com\n\nEXPERIENCE\n- built things';
		expect(redactContactDetails(titled)).toBe(
			'Software Engineer\n[name]\n[email]\n\nEXPERIENCE\n- built things'
		);
	});

	it('leaves a resume with no contact details untouched', () => {
		const plain = 'EXPERIENCE\n- Led a team of 5 from 2018 to 2022\n\nSKILLS\nGo, SQL';
		expect(redactContactDetails(plain)).toBe(plain);
	});
});
