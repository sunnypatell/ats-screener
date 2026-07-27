import type { ParsedJobDescription } from './types';
import { extractNgrams, tokenize } from '$engine/nlp/tokenizer';
import { detectIndustry, getIndustrySkills } from '$engine/nlp/skills-taxonomy';

const COMMON_SKILLS = [
	'python',
	'java',
	'javascript',
	'typescript',
	'react',
	'react native',
	'angular',
	'vue',
	'next.js',
	'node.js',
	'golang',
	'go',
	'rust',
	'swift',
	'kotlin',
	'ruby',
	'php',
	'c++',
	'c#',
	'.net',
	'sql',
	'nosql',
	'mongodb',
	'postgresql',
	'mysql',
	'redis',
	'docker',
	'kubernetes',
	'aws',
	'azure',
	'gcp',
	'terraform',
	'jenkins',
	'git',
	'github',
	'linux',
	'fastapi',
	'express',
	'rest api',
	'restful api',
	'apis rest',
	'microservices',
	'microsservicos',
	'microsserviços',
	'selenium',
	'playwright',
	'beautifulsoup',
	'web scraping',
	'machine learning',
	'deep learning',
	'data science',
	'nlp',
	'natural language processing',
	'computer vision',
	'tensorflow',
	'pytorch',
	'pandas',
	'spark',
	'hadoop',
	'tableau',
	'power bi',
	'etl',
	'salesforce',
	'hubspot',
	'sap',
	'oracle',
	'quickbooks',
	'excel',
	'powerpoint',
	'jira',
	'confluence',
	'asana',
	'slack',
	'cpa',
	'pmp',
	'cissp',
	'ceh',
	'six sigma',
	'scrum',
	'agile',
	'metodologias ageis',
	'metodologias ágeis',
	'lideranca',
	'liderança',
	'comunicacao',
	'comunicação',
	'atendimento ao cliente',
	'gestao de projetos',
	'gestão de projetos'
];

export function parseJobDescription(text: string): ParsedJobDescription {
	const normalized = fold(text);
	const language = detectLanguage(normalized);
	const tokens = tokenize(text);
	const terms = [...new Set(tokens.map((token) => token.normalized))];
	const bigrams = extractNgrams(text, 2);
	const trigrams = extractNgrams(text, 3);
	const industries = detectIndustry(text);
	const industryContext = industries[0]?.industry ?? 'general';
	const industrySkills = industries.length
		? getIndustrySkills(industries[0].industry).map((skill) => fold(skill))
		: [];
	const extractedSkills = extractSkills(text, terms, bigrams, trigrams, industrySkills);
	const { required, preferred } = categorizeSkills(text, extractedSkills);
	const minimumExperienceYears = detectMinimumExperienceYears(normalized);
	const experienceLevel = detectExperienceLevel(normalized, minimumExperienceYears);
	const educationRequirement = detectEducationRequirement(normalized);
	const roleType = detectRoleType(normalized);
	const keyPhrases = [...bigrams, ...trigrams]
		.filter(isKeyPhrase)
		.filter((phrase, index, all) => all.indexOf(phrase) === index)
		.slice(0, 24);

	return {
		rawText: text,
		extractedSkills,
		requiredSkills: required,
		preferredSkills: preferred,
		experienceLevel,
		minimumExperienceYears,
		educationRequirement,
		industryContext,
		roleType,
		keyPhrases,
		language
	};
}

function fold(value: string): string {
	return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
}

function detectLanguage(text: string): 'pt-BR' | 'en' {
	const pt = (
		text.match(
			/\b(?:requisitos|obrigatorio|desejavel|experiencia|formacao|habilidades|competencias|vaga|cargo|anos)\b/g
		) || []
	).length;
	const en = (
		text.match(
			/\b(?:requirements|required|preferred|experience|education|skills|position|role|years)\b/g
		) || []
	).length;
	return pt > en ? 'pt-BR' : 'en';
}

