// minimal core-web-vitals collector.
// observes LCP and CLS via PerformanceObserver, samples at a low rate
// (default 5%), posts to /api/vitals once on first visibility-hidden
// (the canonical "this session is ending" signal per the page lifecycle
// model). uses navigator.sendBeacon when available so the request
// completes even after the page is unloaded; falls back to fetch with
// keepalive: true.
//
// no third-party dep, no INP for now (more nuanced and adds bytes for
// little marginal value at this scale; revisit once LCP and CLS are
// trending). graceful no-op on browsers without PerformanceObserver.

import { browser } from '$app/environment';
import { env as publicEnv } from '$env/dynamic/public';
import { parseSampleRate, shouldSample } from './sampling';

const ENDPOINT = '/api/vitals';
const SAMPLE_RATE = parseSampleRate(publicEnv.PUBLIC_VITALS_SAMPLE_RATE) || 0.05;

// LayoutShift entries carry value + hadRecentInput; the standard typings
// (PerformanceEntry) do not include either, so we narrow with a local type.
interface LayoutShiftEntry extends PerformanceEntry {
	value: number;
	hadRecentInput: boolean;
}

interface VitalsState {
	lcp?: number;
	cls?: number;
}

let installed = false;
let flushed = false;
const state: VitalsState = {};

function flush(): void {
	if (flushed) return;
	if (state.lcp === undefined && state.cls === undefined) return;
	flushed = true;

	// content-addressed seed bucketed at 100ms granularity for LCP so
	// repeat visits with the same vitals from the same page do not all
	// post (deterministic sampling per (url, lcp-bucket)).
	const seed = `${window.location.pathname}|${Math.floor((state.lcp ?? 0) / 100)}`;
	if (!shouldSample(seed, SAMPLE_RATE)) return;

	const payload = {
		lcp: state.lcp,
		cls: state.cls,
		url: window.location.href,
		ua: window.navigator.userAgent,
		at: new Date().toISOString()
	};

	try {
		const json = JSON.stringify(payload);
		if (typeof navigator.sendBeacon === 'function') {
			const blob = new Blob([json], { type: 'application/json' });
			if (navigator.sendBeacon(ENDPOINT, blob)) return;
		}
		// fallback: keepalive lets the request complete during unload
		void fetch(ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: json,
			keepalive: true
		}).catch(() => {
			// drop on the floor. observability must never raise.
		});
	} catch {
		// drop on the floor.
	}
}

export function installWebVitals(): void {
	if (!browser || installed) return;
	installed = true;

	if (typeof PerformanceObserver === 'undefined') return;

	// LCP: take the latest entry; the "final" value per the spec is the
	// last one fired before the page becomes hidden or the user interacts.
	try {
		const lcp = new PerformanceObserver((list) => {
			const entries = list.getEntries();
			const latest = entries[entries.length - 1];
			if (latest) state.lcp = latest.startTime;
		});
		lcp.observe({ type: 'largest-contentful-paint', buffered: true });
	} catch {
		// older browser, no LCP support
	}

	// CLS: cumulative sum of layout-shift values where !hadRecentInput.
	try {
		let cls = 0;
		const layout = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				const e = entry as LayoutShiftEntry;
				if (!e.hadRecentInput && Number.isFinite(e.value)) {
					cls += e.value;
				}
			}
			state.cls = cls;
		});
		layout.observe({ type: 'layout-shift', buffered: true });
	} catch {
		// older browser, no layout-shift support
	}

	// flush on first transition to hidden. pagehide is the more reliable
	// fallback for some browsers (esp. Safari iOS bfcache), so listen for
	// both. flushed-once guard means whichever fires first wins.
	document.addEventListener(
		'visibilitychange',
		() => {
			if (document.visibilityState === 'hidden') flush();
		},
		{ once: false }
	);
	window.addEventListener('pagehide', flush, { once: false });
}
