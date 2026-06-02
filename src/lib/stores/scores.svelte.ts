import { browser } from '$app/environment';
import { env as publicEnv } from '$env/dynamic/public';
import type { ScoreResult } from '$engine/scorer/types';
import type { LLMAnalysis } from '$engine/llm/types';
import type { ParsedJobDescription } from '$engine/job-parser/types';
import { firebaseConfigured, getFirebase } from '$lib/firebase';
import { logger } from '$lib/log';
import { parseSampleRate, shouldSample } from '$lib/sampling';
import { authStore } from './auth.svelte';

const MAX_HISTORY = 5;

// self-host history bucket. when firebase is not configured we persist scan
// history to localStorage under this key (capped at MAX_HISTORY entries,
// newest-first, same shape as the firestore documents) so installs without
// firebase get session-spanning history on the same device. data size is
// well under quota (5 entries x ~10kb = 50kb), localStorage is the right
// fit per `jd-library.svelte.ts` precedent and best-practice guidance.
const LOCAL_HISTORY_KEY = 'ats_local_scan_history_v1';

// in ldap self-host mode the local bucket is namespaced by the signed-in AD
// user's stable subject (objectGUID) so two users sharing a browser don't see
// each other's history. anonymous 'none' mode keeps the bare legacy key, so the
// existing self-host behaviour (and any stored data) is untouched.
function localHistoryKey(): string {
	if (authStore.mode === 'ldap' && authStore.ldapSub) {
		return `${LOCAL_HISTORY_KEY}__${authStore.ldapSub}`;
	}
	return LOCAL_HISTORY_KEY;
}

function readLocalHistory(): ScanHistoryEntry[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(localHistoryKey());
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch (err) {
		logger.warn('history.local_read_failed', {
			error: err instanceof Error ? err.message : String(err)
		});
		return [];
	}
}

function writeLocalHistory(entries: ScanHistoryEntry[]): void {
	if (!browser) return;
	try {
		localStorage.setItem(localHistoryKey(), JSON.stringify(entries));
	} catch (err) {
		// quota exceeded or storage disabled (incognito, sandboxed iframes).
		// in-memory history still works for the current session, we just
		// lose persistence. swallow so the scan flow does not break.
		logger.warn('history.local_write_failed', {
			error: err instanceof Error ? err.message : String(err)
		});
	}
}