function extractSkills(
	text: string,
	terms: string[],
	bigrams: string[],
	trigrams: string[],
	industrySkills: string[]
): string[] {
	const result = new Set<string>();
	const corpus = fold(text);
	const candidates = new Set([...industrySkills, ...COMMON_SKILLS.map(fold)]);
	for (const term of terms) {
		if (candidates.has(term) && term.length >= 2) result.add(canonicalSkill(term));
	}
	for (const phrase of [...bigrams, ...trigrams]) {
		const folded = fold(phrase);
		if (candidates.has(folded)) result.add(canonicalSkill(folded));
	}
	for (const skill of candidates) {
		const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		if (
			new RegExp(
				`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`,
				'iu'
			).test(corpus)
		) {
			result.add(canonicalSkill(skill));
		}
	}
	return [...result];
}

function canonicalSkill(skill: string): string {
	const key = fold(skill).replace(/\s+/g, ' ').trim();
	const aliases: Record<string, string> = {
		golang: 'Go',
		go: 'Go',
		typescript: 'TypeScript',
		javascript: 'JavaScript',
		python: 'Python',
		'react native': 'React Native',
		react: 'React',
		'next.js': 'Next.js',
		nextjs: 'Next.js',
		'node.js': 'Node.js',
		nodejs: 'Node.js',
		fastapi: 'FastAPI',
		postgresql: 'PostgreSQL',
		mysql: 'MySQL',
		mongodb: 'MongoDB',
		github: 'GitHub',
		docker: 'Docker',
		kubernetes: 'Kubernetes',
		aws: 'AWS',
		azure: 'Azure',
		gcp: 'GCP',
		sql: 'SQL',
		'power bi': 'Power BI',
		'rest api': 'REST APIs',
		'restful api': 'REST APIs',
		'apis rest': 'REST APIs',
		microsservicos: 'Microservices',
		microservices: 'Microservices',
		'metodologias ageis': 'Agile',
		agile: 'Agile',
		scrum: 'Scrum',
		lideranca: 'Leadership',
		comunicacao: 'Communication',
		'gestao de projetos': 'Project Management',
		'atendimento ao cliente': 'Customer Service'
	};
	return aliases[key] ?? skill.trim();
}

function categorizeSkills(
	text: string,
	skills: string[]
): { required: string[]; preferred: string[] } {
	const required = new Set<string>();
	const preferred = new Set<string>();
	let mode: 'required' | 'preferred' | 'neutral' = 'neutral';
	for (const rawLine of text.split(/\r?\n/)) {
		const line = fold(rawLine).trim();
		if (!line) continue;
		if (
			/\b(?:preferred|nice to have|bonus|desired|plus|ideal|desejavel|desejaveis|diferencial|diferenciais|sera um diferencial)\b/.test(
				line
			)
		) {
			mode = 'preferred';
		} else if (
			/\b(?:required|must have|minimum|essential|requirements|mandatory|requisitos|obrigatorio|obrigatorios|essencial|necessario|necessarios)\b/.test(
				line
			)
		) {
			mode = 'required';
		}
		for (const skill of skills) {
			if (!containsSkill(line, fold(skill))) continue;
			if (
				mode === 'preferred' ||
				/\b(?:preferred|desejavel|diferencial|bonus)\b/.test(line)
			) {
				preferred.add(skill);
			} else {
				required.add(skill);
			}
		}
	}
	for (const skill of skills) {
		if (!required.has(skill) && !preferred.has(skill)) required.add(skill);
	}
	for (const skill of preferred) required.delete(skill);
	return { required: [...required], preferred: [...preferred] };
}

function containsSkill(text: string, skill: string): boolean {
	const aliases: Record<string, string[]> = {
		go: ['go', 'golang'],
		'rest apis': ['rest api', 'restful api', 'apis rest'],
		microservices: ['microservices', 'microsservicos'],
		leadership: ['leadership', 'lideranca'],
		communication: ['communication', 'comunicacao'],
		'project management': ['project management', 'gestao de projetos']
	};
	return (aliases[skill] ?? [skill]).some((alias) => {
		const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		return new RegExp(
			`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`,
			'iu'
		).test(text);
	});
}

