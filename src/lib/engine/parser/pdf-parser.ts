import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { normalizeLines, normalizeTextFragment, textQualityScore } from './text-normalizer';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
	'pdfjs-dist/build/pdf.worker.min.mjs',
	import.meta.url
).toString();

interface PDFTextItem {
	text: string;
	x: number;
	y: number;
	width: number;
	height: number;
	pageIndex: number;
	pageWidth: number;
	pageHeight: number;
	hadLeadingSpace: boolean;
	hadTrailingSpace: boolean;
}

interface ReconstructedLine {
	text: string;
	xStart: number;
	xEnd: number;
	y: number;
	pageIndex: number;
	pageWidth: number;
	items: PDFTextItem[];
}

interface PDFParseResult {
	text: string;
	lines: string[];
	pageCount: number;
	hasMultipleColumns: boolean;
	hasTables: boolean;
	hasImages: boolean;
	quality: number;
	needsOCR: boolean;
}

export async function parsePDF(file: File): Promise<PDFParseResult> {
	const buffer = await file.arrayBuffer();
	const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
	const allItems: PDFTextItem[] = [];
	let hasImages = false;

	for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
		const page = await pdf.getPage(pageNumber);
		const viewport = page.getViewport({ scale: 1 });
		const textContent = await page.getTextContent();
		const operators = await page.getOperatorList();

		const imageOps = new Set([
			pdfjsLib.OPS.paintImageXObject,
			pdfjsLib.OPS.paintImageMaskXObject
		]);
		for (let index = 0; index < operators.fnArray.length; index++) {
			if (!imageOps.has(operators.fnArray[index])) continue;
			const objectId = operators.argsArray[index]?.[0];
			if (!objectId) continue;
			try {
				const image = page.objs.get(objectId as string) as {
					width?: number;
					height?: number;
				} | null;
				const width = image?.width ?? 0;
				const height = image?.height ?? 0;
				const areaRatio =
					(width * height) / Math.max(1, viewport.width * viewport.height);
				if (width >= 80 && height >= 80 && areaRatio >= 0.03) hasImages = true;
			} catch {
				// Decorative glyph XObjects may not resolve synchronously. Ignoring them
				// avoids reporting every icon as a photograph.
			}
		}

		for (const item of textContent.items) {
			if (!('str' in item)) continue;
			const textItem = item as TextItem;
			const rawText = textItem.str;
			const text = normalizeTextFragment(rawText);
			if (!text) continue;
			allItems.push({
				text,
				x: textItem.transform[4],
				y: textItem.transform[5],
				width: textItem.width,
				height: Math.max(1, textItem.height),
				pageIndex: pageNumber - 1,
				pageWidth: viewport.width,
				pageHeight: viewport.height,
				hadLeadingSpace: /^\s/u.test(rawText),
				hadTrailingSpace: /\s$/u.test(rawText)
			});
		}
	}

	const reconstructed = reconstructLines(allItems);
	const lines = normalizeLines(reconstructed.map((line) => line.text));
	const text = lines.join('\n');
	const quality = textQualityScore(text, lines);

	return {
		text,
		lines,
		pageCount: pdf.numPages,
		hasMultipleColumns: detectMultipleColumns(reconstructed),
		hasTables: detectTables(reconstructed),
		hasImages,
		quality,
		needsOCR: quality < 55
	};
}

function reconstructLines(items: PDFTextItem[]): ReconstructedLine[] {
	const result: ReconstructedLine[] = [];
	const pages = new Map<number, PDFTextItem[]>();
	for (const item of items) {
		pages.set(item.pageIndex, [...(pages.get(item.pageIndex) ?? []), item]);
	}

	for (const [pageIndex, pageItems] of [...pages.entries()].sort(
		([first], [second]) => first - second
	)) {
		const heights = pageItems.map((item) => item.height).sort((a, b) => a - b);
		const medianHeight = heights[Math.floor(heights.length / 2)] || 10;
		const tolerance = Math.max(1.5, Math.min(4.5, medianHeight * 0.35));
		const sorted = [...pageItems].sort((a, b) =>
			Math.abs(a.y - b.y) > tolerance ? b.y - a.y : a.x - b.x
		);
		let current: PDFTextItem[] = [];
		let anchorY = 0;

		const flush = () => {
			if (!current.length) return;
			current.sort((a, b) => a.x - b.x);
			const text = mergeItems(current);
			if (text) {
				result.push({
					text,
					xStart: current[0].x,
					xEnd: Math.max(...current.map((item) => item.x + item.width)),
					y: current.reduce((sum, item) => sum + item.y, 0) / current.length,
					pageIndex,
					pageWidth: current[0].pageWidth,
					items: [...current]
				});
			}
			current = [];
		};

		for (const item of sorted) {
			if (!current.length) {
				current = [item];
				anchorY = item.y;
				continue;
			}
			if (Math.abs(item.y - anchorY) <= tolerance) {
				current.push(item);
				anchorY =
					current.reduce((sum, entry) => sum + entry.y, 0) / current.length;
			} else {
				flush();
				current = [item];
				anchorY = item.y;
			}
		}
		flush();
	}
	return result;
}

