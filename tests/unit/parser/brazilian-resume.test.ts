import { describe, expect, it } from 'vitest';
import { parseResumeText } from '$engine/parser';
import { scoreResume } from '$engine/scorer/engine';
import type { ScoringInput } from '$engine/scorer/types';

const PORTUGUESE_RESUME = `
GABRIEL SAMPAIO DE SOUZA
Desenvolvedor de Software | TypeScript • Python • Golang
São Paulo, SP — Brasil | WhatsApp: +55 (11) 93937-0117 | Email: gabedsam01@gmail.com | GitHub: github.com/gabedsam01 | LinkedIn: linkedin.com/in/gabrielsampaiodesouza

🎯 Perfil Profissional
Desenvolvedor de Software focado em soluções web, automações e integrações de sistemas.

🛠️ Competências Técnicas
• Linguagens: TypeScript, Python, Golang, JavaScript.
• Front-end & Web: TSX, React, React Native, Next.js, HTML5, CSS3, Tailwind CSS.
• Back-end & APIs: Node.js, Express, FastAPI, RESTful APIs, Microsserviços em Go.
• Automação & Web Scraping: Python, Selenium, Playwright, BeautifulSoup.
• Bancos de Dados & Ferramentas: PostgreSQL, MySQL, MongoDB, Git, GitHub, Docker, Postman.

💼 Experiência Profissional
MVP Builders — Desenvolvedor
Mai/2026 – Presente (Remoto)
• Desenvolveu aplicações web responsivas.
• Construiu automações de processos e integrações via API.
Stefanini Brasil — Auxiliar de Escritório
Mai/2023 – Abr/2024
• Processou e organizou alto volume de dados operacionais.
Outras Experiências Profissionais
• Grupo Pro Security — Auxiliar de Serviços Gerais (Ago/2025 – Mai/2026) — Padronizou rotinas operacionais.
• Contax S.A. — Promotor de Vendas (Jun/2025 – Jul/2025) — Operou sistemas de cadastro.
• MRS Logística / SENAI — Aprendiz / Auxiliar de Operação Ferroviária (Set/2024 – Jun/2025) — Executou rotinas técnicas.

🎓 Formação Acadêmica
• Tecnologia em Análise e Desenvolvimento de Sistemas (ADS) Faculdade São Francisco de Assis | Previsão de Conclusão: 2028 – 2030
• Ensino Técnico em Transporte Ferroviário SENAI São Paulo | Concluído (Set/2024 – Jun/2025)

🚀 Repositórios e Projetos Técnicos
• Aplicações Web em TypeScript/TSX: interfaces integradas a APIs REST.
• Automações e Scripts em Python/Golang: web scraping e processamento de dados.
`;

const ENGLISH_RESUME = `
GABRIEL SAMPAIO DE SOUZA
Software Developer | TypeScript • Python • Golang
São Paulo, SP — Brazil | WhatsApp: +55 (11) 93937-0117 | Email: gabedsam01@gmail.com | GitHub: github.com/gabedsam01 | LinkedIn: linkedin.com/in/gabrielsampaiodesouza

🎯 Professional Summary
Software Developer specializing in web solutions, automation, and system integrations.

🛠️ Technical Skills
• Languages: TypeScript, Python, Golang, JavaScript.
• Front-end & Web: TSX, React, React Native, Next.js, HTML5, CSS3, Tailwind CSS.
• Back-end & APIs: Node.js, Express, FastAPI, RESTful APIs, Go Microservices.
• Automation & Web Scraping: Selenium, Playwright, BeautifulSoup.
• Databases & Tools: PostgreSQL, MySQL, MongoDB, Git, GitHub, Docker, Postman.

💼 Professional Experience
MVP Builders — Software Developer
May 2026 – Present
• Developed responsive web applications.
• Built process automation and API integrations.
Stefanini Brasil — Administrative Assistant
May 2023 – Apr 2024
• Processed high-volume operational datasets.
Additional Experience
• Grupo Pro Security — General Operations Assistant (Aug 2025 – May 2026) — Standardized operational routines.
• Contax S.A. — Sales Representative (Jun 2025 – Jul 2025) — Operated registration systems.
• MRS Logística / SENAI — Railway Operations Apprentice (Sep 2024 – Jun 2025) — Executed technical operations.

🎓 Education
• Associate Degree in Systems Analysis and Development Faculdade São Francisco de Assis | Expected Graduation: 2028 – 2030
• Technical Degree in Railway Transportation SENAI São Paulo | Completed (Sep 2024 – Jun 2025)

🚀 Projects & Technical Repositories
• Web Applications (TypeScript / TSX): interfaces integrated with REST APIs.
• Automation & Scripting (Python / Golang): web scraping and data processing.
`;

function assertCoreExtraction(text: string, locale: 'pt-BR' | 'en') {
	const result = parseResumeText(text);
	expect(result.success).toBe(true);
	const resume = result.resume!;
	expect(resume.metadata.language).toBe(locale);
	expect(resume.contact.email).toBe('gabedsam01@gmail.com');
	expect(resume.contact.phone?.replace(/\D/g, '')).toContain('11939370117');
	expect(resume.sections.map((section) => section.type)).toEqual(expect.arrayContaining(['contact', 'summary', 'skills', 'experience', 'education', 'projects']));
	expect(resume.experience.length).toBeGreaterThanOrEqual(5);
	expect(resume.education.length).toBe(2);
	expect(resume.skills).toEqual(expect.arrayContaining(['TypeScript', 'Python', 'Go', 'React', 'PostgreSQL', 'Docker']));
	expect(resume.skills.some((skill) => skill.length > 45)).toBe(false);
	return resume;
}

describe('Brazilian deterministic resume parser', () => {
	it('parses the Portuguese reference resume', () => {
		const resume = assertCoreExtraction(PORTUGUESE_RESUME, 'pt-BR');
		expect(resume.experience.some((entry) => entry.company.includes('MVP Builders') && /Desenvolvedor/i.test(entry.title))).toBe(true);
	});

	it('parses the English reference resume', () => {
		const resume = assertCoreExtraction(ENGLISH_RESUME, 'en');
		expect(resume.experience.some((entry) => entry.company.includes('MVP Builders') && /Developer/i.test(entry.title))).toBe(true);
	});

	it('adds a Gupy-like profile and does not inflate keywords without a job', () => {
		const resume = assertCoreExtraction(PORTUGUESE_RESUME, 'pt-BR');
		const input: ScoringInput = {
			resumeText: resume.rawText,
			resumeSkills: resume.skills,
			resumeSections: resume.sections.map((section) => section.type),
			experienceBullets: resume.experience.flatMap((entry) => entry.bullets),
			educationText: resume.education.map((entry) => entry.rawText).join('\n'),
			hasMultipleColumns: false,
			hasTables: false,
			hasImages: false,
			pageCount: 2,
			wordCount: resume.metadata.wordCount,
			locale: resume.metadata.language,
			extractionQuality: resume.metadata.extractionQuality
		};
		const first = scoreResume(input);
		const second = scoreResume(input);
		expect(first).toHaveLength(7);
		expect(first.find((score) => score.system === 'Gupy-like')).toBeDefined();
		expect(first.every((score) => score.breakdown.keywordMatch.score === 0)).toBe(true);
		expect(first.map((score) => score.overallScore)).toEqual(second.map((score) => score.overallScore));
	});
});
