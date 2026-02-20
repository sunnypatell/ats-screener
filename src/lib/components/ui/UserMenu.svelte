<script lang="ts">
	import { authStore } from '$stores/auth.svelte';
	import { goto } from '$app/navigation';

	let open = $state(false);

	function handleSignOut() {
		authStore.signOut();
		open = false;
		goto('/');
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.user-menu')) {
			open = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="user-menu">
	<button class="avatar-btn" onclick={() => (open = !open)} aria-label="User menu">
		{#if authStore.photoURL}
			<img src={authStore.photoURL} alt={authStore.displayName} class="avatar-img" />
		{:else}
			<span class="avatar-initials">{authStore.initials}</span>
		{/if}
	</button>

	{#if open}
		<div class="dropdown">
			<div class="dropdown-header">
				<span class="dropdown-name">{authStore.displayName}</span>
				<span class="dropdown-email">{authStore.email}</span>
			</div>
			<div class="dropdown-divider"></div>
			<a href="/scanner" class="dropdown-item" onclick={() => (open = false)}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
					<polyline points="14,2 14,8 20,8" />
				</svg>
				Scanner
			</a>
			<button class="dropdown-item" onclick={handleSignOut}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
					<polyline points="16,17 21,12 16,7" />
					<line x1="21" y1="12" x2="9" y2="12" />
				</svg>
				Sign Out
			</button>
		</div>
	{/if}
</div>

<style>
	.user-menu {
		position: relative;
	}

	.avatar-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 2px solid var(--glass-border);
		background: var(--glass-bg);
		cursor: pointer;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease;
		padding: 0;
	}

	.avatar-btn:hover {
		border-color: rgba(6, 182, 212, 0.4);
		box-shadow: 0 0 12px rgba(6, 182, 212, 0.15);
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
	}

	.avatar-initials {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--accent-cyan);
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		min-width: 220px;
		background: rgba(15, 15, 30, 0.95);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		backdrop-filter: blur(20px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		z-index: 100;
		overflow: hidden;
		animation: dropdown-in 0.15s ease;
	}

	@keyframes dropdown-in {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
	}

	.dropdown-header {
		padding: 0.85rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.dropdown-name {
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.dropdown-email {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	.dropdown-divider {
		height: 1px;
		background: var(--glass-border);
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		width: 100%;
		padding: 0.7rem 1rem;
		font-size: 0.85rem;
		color: var(--text-secondary);
		background: none;
		border: none;
		text-decoration: none;
		cursor: pointer;
		transition:
			background 0.15s ease,
			color 0.15s ease;
		font-family: inherit;
		text-align: left;
	}

	.dropdown-item:hover {
		background: rgba(6, 182, 212, 0.06);
		color: var(--text-primary);
	}
</style>
