<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$stores/auth.svelte';
	import { scoresStore, type ScanHistoryEntry } from '$stores/scores.svelte';
	import ScoreDashboard from '$components/scoring/ScoreDashboard.svelte';

	let selectedEntry = $state<ScanHistoryEntry | null>(null);

	// redirect if not logged in
	$effect(() => {
		if (!authStore.loading && !authStore.isAuthenticated) {
			goto('/login');
		}
	});

	// load history on mount
	$effect(() => {
		if (authStore.isAuthenticated) {
			scoresStore.loadHistory();
		}
	});

	const history = $derived(scoresStore.history);

	function formatDate(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function scoreColor(score: number): string {
		if (score >= 80) return '#22c55e';
		if (score >= 60) return '#eab308';
		return '#ef4444';
	}

	function viewEntry(entry: ScanHistoryEntry) {
		selectedEntry = entry;
		scoresStore.loadFromHistory(entry);
	}

	function clearSelection() {
		selectedEntry = null;
		scoresStore.reset();
	}

	async function handleClear() {
		await scoresStore.clearHistory();
		selectedEntry = null;
	}
</script>

<svelte:head>
	<title>Scan History | ATS Screener</title>
</svelte:head>

<main class="history-page">
	<div class="history-bg">
		<div class="bg-orb orb-1"></div>
		<div class="bg-orb orb-2"></div>
	</div>

	{#if authStore.loading}
		<div class="loading-state">
			<div class="spinner"></div>
		</div>
	{:else if !authStore.isAuthenticated}
		<!-- redirect happens via $effect -->
	{:else if selectedEntry}
		<!-- viewing a specific scan's results -->
		<div class="content">
			<button class="back-btn" onclick={clearSelection}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="15,18 9,12 15,6" />
				</svg>
				Back to History
			</button>

			<div class="viewing-header">
				<div class="viewing-meta">
					{#if selectedEntry.fileName}
						<span class="viewing-filename">{selectedEntry.fileName}</span>
					{/if}
					<span class="viewing-date">{formatDate(selectedEntry.timestamp)}</span>
					<span class="viewing-mode">{selectedEntry.mode} scan</span>
				</div>
			</div>

			<ScoreDashboard />
		</div>
	{:else}
		<!-- history list -->
		<div class="content">
			<div class="page-header">
				<h1 class="page-title">Scan History</h1>
				<p class="page-subtitle">View results from your previous resume scans.</p>
			</div>

			{#if scoresStore.historyLoading}
				<div class="loading-state">
					<div class="spinner"></div>
					<p>Loading history...</p>
				</div>
			{:else if history.length === 0}
				<div class="empty-state">
					<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<circle cx="12" cy="12" r="10" />
						<polyline points="12,6 12,12 16,14" />
					</svg>
					<h2>No scans yet</h2>
					<p>Your scan results will appear here after you scan a resume.</p>
					<a href="/scanner" class="cta-btn">Scan a Resume</a>
				</div>
			{:else}
				<div class="history-grid">
					{#each history as entry (entry.id)}
						<button class="history-card" onclick={() => viewEntry(entry)}>
							<div class="card-score" style="color: {scoreColor(entry.averageScore)}">
								{entry.averageScore}
							</div>
							<div class="card-body">
								{#if entry.fileName}
									<span class="card-filename">{entry.fileName}</span>
								{/if}
								<div class="card-meta">
									<span class="card-mode">{entry.mode}</span>
									<span class="card-sep">&middot;</span>
									<span>{entry.passingCount}/6 passing</span>
								</div>
								<span class="card-date">{formatDate(entry.timestamp)}</span>
							</div>
							<svg class="card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="9,18 15,12 9,6" />
							</svg>
						</button>
					{/each}
				</div>

				<div class="history-footer">
					<button class="clear-all-btn" onclick={handleClear}>
						Clear All History
					</button>
				</div>
			{/if}
		</div>
	{/if}
</main>

<style>
	.history-page {
		min-height: 100vh;
		padding: 6rem 2rem 3rem;
		position: relative;
	}

	.history-bg {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: -1;
	}

	.bg-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(120px);
		opacity: 0.15;
	}

	.orb-1 {
		width: 500px;
		height: 500px;
		background: var(--accent-cyan);
		top: -100px;
		right: -100px;
	}

	.orb-2 {
		width: 400px;
		height: 400px;
		background: var(--accent-blue);
		bottom: -50px;
		left: -50px;
	}

	.content {
		max-width: 900px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-title {
		font-size: 1.8rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.03em;
		margin-bottom: 0.4rem;
	}

	.page-subtitle {
		font-size: 0.9rem;
		color: var(--text-tertiary);
	}

	/* loading / empty states */
	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 4rem 2rem;
		text-align: center;
		color: var(--text-tertiary);
	}

	.empty-state svg {
		opacity: 0.3;
	}

	.empty-state h2 {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--text-secondary);
		margin: 0;
	}

	.empty-state p {
		font-size: 0.88rem;
		max-width: 320px;
	}

	.cta-btn {
		padding: 0.6rem 1.5rem;
		background: var(--gradient-primary);
		color: var(--color-bg-primary);
		border-radius: var(--radius-full);
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 600;
		margin-top: 0.5rem;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid var(--glass-border);
		border-top-color: var(--accent-cyan);
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* history card grid */
	.history-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.history-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		backdrop-filter: blur(var(--glass-blur));
		cursor: pointer;
		transition: border-color 0.2s ease, background 0.2s ease;
		width: 100%;
		text-align: left;
		font-family: inherit;
	}

	.history-card:hover {
		border-color: rgba(6, 182, 212, 0.25);
		background: rgba(6, 182, 212, 0.03);
	}

	.card-score {
		font-size: 1.5rem;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		min-width: 3rem;
		text-align: center;
	}

	.card-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
	}

	.card-filename {
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-meta {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.78rem;
		color: var(--text-tertiary);
	}

	.card-mode {
		text-transform: capitalize;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.card-sep {
		opacity: 0.4;
	}

	.card-date {
		font-size: 0.72rem;
		color: var(--text-tertiary);
	}

	.card-arrow {
		color: var(--text-tertiary);
		opacity: 0;
		transition: opacity 0.15s ease;
		flex-shrink: 0;
	}

	.history-card:hover .card-arrow {
		opacity: 0.6;
	}

	/* back button */
	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 0;
		background: none;
		border: none;
		color: var(--accent-cyan);
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		margin-bottom: 1rem;
		font-family: inherit;
	}

	.back-btn:hover {
		text-decoration: underline;
	}

	.viewing-header {
		margin-bottom: 1.5rem;
	}

	.viewing-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.viewing-filename {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.viewing-date,
	.viewing-mode {
		font-size: 0.82rem;
		color: var(--text-tertiary);
	}

	.viewing-mode {
		text-transform: capitalize;
		padding: 0.15rem 0.5rem;
		background: rgba(6, 182, 212, 0.08);
		border-radius: var(--radius-sm);
		color: var(--accent-cyan);
		font-size: 0.72rem;
		font-weight: 600;
	}

	.history-footer {
		display: flex;
		justify-content: center;
		margin-top: 1.5rem;
	}

	.clear-all-btn {
		padding: 0.5rem 1.25rem;
		background: none;
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: var(--radius-md);
		color: var(--text-tertiary);
		font-size: 0.78rem;
		font-weight: 500;
		cursor: pointer;
		transition: color 0.2s ease, border-color 0.2s ease;
		font-family: inherit;
	}

	.clear-all-btn:hover {
		color: #ef4444;
		border-color: rgba(239, 68, 68, 0.4);
	}

	@media (max-width: 640px) {
		.history-page {
			padding: 5rem 1rem 2rem;
		}

		.card-score {
			font-size: 1.2rem;
		}
	}
</style>
