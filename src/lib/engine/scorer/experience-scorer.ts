// strong action verbs that ATS systems and recruiters look for in bullet points
const STRONG_ACTION_VERBS = new Set([
	'achieved',
	'accelerated',
	'administered',
	'advanced',
	'analyzed',
	'architected',
	'automated',
	'built',
	'centralized',
	'championed',
	'collaborated',
	'conceptualized',
	'consolidated',
	'contributed',
	'converted',
	'coordinated',
	'created',
	'decreased',
	'delivered',
	'designed',
	'developed',
	'directed',
	'drove',
	'eliminated',
	'enabled',
	'engineered',
	'established',
	'exceeded',
	'executed',
	'expanded',
	'facilitated',
	'founded',
	'generated',
	'grew',
	'headed',
	'identified',
	'implemented',
	'improved',
	'increased',
	'influenced',
	'initiated',
	'innovated',
	'integrated',
	'introduced',
	'launched',
	'led',
	'leveraged',
	'managed',
	'maximized',
	'mentored',
	'migrated',
	'modernized',
	'negotiated',
	'operated',
	'optimized',
	'orchestrated',
	'organized',
	'outperformed',
	'overhauled',
	'oversaw',
	'pioneered',
	'planned',
	'presented',
	'prioritized',
	'produced',
	'programmed',
	'proposed',
	'published',
	'raised',
	'recommended',
	'redesigned',
	'reduced',
	'refactored',
	'reformed',
	're-engineered',
	'reorganized',
	'replaced',
	'researched',
	'resolved',
	'restructured',
	'revamped',
	'revolutionized',
	'scaled',
	'secured',
	'simplified',
	'spearheaded',
	'standardized',
	'streamlined',
	'strengthened',
	'supervised',
	'surpassed',
	'synchronized',
	'trained',
	'transformed',
	'translated',
	'unified',
	'upgraded'
]);

// patterns indicating quantified achievements (measurable impact boosts ATS scores)
const QUANTIFICATION_PATTERNS = [
	/\d+%/, // percentages: "increased by 30%"
	/\$[\d,]+/, // dollar amounts: "$1.2M"
	/\d+\s*(?:x|times)/i, // multipliers: "3x improvement"
	/\d+\+?\s*(?:users?|customers?|clients?|employees?|members?|team)/i, // people counts
	/\d+\+?\s*(?:projects?|products?|applications?|systems?|services?)/i, // thing counts
	/(?:top|first|#)\s*\d+/i, // rankings: "top 5%", "#1"
	/\d+\s*(?:hours?|days?|weeks?|months?|years?)/i, // time durations
	/\d{1,3}(?:,\d{3})+/, // large numbers: "100,000"
	/\d+\s*(?:million|billion|thousand|k|m|b)\b/i // scaled numbers
];

interface ExperienceScore {
	score: number;
	quantifiedBullets: number;
	totalBullets: number;
	actionVerbCount: number;
	highlights: string[];
}

// scores experience quality: quantified achievements, action verbs, bullet density
export function scoreExperience(bullets: string[]): ExperienceScore {
	if (bullets.length === 0) {
		return {
			score: 0,
			quantifiedBullets: 0,
			totalBullets: 0,
			actionVerbCount: 0,
			highlights: ['no experience bullets found']
		};
	}

	const highlights: string[] = [];
	let quantifiedBullets = 0;
	let actionVerbCount = 0;

	for (const bullet of bullets) {
		// check for quantification
		const isQuantified = QUANTIFICATION_PATTERNS.some((p) => p.test(bullet));
		if (isQuantified) quantifiedBullets++;

		// check for strong action verbs
		const firstWord = bullet
			.trim()
			.split(/\s+/)[0]
			?.toLowerCase()
			.replace(/[^a-z]/g, '');
		if (firstWord && STRONG_ACTION_VERBS.has(firstWord)) {
			actionVerbCount++;
		}
	}

	const totalBullets = bullets.length;

	// scoring components
	const quantificationRatio = quantifiedBullets / totalBullets;
	const actionVerbRatio = actionVerbCount / totalBullets;

	// ideal: 40%+ quantified, 70%+ action verbs
	const quantScore = Math.min(1, quantificationRatio / 0.4) * 40;
	const actionScore = Math.min(1, actionVerbRatio / 0.7) * 30;

	// bullet count: penalize too few, reward good amount
	const bulletCountScore =
		totalBullets >= 8 ? 30 : totalBullets >= 5 ? 25 : totalBullets >= 3 ? 20 : 10;

	// generate highlights
	if (quantificationRatio >= 0.4) {
		highlights.push(
			`${Math.round(quantificationRatio * 100)}% of bullets are quantified (excellent)`
		);
	} else if (quantificationRatio >= 0.2) {
		highlights.push(
			`${Math.round(quantificationRatio * 100)}% of bullets are quantified (good, aim for 40%+)`
		);
	} else {
		highlights.push(
			`only ${Math.round(quantificationRatio * 100)}% of bullets are quantified (add numbers, percentages, dollar amounts)`
		);
	}

	if (actionVerbRatio >= 0.7) {
		highlights.push('strong use of action verbs');
	} else {
		highlights.push(
			`${Math.round(actionVerbRatio * 100)}% bullets start with action verbs (aim for 70%+)`
		);
	}

	if (totalBullets < 5) {
		highlights.push(`only ${totalBullets} experience bullets. consider adding more detail.`);
	}

	const score = Math.round(Math.min(100, quantScore + actionScore + bulletCountScore));

	return {
		score,
		quantifiedBullets,
		totalBullets,
		actionVerbCount,
		highlights
	};
}
