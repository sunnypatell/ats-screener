export interface ParsedJobDescription {
	rawText: string;
	extractedSkills: string[];
	requiredSkills: string[];
	preferredSkills: string[];
	experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
	minimumExperienceYears: number | null;
	educationRequirement: string;
	industryContext: string;
	roleType: string;
	keyPhrases: string[];
	language: 'pt-BR' | 'en';
}
