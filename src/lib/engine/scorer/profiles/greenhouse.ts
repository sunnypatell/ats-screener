import type { ATSProfile } from './types';

/**
 * Greenhouse (greenhouse.io)
 *
 * modern ATS popular with tech companies and high-growth startups.
 * uses structured scorecards and is more lenient on formatting.
 * focuses on experience relevance over keyword density.
 *
 * key behaviors:
 * - lenient parser that handles most formats well
 * - structured hiring with scorecards
 * - values experience quality over keyword quantity
 * - semantic matching considers context
 * - less reliant on exact keyword matching
 * - supports structured data import
 */
export const GREENHOUSE_PROFILE: ATSProfile = {
	name: 'Greenhouse',
	vendor: 'Greenhouse Software',
	marketShare: 'top tech companies and startups',
	description: 'structured scorecards, semantic matching, lenient formatting',
	parsingStrictness: 0.4,
	keywordStrategy: 'semantic',
	weights: {
		formatting: 0.1,
		keywordMatch: 0.25,
		sectionCompleteness: 0.1,
		experienceRelevance: 0.25,
		educationMatch: 0.1,
		quantification: 0.2
	},
	requiredSections: ['experience', 'education'],
	preferredDateFormats: ['Month YYYY', 'MM/YYYY', 'YYYY'],
	quirks: [
		{
			id: 'greenhouse-quantification',
			description: 'Greenhouse structured scorecards reward measurable impact',
			check: (input) => {
				const quantifiedRatio =
					input.experienceBullets.filter((b) => /\d+%|\$[\d,]+|\d+\s*(?:x|times)/i.test(b)).length /
					Math.max(1, input.experienceBullets.length);

				if (quantifiedRatio >= 0.4) {
					return {
						penalty: -8,
						message:
							'strong quantification in experience bullets. Greenhouse scorecards reward measurable impact.'
					};
				}
				return null;
			}
		},
		{
			id: 'greenhouse-projects',
			description: 'Greenhouse values project work for technical roles',
			check: (input) => {
				if (input.resumeSections.includes('projects')) {
					return {
						penalty: -3,
						message:
							'projects section detected. Greenhouse hiring managers value seeing project work.'
					};
				}
				return null;
			}
		}
	],
	passingScore: 55
};
