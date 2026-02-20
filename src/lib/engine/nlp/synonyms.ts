// cross-industry synonym map: maps variant names/abbreviations to a canonical form
// organized by industry cluster for maintainability
const SYNONYM_GROUPS: string[][] = [
	// === technology / programming ===
	['javascript', 'js', 'ecmascript', 'es6', 'es2015'],
	['typescript', 'ts'],
	['python', 'py', 'python3'],
	['c++', 'cpp', 'c plus plus'],
	['c#', 'csharp', 'c sharp'],
	['golang', 'go'],
	['rust', 'rustlang'],
	['ruby', 'rb'],
	['kotlin', 'kt'],
	['swift', 'swiftlang'],
	['objective-c', 'objc', 'obj-c'],

	// frameworks / libraries
	['react', 'reactjs', 'react.js'],
	['angular', 'angularjs', 'angular.js'],
	['vue', 'vuejs', 'vue.js'],
	['svelte', 'sveltejs', 'sveltekit'],
	['next.js', 'nextjs', 'next'],
	['node.js', 'nodejs', 'node'],
	['express', 'expressjs', 'express.js'],
	['django', 'django rest framework', 'drf'],
	['flask', 'flask api'],
	['spring', 'spring boot', 'spring framework'],
	['.net', 'dotnet', '.net core', 'asp.net'],
	['ruby on rails', 'rails', 'ror'],
	['laravel', 'laravel php'],
	['fastapi', 'fast api'],

	// databases
	['postgresql', 'postgres', 'psql'],
	['mysql', 'my sql'],
	['mongodb', 'mongo'],
	['microsoft sql server', 'mssql', 'sql server', 'tsql', 't-sql'],
	['dynamodb', 'dynamo db', 'aws dynamodb'],
	['elasticsearch', 'elastic search', 'es'],
	['redis', 'redis cache'],
	['cassandra', 'apache cassandra'],
	['sqlite', 'sqlite3'],

	// cloud / infrastructure
	['amazon web services', 'aws'],
	['google cloud platform', 'gcp', 'google cloud'],
	['microsoft azure', 'azure'],
	['docker', 'containerization', 'containers'],
	['kubernetes', 'k8s'],
	['terraform', 'infrastructure as code', 'iac'],
	['ci/cd', 'cicd', 'continuous integration', 'continuous deployment'],
	['github actions', 'gh actions'],
	['jenkins', 'jenkins ci'],
	['gitlab ci', 'gitlab ci/cd'],
	['cloudflare', 'cf'],

	// data / ML
	['machine learning', 'ml'],
	['artificial intelligence', 'ai'],
	['deep learning', 'dl'],
	['natural language processing', 'nlp'],
	['computer vision', 'cv'],
	['tensorflow', 'tf'],
	['pytorch', 'torch'],
	['pandas', 'python pandas'],
	['numpy', 'np'],
	['scikit-learn', 'sklearn'],
	['data science', 'data analytics'],
	['business intelligence', 'bi'],
	['extract transform load', 'etl'],
	['data warehouse', 'dwh', 'data warehousing'],

	// === finance / accounting ===
	['financial modeling', 'financial analysis'],
	['generally accepted accounting principles', 'gaap'],
	['international financial reporting standards', 'ifrs'],
	['certified public accountant', 'cpa'],
	['chartered financial analyst', 'cfa'],
	['financial risk management', 'frm'],
	['accounts payable', 'ap'],
	['accounts receivable', 'ar'],
	['profit and loss', 'p&l', 'pnl'],
	['return on investment', 'roi'],
	['key performance indicator', 'kpi', 'kpis'],
	['enterprise resource planning', 'erp'],
	['sap', 'sap erp', 'sap s/4hana'],
	['bloomberg terminal', 'bloomberg'],
	['discounted cash flow', 'dcf'],
	['mergers and acquisitions', 'm&a'],
	['initial public offering', 'ipo'],
	['private equity', 'pe'],
	['venture capital', 'vc'],
	['anti-money laundering', 'aml'],
	['know your customer', 'kyc'],

	// === healthcare ===
	['electronic health record', 'ehr', 'electronic medical record', 'emr'],
	['health insurance portability and accountability act', 'hipaa'],
	['international classification of diseases', 'icd', 'icd-10'],
	['current procedural terminology', 'cpt'],
	['registered nurse', 'rn'],
	['licensed practical nurse', 'lpn'],
	['nurse practitioner', 'np'],
	['physician assistant', 'pa'],
	['basic life support', 'bls'],
	['advanced cardiovascular life support', 'acls'],
	['food and drug administration', 'fda'],
	['good manufacturing practice', 'gmp'],
	['clinical research organization', 'cro'],

	// === marketing / sales ===
	['search engine optimization', 'seo'],
	['search engine marketing', 'sem'],
	['pay per click', 'ppc'],
	['cost per acquisition', 'cpa'],
	['customer relationship management', 'crm'],
	['salesforce', 'sfdc', 'salesforce crm'],
	['hubspot', 'hubspot crm'],
	['google analytics', 'ga', 'ga4'],
	['social media marketing', 'smm'],
	['content management system', 'cms'],
	['email marketing', 'email campaigns'],
	['a/b testing', 'ab testing', 'split testing'],
	['conversion rate optimization', 'cro'],
	['customer lifetime value', 'clv', 'ltv'],
	['net promoter score', 'nps'],
	['marketing qualified lead', 'mql'],
	['sales qualified lead', 'sql'],

	// === human resources ===
	['human resources', 'hr'],
	['human capital management', 'hcm'],
	['applicant tracking system', 'ats'],
	['human resource information system', 'hris'],
	['employee resource planning', 'erp'],
	['diversity equity and inclusion', 'dei', 'de&i'],
	['equal employment opportunity', 'eeo'],
	['professional in human resources', 'phr'],
	['senior professional in human resources', 'sphr'],
	['society for human resource management', 'shrm'],

	// === project management ===
	['project management', 'pm'],
	['project management professional', 'pmp'],
	['certified scrum master', 'csm'],
	['agile', 'agile methodology'],
	['scrum', 'scrum framework'],
	['kanban', 'kanban board'],
	['waterfall', 'waterfall methodology'],
	['jira', 'atlassian jira'],
	['asana', 'asana pm'],
	['trello', 'trello board'],
	['gantt chart', 'gantt'],
	['work breakdown structure', 'wbs'],
	['program management', 'pgm'],

	// === legal ===
	['juris doctor', 'jd', 'j.d.'],
	['intellectual property', 'ip'],
	['non-disclosure agreement', 'nda'],
	['service level agreement', 'sla'],
	['general data protection regulation', 'gdpr'],
	['california consumer privacy act', 'ccpa'],
	['digital millennium copyright act', 'dmca'],
	['terms of service', 'tos'],

	// === supply chain / operations ===
	['supply chain management', 'scm'],
	['enterprise resource planning', 'erp'],
	['manufacturing resource planning', 'mrp'],
	['total quality management', 'tqm'],
	['six sigma', '6 sigma', '6sigma'],
	['lean manufacturing', 'lean'],
	['just in time', 'jit'],
	['inventory management', 'inventory control'],
	['vendor management', 'supplier management'],
	['request for proposal', 'rfp'],
	['request for quotation', 'rfq'],

	// === general professional ===
	['bachelor of science', 'bs', 'b.s.'],
	['bachelor of arts', 'ba', 'b.a.'],
	['master of science', 'ms', 'm.s.'],
	['master of arts', 'ma', 'm.a.'],
	['master of business administration', 'mba', 'm.b.a.'],
	['doctor of philosophy', 'phd', 'ph.d.'],
	['years of experience', 'yoe', 'years experience'],
	['full time', 'full-time', 'ft'],
	['part time', 'part-time', 'pt'],
	['cross functional', 'cross-functional'],
	['stakeholder management', 'stakeholder engagement'],
	['problem solving', 'problem-solving'],
	['communication skills', 'communication'],
	['team leadership', 'team lead', 'team management'],
	['microsoft office', 'ms office', 'office 365', 'microsoft 365'],
	['microsoft excel', 'excel', 'ms excel'],
	['microsoft word', 'word', 'ms word'],
	['microsoft powerpoint', 'powerpoint', 'ms powerpoint', 'ppt'],
	['tableau', 'tableau desktop', 'tableau server'],
	['power bi', 'powerbi', 'microsoft power bi']
];

