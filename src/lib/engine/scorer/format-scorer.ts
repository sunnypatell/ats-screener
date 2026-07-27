import type { ScoringInput } from './types';

interface FormatScore {
	score: number;
	issues: string[];
	details: string[];
}

export function scoreFormatting(input: ScoringInput, strictness: number): FormatScore {
	const issues: string[] = [];
	const details: string[] = [];
	let deductions = 0;

	if (input.hasMultipleColumns) {
		const penalty = 15 * strictness;
		deductions += penalty;
		issues.push('multi-column layout detected');
		details.push(`multi-column reading order may be ambiguous (-${Math.round(penalty)})`);
	}
	if (input.hasTables) {
		const penalty = 12 * strictness;
		deductions += penalty;
		issues.push('tables detected in resume');
		details.push(`repeated aligned columns resemble a table (-${Math.round(penalty)})`);
	}
	if (input.hasImages) {
		const penalty = 8 * strictness;
		deductions += penalty;
		issues.push('images or graphics detected');
		details.push(`large raster graphics can hide text from parsers (-${Math.round(penalty)})`);
	}
	if (input.pageCount > 2) {
		const penalty = 5 * strictness;
		deductions += penalty;
		issues.push(`resume is ${input.pageCount} pages`);
		details.push(`content beyond two pages may receive less attention (-${Math.round(penalty)})`);
	}
	if (input.wordCount < 150) {
		const penalty = 10 * strictness;
		deductions += penalty;
		issues.push('resume appears very short');
		details.push(`only ${input.wordCount} words detected (-${Math.round(penalty)})`);
	} else if (input.wordCount > 1500) {
		const penalty = 3 * strictness;
		deductions += penalty;
		issues.push('resume is quite long');
		details.push(`${input.wordCount} words is above the usual range (-${Math.round(penalty)})`);
	}

	const text = input.resumeText;
	const unusualCharacters = text.match(/[^\p{L}\p{N}\s.,;:!?@#$%&*()\-+=/\\'"\[\]{}<>•·▪►➤○●–—]/gu) || [];
	const specialCharRatio = unusualCharacters.length / Math.max(1, text.length);
	if (specialCharRatio > 0.08) {
		const penalty = 8 * strictness;
		deductions += penalty;
		issues.push('unusual characters detected');
		details.push(`high symbol density may indicate encoding problems (-${Math.round(penalty)})`);
	}

	const lines = text.split('\n');
	const allCapsLines = lines.filter((line) => {
		const trimmed = line.trim();
		return trimmed.length > 30 && trimmed === trimmed.toLocaleUpperCase() && /\p{L}/u.test(trimmed);
	});
	if (allCapsLines.length > 3) {
		const penalty = 3 * strictness;
		deductions += penalty;
		issues.push('excessive use of all-caps text');
		details.push(`${allCapsLines.length} long lines are uppercase (-${Math.round(penalty)})`);
	}

	const bulletLines = lines.filter((line) => /^\s*[-•*·▪►➤○●]\s/.test(line));
	const bulletTypes = new Set(bulletLines.map((line) => line.match(/^\s*([-•*·▪►➤○●])/)?.[1]));
	if (bulletTypes.size > 2) {
		const penalty = 2 * strictness;
		deductions += penalty;
		issues.push('inconsistent bullet point styles');
		details.push(`${bulletTypes.size} bullet styles detected (-${Math.round(penalty)})`);
	}

	if (!input.hasMultipleColumns && !input.hasTables && !input.hasImages) details.push('clean parseable layout detected');
	if (input.pageCount <= 2) details.push('appropriate page length');
	if (input.wordCount >= 300 && input.wordCount <= 800) details.push('word count is in the usual range');
	return { score: Math.max(0, Math.min(100, 100 - deductions)), issues, details };
}
