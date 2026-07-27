import { execFile } from 'node:child_process';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const execFileAsync = promisify(execFile);
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 6;
const MAX_CONCURRENT_JOBS = 2;
let activeJobs = 0;

export const prerender = false;

export const POST: RequestHandler = async ({ request }) => {
	if (process.env.OCR_ENABLED === 'false') {
		return json({ error: 'OCR is disabled' }, { status: 503 });
	}
	if (activeJobs >= MAX_CONCURRENT_JOBS) {
		return json(
			{ error: 'OCR capacity is busy. Try again shortly.' },
			{ status: 429, headers: { 'Retry-After': '10' } }
		);
	}

	const contentLength = Number(request.headers.get('content-length') ?? 0);
	if (contentLength > MAX_FILE_BYTES + 1_000_000) {
		return json({ error: 'Request is too large' }, { status: 413 });
	}
	const form = await request.formData();
	const file = form.get('file');
	if (!(file instanceof File)) {
		return json({ error: 'PDF file is required' }, { status: 400 });
	}
	if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
		return json({ error: 'Only PDF files are supported by OCR' }, { status: 415 });
	}
	if (file.size === 0 || file.size > MAX_FILE_BYTES) {
		return json(
			{ error: `PDF must be between 1 byte and ${MAX_FILE_BYTES} bytes` },
			{ status: 413 }
		);
	}

	activeJobs++;
	const directory = await mkdtemp(join(tmpdir(), 'ats-ocr-'));
	try {
		const input = join(directory, 'input.pdf');
		await writeFile(input, Buffer.from(await file.arrayBuffer()));

		const { stdout: info } = await execFileAsync('pdfinfo', [input], {
			timeout: 10_000,
			maxBuffer: 512 * 1024
		});
		const pageCount = Number(info.match(/^Pages:\s+(\d+)/m)?.[1] ?? 0);
		if (!pageCount) {
			return json({ error: 'Could not determine PDF page count' }, { status: 422 });
		}
		if (pageCount > MAX_PAGES) {
			return json({ error: `OCR supports up to ${MAX_PAGES} pages` }, { status: 413 });
		}

		await execFileAsync(
			'pdftoppm',
			['-png', '-r', '200', '-f', '1', '-l', String(pageCount), input, join(directory, 'page')],
			{ timeout: 60_000, maxBuffer: 2 * 1024 * 1024 }
		);

		const images = (await readdir(directory))
			.filter((name) => /^page-\d+\.png$/.test(name))
			.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
		if (images.length !== pageCount) {
			return json({ error: 'Not all PDF pages could be rendered' }, { status: 422 });
		}

		const pages: string[] = [];
		for (const image of images) {
			const { stdout } = await execFileAsync(
				'tesseract',
				[
					join(directory, image),
					'stdout',
					'-l',
					'por+eng',
					'--oem',
					'1',
					'--psm',
					'3',
					'quiet'
				],
				{ timeout: 45_000, maxBuffer: 8 * 1024 * 1024 }
			);
			pages.push(stdout.trim());
		}

		const text = pages.filter(Boolean).join('\n\n');
		if (!text) {
			return json({ error: 'OCR did not find readable text' }, { status: 422 });
		}
		return json({
			text,
			lines: text
				.split(/\r?\n/)
				.map((line) => line.trim())
				.filter(Boolean),
			pageCount,
			method: 'tesseract-por+eng'
		});
	} catch (cause) {
		const message = cause instanceof Error ? cause.message : 'OCR failed';
		return json({ error: message }, { status: 500 });
	} finally {
		activeJobs--;
		await rm(directory, { recursive: true, force: true });
	}
};
