import type { ATSProfile } from './types';

// icims: mid-to-large enterprise ATS, AI-assisted fuzzy keyword matching
// more format-tolerant than Workday/Taleo, supports skills taxonomies
export const ICIMS_PROFILE: ATSProfile = {
	name: 'iCIMS',
	vendor: 'iCIMS, Inc.',
	marketShare: '~15% of Fortune 500',
	description: 'AI-assisted matching, fuzzy keywords, more format-tolerant',
	parsingStrictness: 0.6,
	keywordStrategy: 'fuzzy',
	weights: {
		formatting: 0.15,
		keywordMatch: 0.3,
		sectionCompleteness: 0.15,
		experienceRelevance: 0.2,
		educationMatch: 0.1,
		quantification: 0.1
	},
	requiredSections: ['contact', 'experience', 'education'],
	preferredDateFormats: ['Month YYYY', 'MM/YYYY', 'YYYY'],
	quirks: [
		{
			id: 'icims-skills-taxonomy',
			description: 'iCIMS uses a skills taxonomy for broader matching',
			check: (input) => {
				if (input.resumeSkills.length >= 10) {
					return {
						penalty: -5,
						message:
							'comprehensive skills list detected. iCIMS skill taxonomy matching benefits from detailed skill listings.'
					};
				}
				return null;
			}
		}
	],
	passingScore: 60
};
