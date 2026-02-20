import type { ATSProfile } from './types';

/**
 * iCIMS Talent Cloud (icims.com)
 *
 * modern ATS platform used by mid-to-large enterprises.
 * more tolerant of formatting variations than Workday/Taleo.
 * uses AI-assisted matching for better keyword understanding.
 *
 * key behaviors:
 * - more forgiving parser than Workday/Taleo
 * - AI-assisted matching considers context and related terms
 * - still relies on keyword matching but with fuzzy matching
 * - better handling of different resume formats
 * - supports skills taxonomies for broader matching
 */
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
