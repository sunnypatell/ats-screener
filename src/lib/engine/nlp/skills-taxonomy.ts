/**
 * categorized skills database organized by industry and domain.
 * used for:
 * 1. identifying which industry a resume/JD belongs to
 * 2. suggesting relevant skills the candidate might be missing
 * 3. weighting keyword matches by relevance to the target role
 */

export interface SkillCategory {
	domain: string;
	industry: string;
	skills: string[];
}

export const SKILLS_TAXONOMY: SkillCategory[] = [
	// === SOFTWARE ENGINEERING ===
	{
		domain: 'programming languages',
		industry: 'technology',
		skills: [
			'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go',
			'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r',
			'matlab', 'perl', 'haskell', 'elixir', 'dart', 'lua',
			'objective-c', 'assembly', 'sql', 'html', 'css'
		]
	},
	{
		domain: 'frontend development',
		industry: 'technology',
		skills: [
			'react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt',
			'tailwind css', 'sass', 'css modules', 'webpack', 'vite',
			'storybook', 'jest', 'cypress', 'playwright',
			'responsive design', 'web accessibility', 'wcag',
			'single page application', 'progressive web app', 'pwa'
		]
	},
	{
		domain: 'backend development',
		industry: 'technology',
		skills: [
			'node.js', 'express', 'django', 'flask', 'fastapi',
			'spring boot', 'ruby on rails', '.net', 'laravel',
			'rest api', 'graphql', 'grpc', 'websockets',
			'microservices', 'serverless', 'api gateway',
			'message queue', 'rabbitmq', 'kafka', 'redis'
		]
	},
	{
		domain: 'databases',
		industry: 'technology',
		skills: [
			'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
			'dynamodb', 'cassandra', 'sqlite', 'oracle', 'sql server',
			'neo4j', 'firebase', 'supabase', 'prisma', 'sequelize',
			'database design', 'data modeling', 'query optimization'
		]
	},
	{
		domain: 'cloud and devops',
		industry: 'technology',
		skills: [
			'aws', 'google cloud platform', 'microsoft azure', 'docker',
			'kubernetes', 'terraform', 'ansible', 'jenkins', 'github actions',
			'gitlab ci', 'circleci', 'cloudflare', 'vercel', 'netlify',
			'linux', 'nginx', 'monitoring', 'grafana', 'prometheus',
			'datadog', 'ci/cd', 'infrastructure as code', 'site reliability'
		]
	},
	{
		domain: 'data science and ml',
		industry: 'technology',
		skills: [
			'machine learning', 'deep learning', 'natural language processing',
			'computer vision', 'tensorflow', 'pytorch', 'scikit-learn',
			'pandas', 'numpy', 'matplotlib', 'jupyter', 'spark',
			'hadoop', 'airflow', 'mlflow', 'data pipeline',
			'statistical analysis', 'a/b testing', 'regression',
			'classification', 'neural networks', 'transformers',
			'large language models', 'generative ai'
		]
	},
	{
		domain: 'mobile development',
		industry: 'technology',
		skills: [
			'ios', 'android', 'react native', 'flutter', 'swift',
			'kotlin', 'xcode', 'android studio', 'mobile ui',
			'app store', 'google play', 'push notifications',
			'mobile testing', 'responsive design'
		]
	},
	{
		domain: 'security',
		industry: 'technology',
		skills: [
			'cybersecurity', 'penetration testing', 'vulnerability assessment',
			'soc', 'siem', 'encryption', 'oauth', 'jwt', 'ssl/tls',
			'firewall', 'intrusion detection', 'incident response',
			'compliance', 'gdpr', 'hipaa', 'pci dss', 'iso 27001',
			'owasp', 'security audit'
		]
	},

	// === FINANCE / ACCOUNTING ===
	{
		domain: 'financial analysis',
		industry: 'finance',
		skills: [
			'financial modeling', 'valuation', 'dcf analysis',
			'comparable analysis', 'financial statements',
			'balance sheet', 'income statement', 'cash flow',
			'budgeting', 'forecasting', 'variance analysis',
			'financial reporting', 'gaap', 'ifrs',
			'bloomberg terminal', 'capital iq', 'factset'
		]
	},
	{
		domain: 'investment banking',
		industry: 'finance',
		skills: [
			'mergers and acquisitions', 'initial public offering',
			'debt financing', 'equity financing', 'leveraged buyout',
			'pitch books', 'deal execution', 'due diligence',
			'private equity', 'venture capital', 'hedge fund',
			'portfolio management', 'asset management',
			'risk management', 'derivatives', 'options pricing'
		]
	},
	{
		domain: 'accounting',
		industry: 'finance',
		skills: [
			'accounts payable', 'accounts receivable', 'general ledger',
			'journal entries', 'reconciliation', 'tax preparation',
			'audit', 'internal controls', 'sarbanes-oxley', 'sox compliance',
			'quickbooks', 'sap', 'oracle financials', 'netsuite',
			'cpa', 'cma', 'cost accounting', 'payroll'
		]
	},

	// === HEALTHCARE ===
	{
		domain: 'clinical',
		industry: 'healthcare',
		skills: [
			'patient care', 'clinical assessment', 'treatment planning',
			'medication administration', 'vital signs', 'phlebotomy',
			'ehr', 'epic', 'cerner', 'meditech',
			'hipaa compliance', 'infection control', 'patient safety',
			'bls', 'acls', 'pals', 'triage',
			'nursing', 'physician', 'surgery', 'diagnostics'
		]
	},
	{
		domain: 'pharmaceutical',
		industry: 'healthcare',
		skills: [
			'clinical trials', 'drug development', 'regulatory affairs',
			'fda submission', 'gmp', 'pharmacovigilance',
			'biostatistics', 'clinical data management', 'sas',
			'medical writing', 'protocol development', 'irb',
			'phase i', 'phase ii', 'phase iii', 'nda', 'ind'
		]
	},

	// === MARKETING ===
	{
		domain: 'digital marketing',
		industry: 'marketing',
		skills: [
			'seo', 'sem', 'ppc', 'google ads', 'facebook ads',
			'social media marketing', 'content marketing',
			'email marketing', 'marketing automation', 'hubspot',
			'mailchimp', 'google analytics', 'google tag manager',
			'conversion rate optimization', 'landing page optimization',
			'copywriting', 'content strategy', 'brand strategy'
		]
	},
	{
		domain: 'product marketing',
		industry: 'marketing',
		skills: [
			'go-to-market strategy', 'competitive analysis',
			'market research', 'customer segmentation', 'positioning',
			'messaging', 'product launch', 'sales enablement',
			'buyer persona', 'customer journey', 'demand generation',
			'lead generation', 'marketing qualified leads'
		]
	},

	// === SALES ===
	{
		domain: 'sales',
		industry: 'sales',
		skills: [
			'business development', 'account management', 'lead generation',
			'pipeline management', 'quota attainment', 'cold calling',
			'consultative selling', 'solution selling', 'saas sales',
			'enterprise sales', 'inside sales', 'field sales',
			'salesforce', 'hubspot crm', 'negotiation',
			'contract negotiation', 'territory management',
			'upselling', 'cross-selling', 'customer retention'
		]
	},

	// === OPERATIONS / SUPPLY CHAIN ===
	{
		domain: 'operations',
		industry: 'operations',
		skills: [
			'supply chain management', 'logistics', 'procurement',
			'inventory management', 'warehouse management',
			'lean manufacturing', 'six sigma', 'kaizen',
			'process improvement', 'quality assurance', 'quality control',
			'vendor management', 'contract management',
			'erp', 'sap', 'oracle', 'demand planning',
			'capacity planning', 'production scheduling'
		]
	},

	// === HUMAN RESOURCES ===
	{
		domain: 'human resources',
		industry: 'hr',
		skills: [
			'recruiting', 'talent acquisition', 'interviewing',
			'onboarding', 'employee relations', 'performance management',
			'compensation and benefits', 'payroll', 'hris',
			'workday', 'bamboohr', 'successfactors',
			'diversity and inclusion', 'employee engagement',
			'training and development', 'organizational development',
			'labor law', 'compliance', 'shrm-cp', 'phr'
		]
	},

	// === LEGAL ===
	{
		domain: 'legal',
		industry: 'legal',
		skills: [
			'contract drafting', 'contract review', 'legal research',
			'litigation', 'corporate law', 'intellectual property',
			'regulatory compliance', 'due diligence', 'legal writing',
			'westlaw', 'lexisnexis', 'case management',
			'mediation', 'arbitration', 'discovery',
			'gdpr', 'ccpa', 'data privacy', 'employment law'
		]
	},

	// === EDUCATION ===
	{
		domain: 'education',
		industry: 'education',
		skills: [
			'curriculum development', 'lesson planning', 'instruction',
			'classroom management', 'student assessment', 'differentiated instruction',
			'special education', 'iep', 'educational technology',
			'learning management system', 'blackboard', 'canvas',
			'tutoring', 'mentoring', 'academic advising'
		]
	},

	// === DESIGN ===
	{
		domain: 'design',
		industry: 'design',
		skills: [
			'ui design', 'ux design', 'user research', 'wireframing',
			'prototyping', 'figma', 'sketch', 'adobe xd',
			'adobe photoshop', 'adobe illustrator', 'adobe indesign',
			'design systems', 'interaction design', 'visual design',
			'typography', 'color theory', 'usability testing',
			'information architecture', 'user flow', 'persona development'
		]
	}
];

