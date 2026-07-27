import { parseJobDescription } from '$engine/job-parser';
import type { ParsedJobDescription } from '$engine/job-parser/types';
import type { ScoringEducationEntry, ScoringExperienceEntry, ScoringInput } from './types';

export interface GupyAlignmentResult {
	keywordScore: number;
	matchedSkills: string[];
	missingSkills: string[];
	preferredMatched: string[];
	experienceScore: number;
	experienceNotes: string[];
	educationScore: number;
	educationNotes: string[];
	parsedJob: ParsedJobDescription;
}

export function scoreGupyAlignment(
	input: ScoringInput,
	baseExperienceScore: number,
	baseEducationScore: number
): GupyAlignmentResult {
	const parsedJob = parseJobDescription(input.jobDescription ?? '');
	const skillResult = matchStructuredSkills(
		input.resumeSkills,
		parsedJob.requiredSkills,
		parsedJob.preferredSkills
	);
	const entries = input.experienceEntries ?? [];
	const educationEntries = input.educationEntries ?? [];
	const durationMonths = totalNonOverlappingMonths(entries);
	const requiredMonths =
		parsedJob.minimumExperienceYears === null
			? null
			: parsedJob.minimumExperienceYears * 12;
	const durationScore =
		requiredMonths === null
			? entries.length > 0
				? 75
				: 0
			: Math.round(
					Math.min(100, (durationMonths / Math.max(1, requiredMonths)) * 100)
				);
	const roleScore = scoreRoleAlignment(entries, parsedJob.roleType);
	const experienceScore = Math.round(
		baseExperienceScore * 0.45 + durationScore * 0.35 + roleScore * 0.2
	);
	const experienceNotes = buildExperienceNotes(
		input.locale ?? parsedJob.language,
		durationMonths,
		requiredMonths,
		roleScore,
		parsedJob.experienceLevel
	);
	const education = scoreEducationRequirement(
		educationEntries,
		parsedJob.educationRequirement,
		baseEducationScore,
		input.locale ?? parsedJob.language
	);

	return {
		keywordScore: skillResult.score,
		matchedSkills: skillResult.matched,
		missingSkills: skillResult.missing,
		preferredMatched: skillResult.preferredMatched,
		experienceScore,
		experienceNotes,
		educationScore: education.score,
		educationNotes: education.notes,
		parsedJob
	};
}

