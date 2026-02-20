export interface ContactInfo {
	name: string | null;
	email: string | null;
	phone: string | null;
	linkedin: string | null;
	github: string | null;
	website: string | null;
	location: string | null;
}

export interface DateRange {
	start: string | null;
	end: string | null;
	isCurrent: boolean;
}

export interface ExperienceEntry {
	title: string;
	company: string;
	dates: DateRange;
	bullets: string[];
	rawText: string;
}

export interface EducationEntry {
	degree: string;
	field: string;
	institution: string;
	dates: DateRange;
	gpa: string | null;
	honors: string[];
	rawText: string;
}

export interface ProjectEntry {
	name: string;
	description: string;
	technologies: string[];
	bullets: string[];
	url: string | null;
	rawText: string;
}

export interface CertificationEntry {
	name: string;
	issuer: string;
	date: string | null;
	rawText: string;
}

export type SectionType =
	| 'contact'
	| 'summary'
	| 'experience'
	| 'education'
	| 'skills'
	| 'projects'
	| 'certifications'
	| 'awards'
	| 'publications'
	| 'volunteer'
	| 'languages'
	| 'interests'
	| 'unknown';

export interface ResumeSection {
	type: SectionType;
	header: string;
	content: string;
	startLine: number;
	endLine: number;
}

export interface ParsedResume {
	rawText: string;
	lines: string[];
	contact: ContactInfo;
	sections: ResumeSection[];
	experience: ExperienceEntry[];
	education: EducationEntry[];
	projects: ProjectEntry[];
	certifications: CertificationEntry[];
	skills: string[];
	summary: string | null;
	metadata: {
		fileType: 'pdf' | 'docx' | 'text';
		pageCount: number;
		wordCount: number;
		lineCount: number;
		hasMultipleColumns: boolean;
		hasTables: boolean;
		hasImages: boolean;
	};
}

export interface ParseResult {
	success: boolean;
	resume: ParsedResume | null;
	errors: string[];
	warnings: string[];
}
