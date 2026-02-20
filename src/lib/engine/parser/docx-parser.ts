import mammoth from 'mammoth';

interface DOCXParseResult {
	text: string;
	lines: string[];
	hasTables: boolean;
	hasImages: boolean;
}

/**
 * extracts text content from a DOCX file using mammoth.
 * mammoth converts DOCX to plaintext, stripping formatting
 * but preserving document structure (paragraphs, lists).
 */
export async function parseDOCX(file: File): Promise<DOCXParseResult> {
	const buffer = await file.arrayBuffer();

	// extract raw text for scoring
	const textResult = await mammoth.extractRawText({ arrayBuffer: buffer });
	const text = textResult.value;

	// also get HTML to detect tables and images
	const htmlResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
	const html = htmlResult.value;

	const hasTables = /<table[\s>]/i.test(html);
	const hasImages = /<img[\s>]/i.test(html);

	const lines = text
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	return {
		text,
		lines,
		hasTables,
		hasImages
	};
}
