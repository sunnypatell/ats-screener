export interface LLMAnalysis {
	extractedRequirements: {
		requiredSkills: string[];
		preferredSkills: string[];
		experienceLevel: string;
		educationRequirement: string;
		industryContext: string;
		roleType: string;
	};
	semanticMatches: {
		skill: string;
		resumeEvidence: string;
		confidence: number;
	}[];
	suggestions: string[];
	overallAssessment: string;
}

export interface LLMRequestPayload {
	resumeText: string;
	jobDescription: string;
	resumeSkills: string[];
	mode: 'analyze-jd' | 'semantic-match' | 'suggestions';
}

export interface LLMResponse {
	success: boolean;
	data: LLMAnalysis | null;
	error: string | null;
	fallback: boolean;
}
