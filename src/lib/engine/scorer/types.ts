export interface ScoreBreakdown {
	formatting: {
		score: number;
		issues: string[];
		details: string[];
	};
	keywordMatch: {
		score: number;
		matched: string[];
		missing: string[];
		synonymMatched: string[];
	};
	sections: {
		score: number;
		present: string[];
		missing: string[];
	};
	experience: {
		score: number;
		quantifiedBullets: number;
		totalBullets: number;
		actionVerbCount: number;
		highlights: string[];
	};
	education: {
		score: number;
		notes: string[];
	};
}

export interface StructuredSuggestion {
	summary: string;
	details: string[];
	impact: 'critical' | 'high' | 'medium' | 'low';
	platforms: string[];
}

export type Suggestion = string | StructuredSuggestion;

export interface ScoreResult {
	system: string;
	vendor: string;
	overallScore: number;
	passesFilter: boolean;
	breakdown: ScoreBreakdown;
	suggestions: Suggestion[];
}

export interface ScoringInput {
	resumeText: string;
	resumeSkills: string[];
	resumeSections: string[];
	experienceBullets: string[];
	educationText: string;
	hasMultipleColumns: boolean;
	hasTables: boolean;
	hasImages: boolean;
	pageCount: number;
	wordCount: number;
	jobDescription?: string;
}

export interface ATSQuirk {
	id: string;
	description: string;
	check: (input: ScoringInput) => { penalty: number; message: string } | null;
}

export interface ATSProfile {
	name: string;
	vendor: string;
	marketShare: string;
	description: string;
	parsingStrictness: number;
	keywordStrategy: 'exact' | 'fuzzy' | 'semantic';
	weights: {
		formatting: number;
		keywordMatch: number;
		sectionCompleteness: number;
		experienceRelevance: number;
		educationMatch: number;
		quantification: number;
	};
	requiredSections: string[];
	preferredDateFormats: string[];
	quirks: ATSQuirk[];
	passingScore: number;
}
