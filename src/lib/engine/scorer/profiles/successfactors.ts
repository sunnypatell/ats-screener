import type { ATSProfile } from './types';

// successfactors: enterprise HCM by SAP, rigid field mapping, exact keyword matching
// expects standard formatting and structured sections, date-sensitive
export const SUCCESSFACTORS_PROFILE: ATSProfile = {
	name: 'SuccessFactors',
	vendor: 'SAP SE',
	marketShare: '~15% of large enterprise',
	description: 'enterprise structured parsing, rigid field mapping, exact matching',
	parsingStrictness: 0.85,
	keywordStrategy: 'exact',
	weights: {
		formatting: 0.25,
		keywordMatch: 0.25,
		sectionCompleteness: 0.2,
		experienceRelevance: 0.15,
		educationMatch: 0.1,
		quantification: 0.05
	},
	requiredSections: ['contact', 'experience', 'education', 'skills'],
	preferredDateFormats: ['MM/YYYY', 'DD/MM/YYYY'],
	quirks: [
		{
			id: 'sf-structured-data',
			description: 'SuccessFactors maps resume fields to structured SAP data',
			check: (input) => {
				// penalize if critical structured data is missing
				const hasDates = /\b(19|20)\d{2}\b/.test(input.resumeText);
				const hasCompanyNames = input.experienceBullets.length > 0;

				if (!hasDates) {
					return {
						penalty: 10,
						message:
							'no dates detected. SuccessFactors requires structured date fields for each position.'
					};
				}
				if (!hasCompanyNames) {
					return {
						penalty: 8,
						message:
							'no clear experience entries detected. SuccessFactors needs structured employer/title/date fields.'
					};
				}
				return null;
			}
		},
		{
			id: 'sf-section-structure',
			description: 'SuccessFactors requires all standard sections',
			check: (input) => {
				const required = ['contact', 'experience', 'education', 'skills'];
				const missing = required.filter((r) => !input.resumeSections.includes(r));
				if (missing.length > 0) {
					return {
						penalty: missing.length * 5,
						message: `missing sections: ${missing.join(', ')}. SuccessFactors requires structured sections for field mapping.`
					};
				}
				return null;
			}
		}
	],
	passingScore: 65
};
