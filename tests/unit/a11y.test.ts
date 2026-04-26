import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefersReducedMotion, scrollBehavior } from '../../src/lib/a11y';

// jsdom does not implement window.matchMedia by default. we patch it per-test
// and restore on teardown so each case sees a fresh world.

afterEach(() => {
	// remove whatever the per-test setup added so other test files do not see leakage.
	// matchMedia is non-optional on the lib.dom Window type, so cast to a record
	// before deleting rather than fighting the type.
	delete (window as unknown as Record<string, unknown>).matchMedia;
	vi.restoreAllMocks();
});

function mockMatchMedia(matches: boolean): void {
	(window as Window & { matchMedia: (q: string) => MediaQueryList }).matchMedia = vi
		.fn()
		.mockImplementation((query: string) => ({
			matches,
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn()
		})) as unknown as (q: string) => MediaQueryList;
}

describe('prefersReducedMotion', () => {
	it('returns false when matchMedia is undefined (ssr-safe fallback)', () => {
		expect(prefersReducedMotion()).toBe(false);
	});

	it('returns false when matchMedia reports no preference', () => {
		mockMatchMedia(false);
		expect(prefersReducedMotion()).toBe(false);
	});

	it('returns true when matchMedia reports the user prefers reduced motion', () => {
		mockMatchMedia(true);
		expect(prefersReducedMotion()).toBe(true);
	});
});

describe('scrollBehavior', () => {
	it('returns "smooth" when matchMedia is unavailable', () => {
		expect(scrollBehavior()).toBe('smooth');
	});

	it('returns "smooth" when no reduced-motion preference is set', () => {
		mockMatchMedia(false);
		expect(scrollBehavior()).toBe('smooth');
	});

	it('returns "auto" when the user prefers reduced motion', () => {
		mockMatchMedia(true);
		expect(scrollBehavior()).toBe('auto');
	});
});
