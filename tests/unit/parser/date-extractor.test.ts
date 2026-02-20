import { describe, it, expect } from 'vitest';
import { extractDateRanges, extractFirstDateRange } from '$engine/parser/date-extractor';

describe('date-extractor', () => {
	it('extracts "Month Year - Month Year" format', () => {
		const ranges = extractDateRanges('Jan 2023 - Dec 2024');

		expect(ranges.length).toBe(1);
		expect(ranges[0].start).toBe('2023-01');
		expect(ranges[0].end).toBe('2024-12');
		expect(ranges[0].isCurrent).toBe(false);
	});

	it('extracts "Month Year - Present" format', () => {
		const ranges = extractDateRanges('January 2023 - Present');

		expect(ranges.length).toBe(1);
		expect(ranges[0].start).toBe('2023-01');
		expect(ranges[0].end).toBeNull();
		expect(ranges[0].isCurrent).toBe(true);
	});

	it('extracts "Year - Year" format', () => {
		const ranges = extractDateRanges('2020 - 2024');

		expect(ranges.length).toBe(1);
		expect(ranges[0].start).toBe('2020');
		expect(ranges[0].end).toBe('2024');
	});

	it('extracts "MM/YYYY - MM/YYYY" format', () => {
		const ranges = extractDateRanges('01/2023 - 12/2024');

		expect(ranges.length).toBe(1);
		expect(ranges[0].start).toBe('2023-01');
		expect(ranges[0].end).toBe('2024-12');
	});

	it('handles "Current" as present indicator', () => {
		const ranges = extractDateRanges('Mar 2023 - Current');

		expect(ranges.length).toBe(1);
		expect(ranges[0].isCurrent).toBe(true);
	});

	it('extracts multiple date ranges from text', () => {
		const text = 'Google, Jan 2023 - Present\nMeta, Jun 2020 - Dec 2022';
		const ranges = extractDateRanges(text);

		expect(ranges.length).toBe(2);
	});

	it('returns null for no dates found', () => {
		const range = extractFirstDateRange('no dates here');

		expect(range).toBeNull();
	});

	it('handles full month names', () => {
		const ranges = extractDateRanges('September 2021 - February 2023');

		expect(ranges.length).toBe(1);
		expect(ranges[0].start).toBe('2021-09');
		expect(ranges[0].end).toBe('2023-02');
	});
});
