export interface ParsedJobDescription {
	rawText: string;
	extractedSkills: string[];
	requiredSkills: string[];
	preferredSkills: string[];
	experienceLevel: string;
	educationRequirement: string;
	industryContext: string;
	roleType: string;
	keyPhrases: string[];
}
