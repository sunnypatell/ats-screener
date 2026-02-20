<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<a href="/login" class="auth-btn {className}">Sign In</a>

<style>
	.auth-btn {
		display: inline-flex;
		align-items: center;
		padding: 0.45rem 1.1rem;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-secondary);
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		text-decoration: none;
		backdrop-filter: blur(12px);
		transition:
			border-color 0.2s ease,
			color 0.2s ease,
			background 0.2s ease;
	}

	.auth-btn:hover {
		border-color: rgba(6, 182, 212, 0.3);
		color: var(--accent-cyan);
		background: rgba(6, 182, 212, 0.05);
	}
</style>
