import { browser } from '$app/environment';

export type AppLocale = 'pt-BR' | 'en';

type Dictionary = Record<string, string>;

const MESSAGES: Record<AppLocale, Dictionary> = {
	'pt-BR': {
		'scanner.badge': 'Analisador de currículo',
		'scanner.title': 'Analise seu currículo em sistemas ATS',
		'scanner.subtitle':
			'Extração local, OCR próprio e pontuação determinística. Nenhuma API de IA é usada.',
		'scanner.upload': 'Enviar',
		'scanner.parse': 'Extrair',
		'scanner.scan': 'Analisar',
		'scanner.results': 'Resultados',
		'scanner.pasteToggle': 'Ou cole o texto do currículo',
		'scanner.pastePlaceholder':
			'Cole o texto do currículo. Títulos claros como Experiência, Formação e Competências melhoram a estruturação.',
		'scanner.characters': 'caracteres',
		'scanner.useText': 'Usar este texto',
		'scanner.startOver': 'Recomeçar',
		'scanner.scoring': 'Analisando...',
		'scanner.rescan': 'Analisar novamente',
		'scanner.scanResume': 'Analisar currículo',
		'scanner.parsed': 'Currículo extraído com sucesso',
		'uploader.aria': 'Enviar currículo em PDF ou DOCX',
		'uploader.invalid': 'Envie um arquivo PDF ou DOCX.',
		'uploader.large': 'Arquivo maior que 10 MB.',
		'uploader.parsing': 'Extraindo currículo...',
		'uploader.parsingHint': 'Lendo texto, seções, campos e metadados',
		'uploader.title': 'Arraste seu currículo aqui',
		'uploader.hint': 'ou toque para procurar. PDF ou DOCX, até 10 MB.',
		'uploader.privacy':
			'PDFs com texto são processados no navegador. OCR é enviado somente ao seu próprio servidor.',
		'jd.show': 'Adicionar descrição da vaga para análise direcionada',
		'jd.hide': 'Ocultar descrição da vaga',
		'jd.placeholder': 'Cole a descrição da vaga para comparar requisitos, competências e experiência...',
		'jd.active': 'Modo direcionado ativo: a pontuação será comparada com esta vaga.',
		'jd.detected': 'Detectado na vaga',
		'jd.inResume': 'no currículo',
		'overview.title': 'Visão geral da extração',
		'overview.words': 'Palavras',
		'overview.pages': 'Páginas',
		'overview.sections': 'Seções',
		'overview.skills': 'Competências',
		'overview.positions': 'Experiências',
		'overview.education': 'Formações',
		'overview.confidence': 'Confiança',
		'overview.method': 'Método',
		'overview.detectedSections': 'Seções detectadas',
		'overview.extractedSkills': 'Competências extraídas',
		'overview.contact': 'Contato',
		'overview.layout': 'Múltiplas colunas',
		'overview.tables': 'Tabelas',
		'overview.images': 'Imagens/gráficos',
		'overview.yes': 'detectado',
		'overview.no': 'não detectado',
		'language.label': 'Idioma'
	},
	en: {
		'scanner.badge': 'Resume scanner',
		'scanner.title': 'Scan your resume across ATS systems',
		'scanner.subtitle':
			'Local extraction, self-hosted OCR and deterministic scoring. No AI API is used.',
		'scanner.upload': 'Upload',
		'scanner.parse': 'Parse',
		'scanner.scan': 'Scan',
		'scanner.results': 'Results',
		'scanner.pasteToggle': 'Or paste resume text',
		'scanner.pastePlaceholder':
			'Paste resume text. Clear headings such as Experience, Education and Skills improve structuring.',
		'scanner.characters': 'characters',
		'scanner.useText': 'Use this text',
		'scanner.startOver': 'Start over',
		'scanner.scoring': 'Scoring...',
		'scanner.rescan': 'Re-scan',
		'scanner.scanResume': 'Scan resume',
		'scanner.parsed': 'Resume parsed successfully',
		'uploader.aria': 'Upload a PDF or DOCX resume',
		'uploader.invalid': 'Upload a PDF or DOCX file.',
		'uploader.large': 'File is larger than 10 MB.',
		'uploader.parsing': 'Parsing resume...',
		'uploader.parsingHint': 'Reading text, sections, fields and metadata',
		'uploader.title': 'Drag your resume here',
		'uploader.hint': 'or click to browse. PDF or DOCX, up to 10 MB.',
		'uploader.privacy':
			'Text PDFs are processed in the browser. OCR is sent only to your own server.',
		'jd.show': 'Add job description for targeted scoring',
		'jd.hide': 'Hide job description',
		'jd.placeholder': 'Paste the job description to compare requirements, skills and experience...',
		'jd.active': 'Targeted mode is active: scoring will be compared with this job.',
		'jd.detected': 'Detected from job',
		'jd.inResume': 'in resume',
		'overview.title': 'Extraction overview',
		'overview.words': 'Words',
		'overview.pages': 'Pages',
		'overview.sections': 'Sections',
		'overview.skills': 'Skills',
		'overview.positions': 'Positions',
		'overview.education': 'Education',
		'overview.confidence': 'Confidence',
		'overview.method': 'Method',
		'overview.detectedSections': 'Detected sections',
		'overview.extractedSkills': 'Extracted skills',
		'overview.contact': 'Contact',
		'overview.layout': 'Multiple columns',
		'overview.tables': 'Tables',
		'overview.images': 'Images/graphics',
		'overview.yes': 'detected',
		'overview.no': 'not detected',
		'language.label': 'Language'
	}
};

class LocaleStore {
	locale = $state<AppLocale>('pt-BR');
	initialized = $state(false);

	init() {
		if (!browser || this.initialized) return;
		const saved = localStorage.getItem('ats_locale');
		this.locale = saved === 'en' || saved === 'pt-BR'
			? saved
			: navigator.language.toLowerCase().startsWith('pt')
				? 'pt-BR'
				: 'en';
		document.documentElement.lang = this.locale;
		this.initialized = true;
	}

	set(locale: AppLocale) {
		this.locale = locale;
		if (browser) {
			localStorage.setItem('ats_locale', locale);
			document.documentElement.lang = locale;
		}
	}

	t(key: string): string {
		return MESSAGES[this.locale][key] ?? MESSAGES.en[key] ?? key;
	}
}

export const localeStore = new LocaleStore();
