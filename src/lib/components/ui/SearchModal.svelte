<script lang="ts">
	import { browser } from '$app/environment';

	let open = $state(false);
	let query = $state('');
	let results = $state<Array<{ url: string; title: string; excerpt: string }>>([]);
	let loading = $state(false);
	let pagefind: any = null;
	let inputEl: HTMLInputElement | undefined = $state();

	const isMac = $derived(browser ? navigator.platform.toUpperCase().includes('MAC') : true);

	async function loadPagefind() {
		if (pagefind) return;
		try {
			// load pagefind at runtime (not bundled by vite)
			const url = '/docs/pagefind/pagefind.js';
			pagefind = await new Function('return import("' + url + '")')();
			await pagefind.init();
		} catch (err) {
			console.warn('[search] failed to load pagefind:', err);
		}
	}

	async function handleSearch() {
		if (!query.trim() || !pagefind) {
			results = [];
			return;
		}
		loading = true;
		try {
			const search = await pagefind.search(query);
			const loaded = await Promise.all(search.results.slice(0, 8).map((r: any) => r.data()));
			results = loaded.map((r: any) => ({
				url: r.url,
				title: r.meta?.title ?? r.url,
				excerpt: r.excerpt ?? ''
			}));
		} catch {
			results = [];
		} finally {
			loading = false;
		}
	}

	export function openSearch() {
		open = true;
		loadPagefind();
		// focus input after dialog opens
		requestAnimationFrame(() => inputEl?.focus());
	}

	function closeSearch() {
		open = false;
		query = '';
		results = [];
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeSearch();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) closeSearch();
	}

	// debounce search
	let searchTimeout: ReturnType<typeof setTimeout>;
	function onInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(handleSearch, 200);
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="search-overlay" onclick={handleBackdropClick} onkeydown={handleKeydown}>
		<div class="search-dialog" role="dialog" aria-label="Search documentation">
			<div class="search-input-wrapper">
				<svg
					class="search-input-icon"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.35-4.35" />
				</svg>
				<input
					bind:this={inputEl}
					bind:value={query}
					oninput={onInput}
					type="text"
					placeholder="Search documentation..."
					class="search-input"
					autocomplete="off"
					spellcheck="false"
				/>
				<kbd class="esc-hint">Esc</kbd>
			</div>

			{#if query.trim()}
				<div class="search-results">
					{#if loading}
						<div class="search-loading">Searching...</div>
					{:else if results.length === 0}
						<div class="search-empty">No results for "{query}"</div>
					{:else}
						{#each results as result}
							<a href={result.url} class="search-result" onclick={closeSearch}>
								<span class="result-title">{result.title}</span>
								<!-- eslint-disable-next-line svelte/no-at-html-tags -- pagefind excerpts are pre-sanitized -->
								<span class="result-excerpt">{@html result.excerpt}</span>
							</a>
						{/each}
					{/if}
				</div>
			{:else}
				<div class="search-results">
					<div class="search-hint">Type to search across all documentation pages</div>
				</div>
			{/if}

			<div class="search-footer">
				<span class="footer-hint">
					<kbd>{isMac ? '⌘' : 'Ctrl'}</kbd><kbd>K</kbd> to toggle
				</span>
				<span class="footer-hint">
					<kbd>Esc</kbd> to close
				</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.search-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: min(20vh, 120px);
	}

	.search-dialog {
		width: 100%;
		max-width: 580px;
		margin: 0 1rem;
		background: rgba(18, 18, 30, 0.98);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(24px);
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
		overflow: hidden;
	}

	.search-input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--glass-border);
	}

	.search-input-icon {
		color: var(--text-tertiary);
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		background: none;
		border: none;
		outline: none;
		font-size: 1rem;
		color: var(--text-primary);
		font-family: inherit;
	}

	.search-input::placeholder {
		color: var(--text-tertiary);
		opacity: 0.6;
	}

	.esc-hint {
		font-size: 0.6rem;
		color: var(--text-tertiary);
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid var(--glass-border);
		border-radius: 4px;
		padding: 0.15rem 0.4rem;
		font-family: inherit;
		line-height: 1;
	}

	.search-results {
		max-height: 360px;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.search-loading,
	.search-empty,
	.search-hint {
		padding: 1.5rem 1rem;
		text-align: center;
		font-size: 0.85rem;
		color: var(--text-tertiary);
	}

	.search-result {
		display: block;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: background 0.15s ease;
	}

	.search-result:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.result-title {
		display: block;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.result-excerpt {
		display: block;
		font-size: 0.8rem;
		color: var(--text-secondary);
		line-height: 1.5;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	/* highlight matching terms from pagefind */
	.result-excerpt :global(mark) {
		background: rgba(6, 182, 212, 0.2);
		color: var(--accent-cyan);
		border-radius: 2px;
		padding: 0 2px;
	}

	.search-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 1rem;
		padding: 0.6rem 1rem;
		border-top: 1px solid var(--glass-border);
	}

	.footer-hint {
		font-size: 0.7rem;
		color: var(--text-tertiary);
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.footer-hint kbd {
		font-size: 0.6rem;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid var(--glass-border);
		border-radius: 3px;
		padding: 0.1rem 0.35rem;
		font-family: inherit;
		line-height: 1;
	}

	@media (max-width: 640px) {
		.search-overlay {
			padding-top: 1rem;
		}

		.search-dialog {
			max-width: none;
		}
	}
</style>
