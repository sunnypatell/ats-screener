import type { ATSProfile } from './types';

// lever: ATS/CRM hybrid for startups, most lenient parser of the major platforms
// contextual matching, values narrative quality over strict keyword density
export const LEVER_PROFILE: ATSProfile = {
	name: 'Lever',
	vendor: 'Lever (Employ Inc.)',
	marketShare: 'popular with startups and mid-market tech',
	description: 'contextual matching, lenient parsing, values narrative quality',
	parsingStrictness: 0.35,
	keywordStrategy: 'semantic',
	weights: {
		formatting: 0.08,
		keywordMatch: 0.22,
		sectionCompleteness: 0.1,
		experienceRelevance: 0.3,
		educationMatch: 0.1,
		quantification: 0.2
	},
	requiredSections: ['experience'],
	preferredDateFormats: ['Month YYYY', 'YYYY'],
	quirks: [
		{
			id: 'lever-narrative',
			description: 'Lever values well-written experience descriptions',
			check: (input) => {
				const avgBulletLength =
					input.experienceBullets.length > 0
						? input.experienceBullets.reduce((sum, b) => sum + b.length, 0) /
							input.experienceBullets.length
						: 0;

				if (avgBulletLength >= 60 && avgBulletLength <= 150) {
					return {
						penalty: -5,
						message:
							'well-detailed experience descriptions. Lever contextual matching works best with descriptive bullets.'
					};
				}
				return null;
			}
		},
		{
			id: 'lever-summary',
			description: 'Lever benefits from a professional summary',
			check: (input) => {
				if (input.resumeSections.includes('summary')) {
					return {
						penalty: -3,
						message: 'professional summary detected. Lever CRM uses this for candidate context.'
					};
				}
				return null;
			}
		}
	],
	passingScore: 50
};
