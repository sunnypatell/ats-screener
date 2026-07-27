import { parseResumeText } from '$engine/parser';
import type { ATSProfile, ScoringInput, ScoreResult, ScoreBreakdown } from './types';
import { ALL_PROFILES } from './profiles';
import { scoreFormatting } from './format-scorer';
import { scoreSections } from './section-scorer';
import { scoreExperience } from './experience-scorer';
import { scoreEducation } from './education-scorer';
import { matchKeywords } from './keyword-matcher';
import { scoreGupyAlignment } from './gupy-alignment';

export function scoreResume(input: ScoringInput): ScoreResult[] {
	const enriched = enrichStructuredInput(input);
	return ALL_PROFILES.map((profile) => scoreAgainstProfile(enriched, profile));
}

function enrichStructuredInput(input: ScoringInput): ScoringInput {
	if (input.experienceEntries?.length && input.educationEntries?.length) return input;
	const parsed = parseResumeText(input.resumeText).resume;
	if (!parsed) return input;
	return {
		...input,
		experienceEntries:
			input.experienceEntries ??
			parsed.experience.map((entry) => ({
				title: entry.title,
				company: entry.company,
				start: entry.dates.start,
				end: entry.dates.end,
				isCurrent: entry.dates.isCurrent,
				text: entry.rawText
			})),
		educationEntries:
			input.educationEntries ??
			parsed.education.map((entry) => ({
				degree: entry.degree,
				field: entry.field,
				institution: entry.institution,
				text: entry.rawText
			}))
	};
}

export function scoreAgainstProfile(input: ScoringInput, profile: ATSProfile): ScoreResult {
	const normalizedInput = { ...input, locale: input.locale ?? detectLocale(input.resumeText) };
	const breakdown = computeBreakdown(normalizedInput, profile);
	const weightedScore = computeWeightedScore(
		breakdown,
		profile,
		Boolean(input.jobDescription?.trim())
	);
	const quirkAdjustment = computeQuirkAdjustment(normalizedInput, profile);
	const confidencePenalty =
		input.extractionQuality !== undefined && input.extractionQuality < 60
			? Math.min(12, (60 - input.extractionQuality) * 0.25)
			: 0;
	const overallScore = Math.max(
		0,
		Math.min(
			100,
			Math.round(weightedScore + quirkAdjustment.totalAdjustment - confidencePenalty)
		)
	);
	return {
		system: profile.name,
		vendor: profile.vendor,
		overallScore,
		passesFilter: overallScore >= profile.passingScore,
		breakdown,
		suggestions: generateSuggestions(
			breakdown,
			profile,
			quirkAdjustment.messages,
			normalizedInput
		)
	};
}

function detectLocale(text: string): 'pt-BR' | 'en' {
	const normalized = text
		.normalize('NFKD')
		.replace(/\p{M}/gu, '')
		.toLowerCase();
	const pt = (
		normalized.match(
			/\b(?:experiencia|formacao|habilidades|competencias|desenvolvimento|atuacao|presente|conclusao)\b/g
		) || []
	).length;
	const en = (
		normalized.match(
			/\b(?:experience|education|skills|development|present|summary|degree|responsibilities)\b/g
		) || []
	).length;
	return pt > en ? 'pt-BR' : 'en';
}

function computeBreakdown(input: ScoringInput, profile: ATSProfile): ScoreBreakdown {
	const locale = input.locale ?? 'en';
	const formatting = scoreFormatting(input, profile.parsingStrictness);
	const sections = scoreSections(input.resumeSections, profile.requiredSections);
	const experience = scoreExperience(input.experienceBullets, locale);
	const education = scoreEducation(input.educationText, locale);
	const hasJob = Boolean(input.jobDescription?.trim());

	if (profile.name === 'Gupy-like' && hasJob) {
		const alignment = scoreGupyAlignment(input, experience.score, education.score);
		return {
			formatting: {
				score: formatting.score,
				issues: formatting.issues,
				details: formatting.details
			},
			keywordMatch: {
				score: alignment.keywordScore,
				matched: alignment.matchedSkills,
				missing: alignment.missingSkills,
				synonymMatched: alignment.preferredMatched
			},
			sections: {
				score: sections.score,
				present: sections.present,
				missing: sections.missing
			},
			experience: {
				score: alignment.experienceScore,
				quantifiedBullets: experience.quantifiedBullets,
				totalBullets: experience.totalBullets,
				actionVerbCount: experience.actionVerbCount,
				highlights: [...experience.highlights, ...alignment.experienceNotes]
			},
			education: {
				score: alignment.educationScore,
				notes: [...education.notes, ...alignment.educationNotes]
			}
		};
	}

	const keywordCorpus =
		profile.name === 'Gupy-like'
			? [
					input.resumeSkills.join(' '),
					input.experienceBullets.join(' '),
					input.educationText
				].join('\n')
			: input.resumeText;
	const keywords = matchKeywords(
		keywordCorpus,
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
		education: { score: education.score, notes: education.notes }
	};
}

