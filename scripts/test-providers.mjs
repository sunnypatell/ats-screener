/**
 * dry run against the real provider chain. imports buildProviders from
 * providers.ts rather than redeclaring models and token budgets, so this can
 * never drift from production and report a healthy provider as broken.
 *
 * reads keys from .env, never logs them.
 *
 * usage: node scripts/test-providers.mjs   (needs node 22.18+ or 24 for type stripping)
 */

import { readFileSync } from 'fs';
import { buildProviders } from '../src/routes/api/analyze/providers.ts';

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

const providers = buildProviders(envVars);

// throttling is not a broken provider. groq reserves (input + max_tokens) against its
// per-minute ceiling, so back-to-back runs of this script can legitimately 413/429
function classify(httpStatus) {
	if (httpStatus === 429 || httpStatus === 413) return 'RATE_LIMIT';
	return 'HTTP_ERR';
}

async function callProvider(provider, prompt, timeoutMs) {
	const secret = envVars[provider.configKey];
	if (!secret) return { status: 'SKIP', ms: 0, detail: `no ${provider.configKey}` };

	// default to the provider's own production timeout so this mirrors the real chain
	const budget = timeoutMs ?? provider.timeoutMs;
	const { url, init } = provider.buildRequest(prompt, secret);
	const t = performance.now();
	try {
		const ctrl = new AbortController();
		const timer = setTimeout(() => ctrl.abort(), budget);
		const res = await fetch(url, { ...init, signal: ctrl.signal });
		clearTimeout(timer);
		const ms = Math.round(performance.now() - t);

		if (!res.ok) {
			const err = await res.text().catch(() => '');
			return {
				status: classify(res.status),
				ms,
				httpStatus: res.status,
				detail: err.slice(0, 160)
			};
		}

		const data = await res.json();
		const text = provider.extractText(data);
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
	const tag =
		r.status === 'OK'
			? 'OK'
			: r.status === 'SKIP'
				? 'SKIP'
				: r.status === 'RATE_LIMIT'
					? 'THROT'
					: 'FAIL';
	const info = r.status === 'OK' ? `keys: [${r.keys}]` : r.detail || r.httpStatus || '';
	console.log(`  ${tag.padEnd(5)} ${name.padEnd(24)} ${String(r.ms).padStart(5)}ms  ${info}`);
}

if (providers.length === 0) {
	console.log(
		'no providers configured. set GEMINI_API_KEY, GROQ_API_KEY or OLLAMA_BASE_URL in .env'
	);
	process.exit(1);
}

console.log('chain (in fallback order), taken from buildProviders:\n');
for (const p of providers) {
	const { init } = p.buildRequest('x', 'x');
	const b = JSON.parse(init.body);
	const tokens =
		b.max_tokens ?? b.generationConfig?.maxOutputTokens ?? b.options?.num_predict ?? '?';
	console.log(`  ${p.name.padEnd(24)} timeout ${p.timeoutMs}ms  max output ${tokens}`);
}

console.log('\n=== test 1: small prompt (connectivity) ===\n');
for (const p of providers) log(p.name, await callProvider(p, SMALL_PROMPT));

console.log('\n=== test 2: large prompt (~6K tokens, realistic resume) ===\n');
console.log(
	`  prompt size: ${BIG_PROMPT.length} chars (~${Math.round(BIG_PROMPT.length / 4)} tokens)\n`
);
for (const p of providers) log(p.name, await callProvider(p, BIG_PROMPT, 45000));

console.log('\n=== test 3: fallback chain simulation ===\n');
let resolved = false;
for (const p of providers) {
	const r = await callProvider(p, BIG_PROMPT, 45000);
	if (r.status === 'OK') {
		console.log(`  resolved: ${p.name} (${r.ms}ms)`);
		resolved = true;
		break;
	}
	console.log(`  ${p.name}: ${r.status} (${r.ms}ms) -> next`);
}
if (!resolved) console.log('  ALL FAILED -> 503');

console.log(
	'\nnote: THROT is a per-minute token ceiling, not a broken provider. re-run after a minute.'
);
console.log('\n=== done ===');
