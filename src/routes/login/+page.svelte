<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$stores/auth.svelte';

	let mode = $state<'signin' | 'signup'>('signin');
	let email = $state('');
	let password = $state('');
	let displayName = $state('');
	let resetEmail = $state('');
	let showReset = $state(false);
	let resetSent = $state(false);
	let signupDone = $state(false);
	let submitting = $state(false);

	// redirect if already logged in
	$effect(() => {
		if (authStore.isAuthenticated && !authStore.loading) {
			goto('/scanner');
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		submitting = true;
		authStore.clearError();

		try {
			if (mode === 'signin') {
				await authStore.signInWithEmail(email, password);
				goto('/scanner');
			} else {
				await authStore.signUpWithEmail(email, password, displayName);
				signupDone = true;
			}
		} catch {
			// error is set in authStore
		} finally {
			submitting = false;
		}
	}

	async function handleGoogle() {
		submitting = true;
		authStore.clearError();
		try {
			await authStore.signInWithGoogle();
			goto('/scanner');
		} catch {
			// error is set in authStore
		} finally {
			submitting = false;
		}
	}

	async function handlePasswordReset() {
		if (!resetEmail.trim()) return;
		try {
			await authStore.sendPasswordReset(resetEmail);
			resetSent = true;
		} catch {
			// error is set in authStore
		}
	}
</script>

<svelte:head>
	<title>Sign In | ATS Screener</title>
</svelte:head>

<div class="login-page">
	<div class="login-card">
		<!-- header -->
		<div class="card-header">
			<h1 class="card-title">
				{#if showReset}
					Reset Password
				{:else if signupDone}
					You're In!
				{:else if mode === 'signin'}
					Welcome Back
				{:else}
					Create Account
				{/if}
			</h1>
			<p class="card-subtitle">
				{#if showReset}
					Enter your email to receive a password reset link.
				{:else if signupDone}
					Check your email to verify your account.
				{:else if mode === 'signin'}
					Sign in to scan your resume across 6 ATS platforms.
				{:else}
					Create a free account to get started.
				{/if}
			</p>
		</div>

		{#if authStore.error}
			<div class="error-banner">{authStore.error}</div>
		{/if}

		{#if showReset}
			<!-- password reset form -->
			<div class="form-body">
				{#if resetSent}
					<div class="success-banner">
						Password reset email sent! Check your inbox.
					</div>
					<p class="spam-hint">
						Don't see it? Check your spam or junk folder.
					</p>
					<button class="link-btn" onclick={() => { showReset = false; resetSent = false; authStore.clearError(); }}>
						Back to sign in
					</button>
				{:else}
					<form onsubmit={(e) => { e.preventDefault(); handlePasswordReset(); }}>
						<label class="field">
							<span class="field-label">Email</span>
							<input type="email" bind:value={resetEmail} placeholder="you@example.com" required class="field-input" />
						</label>
						<button type="submit" class="submit-btn" disabled={submitting}>
							Send Reset Link
						</button>
					</form>
					<button class="link-btn" onclick={() => { showReset = false; authStore.clearError(); }}>
						Back to sign in
					</button>
				{/if}
			</div>
		{:else if signupDone}
			<!-- signup success: verification email sent -->
			<div class="form-body">
				<div class="success-banner">
					Account created! We sent a verification email to <strong>{email}</strong>.
				</div>
				<p class="spam-hint">
					Don't see it? Check your spam or junk folder.
				</p>
				<button class="submit-btn" onclick={() => goto('/scanner')}>
					Continue to Scanner
				</button>
			</div>
		{:else}
			<!-- mode tabs -->
			<div class="mode-tabs">
				<button class="mode-tab" class:active={mode === 'signin'} onclick={() => { mode = 'signin'; authStore.clearError(); }}>
					Sign In
				</button>
				<button class="mode-tab" class:active={mode === 'signup'} onclick={() => { mode = 'signup'; authStore.clearError(); }}>
					Create Account
				</button>
			</div>

			<!-- google sign-in -->
			<button class="google-btn" onclick={handleGoogle} disabled={submitting}>
				<svg width="18" height="18" viewBox="0 0 24 24">
					<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
					<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
					<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
					<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
				</svg>
				Continue with Google
			</button>

			<div class="divider">
				<span>or</span>
			</div>

			<!-- email/password form -->
			<form class="form-body" onsubmit={handleSubmit}>
				{#if mode === 'signup'}
					<label class="field">
						<span class="field-label">Name</span>
						<input type="text" bind:value={displayName} placeholder="Your name" class="field-input" />
					</label>
				{/if}

				<label class="field">
					<span class="field-label">Email</span>
					<input type="email" bind:value={email} placeholder="you@example.com" required class="field-input" />
				</label>

				<label class="field">
					<span class="field-label">Password</span>
					<input type="password" bind:value={password} placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'} required minlength={6} class="field-input" />
				</label>

				{#if mode === 'signin'}
					<button type="button" class="forgot-btn" onclick={() => { showReset = true; resetEmail = email; authStore.clearError(); }}>
						Forgot password?
					</button>
				{/if}

				<button type="submit" class="submit-btn" disabled={submitting}>
					{#if submitting}
						<span class="spinner"></span>
					{/if}
					{mode === 'signin' ? 'Sign In' : 'Create Account'}
				</button>
			</form>
		{/if}
	</div>
</div>

<style>
	.login-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.login-card {
		width: 100%;
		max-width: 420px;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
		padding: 2.5rem;
	}

	.card-header {
		text-align: center;
		margin-bottom: 1.75rem;
	}

	.card-title {
		font-size: 1.6rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.03em;
		margin-bottom: 0.4rem;
	}

	.card-subtitle {
		font-size: 0.88rem;
		color: var(--text-tertiary);
		line-height: 1.5;
	}

	/* mode tabs */
	.mode-tabs {
		display: flex;
		gap: 0.25rem;
		padding: 0.2rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		margin-bottom: 1.5rem;
	}

	.mode-tab {
		flex: 1;
		padding: 0.55rem;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-tertiary);
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition:
			background 0.2s ease,
			color 0.2s ease;
		font-family: inherit;
	}

	.mode-tab.active {
		background: rgba(6, 182, 212, 0.1);
		color: var(--accent-cyan);
	}

	/* google button */
	.google-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text-primary);
		cursor: pointer;
		transition:
			background 0.2s ease,
			border-color 0.2s ease;
		font-family: inherit;
	}

	.google-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.google-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* divider */
	.divider {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: 1.25rem 0;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--glass-border);
	}

	.divider span {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	/* form */
	.form-body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.field-label {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.field-input {
		width: 100%;
		padding: 0.7rem 0.85rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		font-size: 0.88rem;
		color: var(--text-primary);
		outline: none;
		transition: border-color 0.2s ease;
		font-family: inherit;
	}

	.field-input::placeholder {
		color: var(--text-tertiary);
		opacity: 0.6;
	}

	.field-input:focus {
		border-color: rgba(6, 182, 212, 0.5);
	}

	.forgot-btn {
		align-self: flex-end;
		background: none;
		border: none;
		font-size: 0.78rem;
		color: var(--accent-cyan);
		cursor: pointer;
		padding: 0;
		margin-top: -0.5rem;
		font-family: inherit;
	}

	.forgot-btn:hover {
		text-decoration: underline;
	}

	.submit-btn {
		width: 100%;
		padding: 0.75rem;
		background: var(--gradient-primary);
		color: var(--color-bg-primary);
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.92rem;
		font-weight: 700;
		cursor: pointer;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-family: inherit;
		margin-top: 0.25rem;
	}

	.submit-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow:
			0 0 24px rgba(6, 182, 212, 0.3),
			0 0 48px rgba(59, 130, 246, 0.1);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(0, 0, 0, 0.2);
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* error/success banners */
	.error-banner {
		padding: 0.65rem 0.85rem;
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: var(--radius-md);
		font-size: 0.82rem;
		color: #ef4444;
		margin-bottom: 1rem;
	}

	.success-banner {
		padding: 0.65rem 0.85rem;
		background: rgba(34, 197, 94, 0.08);
		border: 1px solid rgba(34, 197, 94, 0.2);
		border-radius: var(--radius-md);
		font-size: 0.82rem;
		color: #22c55e;
		margin-bottom: 0.5rem;
	}

	.spam-hint {
		font-size: 0.78rem;
		color: var(--text-tertiary);
		text-align: center;
		margin: 0 0 0.75rem;
	}

	.link-btn {
		background: none;
		border: none;
		font-size: 0.82rem;
		color: var(--accent-cyan);
		cursor: pointer;
		padding: 0;
		font-family: inherit;
		margin-top: 0.5rem;
	}

	.link-btn:hover {
		text-decoration: underline;
	}

	@media (max-width: 480px) {
		.login-card {
			padding: 1.75rem;
		}
	}
</style>