function computeWeightedScore(
	breakdown: ScoreBreakdown,
	profile: ATSProfile,
	hasJobDescription: boolean
): number {
	const { weights } = profile;
	const quantificationScore =
		breakdown.experience.totalBullets > 0
			? Math.round(
					(breakdown.experience.quantifiedBullets /
						breakdown.experience.totalBullets) *
						100
				)
			: 0;
	const components = [
		{ score: breakdown.formatting.score, weight: weights.formatting },
		{ score: breakdown.sections.score, weight: weights.sectionCompleteness },
		{ score: breakdown.experience.score, weight: weights.experienceRelevance },
		{ score: breakdown.education.score, weight: weights.educationMatch },
		{ score: quantificationScore, weight: weights.quantification }
	];
	if (hasJobDescription) {
		components.push({
			score: breakdown.keywordMatch.score,
			weight: weights.keywordMatch
		});
	}
	const activeWeight = components.reduce(
		(sum, component) => sum + component.weight,
		0
	);
	return activeWeight > 0
		? components.reduce(
				(sum, component) => sum + component.score * component.weight,
				0
			) / activeWeight
		: 0;
}

function computeQuirkAdjustment(
	input: ScoringInput,
	profile: ATSProfile
): { totalAdjustment: number; messages: string[] } {
	let totalAdjustment = 0;
	const messages: string[] = [];
	for (const quirk of profile.quirks) {
		const result = quirk.check(input);
		if (!result) continue;
		totalAdjustment -= result.penalty;
		messages.push(result.message);
	}
	return { totalAdjustment, messages };
}

function generateSuggestions(
	breakdown: ScoreBreakdown,
	profile: ATSProfile,
	quirkMessages: string[],
	input: ScoringInput
): string[] {
	const pt = input.locale === 'pt-BR';
	const suggestions: string[] = [];
	if (input.extractionQuality !== undefined && input.extractionQuality < 70) {
		suggestions.push(
			pt
				? `revise os campos extraídos: confiança de leitura em ${input.extractionQuality}%`
				: `review extracted fields: reading confidence is ${input.extractionQuality}%`
		);
	}
	if (breakdown.formatting.score < 70) {
		if (
			breakdown.formatting.issues.some((issue) => issue.includes('multi-column'))
		) {
			suggestions.push(
				pt ? 'use um layout de coluna única' : 'switch to a single-column resume layout'
			);
		}
		if (breakdown.formatting.issues.some((issue) => issue.includes('tables'))) {
			suggestions.push(
				pt
					? 'remova tabelas e use blocos de texto simples'
					: 'remove tables and use plain text blocks'
			);
		}
		if (breakdown.formatting.issues.some((issue) => issue.includes('images'))) {
			suggestions.push(
				pt
					? 'remova imagens que contenham informações relevantes'
					: 'remove images that contain relevant information'
			);
		}
	}
	if (
		input.jobDescription?.trim() &&
		breakdown.keywordMatch.score < 60 &&
		breakdown.keywordMatch.missing.length
	) {
		const topMissing = breakdown.keywordMatch.missing.slice(0, 8);
		suggestions.push(
			pt
				? `competências obrigatórias ausentes em relação à vaga: ${topMissing.join(', ')}`
				: `required skills missing from the job: ${topMissing.join(', ')}`
		);
		if (profile.keywordStrategy === 'exact') {
			suggestions.push(
				pt
					? `${profile.name} valoriza os termos exatos usados na vaga`
					: `${profile.name} favors exact terms used in the posting`
			);
		}
	}
	if (breakdown.sections.missing.length) {
		suggestions.push(
			pt
				? `seções ausentes: ${breakdown.sections.missing.join(', ')}`
				: `missing sections: ${breakdown.sections.missing.join(', ')}`
		);
	}
	if (breakdown.experience.totalBullets > 0) {
		const quantRatio =
			breakdown.experience.quantifiedBullets /
			breakdown.experience.totalBullets;
		const actionRatio =
			breakdown.experience.actionVerbCount /
			breakdown.experience.totalBullets;
		if (quantRatio < 0.3) {
			suggestions.push(
				pt
					? 'adicione resultados mensuráveis às experiências'
					: 'add measurable outcomes to experience bullets'
			);
		}
		if (actionRatio < 0.5) {
			suggestions.push(
				pt
					? 'inicie mais tópicos com verbos de ação'
					: 'start more bullets with action verbs'
			);
		}
	} else {
		suggestions.push(
			pt
				? 'descreva responsabilidades e entregas nas experiências'
				: 'describe responsibilities and outcomes in experience entries'
		);
	}
	if (breakdown.education.score < 50) {
		suggestions.push(
			pt
				? 'informe tipo de curso, instituição, área e período'
				: 'include degree type, institution, field and dates'
		);
	}
	return [...new Set([...suggestions, ...quirkMessages])];
}
