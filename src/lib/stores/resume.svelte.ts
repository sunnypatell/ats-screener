import { parseResumeText } from '$engine/parser';
import type { ParsedResume, ParseResult } from '$engine/parser/types';

// tracks uploaded file, parsed data, and parsing status
class ResumeStore {
	file = $state<File | null>(null);
	parseResult = $state<ParseResult | null>(null);
	isParsing = $state(false);
	error = $state<string | null>(null);

	get resume(): ParsedResume | null {
		return this.parseResult?.resume ?? null;
	}

	get isReady(): boolean {
		return this.parseResult?.success === true && this.resume !== null;
	}

	get warnings(): string[] {
		return this.parseResult?.warnings ?? [];
	}

	get errors(): string[] {
		return this.parseResult?.errors ?? [];
	}

	setFile(file: File) {
		this.file = file;
		this.parseResult = null;
		this.error = null;
	}

	startParsing() {
		this.isParsing = true;
		this.error = null;
	}

	finishParsing(result: ParseResult) {
		this.parseResult = result;
		this.isParsing = false;
		if (!result.success) {
			this.error = result.errors.join('; ');
		}
	}

	// alternate to setFile + parse: accepts pasted resume text directly,
	// runs parseResumeText synchronously, and populates parseResult so the
	// downstream scoring path is identical to the file-based flow.
	setText(text: string) {
		this.file = null;
		this.error = null;
		const result = parseResumeText(text);
		this.parseResult = result;
		this.isParsing = false;
		if (!result.success) {
			this.error = result.errors.join('; ');
		}
	}

	setError(message: string) {
		this.error = message;
		this.isParsing = false;
	}

	reset() {
		this.file = null;
		this.parseResult = null;
		this.isParsing = false;
		this.error = null;
	}
}

export const resumeStore = new ResumeStore();
