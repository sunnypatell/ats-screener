import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
	'pdfjs-dist/build/pdf.worker.min.mjs',
	import.meta.url
).toString();

interface PDFTextLine {
	text: string;
	x: number;
	y: number;
	width: number;
	height: number;
	pageIndex: number;
}

interface PDFParseResult {
	text: string;
	lines: string[];
	pageCount: number;
	hasMultipleColumns: boolean;
	hasTables: boolean;
	hasImages: boolean;
}

/**
 * extracts text content from a PDF file with layout awareness.
 * reconstructs line ordering based on y-position to handle
 * multi-column layouts that ATS parsers struggle with.
 */
export async function parsePDF(file: File): Promise<PDFParseResult> {
	const buffer = await file.arrayBuffer();
	const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
	const pageCount = pdf.numPages;

	const allLines: PDFTextLine[] = [];
	let hasImages = false;

	for (let i = 1; i <= pageCount; i++) {
		const page = await pdf.getPage(i);
		const textContent = await page.getTextContent();
		const operators = await page.getOperatorList();

		// detect images via operator list
		const imageOps = [
			pdfjsLib.OPS.paintImageXObject,
			pdfjsLib.OPS.paintImageMaskXObject,
			pdfjsLib.OPS.paintXObject
		];
		if (operators.fnArray.some((op: number) => imageOps.includes(op))) {
			hasImages = true;
		}

		for (const item of textContent.items) {
			if (!('str' in item)) continue;
			const textItem = item as TextItem;
			if (!textItem.str.trim()) continue;

			allLines.push({
				text: textItem.str,
				x: textItem.transform[4],
				y: textItem.transform[5],
				width: textItem.width,
				height: textItem.height,
				pageIndex: i - 1
			});
		}
	}

	const hasMultipleColumns = detectMultipleColumns(allLines);
	const hasTables = detectTables(allLines);

	// group text items into lines by y-position proximity
	const reconstructedLines = reconstructLines(allLines);
	const text = reconstructedLines.join('\n');

	return {
		text,
		lines: reconstructedLines,
		pageCount,
		hasMultipleColumns,
		hasTables,
		hasImages
	};
}

/**
 * groups text items into lines based on y-position clustering.
 * items within 3px y-distance are considered the same line.
 * lines are sorted top-to-bottom, items within a line left-to-right.
 */
function reconstructLines(items: PDFTextLine[]): string[] {
	if (items.length === 0) return [];

	// sort by page, then by y (descending = top first), then by x
	const sorted = [...items].sort((a, b) => {
		if (a.pageIndex !== b.pageIndex) return a.pageIndex - b.pageIndex;
		if (Math.abs(a.y - b.y) > 3) return b.y - a.y;
		return a.x - b.x;
	});

	const lines: string[] = [];
	let currentLine: PDFTextLine[] = [sorted[0]];

	for (let i = 1; i < sorted.length; i++) {
		const item = sorted[i];
		const prev = currentLine[currentLine.length - 1];

		const samePage = item.pageIndex === prev.pageIndex;
		const sameLine = Math.abs(item.y - prev.y) <= 3;

		if (samePage && sameLine) {
			currentLine.push(item);
		} else {
			lines.push(mergeLine(currentLine));
			currentLine = [item];
		}
	}

	if (currentLine.length > 0) {
		lines.push(mergeLine(currentLine));
	}

	return lines.filter((line) => line.trim().length > 0);
}

/**
 * merges text items on the same line, inserting spaces
 * where there are significant gaps between items.
 */
function mergeLine(items: PDFTextLine[]): string {
	if (items.length === 0) return '';
	if (items.length === 1) return items[0].text;

	const sorted = [...items].sort((a, b) => a.x - b.x);
	let result = sorted[0].text;

	for (let i = 1; i < sorted.length; i++) {
		const gap = sorted[i].x - (sorted[i - 1].x + sorted[i - 1].width);
		// insert space if gap is larger than ~half a character width
		const charWidth = sorted[i].height * 0.5;
		if (gap > charWidth) {
			result += ' ';
		}
		result += sorted[i].text;
	}

	return result;
}

/**
 * detects multi-column layouts by analyzing x-position distribution.
 * if text items cluster into 2+ distinct x-ranges, it's likely multi-column.
 */
function detectMultipleColumns(items: PDFTextLine[]): boolean {
	if (items.length < 20) return false;

	const xPositions = items.map((item) => Math.round(item.x / 10) * 10);
	const xCounts = new Map<number, number>();

	for (const x of xPositions) {
		xCounts.set(x, (xCounts.get(x) || 0) + 1);
	}

	// find distinct x-clusters with significant item counts
	const significantClusters = [...xCounts.entries()]
		.filter(([_, count]) => count > items.length * 0.05)
		.map(([x]) => x)
		.sort((a, b) => a - b);

	if (significantClusters.length < 2) return false;

	// check if clusters are far enough apart to be separate columns
	for (let i = 1; i < significantClusters.length; i++) {
		const gap = significantClusters[i] - significantClusters[i - 1];
		if (gap > 150) return true;
	}

	return false;
}

/**
 * detects table-like structures by looking for aligned columns
 * of text with consistent spacing patterns.
 */
function detectTables(items: PDFTextLine[]): boolean {
	if (items.length < 10) return false;

	// group items by y-position (same line)
	const lineGroups = new Map<number, PDFTextLine[]>();
	for (const item of items) {
		const roundedY = Math.round(item.y / 3) * 3;
		if (!lineGroups.has(roundedY)) {
			lineGroups.set(roundedY, []);
		}
		lineGroups.get(roundedY)!.push(item);
	}

	// count lines with 3+ separate text items (potential table rows)
	let tableRowCount = 0;
	for (const [, lineItems] of lineGroups) {
		if (lineItems.length >= 3) {
			const sorted = lineItems.sort((a, b) => a.x - b.x);
			const gaps = [];
			for (let i = 1; i < sorted.length; i++) {
				gaps.push(sorted[i].x - (sorted[i - 1].x + sorted[i - 1].width));
			}
			// if there are large, consistent gaps, it looks like a table
			const largeGaps = gaps.filter((g) => g > 30);
			if (largeGaps.length >= 2) tableRowCount++;
		}
	}

	return tableRowCount >= 3;
}