/**
 * detects the most likely industry of a text based on skill keyword presence.
 * returns industries sorted by match count.
 */
export function detectIndustry(text: string): Array<{ industry: string; matchCount: number }> {
	const lowerText = text.toLowerCase();
	const industryCounts = new Map<string, number>();

	for (const category of SKILLS_TAXONOMY) {
		let count = 0;
		for (const skill of category.skills) {
			if (lowerText.includes(skill)) {
				count++;
			}
		}

		if (count > 0) {
			const current = industryCounts.get(category.industry) || 0;
			industryCounts.set(category.industry, current + count);
		}
	}

	return [...industryCounts.entries()]
		.map(([industry, matchCount]) => ({ industry, matchCount }))
		.sort((a, b) => b.matchCount - a.matchCount);
}

/**
 * gets all skills for a given industry.
 */
export function getIndustrySkills(industry: string): string[] {
	return SKILLS_TAXONOMY
		.filter((cat) => cat.industry === industry)
		.flatMap((cat) => cat.skills);
}

/**
 * gets the domain/category for a given skill.
 */
export function getSkillDomain(skill: string): string | null {
	const lower = skill.toLowerCase();
	for (const category of SKILLS_TAXONOMY) {
		if (category.skills.includes(lower)) {
			return category.domain;
		}
	}
	return null;
}
