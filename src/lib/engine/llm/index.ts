import { env as publicEnv } from '$env/dynamic/public';
import { scoreResume } from '$engine/scorer/engine';
import type { ScoringInput } from '$engine/scorer/types';
import { resumeStore } from '$stores/resume.svelte';
import {
	analyzWithLLM,
	scoreLLM as scoreWithRemoteLLM,
	type ScoreLLMResult
} from './client';

export async function scoreLLM(
	resumeText: string,
	jobDescription?: string,
	options?: { signal?: AbortSignal }
): Promise<ScoreLLMResult> {
	const deterministicOnly = publicEnv.PUBLIC_DETERMINISTIC_ONLY !== 'false';
	if (!deterministicOnly) {
		return scoreWithRemoteLLM(resumeText, jobDescription, options);
	}

	if (options?.signal?.aborted) return { status: 'cancelled' };
	const resume = resumeStore.resume;
	if (!resume) return { status: 'error' };

	const input: ScoringInput = {
		resumeText: resume.rawText,
		resumeSkills: resume.skills,
		resumeSections: resume.sections.map((section) => section.type),
		experienceBullets: resume.experience.flatMap((entry) => entry.bullets),
		educationText: resume.education.map((entry) => entry.rawText).join('\n'),
		hasMultipleColumns: resume.metadata.hasMultipleColumns,
		hasTables: resume.metadata.hasTables,
		hasImages: resume.metadata.hasImages,
		pageCount: resume.metadata.pageCount,
		wordCount: resume.metadata.wordCount,
		jobDescription,
		locale: resume.metadata.language,
		extractionQuality: resume.metadata.extractionQuality
	};

	return {
		status: 'ok',
		results: scoreResume(input),
		provider: 'deterministic-local',
		fallback: false
	};
}

export { analyzWithLLM };
export { generateFallbackAnalysis } from './fallback';
export {
	buildFullScoringPrompt,
	buildJDAnalysisPrompt,
	buildSemanticMatchPrompt,
	buildSuggestionsPrompt
} from './prompts';
export type { LLMAnalysis, LLMRequestPayload, LLMResponse } from './types';
