<script lang="ts">
	let {
		borderRadius = '16px',
		duration = 4000,
		class: className = ''
	}: {
		borderRadius?: string;
		duration?: number;
		class?: string;
	} = $props();
</script>

<div
	class="moving-border-wrapper {className}"
	style="--border-radius: {borderRadius}; --duration: {duration}ms;"
>
	<div class="border-content">
		<slot />
	</div>
</div>

<style>
	.moving-border-wrapper {
		position: relative;
		border-radius: var(--border-radius);
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		overflow: hidden;
		transition: border-color 0.3s ease;
	}

	.moving-border-wrapper::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		padding: 1px;
		background: conic-gradient(
			from 0deg,
			transparent 60%,
			rgba(6, 182, 212, 0.4) 80%,
			rgba(59, 130, 246, 0.3) 90%,
			transparent 100%
		);
		mask:
			linear-gradient(#fff 0 0) content-box,
			linear-gradient(#fff 0 0);
		mask-composite: exclude;
		-webkit-mask-composite: xor;
		animation: border-rotate var(--duration) linear infinite;
		will-change: transform;
		pointer-events: none;
	}

	@keyframes border-rotate {
		from {
			rotate: 0deg;
		}
		to {
			rotate: 360deg;
		}
	}

	.border-content {
		position: relative;
		z-index: 1;
	}
</style>
