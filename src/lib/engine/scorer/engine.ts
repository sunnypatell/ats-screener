import type { ATSProfile, ScoringInput, ScoreResult, ScoreBreakdown } from './types';
import { ALL_PROFILES } from './profiles';
import { scoreFormatting } from './format-scorer';
import { scoreSections } from './section-scorer';
import { scoreExperience } from './experience-scorer';
import { scoreEducation } from './education-scorer';
import { matchKeywords } from './keyword-matcher';

// scores a resume against all 6 ATS profiles. deterministic: same input = same output
export function scoreResume(input: ScoringInput): ScoreResult[] {
	return ALL_PROFILES.map((profile) => scoreAgainstProfile(input, profile));
}

// scores a resume against a single ATS profile
export function scoreAgainstProfile(input: ScoringInput, profile: ATSProfile): ScoreResult {
	const breakdown = computeBreakdown(input, profile);
	const weightedScore = computeWeightedScore(breakdown, profile);

	// apply quirk penalties/bonuses
	const quirkAdjustment = computeQuirkAdjustment(input, profile);
	const overallScore = Math.max(
		0,
		Math.min(100, Math.round(weightedScore + quirkAdjustment.totalAdjustment))
	);

	const suggestions = generateSuggestions(breakdown, profile, quirkAdjustment.messages);

	return {
		system: profile.name,
		vendor: profile.vendor,
		overallScore,
		passesFilter: overallScore >= profile.passingScore,
		breakdown,
		suggestions
	};
}

// runs each individual scorer and assembles the breakdown
function computeBreakdown(input: ScoringInput, profile: ATSProfile): ScoreBreakdown {
	const formatting = scoreFormatting(input, profile.parsingStrictness);
	const sections = scoreSections(input.resumeSections, profile.requiredSections);
	const experience = scoreExperience(input.experienceBullets);
	const education = scoreEducation(input.educationText);
	const keywords = matchKeywords(
		input.resumeText,
		input.jobDescription || '',
		profile.keywordStrategy
	);

	return {
		formatting: {
			score: formatting.score,
			issues: formatting.issues,
			details: formatting.details
		},
		keywordMatch: {
			score: keywords.score,
			matched: keywords.matched,
			missing: keywords.missing,
			synonymMatched: keywords.synonymMatched
		},
		sections: {
			score: sections.score,
			present: sections.present,
			missing: sections.missing
		},
		experience: {
			score: experience.score,
			quantifiedBullets: experience.quantifiedBullets,
			totalBullets: experience.totalBullets,
			actionVerbCount: experience.actionVerbCount,
			highlights: experience.highlights
		},
		education: {
			score: education.score,
			notes: education.notes
		}
	};
}

// applies profile weights to produce a single 0-100 score
function computeWeightedScore(breakdown: ScoreBreakdown, profile: ATSProfile): number {
	const { weights } = profile;

	// quantification is derived from the experience scorer's quantification ratio
	const quantificationScore =
		breakdown.experience.totalBullets > 0
			? Math.round(
					(breakdown.experience.quantifiedBullets / breakdown.experience.totalBullets) * 100
				)
			: 0;

	const weighted =
		breakdown.formatting.score * weights.formatting +
		breakdown.keywordMatch.score * weights.keywordMatch +
		breakdown.sections.score * weights.sectionCompleteness +
		breakdown.experience.score * weights.experienceRelevance +
		breakdown.education.score * weights.educationMatch +
		quantificationScore * weights.quantification;

	return weighted;
}

// runs quirk checks for a profile. negative penalty = bonus, positive = deduction
function computeQuirkAdjustment(
	input: ScoringInput,
	profile: ATSProfile
): { totalAdjustment: number; messages: string[] } {
	let totalAdjustment = 0;
	const messages: string[] = [];

	for (const quirk of profile.quirks) {
		const result = quirk.check(input);
		if (result) {
			totalAdjustment -= result.penalty;
			messages.push(result.message);
		}
	}

	return { totalAdjustment, messages };
}

// generates rule-based suggestions. LLM enhancement is layered on top separately
function generateSuggestions(
	breakdown: ScoreBreakdown,
	profile: ATSProfile,
	quirkMessages: string[]
): string[] {
	const suggestions: string[] = [];

	// formatting suggestions
	if (breakdown.formatting.score < 70) {
		if (breakdown.formatting.issues.some((i) => i.includes('multi-column'))) {
			suggestions.push('switch to a single-column resume layout for better ATS parsing');
		}
		if (breakdown.formatting.issues.some((i) => i.includes('tables'))) {
			suggestions.push('remove tables and use plain text formatting instead');
		}
		if (breakdown.formatting.issues.some((i) => i.includes('images'))) {
			suggestions.push('remove images, logos, and graphics from your resume');
		}
	}

	// keyword suggestions
	if (breakdown.keywordMatch.score < 60 && breakdown.keywordMatch.missing.length > 0) {
		const topMissing = breakdown.keywordMatch.missing.slice(0, 5);
		suggestions.push(
			`add these missing keywords from the job description: ${topMissing.join(', ')}`
		);

		if (profile.keywordStrategy === 'exact') {
			suggestions.push(
				`${profile.name} uses exact keyword matching. use the exact terms from the job posting, not synonyms.`
			);
		}
	}

	// section suggestions
	if (breakdown.sections.missing.length > 0) {
		suggestions.push(
			`add missing sections: ${breakdown.sections.missing.join(', ')}. ${profile.name} requires these for proper parsing.`
		);
	}

	// experience suggestions
	if (breakdown.experience.totalBullets > 0) {
		const quantRatio = breakdown.experience.quantifiedBullets / breakdown.experience.totalBullets;
		if (quantRatio < 0.3) {
			suggestions.push(
				'add more quantified achievements (numbers, percentages, dollar amounts) to your experience bullets'
			);
		}
		if (breakdown.experience.actionVerbCount / breakdown.experience.totalBullets < 0.5) {
			suggestions.push(
				'start more bullet points with strong action verbs (led, developed, increased, delivered)'
			);
		}
	} else {
		suggestions.push('add detailed experience bullets with measurable achievements');
	}

	// education suggestions
	if (breakdown.education.score < 50) {
		suggestions.push(
			'ensure your education section includes degree type, institution, and graduation date'
		);
	}

	// quirk-specific suggestions (from profile checks)
	for (const message of quirkMessages) {
		suggestions.push(message);
	}

	return suggestions;
}
