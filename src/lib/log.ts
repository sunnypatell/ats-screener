// minimal structured logger. emits json-shaped records on the server (where
// vercel log aggregation parses them into queryable fields) and stays close
// to console.log on the browser (where devtools format objects nicely).
//
// design choices:
// - no transport. just console; vercel reads stdout/stderr already.
// - no log level filter at write time. server logs are sampled or dropped at
//   ingest. local dev wants to see everything.
// - browser info / debug calls are NO-OPS in production (when running on a
//   non-localhost host). reduces console noise for end users without losing
//   warnings or errors, which always emit.
// - server emits one json object per line (newline-delimited json) so vercel's
//   log parser can extract fields like `level`, `event`, `error.message`, etc.
// - api: log(level, event, fields?) plus log.info/warn/error/debug shortcuts
//   that close over the level, identical signature otherwise.

import { browser } from '$app/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogFields {
	[key: string]: unknown;
}

// when true, browser-side info/debug calls are silenced. localhost dev keeps
// logging at full volume. production sites get a quieter console.
function isProductionBrowser(): boolean {
	if (!browser) return false;
	if (typeof window === 'undefined') return false;
	const host = window.location.hostname;
	if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return false;
	return true;
}

// pick the underlying console method. vercel surfaces stderr (warn/error)
// and stdout (log/info) separately, which matters for log alerting.
function consoleFor(level: LogLevel): (message?: unknown, ...rest: unknown[]) => void {
	switch (level) {
		case 'error':
			return console.error.bind(console);
		case 'warn':
			return console.warn.bind(console);
		case 'info':
			return console.info ? console.info.bind(console) : console.log.bind(console);
		case 'debug':
			return console.debug ? console.debug.bind(console) : console.log.bind(console);
	}
}

export function log(level: LogLevel, event: string, fields: LogFields = {}): void {
	// production browsers drop info / debug. warnings and errors always emit.
	if ((level === 'info' || level === 'debug') && isProductionBrowser()) return;

	const record = {
		level,
		event,
		ts: new Date().toISOString(),
		...fields
	};

	if (browser) {
		// browser: pass the structured object so devtools renders it expandably
		consoleFor(level)(`[${event}]`, record);
		return;
	}

	// server: newline-delimited json. one record per line is what vercel
	// parses into log fields. plain string output also stays grep-friendly.
	consoleFor(level)(JSON.stringify(record));
}

export const logger = {
	debug: (event: string, fields?: LogFields) => log('debug', event, fields),
	info: (event: string, fields?: LogFields) => log('info', event, fields),
	warn: (event: string, fields?: LogFields) => log('warn', event, fields),
	error: (event: string, fields?: LogFields) => log('error', event, fields)
};
