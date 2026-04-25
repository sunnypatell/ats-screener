// shared a11y helpers used by both svelte components and tests.

// returns true when the user has expressed a preference for reduced motion
// at the OS level. ssr-safe: returns false when matchMedia is unavailable
// (during prerender or in non-browser environments).
//
// callers should gate any js-driven motion (scrollIntoView smooth, web
// animation api playback, libraries that animate via raf) on this. css
// transitions/animations are already neutralized by the global media
// query in $lib/styles/animations.css.
export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
		return false;
	}
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// returns the right ScrollBehavior for the current user. callers can use
// directly: element.scrollIntoView({ behavior: scrollBehavior(), ... })
export function scrollBehavior(): ScrollBehavior {
	return prefersReducedMotion() ? 'auto' : 'smooth';
}
