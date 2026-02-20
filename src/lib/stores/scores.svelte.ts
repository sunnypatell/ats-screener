import { browser } from '$app/environment';
import type { ScoreResult } from '$engine/scorer/types';
import type { LLMAnalysis } from '$engine/llm/types';
import type { ParsedJobDescription } from '$engine/job-parser/types';

const HISTORY_KEY = 'ats-scan-history';
const MAX_HISTORY = 10;

export interface ScanHistoryEntry {
	id: string;
	timestamp: string;
	mode: 'general' | 'targeted';
	averageScore: number;
	passingCount: number;
	results: ScoreResult[];
}

// tracks ATS scores, LLM analysis, and job description state
class ScoresStore {
	results = $state<ScoreResult[]>([]);
	llmAnalysis = $state<LLMAnalysis | null>(null);
	parsedJD = $state<ParsedJobDescription | null>(null);
	jobDescription = $state('');
	isScoring = $state(false);
	isAnalyzing = $state(false);
	llmFallback = $state(false);
	error = $state<string | null>(null);

	get hasResults(): boolean {
		return this.results.length > 0;
	}

	get averageScore(): number {
		if (this.results.length === 0) return 0;
		return Math.round(
			this.results.reduce((sum, r) => sum + r.overallScore, 0) / this.results.length
		);
	}

	get passingCount(): number {
		return this.results.filter((r) => r.passesFilter).length;
	}

	get hasJobDescription(): boolean {
		return this.jobDescription.trim().length > 0;
	}

	get mode(): 'general' | 'targeted' {
		return this.hasJobDescription ? 'targeted' : 'general';
	}

	setJobDescription(text: string) {
		this.jobDescription = text;
	}

	startScoring() {
		this.isScoring = true;
		this.error = null;
	}

	finishScoring(results: ScoreResult[]) {
		this.results = results;
		this.isScoring = false;
		this.saveToHistory(results);
	}

	// scan history persisted in localStorage
	get history(): ScanHistoryEntry[] {
		if (!browser) return [];
		try {
			const raw = localStorage.getItem(HISTORY_KEY);
			return raw ? JSON.parse(raw) : [];
		} catch {
			return [];
		}
	}

	private saveToHistory(results: ScoreResult[]) {
		if (!browser || results.length === 0) return;
		try {
			const entry: ScanHistoryEntry = {
				id: crypto.randomUUID(),
				timestamp: new Date().toISOString(),
				mode: this.mode,
				averageScore: Math.round(results.reduce((s, r) => s + r.overallScore, 0) / results.length),
				passingCount: results.filter((r) => r.passesFilter).length,
				results
			};
			const existing = this.history;
			const updated = [entry, ...existing].slice(0, MAX_HISTORY);
			localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
		} catch {
			// localStorage full or unavailable, silently skip
		}
	}

	clearHistory() {
		if (browser) localStorage.removeItem(HISTORY_KEY);
	}

	startAnalyzing() {
		this.isAnalyzing = true;
	}

	finishAnalyzing(analysis: LLMAnalysis | null, fallback: boolean) {
		this.llmAnalysis = analysis;
		this.llmFallback = fallback;
		this.isAnalyzing = false;
	}

	setParsedJD(jd: ParsedJobDescription) {
		this.parsedJD = jd;
	}

	setError(message: string) {
		this.error = message;
		this.isScoring = false;
		this.isAnalyzing = false;
	}

	reset() {
		this.results = [];
		this.llmAnalysis = null;
		this.parsedJD = null;
		this.jobDescription = '';
		this.isScoring = false;
		this.isAnalyzing = false;
		this.llmFallback = false;
		this.error = null;
	}
}

export const scoresStore = new ScoresStore();
