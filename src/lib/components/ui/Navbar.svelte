<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import Logo from './Logo.svelte';
	import UserMenu from './UserMenu.svelte';
	import AuthButton from './AuthButton.svelte';
	import { authStore } from '$stores/auth.svelte';

	// controls the mobile menu visibility
	let mobileOpen = $state(false);

	// highlight the active route
	const currentPath = $derived($page.url.pathname);
	const isOnDocs = $derived(currentPath.startsWith('/docs'));
	const isMac = $derived(browser ? navigator.platform.toUpperCase().includes('MAC') : true);

	function handleSearchClick() {
		goto('/docs');
	}

	// cmd+k / ctrl+k shortcut to jump to docs search
	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			// only intercept when NOT already on docs (Starlight handles its own cmd+k)
			if (!isOnDocs) {
				e.preventDefault();
				goto('/docs');
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<nav class="navbar">
	<div class="nav-inner">
		<Logo size="sm" />

		{#if !isOnDocs}
			<button class="search-bar" onclick={handleSearchClick} aria-label="Search documentation">
				<svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.35-4.35" />
				</svg>
				<span class="search-placeholder">Search Docs</span>
				<kbd class="search-kbd">{isMac ? '⌘' : 'Ctrl'}K</kbd>
			</button>
		{/if}

		<div class="nav-links" class:open={mobileOpen}>
			<a href="/" class="nav-link" class:active={currentPath === '/'}>Home</a>
			<a href="/scanner" class="nav-link" class:active={currentPath === '/scanner'}>Scanner</a>
			<a href="/about" class="nav-link" class:active={currentPath === '/about'}>About</a>
			<a href="/docs" class="nav-link" class:active={currentPath.startsWith('/docs')}>Docs</a>
			<a
				href="https://github.com/sunnypatell/ats-screener"
				target="_blank"
				rel="noopener"
				class="nav-link github-link"
			>
				<!-- github icon -->
				<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
					/>
				</svg>
				GitHub
			</a>
			<a href="/scanner" class="nav-cta"> Scan Now </a>
			{#if !authStore.loading}
				{#if authStore.isAuthenticated}
					<UserMenu />
				{:else}
					<AuthButton />
				{/if}
			{/if}
		</div>

		<!-- mobile hamburger -->
		<button
			class="nav-toggle"
			onclick={() => (mobileOpen = !mobileOpen)}
			aria-label="toggle navigation"
		>
			<span class="bar" class:open={mobileOpen}></span>
			<span class="bar" class:open={mobileOpen}></span>
			<span class="bar" class:open={mobileOpen}></span>
		</button>
	</div>
</nav>

<style>
	.navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		padding: 0.875rem 2rem;
		background: rgba(10, 10, 20, 0.85);
		backdrop-filter: blur(24px);
		border-bottom: 1px solid var(--glass-border);
	}

	.nav-inner {
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	/* search bar */
	.search-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.75rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition:
			border-color 0.2s ease,
			background 0.2s ease;
		min-width: 200px;
	}

	.search-bar:hover {
		border-color: rgba(255, 255, 255, 0.15);
		background: rgba(255, 255, 255, 0.06);
	}

	.search-icon {
		color: var(--text-tertiary);
		flex-shrink: 0;
	}

	.search-placeholder {
		font-size: 0.85rem;
		color: var(--text-tertiary);
		flex: 1;
		text-align: left;
	}

	.search-kbd {
		font-size: 0.65rem;
		font-family: inherit;
		color: var(--text-tertiary);
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid var(--glass-border);
		border-radius: 4px;
		padding: 0.15rem 0.4rem;
		line-height: 1;
		white-space: nowrap;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.nav-link {
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		transition: color 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.nav-link:hover,
	.nav-link.active {
		color: var(--text-primary);
	}

	/* CTA button in navbar */
	.nav-cta {
		padding: 0.5rem 1.25rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-bg-primary);
		background: var(--gradient-primary);
		border-radius: var(--radius-full);
		text-decoration: none;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.nav-cta:hover {
		transform: translateY(-1px);
		box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
		color: var(--color-bg-primary);
	}

	.nav-toggle {
		display: none;
		flex-direction: column;
		gap: 4px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
	}

	.bar {
		width: 20px;
		height: 2px;
		background: var(--text-secondary);
		border-radius: 1px;
		transition:
			transform 0.3s ease,
			opacity 0.3s ease;
	}

	.bar.open:nth-child(1) {
		transform: rotate(45deg) translate(4px, 4px);
	}
	.bar.open:nth-child(2) {
		opacity: 0;
	}
	.bar.open:nth-child(3) {
		transform: rotate(-45deg) translate(4px, -4px);
	}

	@media (max-width: 900px) {
		.search-bar {
			min-width: 160px;
		}

		.search-placeholder {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.search-bar {
			display: none;
		}

		.nav-toggle {
			display: flex;
		}

		.nav-links {
			position: absolute;
			top: 100%;
			left: 0;
			right: 0;
			flex-direction: column;
			padding: 1.5rem 2rem;
			background: rgba(10, 10, 20, 0.98);
			backdrop-filter: blur(24px);
			border-bottom: 1px solid var(--glass-border);
			gap: 1rem;
			display: none;
		}

		.nav-links.open {
			display: flex;
		}

		.nav-cta {
			width: fit-content;
		}
	}
</style>
