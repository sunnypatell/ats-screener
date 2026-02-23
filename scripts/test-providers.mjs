/**
 * dry run: tests each LLM provider matching the fallback chain in +server.ts
 * reads keys from .env, never logs them.
 *
 * usage: node scripts/test-providers.mjs
 */

import { readFileSync } from 'fs';

const envFile = readFileSync('.env', 'utf-8');
const envVars = Object.fromEntries(
	envFile
		.split('\n')
		.filter((l) => l && !l.startsWith('#'))
		.map((l) => {
			const eq = l.indexOf('=');
			return eq > 0 ? [l.slice(0, eq).trim(), l.slice(eq + 1).trim()] : null;
		})
		.filter(Boolean)
);

const GEMINI_KEY = envVars.GEMINI_API_KEY;
const GROQ_KEY = envVars.GROQ_API_KEY;

function extractJSON(raw) {
	const trimmed = raw.trim();
	try {
		return JSON.parse(trimmed);
	} catch {}
	const cleaned = trimmed.replace(/```json\n?|\n?```/g, '').trim();
	try {
		return JSON.parse(cleaned);
	} catch {}
	const s = cleaned.indexOf('{'),
		e = cleaned.lastIndexOf('}');
	if (s !== -1 && e > s) {
		try {
			return JSON.parse(cleaned.slice(s, e + 1));
		} catch {}
	}
	return null;
}

const SMALL_PROMPT = 'Return ONLY valid JSON: {"test": true, "score": 85}';

// ~6K token resume prompt matching real usage
const BIG_RESUME = (
	'Experienced software engineer with expertise in distributed systems, cloud computing, and full-stack development. ' +
	'Built scalable microservices handling 10M+ requests per day using Go, Kubernetes, and AWS. Led team of 5 engineers. '
).repeat(60);
const BIG_PROMPT = `You are an ATS scoring engine. Analyze this resume against 6 ATS platforms (Workday, Taleo, iCIMS, Greenhouse, Lever, SuccessFactors). Return ONLY valid JSON with a "results" array containing objects with "system", "overallScore", and "passesFilter" fields. Resume: ${BIG_RESUME}`;

const PROVIDERS = [
	{
		name: 'gemma-3-27b (Google)',
		key: GEMINI_KEY,
		build: (prompt) => ({
			url: `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${GEMINI_KEY}`,
			opts: {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }],
					generationConfig: { temperature: 0.3, topP: 0.85, maxOutputTokens: 16384 }
				})
			}
		}),
		extract: (d) => d.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
	},
	{
		name: 'llama-3.3-70b (Groq)',
		key: GROQ_KEY,
		build: (prompt) => ({
			url: 'https://api.groq.com/openai/v1/chat/completions',
			opts: {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
				body: JSON.stringify({
					model: 'llama-3.3-70b-versatile',
					messages: [{ role: 'user', content: prompt }],
					temperature: 0.3,
					top_p: 0.85,
					max_tokens: 16384,
					response_format: { type: 'json_object' }
				})
			}
		}),
		extract: (d) => d.choices?.[0]?.message?.content ?? ''
	},
	{
		name: 'gemini-2.5-flash (Google)',
		key: GEMINI_KEY,
		build: (prompt) => ({
			url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
			opts: {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }],
					generationConfig: {
						temperature: 0.3,
						topP: 0.85,
						maxOutputTokens: 16384,
						responseMimeType: 'application/json'
					}
				})
			}
		}),
		extract: (d) => d.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
	}
];

async function callProvider(provider, prompt, timeoutMs = 30000) {
	if (!provider.key) return { status: 'SKIP', ms: 0, detail: 'no key' };

	const { url, opts } = provider.build(prompt);
	const t = performance.now();
	try {
		const ctrl = new AbortController();
		const timer = setTimeout(() => ctrl.abort(), timeoutMs);
		const res = await fetch(url, { ...opts, signal: ctrl.signal });
		clearTimeout(timer);
		const ms = Math.round(performance.now() - t);

		if (!res.ok) {
			const err = await res.text().catch(() => '');
			return { status: 'HTTP_ERR', ms, httpStatus: res.status, detail: err.slice(0, 150) };
		}

		const data = await res.json();
		const text = provider.extract(data);
		if (!text) return { status: 'EMPTY', ms };

		const parsed = extractJSON(text);
		if (!parsed || typeof parsed !== 'object')
			return { status: 'BAD_JSON', ms, detail: text.slice(0, 150) };

		return { status: 'OK', ms, keys: Object.keys(parsed).slice(0, 5) };
	} catch (err) {
		const ms = Math.round(performance.now() - t);
		const isTimeout = err.name === 'AbortError';
		return { status: isTimeout ? 'TIMEOUT' : 'ERROR', ms, detail: err.message };
	}
}

function log(name, r) {
	const tag = r.status === 'OK' ? 'OK' : r.status === 'SKIP' ? 'SKIP' : 'FAIL';
	const info = r.status === 'OK' ? `keys: [${r.keys}]` : r.detail || r.httpStatus || '';
	console.log(`  ${tag.padEnd(4)} ${name.padEnd(28)} ${String(r.ms).padStart(5)}ms  ${info}`);
}

console.log('=== test 1: small prompt (connectivity) ===\n');
for (const p of PROVIDERS) log(p.name, await callProvider(p, SMALL_PROMPT));

console.log('\n=== test 2: large prompt (~6K tokens, realistic resume) ===\n');
console.log(
	`  prompt size: ${BIG_PROMPT.length} chars (~${Math.round(BIG_PROMPT.length / 4)} tokens)\n`
);
for (const p of PROVIDERS) log(p.name, await callProvider(p, BIG_PROMPT, 45000));

console.log('\n=== test 3: fallback chain simulation ===\n');
let resolved = false;
for (const p of PROVIDERS) {
	const r = await callProvider(p, BIG_PROMPT, 45000);
	if (r.status === 'OK') {
		console.log(`  resolved: ${p.name} (${r.ms}ms)`);
		resolved = true;
		break;
	}
	console.log(`  ${p.name}: ${r.status} (${r.ms}ms) → next`);
}
if (!resolved) console.log('  ALL FAILED → 503');

console.log('\n=== done ===');
