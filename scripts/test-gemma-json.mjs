import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const GEMINI_KEY = envContent.match(/GEMINI_API_KEY=(.+)/)?.[1]?.trim();

if (!GEMINI_KEY) {
	console.error('no GEMINI_API_KEY in .env');
	process.exit(1);
}

// simulate the real scoring prompt (similar size to buildFullScoringPrompt)
const resumeText =
	'Sunny Patel. (437) 216-1611. Software Engineer Intern at IBM. IT Technician at Canadas Wonderland. Supported tenant-to-tenant migration during Six Flags acquisition for 3000+ directory objects. Authored 10+ PowerShell/ConnectWise scripts automating workstation imaging. Built and deployed MDT task sequences. Managed Active Directory accounts, security groups, and GPOs. System Support Specialist at Mackenzie Health. Migrated 400+ Surface tablets to bedside iPads. Skills: Java, Python, Go, Scala, PowerShell, C++, C#, YAML, Kotlin, Assembly, Django, Ruby on Rails, MongoDB, PostgreSQL, MySQL, Express.js, ASP.NET Core, Spring Boot, Kafka, React.js, JavaScript, Flutter, TypeScript, WebGL, GraphQL, Tailwind CSS, Three.js, Vue.js, Git, Docker, Kubernetes, Azure, GCP, AWS, Jamf Pro, Datadog. Education: Ontario Tech University, Honours BSc Computer Science. Projects: Axelot collaborative document platform with Next.js 16 and WebRTC, Netdash Electron networking toolkit with 15+ tools, SecureBank CTF banking app for SQL injection training, Sunnify Spotify downloader with PyQt5. Certifications: Microsoft GH-300 GitHub Copilot Intermediate, MongoDB Python Developer Path, GitHub Foundations, ConnectWise Automate Certified Enterprise Scripting Architect, Google IT Automation with Python.';

const scoringPrompt = `You are a senior talent acquisition technology analyst. Analyze this resume from the perspective of 6 enterprise ATS platforms.

<RESUME>
${resumeText}
</RESUME>

MODE: general ATS readiness. Evaluate formatting, structure, and keyword density.

## PLATFORM SPECIFICATIONS
### 1. WORKDAY RECRUITING - strict parser, skips headers/footers, penalizes creative formats
### 2. ORACLE TALEO - literal exact keyword match, strictest matching
### 3. iCIMS - semantic ML-based matching, most forgiving parser
### 4. GREENHOUSE - LLM-based parser, no auto-scoring, human review focused
### 5. LEVER - stemming-based matching, no ranking system
### 6. SAP SUCCESSFACTORS - Textkernel parser, taxonomy normalization

Score each platform on: formatting (0-100), keywordMatch (0-100), sections (0-100), experience (0-100), education (0-100), overallScore (0-100).

Respond ONLY with valid JSON matching this structure:
{
  "results": [
    {
      "system": "Workday",
      "vendor": "Workday Inc.",
      "overallScore": 75,
      "passesFilter": true,
      "breakdown": {
        "formatting": { "score": 80, "issues": [], "details": [] },
        "keywordMatch": { "score": 70, "matched": [], "missing": [], "synonymMatched": [] },
        "sections": { "score": 85, "present": [], "missing": [] },
        "experience": { "score": 75, "quantifiedBullets": 5, "totalBullets": 10, "actionVerbCount": 7, "highlights": [] },
        "education": { "score": 90, "notes": [] }
      },
      "suggestions": []
    }
  ]
}

Return exactly 6 results: Workday, Taleo, iCIMS, Greenhouse, Lever, SuccessFactors.`;

console.log('prompt length:', scoringPrompt.length, 'chars');
console.log('estimated tokens:', Math.ceil(scoringPrompt.length / 3.5));
console.log('');

async function test() {
	const start = Date.now();
	const res = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${GEMINI_KEY}`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contents: [{ parts: [{ text: scoringPrompt }] }],
				generationConfig: { temperature: 0.3, topP: 0.85, maxOutputTokens: 16384 }
			})
		}
	);

	const elapsed = Date.now() - start;
	console.log('status:', res.status, `(${elapsed}ms)`);

	if (!res.ok) {
		const err = await res.text();
		console.log('ERROR:', err.slice(0, 500));
		return;
	}

	const data = await res.json();
	const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
	console.log('response length:', text.length, 'chars');

	// try JSON parse (same logic as extractJSON in +server.ts)
	const trimmed = text.trim();

	// attempt 1: direct parse
	try {
		JSON.parse(trimmed);
		console.log('JSON parse: DIRECT SUCCESS');
		return;
	} catch {
		/* continue */
	}

	// attempt 2: strip markdown fences
	const cleaned = trimmed.replace(/```json\n?|\n?```/g, '').trim();
	try {
		JSON.parse(cleaned);
		console.log('JSON parse: SUCCESS (after fence strip)');
		return;
	} catch {
		/* continue */
	}

	// attempt 3: find { ... } block
	const s = cleaned.indexOf('{');
	const e = cleaned.lastIndexOf('}');
	if (s !== -1 && e > s) {
		try {
			JSON.parse(cleaned.slice(s, e + 1));
			console.log('JSON parse: SUCCESS (extracted { } block)');
			return;
		} catch {
			/* continue */
		}
	}

	console.log('JSON parse: FAILED - this is why Gemma falls through to Groq');
	console.log('--- first 500 chars of response ---');
	console.log(text.slice(0, 500));
	console.log('--- last 200 chars of response ---');
	console.log(text.slice(-200));
}

test().catch(console.error);
