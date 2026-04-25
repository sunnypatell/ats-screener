// soft anonymous-trial gate. lets a first-time visitor run one scan
// without signing in, then nudges them toward an account for repeat
// scans, history, and scan comparison.
//
// stored client-side in localStorage. the cap is a UX nudge, not a
// security boundary. opening incognito or clearing storage resets it.
// that is fine: the goal is conversion, not paywall enforcement.
//
// no firestore writes, no server-side state, no PII collected. anonymous
// scans never call saveToHistory (the existing auth guard bails).

import { browser } from '$app/environment';

const KEY = 'ats_trial_used';

class AnonTrial {
	// whether the visitor has already used their one anonymous scan.
	// reactive so the scanner UI can react to mark-used in the same tick.
	used = $state(false);

	constructor() {
		if (browser) {
			try {
				this.used = localStorage.getItem(KEY) === '1';
			} catch {
				// localStorage unavailable (incognito quirks, sandboxed iframe).
				// fall back to "trial available" so the user is not blocked.
				this.used = false;
			}
		}
	}

	markUsed() {
		this.used = true;
		if (!browser) return;
		try {
			localStorage.setItem(KEY, '1');
		} catch {
			// ignore; a refresh will reset to "available" but that is the
			// same fail-open behaviour as in incognito, which is acceptable
			// for a soft trial gate.
		}
	}

	reset() {
		this.used = false;
		if (!browser) return;
		try {
			localStorage.removeItem(KEY);
		} catch {
			// ignore
		}
	}
}

export const anonTrial = new AnonTrial();
