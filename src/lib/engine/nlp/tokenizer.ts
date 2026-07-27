const STOP_WORDS = new Set([
	'a','an','the','and','or','but','in','on','at','to','for','of','with','by','from','as','is','was','are','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','need','not','no','nor','so','if','then','than','too','very','just','about','above','after','again','all','also','am','any','because','before','between','both','each','few','further','get','got','here','how','i','into','it','its','me','more','most','my','myself','now','only','other','our','out','over','own','same','she','he','her','him','his','some','such','that','their','them','there','these','they','this','those','through','under','until','up','us','we','what','when','where','which','while','who','whom','why','you','your','etc','ie','eg','per','via',
	'o','os','um','uma','uns','umas','e','ou','mas','em','no','na','nos','nas','ao','aos','para','por','de','do','da','dos','das','com','sem','sob','sobre','entre','ate','até','desde','como','que','se','ser','foi','sao','são','era','eram','ter','tem','teve','tinha','há','ha','mais','menos','muito','muita','muitos','muitas','pouco','pouca','ja','já','ainda','tambem','também','apenas','cada','todo','toda','todos','todas','seu','sua','seus','suas','meu','minha','meus','minhas','ele','ela','eles','elas','isso','isto','aquele','aquela','onde','quando','qual','quais','porque','pelo','pela','pelos','pelas','num','numa','via'
]);

export interface Token {
	raw: string;
	normalized: string;
	position: number;
}

function cleanToken(raw: string): string {
	return raw
		.normalize('NFKC')
		.replace(/^[^\p{L}\p{N}#+.]+|[^\p{L}\p{N}#+.]+$/gu, '')
		.trim();
}

function fold(value: string): string {
	return value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('en-US');
}

export function tokenize(text: string): Token[] {
	const words = text.split(/[\s,;|•·▪]+/u);
	const tokens: Token[] = [];
	for (let position = 0; position < words.length; position++) {
		const raw = cleanToken(words[position]);
		if (!raw) continue;
		const normalized = fold(raw);
		if (normalized.length < 2 || STOP_WORDS.has(normalized)) continue;
		tokens.push({ raw, normalized, position });
	}
	return tokens;
}

export function extractNgrams(text: string, n: number): string[] {
	const words = text
		.split(/[\s,;|•·▪]+/u)
		.map(cleanToken)
		.filter(Boolean)
		.map(fold);
	if (words.length < n) return [];
	const ngrams: string[] = [];
	for (let index = 0; index <= words.length - n; index++) {
		const slice = words.slice(index, index + n);
		if (slice.some((word) => !STOP_WORDS.has(word))) ngrams.push(slice.join(' '));
	}
	return ngrams;
}

export function extractTerms(text: string): string[] {
	return [...new Set([
		...tokenize(text).map((token) => token.normalized),
		...extractNgrams(text, 2),
		...extractNgrams(text, 3)
	])];
}

export function normalizeText(text: string): string {
	return fold(text).trim().replace(/\s+/g, ' ');
}

export { STOP_WORDS };
