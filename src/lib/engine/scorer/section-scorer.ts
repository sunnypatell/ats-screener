interface SectionScore {
	score: number;
	present: string[];
	missing: string[];
}

/**
 * scores section completeness based on what the ATS profile expects.
 * different systems have different required sections.
 * e.g., Workday expects very structured sections while Lever is more lenient.
 */
export function scoreSections(presentSections: string[], requiredSections: string[]): SectionScore {
	const presentSet = new Set(presentSections.map((s) => s.toLowerCase()));
	const present: string[] = [];
	const missing: string[] = [];

	for (const required of requiredSections) {
		if (presentSet.has(required.toLowerCase())) {
			present.push(required);
		} else {
			missing.push(required);
		}
	}

	// score based on percentage of required sections present
	const score =
		requiredSections.length > 0
			? Math.round((present.length / requiredSections.length) * 100)
			: 100;

	return { score, present, missing };
}
