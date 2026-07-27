import { describe, expect, it } from 'vitest';
import { totalNonOverlappingMonths } from '$engine/scorer/gupy-alignment';
import { scoreAgainstProfile } from '$engine/scorer/engine';
import { GUPY_PROFILE } from '$engine/scorer/profiles/gupy';
import type { ScoringInput } from '$engine/scorer/types';

const job = `
Desenvolvedor Backend Sênior
Requisitos obrigatórios:
- 3 anos de experiência com TypeScript, Node.js, PostgreSQL e APIs REST
- Graduação em tecnologia
Diferenciais:
- Docker e Kubernetes
`;

function input(name: string, email: string): ScoringInput {
	return {
		resumeText: `${name}\n${email}\nDesenvolvedor Backend\nTypeScript Node.js PostgreSQL Docker`,
		resumeSkills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
		resumeSections: ['contact', 'summary', 'skills', 'experience', 'education'],
		experienceBullets: [
			'Desenvolveu APIs REST em TypeScript e Node.js',
			'Otimizou consultas PostgreSQL em 30%'
		],
		experienceEntries: [
			{
				title: 'Desenvolvedor Backend',
				company: 'Empresa A',
				start: '2022-01',
				end: '2024-12',
				isCurrent: false,
				text: 'Desenvolvimento de APIs REST com TypeScript, Node.js e PostgreSQL'
			},
			{
				title: 'Desenvolvedor',
				company: 'Empresa B',
				start: '2024-06',
				end: null,
				isCurrent: true,
				text: 'Serviços backend e Docker'
			}
		],
		educationText: 'Tecnologia em Análise e Desenvolvimento de Sistemas - Faculdade Exemplo',
		educationEntries: [
			{
				degree: 'Tecnologia',
				field: 'Análise e Desenvolvimento de Sistemas',
				institution: 'Faculdade Exemplo',
				text: 'Tecnologia em Análise e Desenvolvimento de Sistemas'
			}
		],
		hasMultipleColumns: false,
		hasTables: false,
		hasImages: false,
		pageCount: 1,
		wordCount: 350,
		jobDescription: job,
		locale: 'pt-BR',
		extractionQuality: 95
	};
}

describe('Gupy-like deterministic alignment', () => {
	it('weights required skills above preferred skills', () => {
		const result = scoreAgainstProfile(input('CANDIDATO TESTE', 'teste@example.com'), GUPY_PROFILE);
		expect(result.breakdown.keywordMatch.matched).toEqual(
			expect.arrayContaining(['TypeScript', 'Node.js', 'PostgreSQL'])
		);
		expect(result.breakdown.keywordMatch.missing).toContain('REST APIs');
		expect(result.breakdown.keywordMatch.synonymMatched).toContain('Docker');
		expect(result.breakdown.keywordMatch.score).toBeGreaterThan(65);
	});

	it('does not double-count overlapping employment dates', () => {
		const months = totalNonOverlappingMonths(input('CANDIDATO TESTE', 'teste@example.com').experienceEntries!);
		const now = new Date();
		const expected = now.getUTCFullYear() * 12 + now.getUTCMonth() - (2022 * 12) + 1;
		expect(months).toBe(expected);
	});

	it('ignores candidate name and email in Gupy-like ordering', () => {
		const first = scoreAgainstProfile(input('ALICE EXEMPLO', 'alice@example.com'), GUPY_PROFILE);
		const second = scoreAgainstProfile(input('BRUNO EXEMPLO', 'bruno@example.com'), GUPY_PROFILE);
		expect(first.overallScore).toBe(second.overallScore);
		expect(first.breakdown.keywordMatch).toEqual(second.breakdown.keywordMatch);
		expect(first.breakdown.experience.score).toBe(second.breakdown.experience.score);
	});
});
