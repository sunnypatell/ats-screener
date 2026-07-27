import { expect, test } from '@playwright/test';

const RESUME = `
GABRIEL SAMPAIO DE SOUZA
Desenvolvedor de Software | São Paulo, SP | gabedsam01@gmail.com | +55 (11) 93937-0117

Perfil Profissional
Desenvolvedor focado em soluções web e automações.

Competências Técnicas
TypeScript, Python, Golang, React, Next.js, Node.js, FastAPI, PostgreSQL, Docker

Experiência Profissional
MVP Builders — Desenvolvedor
Mai/2026 – Presente
• Desenvolveu aplicações web responsivas.
• Automatizou 3 rotinas operacionais.
Stefanini Brasil — Auxiliar de Escritório
Mai/2023 – Abr/2024
• Processou dados e estruturou relatórios.

Formação Acadêmica
Tecnologia em Análise e Desenvolvimento de Sistemas — Faculdade São Francisco de Assis — 2026 – 2030
`;

test('parses and scores a Portuguese resume without an LLM', async ({ page }) => {
	await page.goto('/scanner');
	await page.getByText('Or paste resume text instead').click();
	await page.getByRole('textbox', { name: 'Paste resume text' }).fill(RESUME);
	await page.getByRole('button', { name: 'Use this text' }).click();
	await expect(page.getByText('Resume Parsed Successfully')).toBeVisible();
	await expect(page.getByText('TypeScript', { exact: true }).first()).toBeVisible();
	await page.getByRole('button', { name: /Scan Resume|Re-Scan/ }).click();
	await expect(page.getByText('Gupy-like', { exact: true }).first()).toBeVisible({ timeout: 30_000 });
	await expect(page.getByText(/Systems Passed/)).toBeVisible();
});
