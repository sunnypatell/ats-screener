<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$components/seo/SeoHead.svelte';
</script>

<SeoHead
	title="Something went wrong | ATS Screener"
	description="An unexpected error occurred. Please refresh or return to the homepage."
	noIndex
/>

<main class="error-page">
	<div class="error-bg">
		<div class="bg-orb orb-1"></div>
		<div class="bg-orb orb-2"></div>
	</div>

	<div class="error-card">
		<div class="error-status">{page.status}</div>
		<h1 class="error-title">
			{#if page.status === 404}
				Page not found
			{:else if page.status === 429}
				Too many requests
			{:else if page.status >= 500}
				Something went wrong
			{:else}
				Unexpected error
			{/if}
		</h1>
		<p class="error-message">
			{#if page.error?.message && page.status !== 500}
				{page.error.message}
			{:else if page.status === 404}
				The page you're looking for doesn't exist or has moved.
			{:else if page.status === 429}
				You've hit the rate limit. Please wait a minute and try again.
			{:else}
				An unexpected error occurred. Refreshing usually helps.
			{/if}
		</p>
		<div class="error-actions">
			<a href="/" class="btn-primary">Back to home</a>
			<a href="/scanner" class="btn-secondary">Open scanner</a>
		</div>
	</div>
</main>

<style>
	.error-page {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100dvh;
		padding: 6rem 1.5rem 4rem;
		overflow: hidden;
	}

	.error-bg {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.bg-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(120px);
	}

	.orb-1 {
		width: 480px;
		height: 480px;
		background: rgba(239, 68, 68, 0.06);
		top: -10%;
		right: -15%;
	}

	.orb-2 {
		width: 380px;
		height: 380px;
		background: rgba(139, 92, 246, 0.05);
		bottom: -10%;
		left: -15%;
	}

	.error-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: 520px;
		padding: 3rem 2.5rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(20px);
	}

	.error-status {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		color: var(--text-tertiary);
		margin-bottom: 1.25rem;
	}

	.error-title {
		font-size: clamp(1.6rem, 4vw, 2.25rem);
		font-weight: 800;
		letter-spacing: -0.02em;
		color: var(--text-primary);
		margin-bottom: 0.85rem;
		line-height: 1.2;
	}

	.error-message {
		font-size: 0.95rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin-bottom: 1.85rem;
		max-width: 420px;
	}

	.error-actions {
		display: flex;
		gap: 0.85rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.btn-primary,
	.btn-secondary {
		display: inline-flex;
		align-items: center;
		padding: 0.65rem 1.35rem;
		font-size: 0.9rem;
		font-weight: 600;
		border-radius: var(--radius-full);
		text-decoration: none;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease;
	}

	.btn-primary {
		color: var(--color-bg-primary);
		background: var(--gradient-primary);
	}

	.btn-primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
	}

	.btn-secondary {
		color: var(--text-secondary);
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
	}

	.btn-secondary:hover {
		border-color: var(--accent-cyan);
		color: var(--text-primary);
	}
</style>
