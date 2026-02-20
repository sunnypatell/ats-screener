import type { ScoringInput } from './types';

interface FormatScore {
	score: number;
	issues: string[];
	details: string[];
}

/**
 * scores resume formatting and parseability.
 * this is what determines if an ATS can even READ the resume.
 * strict ATS systems (Workday, Taleo) penalize formatting issues heavily.
 */
export function scoreFormatting(input: ScoringInput, strictness: number): FormatScore {
	const issues: string[] = [];
	const details: string[] = [];
	let deductions = 0;

	// multi-column layout detection
	if (input.hasMultipleColumns) {
		const penalty = 15 * strictness;
		deductions += penalty;
		issues.push('multi-column layout detected');
		details.push(
			`multi-column layouts confuse most ATS parsers. text may be read out of order. (-${Math.round(penalty)})`
		);
	}

	// table detection
	if (input.hasTables) {
		const penalty = 12 * strictness;
		deductions += penalty;
		issues.push('tables detected in resume');
		details.push(
			`tables are poorly supported by many ATS systems. content inside tables may be skipped entirely. (-${Math.round(penalty)})`
		);
	}

	// image detection
	if (input.hasImages) {
		const penalty = 8 * strictness;
		deductions += penalty;
		issues.push('images or graphics detected');
		details.push(
			`ATS systems cannot read text embedded in images. logos, icons, and headshots add no value. (-${Math.round(penalty)})`
		);
	}

	// page count
	if (input.pageCount > 2) {
		const penalty = 5 * strictness;
		deductions += penalty;
		issues.push(`resume is ${input.pageCount} pages`);
		details.push(
			`most ATS systems and recruiters prefer 1-2 pages. longer resumes may be truncated. (-${Math.round(penalty)})`
		);
	}

	// word count (too short or too long)
	if (input.wordCount < 150) {
		const penalty = 10 * strictness;
		deductions += penalty;
		issues.push('resume appears very short');
		details.push(
			`only ${input.wordCount} words detected. this may indicate parsing issues or insufficient content. (-${Math.round(penalty)})`
		);
	} else if (input.wordCount > 1500) {
		const penalty = 3 * strictness;
		deductions += penalty;
		issues.push('resume is quite long');
		details.push(
			`${input.wordCount} words is above average. consider trimming to the most relevant content. (-${Math.round(penalty)})`
		);
	}

	// check for common formatting red flags in text
	const text = input.resumeText;

	// excessive special characters (often from bad PDF extraction)
	const specialCharRatio =
		(text.match(/[^\w\s.,;:!?@#$%&*()\-+=/\\'"]/g) || []).length / text.length;
	if (specialCharRatio > 0.05) {
		const penalty = 8 * strictness;
		deductions += penalty;
		issues.push('unusual characters detected');
		details.push(
			`high density of special characters suggests formatting issues or encoding problems. (-${Math.round(penalty)})`
		);
	}

	// all-caps sections (besides headers)
	const lines = text.split('\n');
	const allCapsLines = lines.filter(
		(l) => l.trim().length > 30 && l === l.toUpperCase() && /[A-Z]/.test(l)
	);
	if (allCapsLines.length > 3) {
		const penalty = 3 * strictness;
		deductions += penalty;
		issues.push('excessive use of all-caps text');
		details.push(
			`${allCapsLines.length} lines are fully uppercase. this can cause parsing confusion. (-${Math.round(penalty)})`
		);
	}

	// check for consistent bullet point usage
	const bulletLines = lines.filter((l) => /^\s*[-•*·▪►➤○●]\s/.test(l));
	const bulletTypes = new Set(bulletLines.map((l) => l.match(/^\s*([-•*·▪►➤○●])/)?.[1]));
	if (bulletTypes.size > 2) {
		const penalty = 2 * strictness;
		deductions += penalty;
		issues.push('inconsistent bullet point styles');
		details.push(
			`${bulletTypes.size} different bullet styles detected. use a consistent format. (-${Math.round(penalty)})`
		);
	}

	// positive signals
	if (!input.hasMultipleColumns && !input.hasTables && !input.hasImages) {
		details.push('clean single-column layout detected (good)');
	}
	if (input.pageCount <= 2) {
		details.push('appropriate page length (good)');
	}
	if (input.wordCount >= 300 && input.wordCount <= 800) {
		details.push('word count is in the ideal range (good)');
	}

	const score = Math.max(0, Math.min(100, 100 - deductions));

	return { score, issues, details };
}
