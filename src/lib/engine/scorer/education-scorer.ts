interface EducationScore {
	score: number;
	notes: string[];
}

const DEGREE_PATTERNS: Array<{ label: string; level: number; pattern: RegExp }> = [
	{ label: 'doctorate', level: 5, pattern: /\b(?:ph\.?d\.?|doctorate|doctor|doutorado)\b/i },
	{ label: 'master', level: 4, pattern: /\b(?:master'?s?|mestrado|mba|m\.?s\.?|m\.?b\.?a\.?)\b/i },
	{ label: 'bachelor', level: 3, pattern: /\b(?:bachelor'?s?|bacharelado|licenciatura|b\.?s\.?|b\.?a\.?|b\.?eng\.?)\b/i },
	{ label: 'associate/technology', level: 2, pattern: /\b(?:associate'?s?|tecnologia|tecnologo|tecnólogo|a\.?s\.?|a\.?a\.?)\b/i },
	{ label: 'technical/diploma', level: 1, pattern: /\b(?:technical degree|ensino tecnico|ensino técnico|curso tecnico|curso técnico|diploma|certificate|certification|certificado)\b/i }
];

export function scoreEducation(educationText: string, locale: 'pt-BR' | 'en' = 'en'): EducationScore {
	if (!educationText?.trim()) {
		return { score: 0, notes: [locale === 'pt-BR' ? 'nenhuma formação acadêmica foi detectada' : 'no education section found'] };
	}

	const notes: string[] = [];
	let score = 0;
	let degreeFound = '';
	let highestLevel = 0;
	for (const degree of DEGREE_PATTERNS) {
		if (degree.pattern.test(educationText) && degree.level > highestLevel) {
			highestLevel = degree.level;
			degreeFound = degree.label;
		}
	}
	if (degreeFound) {
		score += 30;
		notes.push(locale === 'pt-BR' ? `nível de formação detectado: ${degreeFound}` : `degree level detected: ${degreeFound}`);
	} else {
		notes.push(locale === 'pt-BR' ? 'tipo de formação não identificado claramente' : 'no clear degree type found');
	}

	const hasInstitution = /\b(?:university|college|institute|school|faculdade|universidade|instituto|senai|senac|ifsp|usp|unesp|unicamp)\b/i.test(educationText);
	if (hasInstitution) score += 20;
	else notes.push(locale === 'pt-BR' ? 'instituição não identificada claramente' : 'institution name may not be clearly parseable');

	const hasYear = /\b(?:19|20)\d{2}\b/.test(educationText);
	if (hasYear) score += 15;
	else notes.push(locale === 'pt-BR' ? 'ano de conclusão não encontrado' : 'no graduation year found');

	const hasField = /\b(?:computer science|software engineering|systems analysis and development|railway transportation|analise e desenvolvimento de sistemas|análise e desenvolvimento de sistemas|engenharia de software|ciencia da computacao|ciência da computação|transporte ferroviario|transporte ferroviário|administracao|administração|marketing|finance|financas|finanças|accounting|contabilidade|nursing|enfermagem|law|direito|design)\b/i.test(educationText) || /\b(?:in|of|em)\s+[\p{Lu}]/u.test(educationText);
	if (hasField) {
		score += 20;
		notes.push(locale === 'pt-BR' ? 'área de estudo detectada' : 'field of study detected');
	} else notes.push(locale === 'pt-BR' ? 'área de estudo pouco explícita' : 'field of study is not explicit');

	const hasGPA = /\b(?:gpa|media|média)\b/i.test(educationText) || /\b[34][.,]\d{1,2}\s*\/?\s*4\b/i.test(educationText);
	if (hasGPA) {
		score += 5;
		notes.push(locale === 'pt-BR' ? 'média acadêmica informada' : 'GPA listed');
	}
	const hasHonors = /\b(?:cum laude|magna cum laude|summa cum laude|dean'?s? list|honors?|distinction|honras?|destaque academico|destaque acadêmico)\b/i.test(educationText);
	if (hasHonors) score += 10;

	return { score: Math.min(100, score), notes };
}