function fold(value: string): string {
	return value
		.normalize('NFKD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9+#.]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function canonical(value: string): string {
	const normalized = fold(value);
	const aliases: Record<string, string> = {
		golang: 'go',
		'node js': 'node.js',
		nodejs: 'node.js',
		nextjs: 'next.js',
		'restful api': 'rest api',
		'restful apis': 'rest api',
		'rest apis': 'rest api',
		'apis rest': 'rest api',
		microsservicos: 'microservices',
		'microsservicos em go': 'microservices',
		lideranca: 'leadership',
		comunicacao: 'communication',
		'gestao de projetos': 'project management',
		'metodologias ageis': 'agile'
	};
	return aliases[normalized] ?? normalized;
}

function matchStructuredSkills(
	resumeSkills: string[],
	requiredSkills: string[],
	preferredSkills: string[]
): { score: number; matched: string[]; missing: string[]; preferredMatched: string[] } {
	const resume = new Set(resumeSkills.map(canonical));
	const required = requiredSkills.map((skill) => ({ raw: skill, canonical: canonical(skill) }));
	const preferred = preferredSkills.map((skill) => ({ raw: skill, canonical: canonical(skill) }));
	const matched = required
		.filter((skill) => resume.has(skill.canonical))
		.map((skill) => skill.raw);
	const missing = required
		.filter((skill) => !resume.has(skill.canonical))
		.map((skill) => skill.raw);
	const preferredMatched = preferred
		.filter((skill) => resume.has(skill.canonical))
		.map((skill) => skill.raw);

	if (required.length === 0 && preferred.length === 0) {
		return { score: 0, matched: [], missing: [], preferredMatched: [] };
	}
	const requiredScore = required.length ? matched.length / required.length : 1;
	const preferredScore = preferred.length
		? preferredMatched.length / preferred.length
		: 1;
	const requiredWeight = required.length ? 0.8 : 0;
	const preferredWeight = preferred.length ? 0.2 : 0;
	const totalWeight = requiredWeight + preferredWeight;
	return {
		score: Math.round(
			((requiredScore * requiredWeight + preferredScore * preferredWeight) /
				Math.max(0.01, totalWeight)) *
				100
		),
		matched,
		missing,
		preferredMatched
	};
}

function parseMonth(value: string | null, isEnd = false): number | null {
	if (!value) return null;
	const match = value.match(/^(\d{4})(?:-(\d{2}))?$/);
	if (!match) return null;
	const year = Number(match[1]);
	const month = match[2] ? Number(match[2]) - 1 : isEnd ? 11 : 0;
	return year * 12 + month;
}

export function totalNonOverlappingMonths(entries: ScoringExperienceEntry[]): number {
	const now = new Date();
	const currentMonth = now.getUTCFullYear() * 12 + now.getUTCMonth();
	const intervals = entries
		.map((entry) => {
			const start = parseMonth(entry.start);
			const end = entry.isCurrent
				? currentMonth
				: (parseMonth(entry.end, true) ?? start);
			return start === null || end === null || end < start
				? null
				: ([start, end] as const);
		})
		.filter((interval): interval is readonly [number, number] => interval !== null)
		.sort((a, b) => a[0] - b[0]);
	if (!intervals.length) return 0;
	let [start, end] = intervals[0];
	let total = 0;
	for (const [nextStart, nextEnd] of intervals.slice(1)) {
		if (nextStart <= end + 1) {
			end = Math.max(end, nextEnd);
		} else {
			total += end - start + 1;
			start = nextStart;
			end = nextEnd;
		}
	}
	return total + (end - start + 1);
}

function scoreRoleAlignment(entries: ScoringExperienceEntry[], roleType: string): number {
	if (roleType === 'other') return entries.length ? 75 : 0;
	const corpus = fold(
		entries.map((entry) => `${entry.title} ${entry.text}`).join(' ')
	);
	const patterns: Record<string, RegExp> = {
		engineering:
			/\b(?:developer|engineer|software|programmer|desenvolvedor|engenheiro|programador|api|web|backend|frontend)\b/,
		sales: /\b(?:sales|account executive|vendas|comercial|promotor|cliente)\b/,
		marketing: /\b(?:marketing|brand|content|seo|social media|conteudo|midias sociais)\b/,
		finance: /\b(?:finance|financial|accounting|financeiro|contabilidade|auditoria)\b/,
		healthcare: /\b(?:nurse|clinical|patient|enfermeiro|clinico|saude)\b/,
		legal: /\b(?:legal|attorney|compliance|juridico|advogado)\b/,
		operations:
			/\b(?:operations|logistics|operacao|logistica|ferroviaria|processos operacionais)\b/,
		design: /\b(?:design|ux|ui|graphic|criativo)\b/
	};
	const pattern = patterns[roleType];
	if (!pattern) return 60;
	const matches = corpus.match(new RegExp(pattern.source, 'g'))?.length ?? 0;
	return Math.min(100, matches * 20);
}

function buildExperienceNotes(
	locale: 'pt-BR' | 'en',
	durationMonths: number,
	requiredMonths: number | null,
	roleScore: number,
	level: string
): string[] {
	const years = durationMonths / 12;
	if (locale === 'pt-BR') {
		return [
			`experiência cronológica detectada: ${years.toFixed(1)} ano(s)`,
			requiredMonths === null
				? 'a vaga não informa tempo mínimo explícito'
				: `tempo mínimo da vaga: ${(requiredMonths / 12).toFixed(1)} ano(s)`,
			`aderência dos cargos e descrições à área: ${roleScore}%`,
			`senioridade indicada na vaga: ${level}`
		];
	}
	return [
		`detected chronological experience: ${years.toFixed(1)} year(s)`,
		requiredMonths === null
			? 'the job does not state an explicit minimum duration'
			: `job minimum: ${(requiredMonths / 12).toFixed(1)} year(s)`,
		`role and description alignment: ${roleScore}%`,
		`job seniority: ${level}`
	];
}

function educationLevel(entries: ScoringEducationEntry[]): number {
	const corpus = fold(
		entries.map((entry) => `${entry.degree} ${entry.field} ${entry.text}`).join(' ')
	);
	if (/\b(?:doctorate|phd|doutorado)\b/.test(corpus)) return 5;
	if (/\b(?:master|mba|mestrado|pos graduacao)\b/.test(corpus)) return 4;
	if (/\b(?:bachelor|bacharelado|graduacao|licenciatura)\b/.test(corpus)) return 3;
	if (/\b(?:associate|tecnologia|tecnologo)\b/.test(corpus)) return 2;
	if (/\b(?:technical|tecnico|diploma|certificate)\b/.test(corpus)) return 1;
	return 0;
}

function requiredEducationLevel(requirement: string): number {
	const levels: Record<string, number> = {
		doctorate: 5,
		master: 4,
		bachelor: 3,
		associate: 2,
		technical: 1
	};
	return levels[requirement] ?? 0;
}

function scoreEducationRequirement(
	entries: ScoringEducationEntry[],
	requirement: string,
	baseScore: number,
	locale: 'pt-BR' | 'en'
): { score: number; notes: string[] } {
	const current = educationLevel(entries);
	const required = requiredEducationLevel(requirement);
	if (required === 0) {
		return {
			score: baseScore,
			notes: [
				locale === 'pt-BR'
					? 'a vaga não informa formação mínima explícita'
					: 'the job does not state an explicit education minimum'
			]
		};
	}
	const matchScore = current >= required ? 100 : Math.round((current / required) * 100);
	return {
		score: Math.round(baseScore * 0.45 + matchScore * 0.55),
		notes: [
			locale === 'pt-BR'
				? `nível de formação detectado ${current}; exigido ${required}`
				: `detected education level ${current}; required ${required}`,
			locale === 'pt-BR'
				? current >= required
					? 'requisito de formação atendido'
					: 'requisito de formação parcialmente atendido'
				: current >= required
					? 'education requirement met'
					: 'education requirement partially met'
		]
	};
}
