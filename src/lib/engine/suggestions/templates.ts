// classifies a suggestion's free-text summary into a known category and attaches
// a concrete before/after example. pure functions, deterministic, no LLM.
// returns null when no template fits, in which case the dashboard renders the
// suggestion's own details and skips the example block

export type SuggestionType =
	| 'quantification'
	| 'action-verbs'
	| 'missing-keywords'
	| 'skills-section'
	| 'short-resume'
	| 'sections'
	| 'format';

export interface SuggestionExample {
	type: SuggestionType;
	tip: string;
	before: string;
	after: string;
}

export function classifySuggestion(text: string): SuggestionType | null {
	const t = text.toLowerCase();
	// order matters: more specific patterns checked before broader ones
	if (/quantif|metric|number|measur|impact|outcome/.test(t)) return 'quantification';
	if (/action.{0,4}verb|passive.{0,4}voice|stronger.{0,4}verb|weak.{0,4}verb/.test(t)) {
		return 'action-verbs';
	}
	if (/skills?\s+section|dedicated\s+skills|list\s+(your\s+)?skills/.test(t)) {
		return 'skills-section';
	}
	if (
		/missing\s+(keyword|term|skill)|add(?:ing)?\s+(?:these\s+|the\s+)?(?:keyword|term|skill)|consider adding/.test(
			t
		)
	) {
		return 'missing-keywords';
	}
	if (/short|more\s+detail|expand|length|too\s+brief/.test(t)) return 'short-resume';
	if (
		/standard\s+section|section\s+(missing|header)|use\s+standard|recognised\s+section|recognized\s+section/.test(
			t
		)
	) {
		return 'sections';
	}
	if (/format|multi.?column|tables?|images?|two.?column|page\s+limit|page\s+count/.test(t)) {
		return 'format';
	}
	return null;
}

const EXAMPLES: Record<SuggestionType, SuggestionExample> = {
	quantification: {
		type: 'quantification',
		tip: 'Add concrete numbers (percent improvements, dollar amounts, scale).',
		before: 'Led the migration of the platform.',
		after: 'Led the migration of the platform serving 2M daily users, reducing infra cost 38%.'
	},
	'action-verbs': {
		type: 'action-verbs',
		tip: 'Open every bullet with a strong action verb. Swap weak/passive forms.',
		before: 'Was responsible for managing the deployment pipeline.',
		after: 'Owned the deployment pipeline; cut release time from 4h to 12 minutes.'
	},
	'missing-keywords': {
		type: 'missing-keywords',
		tip: 'Weave missing JD keywords into a real bullet, never standalone keyword stuffing.',
		before: 'Built backend services.',
		after:
			'Built Node.js / TypeScript / GraphQL backend services on AWS, integrated with PostgreSQL and Redis.'
	},
	'skills-section': {
		type: 'skills-section',
		tip: 'Add a single Skills section near the top, grouped by category.',
		before: '(no skills section present)',
		after:
			'Skills\n  Languages: TypeScript, Python, Go\n  Cloud: AWS, GCP, Docker, Kubernetes\n  Data: PostgreSQL, Redis, BigQuery'
	},
	'short-resume': {
		type: 'short-resume',
		tip: 'Aim for one full page minimum, 4–6 quantified bullets per role.',
		before: 'Software Engineer (2022-Present)\n  Worked on the backend.',
		after:
			'Software Engineer, Acme (2022-Present)\n  Cut p99 latency 45% by introducing per-request caching.\n  Owned migration to TypeScript across 12 services.\n  Led on-call rotation for the payments domain.'
	},
	sections: {
		type: 'sections',
		tip: 'Use these standard headers: Contact, Summary, Experience, Education, Skills.',
		before: "My Background  /  Things I've Done  /  Stuff",
		after: 'Experience  /  Education  /  Skills'
	},
	format: {
		type: 'format',
		tip: 'Single column. No tables, images, or icons. ATS parsers struggle with multi-column layouts and embedded objects.',
		before: '(2-column layout, sidebar with skill icons)',
		after: '(single column, plain text headers, no decorative graphics)'
	}
};

export function getExampleFor(suggestionText: string): SuggestionExample | null {
	const type = classifySuggestion(suggestionText);
	return type ? EXAMPLES[type] : null;
}
