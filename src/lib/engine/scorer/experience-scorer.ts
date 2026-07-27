const ACTION_VERBS = new Set([
	'achieved','accelerated','administered','advanced','analyzed','architected','automated','built','centralized','collaborated','consolidated','coordinated','created','decreased','delivered','designed','developed','directed','drove','enabled','engineered','established','executed','expanded','generated','implemented','improved','increased','integrated','launched','led','managed','mentored','migrated','modernized','operated','optimized','organized','planned','produced','programmed','reduced','refactored','resolved','scaled','secured','simplified','standardized','streamlined','supervised','trained','transformed','upgraded',
	'alcancei','acelerei','administrei','analisei','arquitetei','automatizei','construí','colaborei','consolidei','coordenei','criei','reduzi','entreguei','projetei','desenvolvi','dirigi','executei','expandi','gerei','implementei','melhorei','aumentei','integrei','lancei','liderei','gerenciei','mentorei','migrei','modernizei','operei','otimizei','organizei','planejei','produzi','programei','refatorei','resolvi','escalei','protegi','simplifiquei','padronizei','supervisionei','treinei','transformei','atualizei',
	'atuou','construiu','desenvolveu','implementou','criou','organizou','estruturou','processou','gerou','aplicou','executou','operou','manteve','realizou'
]);

const QUANTIFICATION_PATTERNS = [
	/\d+(?:[.,]\d+)?\s*%/,
	/(?:R\$|US\$|\$|€|£)\s*[\d.,]+/i,
	/\d+(?:[.,]\d+)?\s*(?:x|vezes)/i,
	/\d+\+?\s*(?:users?|customers?|clients?|employees?|members?|pessoas?|usuarios?|usuários?|clientes?|colaboradores?|membros?|equipe)/i,
	/\d+\+?\s*(?:projects?|products?|applications?|systems?|services?|projetos?|produtos?|aplicacoes?|aplicações?|sistemas?|servicos?|serviços?)/i,
	/(?:top|first|primeiro|#)\s*\d+/i,
	/\d+\s*(?:hours?|days?|weeks?|months?|years?|horas?|dias?|semanas?|meses?|anos?)/i,
	/\d{1,3}(?:[.,]\d{3})+/,
	/\d+(?:[.,]\d+)?\s*(?:million|billion|thousand|milhao|milhão|milhoes|milhões|mil|k|m|b)\b/i
];

interface ExperienceScore {
	score: number;
	quantifiedBullets: number;
	totalBullets: number;
	actionVerbCount: number;
	highlights: string[];
}

export function scoreExperience(bullets: string[], locale: 'pt-BR' | 'en' = 'en'): ExperienceScore {
	if (bullets.length === 0) {
		return {
			score: 0,
			quantifiedBullets: 0,
			totalBullets: 0,
			actionVerbCount: 0,
			highlights: [locale === 'pt-BR' ? 'nenhum tópico de experiência foi detectado' : 'no experience bullets found']
		};
	}

	let quantifiedBullets = 0;
	let actionVerbCount = 0;
	for (const bullet of bullets) {
		if (QUANTIFICATION_PATTERNS.some((pattern) => pattern.test(bullet))) quantifiedBullets++;
		const firstWord = bullet
			.normalize('NFKD')
			.replace(/\p{M}/gu, '')
			.trim()
			.split(/\s+/)[0]
			?.toLowerCase()
			.replace(/[^a-z]/g, '');
		if (firstWord && ACTION_VERBS.has(firstWord)) actionVerbCount++;
	}

	const totalBullets = bullets.length;
	const quantificationRatio = quantifiedBullets / totalBullets;
	const actionVerbRatio = actionVerbCount / totalBullets;
	const quantScore = Math.min(1, quantificationRatio / 0.4) * 40;
	const actionScore = Math.min(1, actionVerbRatio / 0.7) * 30;
	const bulletCountScore = totalBullets >= 8 ? 30 : totalBullets >= 5 ? 25 : totalBullets >= 3 ? 20 : 10;
	const highlights: string[] = [];

	if (locale === 'pt-BR') {
		highlights.push(`${Math.round(quantificationRatio * 100)}% dos tópicos têm resultados mensuráveis (meta: 40%+)`);
		highlights.push(`${Math.round(actionVerbRatio * 100)}% dos tópicos começam com verbos de ação (meta: 70%+)`);
		if (totalBullets < 5) highlights.push(`apenas ${totalBullets} tópicos de experiência foram detectados`);
	} else {
		highlights.push(`${Math.round(quantificationRatio * 100)}% of bullets are quantified (aim for 40%+)`);
		highlights.push(`${Math.round(actionVerbRatio * 100)}% of bullets start with action verbs (aim for 70%+)`);
		if (totalBullets < 5) highlights.push(`only ${totalBullets} experience bullets were detected`);
	}

	return {
		score: Math.round(Math.min(100, quantScore + actionScore + bulletCountScore)),
		quantifiedBullets,
		totalBullets,
		actionVerbCount,
		highlights
	};
}
