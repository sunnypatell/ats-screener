interface EducationScore {
	score: number;
	notes: string[];
}

const DEGREE_LEVELS: Record<string, number> = {
	phd: 5,
	'ph.d': 5,
	doctor: 5,
	doctorate: 5,
	master: 4,
	"master's": 4,
	mba: 4,
	ms: 4,
	'm.s': 4,
	ma: 4,
	'm.a': 4,
	'm.b.a': 4,
	bachelor: 3,
	"bachelor's": 3,
	bs: 3,
	'b.s': 3,
	ba: 3,
	'b.a': 3,
	'b.eng': 3,
	associate: 2,
	"associate's": 2,
	as: 2,
	'a.s': 2,
	aa: 2,
	'a.a': 2,
	diploma: 1,
	certificate: 1,
	certification: 1
};

// scores education section: degree, institution, dates, GPA, honors
export function scoreEducation(educationText: string): EducationScore {
	if (!educationText || educationText.trim().length === 0) {
		return {
			score: 20,
			notes: ['no education section found. most positions require at least a degree listing.']
		};
	}

	const notes: string[] = [];
	let score = 0;
	const lowerText = educationText.toLowerCase();

	// check for degree mention
	let highestDegree = 0;
	let degreeFound = '';
	for (const [degree, level] of Object.entries(DEGREE_LEVELS)) {
		if (lowerText.includes(degree) && level > highestDegree) {
			highestDegree = level;
			degreeFound = degree;
		}
	}

	if (highestDegree > 0) {
		score += 30;
		notes.push(`degree detected: ${degreeFound}`);
	} else {
		notes.push('no clear degree type found. ensure your degree is explicitly stated.');
	}

	// check for institution name (heuristic: capitalized multi-word phrase)
	const hasInstitution = /[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+/.test(educationText);
	if (hasInstitution) {
		score += 20;
	} else {
		notes.push('institution name may not be clearly parseable');
	}

	// check for dates
	const hasYear = /\b(19|20)\d{2}\b/.test(educationText);
	if (hasYear) {
		score += 15;
	} else {
		notes.push('no graduation date found. include your graduation year.');
	}

	// check for field of study
	const fieldIndicators = /\b(?:in|of)\s+[A-Z]/;
	const hasField =
		fieldIndicators.test(educationText) ||
		/(?:computer science|engineering|business|mathematics|biology|chemistry|physics|psychology|economics|finance|accounting|marketing|nursing|law|education|design)/i.test(
			educationText
		);
	if (hasField) {
		score += 15;
		notes.push('field of study detected');
	} else {
		notes.push('consider explicitly stating your field of study');
	}

	// check for GPA
	const hasGPA = /\bgpa\b/i.test(educationText) || /\b[34]\.\d{1,2}\s*\/?\s*4/i.test(educationText);
	if (hasGPA) {
		score += 10;
		notes.push('GPA listed');
		// check if GPA is strong
		const gpaMatch = educationText.match(/(\d\.\d{1,2})/);
		if (gpaMatch) {
			const gpa = parseFloat(gpaMatch[1]);
			if (gpa >= 3.5) notes.push(`strong GPA (${gpa})`);
			else if (gpa < 3.0) notes.push(`consider removing GPA below 3.0 unless required`);
		}
	}

	// check for honors
	const hasHonors =
		/\b(cum laude|magna cum laude|summa cum laude|dean'?s?\s*list|honors?|distinction)\b/i.test(
			educationText
		);
	if (hasHonors) {
		score += 10;
		notes.push('academic honors detected');
	}

	return {
		score: Math.min(100, score),
		notes
	};
}
