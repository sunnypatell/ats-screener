<script lang="ts">
	interface DockItem {
		label: string;
		icon: string;
		href: string;
	}

	let {
		items,
		baseSize = 48,
		maxSize = 72,
		magnification = 0.4,
		distance = 120
	}: {
		items: DockItem[];
		baseSize?: number;
		maxSize?: number;
		magnification?: number;
		distance?: number;
	} = $props();

	let dockEl: HTMLDivElement;
	let mouseX = $state<number | null>(null);

	let sizes = $derived.by(() => {
		if (mouseX === null) return items.map(() => baseSize);
		return items.map((_, i) => {
			if (!dockEl) return baseSize;
			const itemEl = dockEl.children[i] as HTMLElement;
			if (!itemEl) return baseSize;
			const itemRect = itemEl.getBoundingClientRect();
			const dockRect = dockEl.getBoundingClientRect();
			const itemCenter = itemRect.left - dockRect.left + itemRect.width / 2;
			const dist = Math.abs(mouseX! - itemCenter);
			if (dist > distance) return baseSize;
			const scale = 1 + magnification * (1 - dist / distance);
			return Math.min(baseSize * scale, maxSize);
		});
	});

	function handleMouseMove(e: MouseEvent) {
		if (!dockEl) return;
		const rect = dockEl.getBoundingClientRect();
		mouseX = e.clientX - rect.left;
	}

	function handleMouseLeave() {
		mouseX = null;
	}
</script>

<div
	class="dock"
	bind:this={dockEl}
	onmousemove={handleMouseMove}
	onmouseleave={handleMouseLeave}
	role="navigation"
	aria-label="Navigation dock"
>
	{#each items as item, i}
		<a
			class="dock-item"
			href={item.href}
			title={item.label}
			style="width: {sizes[i]}px; height: {sizes[i]}px;"
		>
			<span class="dock-icon" style="font-size: {sizes[i] * 0.5}px;">
				{item.icon}
			</span>
			<span class="dock-tooltip">{item.label}</span>
		</a>
	{/each}
</div>

<style>
	.dock {
		display: flex;
		align-items: flex-end;
		gap: 0.25rem;
		padding: 0.5rem 0.75rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: 20px;
		backdrop-filter: blur(var(--glass-blur));
	}

	.dock-item {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		cursor: pointer;
		transition:
			width 0.15s ease-out,
			height 0.15s ease-out,
			background 0.2s ease;
		position: relative;
		text-decoration: none;
		color: inherit;
	}

	.dock-item:hover {
		background: rgba(6, 182, 212, 0.1);
		border-color: rgba(6, 182, 212, 0.2);
	}

	.dock-icon {
		line-height: 1;
		transition: font-size 0.15s ease-out;
		user-select: none;
	}

	.dock-tooltip {
		position: absolute;
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
		padding: 0.3rem 0.6rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		font-size: 0.72rem;
		font-weight: 500;
		color: var(--text-primary);
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.15s ease;
		backdrop-filter: blur(12px);
	}

	.dock-item:hover .dock-tooltip {
		opacity: 1;
	}
</style>
