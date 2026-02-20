<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		onclick,
		disabled = false,
		href,
		variant = 'primary',
		size = 'md'
	}: {
		children: Snippet;
		onclick?: (e: MouseEvent) => void;
		disabled?: boolean;
		href?: string;
		variant?: 'primary' | 'secondary';
		size?: 'sm' | 'md' | 'lg';
	} = $props();
</script>

{#if href}
	<a class="shimmer-btn {variant} {size}" {href}>
		<span class="shimmer-bg" aria-hidden="true"></span>
		<span class="shimmer-highlight" aria-hidden="true"></span>
		<span class="shimmer-content">
			{@render children()}
		</span>
	</a>
{:else}
	<button class="shimmer-btn {variant} {size}" {onclick} {disabled}>
		<span class="shimmer-bg" aria-hidden="true"></span>
		<span class="shimmer-highlight" aria-hidden="true"></span>
		<span class="shimmer-content">
			{@render children()}
		</span>
	</button>
{/if}

<style>
	.shimmer-btn {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		overflow: hidden;
		border: none;
		cursor: pointer;
		font-weight: 600;
		text-decoration: none;
		transition:
			transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
			box-shadow 0.25s ease;
	}

	/* sizes */
	.shimmer-btn.sm {
		padding: 0.5rem 1.25rem;
		font-size: 0.82rem;
		border-radius: var(--radius-md);
	}

	.shimmer-btn.md {
		padding: 0.75rem 1.75rem;
		font-size: 0.95rem;
		border-radius: var(--radius-lg);
	}

	.shimmer-btn.lg {
		padding: 1rem 2.5rem;
		font-size: 1.05rem;
		border-radius: var(--radius-lg);
	}

	/* primary variant */
	.shimmer-btn.primary {
		color: var(--color-bg-primary, #0a0a14);
		background: var(--gradient-primary);
	}

	.shimmer-btn.primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow:
			0 0 30px rgba(6, 182, 212, 0.35),
			0 0 60px rgba(59, 130, 246, 0.15);
	}

	/* secondary variant */
	.shimmer-btn.secondary {
		color: var(--text-primary);
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		backdrop-filter: blur(var(--glass-blur));
	}

	.shimmer-btn.secondary:hover:not(:disabled) {
		transform: translateY(-1px);
		border-color: rgba(6, 182, 212, 0.3);
		box-shadow: 0 0 20px rgba(6, 182, 212, 0.1);
	}

	.shimmer-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* shimmer effect */
	.shimmer-bg {
		position: absolute;
		inset: 0;
		background: inherit;
	}

	.shimmer-highlight {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			110deg,
			transparent 25%,
			rgba(255, 255, 255, 0.15) 50%,
			transparent 75%
		);
		background-size: 200% 100%;
		animation: shimmer 2.5s ease-in-out infinite;
	}

	.shimmer-btn.secondary .shimmer-highlight {
		background: linear-gradient(
			110deg,
			transparent 25%,
			rgba(6, 182, 212, 0.06) 50%,
			transparent 75%
		);
		background-size: 200% 100%;
	}

	.shimmer-content {
		position: relative;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
