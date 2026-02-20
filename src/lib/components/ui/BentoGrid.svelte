<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		columns = 3,
		gap = '1.5rem'
	}: {
		children: Snippet;
		columns?: number;
		gap?: string;
	} = $props();
</script>

<div
	class="bento-grid"
	style="
		--bento-columns: {columns};
		--bento-gap: {gap};
	"
>
	{@render children()}
</div>

<style>
	.bento-grid {
		display: grid;
		grid-template-columns: repeat(var(--bento-columns), 1fr);
		gap: var(--bento-gap);
	}

	/* bento items can use grid-column / grid-row for spanning */
	.bento-grid :global(.bento-span-2) {
		grid-column: span 2;
	}

	.bento-grid :global(.bento-span-3) {
		grid-column: span 3;
	}

	.bento-grid :global(.bento-row-span-2) {
		grid-row: span 2;
	}

	@media (max-width: 900px) {
		.bento-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.bento-grid :global(.bento-span-3) {
			grid-column: span 2;
		}
	}

	@media (max-width: 640px) {
		.bento-grid {
			grid-template-columns: 1fr;
		}

		.bento-grid :global(.bento-span-2),
		.bento-grid :global(.bento-span-3) {
			grid-column: span 1;
		}

		.bento-grid :global(.bento-row-span-2) {
			grid-row: span 1;
		}
	}
</style>