function mergeItems(items: PDFTextItem[]): string {
	if (!items.length) return '';
	let value = items[0].text;
	for (let index = 1; index < items.length; index++) {
		const previous = items[index - 1];
		const current = items[index];
		const gap = current.x - (previous.x + previous.width);
		const previousCharWidth = previous.width / Math.max(1, previous.text.length);
		const currentCharWidth = current.width / Math.max(1, current.text.length);
		const threshold = Math.max(
			1.2,
			Math.min(previousCharWidth, currentCharWidth) * 0.25
		);
		if (shouldInsertSpace(previous, current, value, gap, threshold)) value += ' ';
		value += current.text;
	}
	return normalizeTextFragment(value);
}

function shouldInsertSpace(
	previous: PDFTextItem,
	current: PDFTextItem,
	assembled: string,
	gap: number,
	threshold: number
): boolean {
	if (/^[,.;:)]/.test(current.text)) return false;
	if (/[-/@#_.+]$/.test(assembled)) return false;
	if (previous.hadTrailingSpace || current.hadLeadingSpace) return true;
	if (gap > threshold) return true;
	if (gap < -0.8) return false;

	// Several office/PDF generators emit adjacent text runs with no geometric gap,
	// even when a visual word boundary exists. Infer that boundary conservatively.
	const previousEndsWord = /[\p{L}\p{N}):%]$/u.test(previous.text);
	const currentStartsWord = /^[\p{L}\p{N}(]/u.test(current.text);
	const previousIsBullet = /^[•·▪►➤○●]$/u.test(previous.text);
	return (previousEndsWord && currentStartsWord) || previousIsBullet;
}

function detectMultipleColumns(lines: ReconstructedLine[]): boolean {
	const pages = new Map<number, ReconstructedLine[]>();
	for (const line of lines) {
		pages.set(line.pageIndex, [...(pages.get(line.pageIndex) ?? []), line]);
	}
	for (const pageLines of pages.values()) {
		const candidates = pageLines.filter(
			(line) => line.text.length >= 12 && line.xEnd - line.xStart >= 50
		);
		if (candidates.length < 12) continue;
		const counts = new Map<number, number>();
		for (const line of candidates) {
			const bucket = Math.round(line.xStart / 20) * 20;
			counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
		}
		const clusters = [...counts.entries()]
			.filter(([, count]) => count >= Math.max(4, candidates.length * 0.18))
			.sort((a, b) => a[0] - b[0]);
		for (let first = 0; first < clusters.length; first++) {
			for (let second = first + 1; second < clusters.length; second++) {
				const gap = clusters[second][0] - clusters[first][0];
				const pageWidth = candidates[0].pageWidth;
				if (
					gap >= Math.max(170, pageWidth * 0.3) &&
					clusters[second][0] >= pageWidth * 0.42
				) {
					return true;
				}
			}
		}
	}
	return false;
}

function detectTables(lines: ReconstructedLine[]): boolean {
	const signatures = new Map<string, number>();
	for (const line of lines) {
		if (line.items.length < 3) continue;
		const sorted = [...line.items].sort((a, b) => a.x - b.x);
		const anchors = [sorted[0].x];
		for (let index = 1; index < sorted.length; index++) {
			const gap =
				sorted[index].x - (sorted[index - 1].x + sorted[index - 1].width);
			if (gap >= 35) anchors.push(sorted[index].x);
		}
		if (anchors.length < 3) continue;
		const signature = anchors
			.slice(0, 4)
			.map((x) => Math.round(x / 20) * 20)
			.join(':');
		signatures.set(signature, (signatures.get(signature) ?? 0) + 1);
	}
	return [...signatures.values()].some((count) => count >= 4);
}
