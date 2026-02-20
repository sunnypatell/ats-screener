<script lang="ts">
	// size variant: sm for navbar, lg for hero
	let { size = 'sm' }: { size?: 'sm' | 'lg' } = $props();
</script>

<a href="/" class="logo" class:lg={size === 'lg'}>
	<!-- shield icon representing protection/screening -->
	<svg class="logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
		<defs>
			<linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
				<stop offset="0%" stop-color="#06b6d4" />
				<stop offset="50%" stop-color="#3b82f6" />
				<stop offset="100%" stop-color="#8b5cf6" />
			</linearGradient>
		</defs>
		<!-- outer shield shape -->
		<path
			d="M16 2L4 8v8c0 7.18 5.12 13.88 12 15.5C22.88 29.88 28 23.18 28 16V8L16 2z"
			fill="url(#logo-gradient)"
			opacity="0.15"
			stroke="url(#logo-gradient)"
			stroke-width="1.5"
		/>
		<!-- checkmark inside -->
		<path
			d="M11 16l3.5 3.5L21 13"
			stroke="url(#logo-gradient)"
			stroke-width="2.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			fill="none"
		/>
	</svg>
	<span class="logo-text">
		<span class="logo-ats">ATS</span>
		<span class="logo-screener">Screener</span>
	</span>
</a>

<style>
	.logo {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		text-decoration: none;
	}

	.logo-icon {
		width: 28px;
		height: 28px;
	}

	.lg .logo-icon {
		width: 48px;
		height: 48px;
	}

	.logo-text {
		display: flex;
		align-items: baseline;
		gap: 0.3rem;
	}

	.logo-ats {
		font-size: 1.15rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		background: var(--gradient-primary);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.logo-screener {
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.lg .logo-ats {
		font-size: 2rem;
	}

	.lg .logo-screener {
		font-size: 2rem;
	}
</style>