function detectMinimumExperienceYears(text: string): number | null {
	const matches = [
		...text.matchAll(
			/\b(\d{1,2})(?:\s*(?:-|a|to)\s*\d{1,2})?\s*\+?\s*(?:anos?|years?|yrs?)\b/giu
		)
	]
		.map((match) => Number(match[1]))
		.filter((value) => Number.isFinite(value) && value <= 30);
	return matches.length ? Math.max(...matches) : null;
}

function detectExperienceLevel(
	text: string,
	minimumYears: number | null
): ParsedJobDescription['experienceLevel'] {
	if (
		/\b(?:director|vp|vice president|head of|chief|diretor|diretora|vice-presidente|presidente|c-level)\b/.test(
			text
		)
	) {
		return 'executive';
	}
	if (
		/\b(?:lead|principal|staff|architect|lider|especialista principal|arquiteto|arquiteta)\b/.test(
			text
		)
	) {
		return 'lead';
	}
	if (/\b(?:senior|sr\.?)\b/.test(text) || (minimumYears ?? 0) >= 5) return 'senior';
	if (
		/\b(?:junior|jr\.?|entry|iniciante)\b/.test(text) ||
		(minimumYears !== null && minimumYears <= 2)
	) {
		return 'entry';
	}
	if (/\b(?:intern|internship|co-op|new grad|estagio|estagiario|aprendiz)\b/.test(text)) {
		return 'entry';
	}
	return 'mid';
}

function detectEducationRequirement(text: string): string {
	if (/\b(?:ph\.?d|doctorate|doutorado)\b/.test(text)) return 'doctorate';
	if (/\b(?:master'?s?|mba|m\.?s\.?|m\.?a\.?|mestrado|pos-graduacao)\b/.test(text)) {
		return 'master';
	}
	if (
		/\b(?:bachelor'?s?|b\.?s\.?|b\.?a\.?|bacharelado|graduacao|ensino superior)\b/.test(
			text
		)
	) {
		return 'bachelor';
	}
	if (/\b(?:associate'?s?|tecnologo|tecnologia)\b/.test(text)) return 'associate';
	if (/\b(?:technical degree|curso tecnico|ensino tecnico)\b/.test(text)) return 'technical';
	return 'not specified';
}

function detectRoleType(text: string): string {
	if (
		/\b(?:engineer|developer|programmer|devops|sre|software|frontend|backend|fullstack|engenheiro|desenvolvedor|programador)\b/.test(
			text
		)
	) {
		return 'engineering';
	}
	if (/\b(?:sales|account executive|business development|vendas|comercial|promotor)\b/.test(text)) {
		return 'sales';
	}
	if (/\b(?:market|brand|content|seo|social media|marketing|conteudo|midias sociais)\b/.test(text)) {
		return 'marketing';
	}
	if (
		/\b(?:financial|finance|accounting|audit|tax|treasury|cpa|cfa|financeiro|financas|contabilidade|auditoria)\b/.test(
			text
		)
	) {
		return 'finance';
	}
	if (/\b(?:nurse|physician|clinical|patient|healthcare|enfermeiro|medico|clinico|saude)\b/.test(text)) {
		return 'healthcare';
	}
	if (/\b(?:legal|attorney|counsel|compliance|juridico|advogado|advogada)\b/.test(text)) {
		return 'legal';
	}
	if (/\b(?:operat\w*|supply chain|logistics|operacao|logistica|suprimentos)\b/.test(text)) {
		return 'operations';
	}
	if (/\b(?:design|ux|ui|graphic|creative|criativo|criativa)\b/.test(text)) return 'design';
	return 'other';
}

function isKeyPhrase(phrase: string): boolean {
	const words = phrase.split(' ');
	const generic = new Set([
		'the',
		'and',
		'for',
		'with',
		'this',
		'that',
		'will',
		'you',
		'are',
		'para',
		'com',
		'uma',
		'um',
		'que',
		'por',
		'das',
		'dos'
	]);
	return !words.every((word) => generic.has(word)) && !words.some((word) => word.length <= 1);
}