function clearLocalHistory(): void {
	if (!browser) return;
	try {
		localStorage.removeItem(localHistoryKey());
	} catch {
		// removeItem rarely throws but defend against pathological storage.
	}
}
// admin scan_logs are observability, not user data. at 50k users they alone
// would push past firestore spark's 20k writes/day cap, so we accept losing
// detail in exchange for staying free. default 1.0 (no behavior change at
// current scale); set PUBLIC_SCAN_LOG_SAMPLE_RATE to e.g. 0.1 to keep 10% of
// scans logged once traffic ramps.
const SCAN_LOG_SAMPLE_RATE = parseSampleRate(publicEnv.PUBLIC_SCAN_LOG_SAMPLE_RATE);

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
	// absolute timestamp (ms) when the AI path becomes available again after a 429
	// null when not rate-limited; UI derives a live countdown from this
	llmRetryAtMs = $state<number | null>(null);
	error = $state<string | null>(null);
	scanHistory = $state<ScanHistoryEntry[]>([]);
	historyLoading = $state(false);
	// true when the dashboard is showing a snapshot loaded from history
	// (suppresses the "you went from X to Y" comparison band)
	isFromHistory = $state(false);
	// captured at startScoring time so the comparison band stays correct during
	// the ~1s race between finishScoring (results visible) and saveToHistory's
	// async reload (which would otherwise leave scanHistory[1] pointing at the
	// scan BEFORE the previous one for that brief window)
	previousScanForComparison = $state<ScanHistoryEntry | null>(null);

	// in-flight scoring controller; aborted when a new scan starts or the user resets
	// not exposed as $state - it's plumbing, not view state
	private abortController: AbortController | null = null;

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

	// returns a signal the caller threads into in-flight requests
	// any prior in-flight scan is aborted before we hand out the new signal
	startScoring(): AbortSignal {
		this.abortController?.abort();
		this.abortController = new AbortController();
		// snapshot the previous scan for the comparison band. preference order:
		// 1. the currently-visible results (a just-finished scan that may not yet
		//    be in scanHistory if its async saveToHistory is still in flight)
		// 2. scanHistory[0] (most recent saved scan)
		// without (1) a rapid re-scan would compare against scanHistory's STALE
		// top entry - i.e. two generations back instead of the immediate previous
		this.previousScanForComparison = this.hasResults
			? {
					id: '',
					timestamp: new Date().toISOString(),
					mode: this.mode,
					averageScore: this.averageScore,
					passingCount: this.passingCount,
					results: this.results
				}
			: (this.scanHistory[0] ?? null);
		this.isScoring = true;
		this.llmFallback = false;
		this.llmRetryAtMs = null;
		this.isFromHistory = false;
		this.error = null;
		return this.abortController.signal;
	}

	cancelScoring() {
		this.abortController?.abort();
		this.abortController = null;
		this.isScoring = false;
	}

	finishScoring(results: ScoreResult[], fileName?: string) {
		this.abortController = null;
		this.results = results;
		this.isScoring = false;
		this.saveToHistory(results, fileName);
	}

	// load scan history. firestore for the authenticated user on hosted
	// builds; localStorage on self-host (no firebase configured). both
	// return up to MAX_HISTORY entries newest-first.
	async loadHistory() {
		if (!browser) return;

		// self-host path: read from localStorage and return synchronously.
		if (!firebaseConfigured) {
			this.historyLoading = true;
			this.scanHistory = readLocalHistory().slice(0, MAX_HISTORY);
			this.historyLoading = false;
			return;
		}

		if (!authStore.isAuthenticated || !authStore.user) return;

		this.historyLoading = true;
		try {
			const { db } = await getFirebase();
			const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
			const scansRef = collection(db, 'users', authStore.user.uid, 'scans');
			const q = query(scansRef, orderBy('timestamp', 'desc'), limit(MAX_HISTORY));
			const snapshot = await getDocs(q);

			this.scanHistory = snapshot.docs.map((d) => ({
				id: d.id,
				...(d.data() as Omit<ScanHistoryEntry, 'id'>)
			}));
		} catch (err) {
			logger.warn('history.load_failed', {
				error: err instanceof Error ? err.message : String(err)
			});
			this.scanHistory = [];
		} finally {
			this.historyLoading = false;
		}
	}

	// save scan results. self-host writes to localStorage, hosted writes to
	// firestore. both maintain the same MAX_HISTORY cap and newest-first
	// ordering so consumers see identical shape across the two backends.
	private async saveToHistory(results: ScoreResult[], fileName?: string) {
		if (!browser || results.length === 0) return;

		// self-host path: localStorage only, no firestore round trip, no
		// scan_logs telemetry (scan_logs is an admin-visibility feature for
		// the hosted instance, not user-facing).
		if (!firebaseConfigured) {
			const entry: ScanHistoryEntry = {
				id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
				timestamp: new Date().toISOString(),
				mode: this.mode,
				averageScore: Math.round(results.reduce((s, r) => s + r.overallScore, 0) / results.length),
				passingCount: results.filter((r) => r.passesFilter).length,
				results,
				...(fileName && { fileName }),
				...(this.jobDescription && { jobDescriptionSnippet: this.jobDescription.slice(0, 200) })
			};
			const next = [entry, ...readLocalHistory()].slice(0, MAX_HISTORY);
			writeLocalHistory(next);
			this.scanHistory = next;
			logger.info('history.local_saved', { id: entry.id });
			return;
		}

		if (!authStore.isAuthenticated || !authStore.user) {
			logger.info('history.skip_save', { reason: 'unauthenticated' });
			return;
		}

		try {
			const uid = authStore.user.uid;
			const { db } = await getFirebase();
			const { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } =
				await import('firebase/firestore');
			const scansRef = collection(db, 'users', uid, 'scans');
			const entry: Omit<ScanHistoryEntry, 'id'> = {
				timestamp: new Date().toISOString(),
				mode: this.mode,
				averageScore: Math.round(results.reduce((s, r) => s + r.overallScore, 0) / results.length),
				passingCount: results.filter((r) => r.passesFilter).length,
				results,
				...(fileName && { fileName }),
				...(this.jobDescription && { jobDescriptionSnippet: this.jobDescription.slice(0, 200) })
			};

			// strip undefined values (Firestore rejects them)
			const sanitized = JSON.parse(JSON.stringify(entry));

			const docRef = await addDoc(scansRef, sanitized);
			logger.info('history.saved', { docId: docRef.id });

			// write to top-level scan_logs for admin visibility
			this.writeScanLog(sanitized, uid);

			// prune old scans beyond the cap (one query, deletes only the overflow)
			const allScansQuery = query(scansRef, orderBy('timestamp', 'desc'));
			const allSnap = await getDocs(allScansQuery);
			if (allSnap.size > MAX_HISTORY) {
				const toDelete = allSnap.docs.slice(MAX_HISTORY);
				for (const d of toDelete) {
					await deleteDoc(doc(db, 'users', uid, 'scans', d.id));
				}
			}

			// mutate local history in place rather than re-reading. firestore round
			// trip avoided: 1 read query per scan saved, which is the difference
			// between staying inside spark free tier (50k reads/day) and blowing it
			// past 50k users. on next cold start loadHistory pulls the canonical set.
			const newEntry: ScanHistoryEntry = { id: docRef.id, ...sanitized };
			this.scanHistory = [newEntry, ...this.scanHistory].slice(0, MAX_HISTORY);
		} catch (err) {
			logger.error('history.save_failed', {
				error: err instanceof Error ? err.message : String(err)
			});
		}
	}

	/** log scan to top-level scan_logs collection for admin browsing.
	 * sampled by PUBLIC_SCAN_LOG_SAMPLE_RATE (default 1.0). hashing on
	 * uid+timestamp keeps the decision deterministic and reproducible.
	 */
	private async writeScanLog(entry: Omit<ScanHistoryEntry, 'id'>, uid: string) {
		if (!shouldSample(`${uid}:${entry.timestamp}`, SCAN_LOG_SAMPLE_RATE)) return;
		try {
			const { db } = await getFirebase();
			const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
			const user = authStore.user;
			const now = new Date();
			// inverted timestamp so newest logs sort first in Firebase Console
			const inverted = (9999999999999 - now.getTime()).toString().padStart(13, '0');
			const docId = `0_${inverted}_${now.toISOString().slice(0, 10)}_${uid.slice(0, 6)}`;
			await setDoc(doc(db, 'scan_logs', docId), {
				uid,
				email: user?.email ?? null,
				displayName: user?.displayName ?? null,
				fileName: entry.fileName ?? null,
				mode: entry.mode,
				averageScore: entry.averageScore,
				passingCount: entry.passingCount,
				createdAt: serverTimestamp()
			});
		} catch {
			// non-critical, don't break the scan flow
		}
	}

	async clearHistory() {
		if (!browser) return;

		// self-host path: clear the localStorage bucket and reset in-memory.
		if (!firebaseConfigured) {
			clearLocalHistory();
			this.scanHistory = [];
			return;
		}

		if (!authStore.isAuthenticated || !authStore.user) return;

		try {
			const { db } = await getFirebase();
			const { collection, getDocs, deleteDoc } = await import('firebase/firestore');
			const scansRef = collection(db, 'users', authStore.user.uid, 'scans');
			const snapshot = await getDocs(scansRef);
			for (const d of snapshot.docs) {
				await deleteDoc(d.ref);
			}
			this.scanHistory = [];
		} catch (err) {
			logger.warn('history.clear_failed', {
				error: err instanceof Error ? err.message : String(err)
			});
		}
	}

	// load a past scan's results into the active dashboard view.
	// must abort any in-flight scan first, otherwise its eventual completion
	// (finishScoring) will stomp the historical snapshot the user just clicked.
	// also clears llmAnalysis since stored history entries do not carry it,
	// so leaving the previous session's analysis visible would render mismatched
	// data alongside historical results.
	loadFromHistory(entry: ScanHistoryEntry) {
		this.abortController?.abort();
		this.abortController = null;
		this.results = entry.results;
		this.llmAnalysis = null;
		this.isScoring = false;
		this.isAnalyzing = false;
		this.llmFallback = false;
		this.llmRetryAtMs = null;
		this.isFromHistory = true;
		this.previousScanForComparison = null;
		this.error = null;
	}

	startAnalyzing() {
		this.isAnalyzing = true;
	}

	finishAnalyzing(
		analysis: LLMAnalysis | null,
		fallback: boolean,
		retryAtMs: number | null = null
	) {
		this.llmAnalysis = analysis;
		this.llmFallback = fallback;
		this.llmRetryAtMs = retryAtMs;
		this.isAnalyzing = false;
	}

	setParsedJD(jd: ParsedJobDescription) {
		this.parsedJD = jd;
	}

	setError(message: string) {
		this.abortController?.abort();
		this.abortController = null;
		this.error = message;
		this.isScoring = false;
		this.isAnalyzing = false;
		this.llmFallback = false;
		this.llmRetryAtMs = null;
	}

	reset() {
		this.abortController?.abort();
		this.abortController = null;
		this.results = [];
		this.llmAnalysis = null;
		this.parsedJD = null;
		this.jobDescription = '';
		this.isScoring = false;
		this.isAnalyzing = false;
		this.llmFallback = false;
		this.llmRetryAtMs = null;
		this.isFromHistory = false;
		this.previousScanForComparison = null;
		this.error = null;
	}
}

export const scoresStore = new ScoresStore();
