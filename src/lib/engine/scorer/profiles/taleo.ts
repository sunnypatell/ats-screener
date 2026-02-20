import type { ATSProfile } from './types';

// taleo: legacy oracle ATS, boolean keyword filtering, knockout questions
// rigid parsing with strict date and section requirements
export const TALEO_PROFILE: ATSProfile = {
	name: 'Taleo',
	vendor: 'Oracle Corporation',
	marketShare: '~25% of Fortune 500',
	description: 'boolean keyword filtering, knockout questions, rigid parsing',
	parsingStrictness: 0.85,
	keywordStrategy: 'exact',
	weights: {
		formatting: 0.2,
		keywordMatch: 0.35,
		sectionCompleteness: 0.15,
		experienceRelevance: 0.15,
		educationMatch: 0.1,
		quantification: 0.05
	},
	requiredSections: ['contact', 'experience', 'education', 'skills'],
	preferredDateFormats: ['MM/YYYY', 'Month YYYY'],
	quirks: [
		{
			id: 'taleo-keyword-density',
			description: 'Taleo uses boolean keyword matching with AND/OR logic',
			check: (input) => {
				if (input.jobDescription && input.resumeSkills.length < 5) {
					return {
						penalty: 10,
						message:
							'very few skills detected. Taleo relies heavily on keyword matching. ensure your resume lists relevant skills explicitly.'
					};
				}
				return null;
			}
		},
		{
			id: 'taleo-section-headers',
			description: 'Taleo expects very standard section headers',
			check: (input) => {
				const standardHeaders = ['contact', 'experience', 'education', 'skills'];
				const missingStandard = standardHeaders.filter((h) => !input.resumeSections.includes(h));
				if (missingStandard.length > 1) {
					return {
						penalty: 8,
						message: `missing standard sections: ${missingStandard.join(', ')}. Taleo requires clearly labeled sections.`
					};
				}
				return null;
			}
		}
	],
	passingScore: 65
};
