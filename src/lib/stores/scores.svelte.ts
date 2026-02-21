import { browser } from '$app/environment';
import type { ScoreResult } from '$engine/scorer/types';
import type { LLMAnalysis } from '$engine/llm/types';
import type { ParsedJobDescription } from '$engine/job-parser/types';
import {
	collection,
	addDoc,
	getDocs,
	deleteDoc,
	doc,
	query,
	orderBy,
	limit
} from 'firebase/firestore';
import { db } from '$lib/firebase';
import { authStore } from './auth.svelte';

const MAX_HISTORY = 20;

export interface ScanHistoryEntry {
	id: string;
	timestamp: string;
	mode: 'general' | 'targeted';
	averageScore: number;
	passingCount: number;
	results: ScoreResult[];
	fileName?: string;
	jobDescriptionSnippet?: string;
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
	scanHistory = $state<ScanHistoryEntry[]>([]);
	historyLoading = $state(false);

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

	get history(): ScanHistoryEntry[] {
		return this.scanHistory;
	}

	setJobDescription(text: string) {
		this.jobDescription = text;
	}

	startScoring() {
		this.isScoring = true;
		this.error = null;
	}

	finishScoring(results: ScoreResult[], fileName?: string) {
		this.results = results;
		this.isScoring = false;
		this.saveToHistory(results, fileName);
	}

	// load scan history from Firestore for current user
	async loadHistory() {
		if (!browser || !authStore.isAuthenticated || !authStore.user) return;

		this.historyLoading = true;
		try {
			const scansRef = collection(db, 'users', authStore.user.uid, 'scans');
			const q = query(scansRef, orderBy('timestamp', 'desc'), limit(MAX_HISTORY));
			const snapshot = await getDocs(q);

			this.scanHistory = snapshot.docs.map((d) => ({
				id: d.id,
				...(d.data() as Omit<ScanHistoryEntry, 'id'>)
			}));
		} catch (err) {
			console.warn('failed to load scan history:', err);
			this.scanHistory = [];
		} finally {
			this.historyLoading = false;
		}
	}

	// save scan results to Firestore
	private async saveToHistory(results: ScoreResult[], fileName?: string) {
		if (!browser || results.length === 0 || !authStore.isAuthenticated || !authStore.user) return;

		try {
			const scansRef = collection(db, 'users', authStore.user.uid, 'scans');
			const entry: Omit<ScanHistoryEntry, 'id'> = {
				timestamp: new Date().toISOString(),
				mode: this.mode,
				averageScore: Math.round(
					results.reduce((s, r) => s + r.overallScore, 0) / results.length
				),
				passingCount: results.filter((r) => r.passesFilter).length,
				results,
				...(fileName && { fileName }),
				...(this.jobDescription && { jobDescriptionSnippet: this.jobDescription.slice(0, 200) })
			};

			await addDoc(scansRef, entry);

			// enforce max history cap
			await this.loadHistory();
			if (this.scanHistory.length > MAX_HISTORY) {
				const toDelete = this.scanHistory.slice(MAX_HISTORY);
				for (const scan of toDelete) {
					await deleteDoc(doc(db, 'users', authStore.user.uid, 'scans', scan.id));
				}
				this.scanHistory = this.scanHistory.slice(0, MAX_HISTORY);
			}
		} catch (err) {
			console.warn('failed to save scan to history:', err);
		}
	}

	async clearHistory() {
		if (!browser || !authStore.isAuthenticated || !authStore.user) return;

		try {
			const scansRef = collection(db, 'users', authStore.user.uid, 'scans');
			const snapshot = await getDocs(scansRef);
			for (const d of snapshot.docs) {
				await deleteDoc(d.ref);
			}
			this.scanHistory = [];
		} catch (err) {
			console.warn('failed to clear history:', err);
		}
	}

	// load a past scan's results into the active dashboard view
	loadFromHistory(entry: ScanHistoryEntry) {
		this.results = entry.results;
		this.isScoring = false;
		this.error = null;
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
