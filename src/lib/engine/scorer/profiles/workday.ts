import type { ATSProfile } from './types';

/**
 * Workday Recruiting (workday.com)
 *
 * the most widely used ATS among Fortune 500 companies.
 * known for strict resume parsing, single-column preference,
 * and heavy reliance on exact keyword matching.
 *
 * key behaviors:
 * - very strict parser that struggles with creative formats
 * - prefers single-column, chronological resumes
 * - uses exact keyword matching against job requisition fields
 * - parses sections rigidly; expects clear headers
 * - date parsing is format-sensitive
 */
export const WORKDAY_PROFILE: ATSProfile = {
	name: 'Workday',
	vendor: 'Workday, Inc.',
	marketShare: '~40% of Fortune 500',
	description: 'strict parser, exact keyword matching, demands clean formatting',
	parsingStrictness: 0.9,
	keywordStrategy: 'exact',
	weights: {
		formatting: 0.25,
		keywordMatch: 0.3,
		sectionCompleteness: 0.15,
		experienceRelevance: 0.15,
		educationMatch: 0.1,
		quantification: 0.05
	},
	requiredSections: ['contact', 'experience', 'education', 'skills'],
	preferredDateFormats: ['MM/YYYY', 'Month YYYY'],
	quirks: [
		{
			id: 'workday-header-format',
			description: 'Workday expects standard section header names',
			check: (input) => {
				const nonStandard = input.resumeSections.filter((s) => s === 'unknown');
				if (nonStandard.length > 2) {
					return {
						penalty: 5,
						message:
							'multiple unrecognized section headers. Workday expects standard names like "Experience", "Education", "Skills".'
					};
				}
				return null;
			}
		},
		{
			id: 'workday-page-limit',
			description: 'Workday may truncate resumes beyond 2 pages',
			check: (input) => {
				if (input.pageCount > 2) {
					return {
						penalty: 8,
						message: `resume is ${input.pageCount} pages. Workday may truncate content beyond page 2.`
					};
				}
				return null;
			}
		}
	],
	passingScore: 70
};
