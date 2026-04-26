import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// $app/environment.browser is false by default in vitest (the suite runs
// as a server-side bundle). force it to true so the browser code path
// runs and we can assert the structured-record argument shape.
vi.mock('$app/environment', () => ({ browser: true }));

import { log, logger } from '../../src/lib/log';

// $app/environment.browser is true in jsdom (the test env). production-host
// behaviour is exercised by stubbing window.location to a fake object since
// jsdom marks individual location properties non-configurable, but the
// location object itself is replaceable on window.

const originalLocation = window.location;

beforeEach(() => {
	// vi.spyOn is the cleanest way to capture console output without
	// polluting test runner stdout. each spy is restored in afterEach.
	vi.spyOn(console, 'log').mockImplementation(() => {});
	vi.spyOn(console, 'info').mockImplementation(() => {});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	vi.spyOn(console, 'error').mockImplementation(() => {});
	vi.spyOn(console, 'debug').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
	Object.defineProperty(window, 'location', {
		configurable: true,
		writable: true,
		value: originalLocation
	});
});

function setHostname(host: string): void {
	Object.defineProperty(window, 'location', {
		configurable: true,
		writable: true,
		value: { ...originalLocation, hostname: host }
	});
}

describe('log: routing per level', () => {
	it('warn calls console.warn', () => {
		log('warn', 'test');
		expect(console.warn).toHaveBeenCalled();
		expect(console.error).not.toHaveBeenCalled();
	});

	it('error calls console.error', () => {
		log('error', 'test');
		expect(console.error).toHaveBeenCalled();
		expect(console.warn).not.toHaveBeenCalled();
	});

	it('info on localhost calls console.info (or console.log fallback)', () => {
		setHostname('localhost');
		log('info', 'test');
		expect(
			(console.info as ReturnType<typeof vi.fn>).mock.calls.length +
				(console.log as ReturnType<typeof vi.fn>).mock.calls.length
		).toBeGreaterThan(0);
	});
});

describe('log: production-browser silencing for info / debug', () => {
	it('drops info on a non-local host', () => {
		setHostname('ats-screener.vercel.app');
		log('info', 'should not log');
		expect(console.info).not.toHaveBeenCalled();
		expect(console.log).not.toHaveBeenCalled();
	});

	it('drops debug on a non-local host', () => {
		setHostname('ats-screener.vercel.app');
		log('debug', 'should not log');
		expect(console.debug).not.toHaveBeenCalled();
		expect(console.log).not.toHaveBeenCalled();
	});

	it('still emits warn on a non-local host', () => {
		setHostname('ats-screener.vercel.app');
		log('warn', 'visible');
		expect(console.warn).toHaveBeenCalled();
	});

	it('still emits error on a non-local host', () => {
		setHostname('ats-screener.vercel.app');
		log('error', 'visible');
		expect(console.error).toHaveBeenCalled();
	});

	it('does NOT silence info on localhost', () => {
		setHostname('localhost');
		log('info', 'visible');
		const infoOrLog =
			(console.info as ReturnType<typeof vi.fn>).mock.calls.length +
			(console.log as ReturnType<typeof vi.fn>).mock.calls.length;
		expect(infoOrLog).toBeGreaterThan(0);
	});

	it('does NOT silence info on 127.0.0.1', () => {
		setHostname('127.0.0.1');
		log('info', 'visible');
		const infoOrLog =
			(console.info as ReturnType<typeof vi.fn>).mock.calls.length +
			(console.log as ReturnType<typeof vi.fn>).mock.calls.length;
		expect(infoOrLog).toBeGreaterThan(0);
	});
});

describe('log: payload shape', () => {
	it('includes level, event, ts, and any user fields in browser mode', () => {
		setHostname('localhost');
		log('warn', 'test-event', { user: 'alice', count: 3 });
		const call = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0];
		expect(call).toBeDefined();
		// browser mode: second argument is the structured record
		const record = call[1] as Record<string, unknown>;
		expect(record.level).toBe('warn');
		expect(record.event).toBe('test-event');
		expect(typeof record.ts).toBe('string');
		expect(record.user).toBe('alice');
		expect(record.count).toBe(3);
	});
});

describe('logger shortcuts', () => {
	it('logger.warn is equivalent to log("warn", ...)', () => {
		logger.warn('shortcut');
		expect(console.warn).toHaveBeenCalled();
	});

	it('logger.error is equivalent to log("error", ...)', () => {
		logger.error('shortcut');
		expect(console.error).toHaveBeenCalled();
	});
});