// maps every variant to its canonical form (first in group), case-insensitive
const synonymMap = new Map<string, string>();

for (const group of SYNONYM_GROUPS) {
	const canonical = group[0];
	for (const variant of group) {
		synonymMap.set(variant.toLowerCase(), canonical);
	}
}

// returns the canonical form of a term, or the term itself if no synonym exists
export function getCanonical(term: string): string {
	return synonymMap.get(term.toLowerCase()) || term.toLowerCase();
}

// checks if two terms are synonymous
export function areSynonyms(term1: string, term2: string): boolean {
	const c1 = getCanonical(term1);
	const c2 = getCanonical(term2);
	return c1 === c2;
}

// finds all known synonyms for a term
export function getSynonyms(term: string): string[] {
	const canonical = getCanonical(term);
	const group = SYNONYM_GROUPS.find((g) => g.some((v) => v.toLowerCase() === canonical));
	return group ? [...group] : [term];
}

// normalizes a list of terms using the synonym map, deduplicates by canonical form
export function normalizeTerms(terms: string[]): string[] {
	const seen = new Set<string>();
	const result: string[] = [];

	for (const term of terms) {
		const canonical = getCanonical(term);
		if (!seen.has(canonical)) {
			seen.add(canonical);
			result.push(canonical);
		}
	}

	return result;
}

export { SYNONYM_GROUPS };
