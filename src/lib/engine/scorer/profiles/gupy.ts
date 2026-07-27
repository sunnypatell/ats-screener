import type { ATSProfile } from './types';

// Deterministic simulation based only on Gupy's public candidate guidance.
// It is not the proprietary Gupy ranking model and is deliberately labeled as such.
export const GUPY_PROFILE: ATSProfile = {
	name: 'Gupy-like',
	vendor: 'Public-guidance simulation',
	marketShare: 'Brazil-focused benchmark',
	description: 'prioritizes experiences, skills, education and job alignment while excluding sensitive data',
	parsingStrictness: 0.85,
	keywordStrategy: 'fuzzy',
	weights: {
		formatting: 0.08,
		keywordMatch: 0.3,
		sectionCompleteness: 0.1,
		experienceRelevance: 0.32,
		educationMatch: 0.15,
		quantification: 0.05
	},
	requiredSections: ['contact', 'experience', 'education', 'skills'],
	preferredDateFormats: ['MM/YYYY', 'Mês/YYYY', 'Month YYYY'],
	quirks: [
		{
			id: 'gupy-structured-profile',
			description: 'public guidance emphasizes complete structured experiences and skills',
			check: (input) => {
				const missingCore = ['experience', 'skills'].filter((section) => !input.resumeSections.includes(section));
				if (!missingCore.length) return null;
				return {
					penalty: 8,
					message: input.locale === 'pt-BR'
						? `simulação Gupy-like: complete os campos ${missingCore.join(' e ')}`
						: `Gupy-like simulation: complete ${missingCore.join(' and ')} fields`
				};
			}
		}
	],
	passingScore: 70
};
