<script lang="ts">
	import { page } from '$app/stores';

	// controls the mobile menu visibility
	let mobileOpen = $state(false);

	// highlight the active route
	const currentPath = $derived($page.url.pathname);
</script>

<nav class="navbar">
	<div class="nav-inner">
		<a href="/" class="nav-brand">
			<span class="gradient-text">ATS Screener</span>
		</a>

		<div class="nav-links" class:open={mobileOpen}>
			<a href="/" class="nav-link" class:active={currentPath === '/'}>home</a>
			<a href="/scanner" class="nav-link" class:active={currentPath === '/scanner'}>scanner</a>
			<a
				href="https://github.com/sunnypatell/ats-screener"
				target="_blank"
				rel="noopener"
				class="nav-link"
			>
				github
			</a>
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
		padding: 1rem 2rem;
		background: rgba(10, 10, 20, 0.8);
		backdrop-filter: blur(20px);
		border-bottom: 1px solid var(--glass-border);
	}

	.nav-inner {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.nav-brand {
		text-decoration: none;
	}

	.gradient-text {
		font-size: 1.15rem;
		font-weight: 700;
		background: var(--gradient-primary);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.nav-links {
		display: flex;
		gap: 2rem;
	}

	.nav-link {
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		transition: color 0.2s ease;
	}

	.nav-link:hover,
	.nav-link.active {
		color: var(--text-primary);
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

	/* hamburger → X animation */
	.bar.open:nth-child(1) {
		transform: rotate(45deg) translate(4px, 4px);
	}
	.bar.open:nth-child(2) {
		opacity: 0;
	}
	.bar.open:nth-child(3) {
		transform: rotate(-45deg) translate(4px, -4px);
	}

	@media (max-width: 640px) {
		.nav-toggle {
			display: flex;
		}

		.nav-links {
			/* slide down on mobile */
			position: absolute;
			top: 100%;
			left: 0;
			right: 0;
			flex-direction: column;
			padding: 1rem 2rem;
			background: rgba(10, 10, 20, 0.95);
			backdrop-filter: blur(20px);
			border-bottom: 1px solid var(--glass-border);
			gap: 1rem;
			display: none;
		}

		.nav-links.open {
			display: flex;
		}
	}
</style>
