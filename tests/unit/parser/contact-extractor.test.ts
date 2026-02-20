import { describe, it, expect } from 'vitest';
import { extractContact } from '$engine/parser/contact-extractor';

describe('contact-extractor', () => {
	it('extracts email address', () => {
		const lines = ['John Doe', 'john.doe@gmail.com', '555-123-4567'];
		const contact = extractContact(lines);

		expect(contact.email).toBe('john.doe@gmail.com');
	});

	it('extracts phone number', () => {
		const lines = ['John Doe', 'john@email.com', '(555) 123-4567'];
		const contact = extractContact(lines);

		expect(contact.phone).toBeTruthy();
		expect(contact.phone).toMatch(/555.*123.*4567/);
	});

	it('extracts linkedin URL', () => {
		const lines = ['John Doe', 'linkedin.com/in/johndoe', 'john@email.com'];
		const contact = extractContact(lines);

		expect(contact.linkedin).toBe('linkedin.com/in/johndoe');
	});

	it('extracts github URL', () => {
		const lines = ['John Doe', 'github.com/johndoe', 'john@email.com'];
		const contact = extractContact(lines);

		expect(contact.github).toBe('github.com/johndoe');
	});

	it('extracts name from first line', () => {
		const lines = ['John Doe', 'john@email.com', '555-1234'];
		const contact = extractContact(lines);

		expect(contact.name).toBe('John Doe');
	});

	it('skips non-name first lines', () => {
		const lines = ['john.doe@gmail.com', 'John Michael Doe', '555-1234'];
		const contact = extractContact(lines);

		expect(contact.name).toBe('John Michael Doe');
	});

	it('extracts location', () => {
		const lines = ['John Doe', 'San Francisco, CA', 'john@email.com'];
		const contact = extractContact(lines);

		expect(contact.location).toContain('San Francisco');
	});

	it('handles missing fields gracefully', () => {
		const lines = ['John Doe'];
		const contact = extractContact(lines);

		expect(contact.name).toBe('John Doe');
		expect(contact.email).toBeNull();
		expect(contact.phone).toBeNull();
		expect(contact.linkedin).toBeNull();
		expect(contact.github).toBeNull();
	});
});
