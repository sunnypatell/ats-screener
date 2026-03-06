<script lang="ts">
	import { scoresStore } from '$stores/scores.svelte';
	import { authStore } from '$stores/auth.svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let copied = $state(false);
	let badgeSvgEl: SVGSVGElement | undefined = $state();

	const avgScore = $derived(scoresStore.averageScore);
	const passCount = $derived(scoresStore.passingCount);
	const totalCount = $derived(scoresStore.results.length);
	const mode = $derived(scoresStore.mode);
	const displayName = $derived(authStore.displayName || 'Resume Candidate');

	const scanDate = $derived(
		new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
	);
	const modeLabel = $derived(mode === 'targeted' ? 'Targeted Scoring' : 'General Readiness');

	function getScoreColor(score: number): string {
		if (score >= 80) return '#22c55e';
		if (score >= 60) return '#eab308';
		if (score >= 40) return '#f97316';
		return '#ef4444';
	}

	function getScoreLabel(score: number): string {
		if (score >= 80) return 'Excellent';
		if (score >= 60) return 'Good';
		if (score >= 40) return 'Needs Work';
		return 'Poor';
	}

	const scoreColor = $derived(getScoreColor(avgScore));
	const scoreLabel = $derived(getScoreLabel(avgScore));

	// circumference for the score ring (radius 58)
	const circumference = 2 * Math.PI * 58;
	const dashOffset = $derived(circumference - (avgScore / 100) * circumference);

	const shareText = $derived(
		`Just scored ${avgScore}/100 on ATS Screener, a free open-source tool that simulates how real ATS platforms like Workday, Taleo, and Greenhouse parse your resume.\n\n${passCount}/${totalCount} systems passed. Check yours at ats-screener.vercel.app`
	);

	function close() {
		open = false;
		copied = false;
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) close();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	function autoFocus(node: HTMLElement) {
		node.focus();
	}

	function downloadBadge() {
		if (!badgeSvgEl) return;

		const svgData = new XMLSerializer().serializeToString(badgeSvgEl);
		const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
		const url = URL.createObjectURL(svgBlob);

		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = img.width * 2;
			canvas.height = img.height * 2;
			const ctx = canvas.getContext('2d')!;
			ctx.scale(2, 2);
			ctx.drawImage(img, 0, 0);

			canvas.toBlob((blob) => {
				if (!blob) return;
				const a = document.createElement('a');
				a.href = URL.createObjectURL(blob);
				a.download = `ats-badge-${avgScore}-${new Date().toISOString().slice(0, 10)}.png`;
				a.click();
				URL.revokeObjectURL(a.href);
			}, 'image/png');

			URL.revokeObjectURL(url);
		};
		img.src = url;
	}

	function shareToLinkedIn() {
		const url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent('https://ats-screener.vercel.app')}`;
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	function addToLinkedInProfile() {
		const d = new Date();
		const year = d.getFullYear();
		const month = d.getMonth() + 1;
		const url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent('ATS Screening Report')}&organizationName=${encodeURIComponent('ATS Screener')}&issueYear=${year}&issueMonth=${month}&certUrl=${encodeURIComponent('https://ats-screener.vercel.app')}`;
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	async function copyShareText() {
		try {
			await navigator.clipboard.writeText(shareText);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// fallback
			const ta = document.createElement('textarea');
			ta.value = shareText;
			ta.style.position = 'fixed';
			ta.style.opacity = '0';
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			document.body.removeChild(ta);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="badge-overlay" onclick={handleBackdropClick} onkeydown={handleKeydown} tabindex="-1" use:autoFocus>
		<div class="badge-dialog" role="dialog" aria-label="Share badge">
			<button class="close-btn" onclick={close} aria-label="Close">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>

			<div class="badge-content">
				<h2 class="dialog-title">Share Your Score</h2>
				<p class="dialog-subtitle">Download your badge or share directly to LinkedIn</p>

				<!-- badge preview -->
				<div class="badge-preview">
					<svg
						bind:this={badgeSvgEl}
						xmlns="http://www.w3.org/2000/svg"
						width="600"
						height="820"
						viewBox="0 0 600 820"
						class="badge-svg"
					>
						<defs>
							<linearGradient id="badge-bgGrad" x1="0" y1="0" x2="1" y2="1">
								<stop offset="0%" stop-color="#0a0a1a" />
								<stop offset="50%" stop-color="#0d0d28" />
								<stop offset="100%" stop-color="#0a0a1a" />
							</linearGradient>
							<linearGradient id="badge-accentGrad" x1="0" y1="0" x2="1" y2="1">
								<stop offset="0%" stop-color="#06b6d4" />
								<stop offset="50%" stop-color="#3b82f6" />
								<stop offset="100%" stop-color="#8b5cf6" />
							</linearGradient>
							<linearGradient id="badge-scoreGlow" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stop-color={scoreColor} stop-opacity="0.4" />
								<stop offset="100%" stop-color={scoreColor} stop-opacity="0" />
							</linearGradient>
							<filter id="badge-glassBlur">
								<feGaussianBlur in="SourceGraphic" stdDeviation="2" />
							</filter>
							<filter id="badge-glow">
								<feGaussianBlur stdDeviation="6" result="blur" />
								<feMerge>
									<feMergeNode in="blur" />
									<feMergeNode in="SourceGraphic" />
								</feMerge>
							</filter>
							<clipPath id="badge-cardClip">
								<rect x="0" y="0" width="600" height="820" rx="32" ry="32" />
							</clipPath>
						</defs>

						<!-- card background -->
						<rect width="600" height="820" rx="32" ry="32" fill="url(#badge-bgGrad)" />

						<!-- subtle grid pattern -->
						<g opacity="0.03" clip-path="url(#badge-cardClip)">
							{#each Array(20) as _, i}
								<line x1="0" y1={i * 42} x2="600" y2={i * 42} stroke="white" stroke-width="0.5" />
								<line x1={i * 32} y1="0" x2={i * 32} y2="820" stroke="white" stroke-width="0.5" />
							{/each}
						</g>

						<!-- top accent bar gradient -->
						<rect x="0" y="0" width="600" height="4" rx="0" fill="url(#badge-accentGrad)" clip-path="url(#badge-cardClip)" />

						<!-- decorative corner accents -->
						<circle cx="540" cy="60" r="120" fill="#06b6d4" opacity="0.03" />
						<circle cx="60" cy="760" r="100" fill="#8b5cf6" opacity="0.03" />

						<!-- branding header -->
						<g transform="translate(300, 60)">
							<!-- shield icon -->
							<g transform="translate(-10, 0)">
								<path
									d="M0-16 L-10-10 L-10 2 C-10 10 0 16 0 16 C0 16 10 10 10 2 L10-10 Z"
									fill="none"
									stroke="url(#badge-accentGrad)"
									stroke-width="1.5"
									opacity="0.8"
								/>
								<path
									d="M-4 0 L-1 3 L5 -3"
									fill="none"
									stroke="#06b6d4"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</g>
							<text
								x="16"
								y="5"
								font-family="system-ui, -apple-system, sans-serif"
								font-size="16"
								font-weight="700"
								fill="rgba(255,255,255,0.9)"
								text-anchor="start"
								letter-spacing="0.08em"
							>ATS SCREENER</text>
						</g>

						<!-- divider -->
						<line x1="100" y1="95" x2="500" y2="95" stroke="rgba(255,255,255,0.06)" stroke-width="1" />

						<!-- score ring section -->
						<g transform="translate(300, 250)">
							<!-- outer glow ring -->
							<circle cx="0" cy="0" r="80" fill="none" stroke={scoreColor} stroke-width="1" opacity="0.1" />

							<!-- background track -->
							<circle
								cx="0"
								cy="0"
								r="58"
								fill="none"
								stroke="rgba(255,255,255,0.05)"
								stroke-width="8"
							/>

							<!-- score progress arc -->
							<circle
								cx="0"
								cy="0"
								r="58"
								fill="none"
								stroke={scoreColor}
								stroke-width="8"
								stroke-dasharray={circumference}
								stroke-dashoffset={dashOffset}
								stroke-linecap="round"
								transform="rotate(-90)"
								filter="url(#badge-glow)"
							/>

							<!-- score number -->
							<text
								x="0"
								y="-8"
								font-family="system-ui, -apple-system, sans-serif"
								font-size="56"
								font-weight="800"
								fill={scoreColor}
								text-anchor="middle"
								dominant-baseline="central"
							>{avgScore}</text>

							<!-- /100 label -->
							<text
								x="0"
								y="28"
								font-family="system-ui, -apple-system, sans-serif"
								font-size="14"
								font-weight="500"
								fill="rgba(255,255,255,0.35)"
								text-anchor="middle"
							>/ 100</text>
						</g>

						<!-- verdict -->
						<text
							x="300"
							y="365"
							font-family="system-ui, -apple-system, sans-serif"
							font-size="22"
							font-weight="700"
							fill={scoreColor}
							text-anchor="middle"
							letter-spacing="0.06em"
						>{scoreLabel.toUpperCase()}</text>

						<!-- systems passed pill -->
						<g transform="translate(300, 405)">
							<rect x="-70" y="-16" width="140" height="32" rx="16" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
							<text
								x="0"
								y="1"
								font-family="system-ui, -apple-system, sans-serif"
								font-size="13"
								font-weight="600"
								fill="rgba(255,255,255,0.7)"
								text-anchor="middle"
								dominant-baseline="central"
							>{passCount}/{totalCount} Systems Passed</text>
						</g>

						<!-- divider -->
						<line x1="120" y1="455" x2="480" y2="455" stroke="rgba(255,255,255,0.06)" stroke-width="1" />

						<!-- details section -->
						<!-- name -->
						<g transform="translate(300, 500)">
							<text
								x="0"
								y="0"
								font-family="system-ui, -apple-system, sans-serif"
								font-size="11"
								font-weight="600"
								fill="rgba(255,255,255,0.3)"
								text-anchor="middle"
								letter-spacing="0.12em"
							>CANDIDATE</text>
							<text
								x="0"
								y="26"
								font-family="system-ui, -apple-system, sans-serif"
								font-size="20"
								font-weight="600"
								fill="rgba(255,255,255,0.9)"
								text-anchor="middle"
							>{displayName}</text>
						</g>

						<!-- mode + date row -->
						<g transform="translate(300, 575)">
							<!-- mode -->
							<g transform="translate(-100, 0)">
								<text
									x="0"
									y="0"
									font-family="system-ui, -apple-system, sans-serif"
									font-size="10"
									font-weight="600"
									fill="rgba(255,255,255,0.3)"
									text-anchor="middle"
									letter-spacing="0.1em"
								>MODE</text>
								<text
									x="0"
									y="22"
									font-family="system-ui, -apple-system, sans-serif"
									font-size="14"
									font-weight="500"
									fill="#06b6d4"
									text-anchor="middle"
								>{modeLabel}</text>
							</g>
							<!-- date -->
							<g transform="translate(100, 0)">
								<text
									x="0"
									y="0"
									font-family="system-ui, -apple-system, sans-serif"
									font-size="10"
									font-weight="600"
									fill="rgba(255,255,255,0.3)"
									text-anchor="middle"
									letter-spacing="0.1em"
								>SCAN DATE</text>
								<text
									x="0"
									y="22"
									font-family="system-ui, -apple-system, sans-serif"
									font-size="14"
									font-weight="500"
									fill="rgba(255,255,255,0.7)"
									text-anchor="middle"
								>{scanDate}</text>
							</g>
						</g>

						<!-- individual system scores -->
						<g transform="translate(300, 640)">
							{#each scoresStore.results as result, i}
								{@const col = i % 3}
								{@const row = Math.floor(i / 3)}
								{@const x = (col - 1) * 160}
								{@const y = row * 36}
								<g transform="translate({x}, {y})">
									<rect
										x="-68"
										y="-12"
										width="136"
										height="24"
										rx="6"
										fill="rgba(255,255,255,0.02)"
									/>
									<text
										x="-58"
										y="1"
										font-family="system-ui, -apple-system, sans-serif"
										font-size="10"
										font-weight="500"
										fill="rgba(255,255,255,0.5)"
										dominant-baseline="central"
									>{result.system}</text>
									<text
										x="58"
										y="1"
										font-family="system-ui, -apple-system, sans-serif"
										font-size="11"
										font-weight="700"
										fill={getScoreColor(result.overallScore)}
										text-anchor="end"
										dominant-baseline="central"
									>{result.overallScore}</text>
								</g>
							{/each}
						</g>

						<!-- footer -->
						<line x1="80" y1="730" x2="520" y2="730" stroke="rgba(255,255,255,0.06)" stroke-width="1" />

						<text
							x="300"
							y="760"
							font-family="system-ui, -apple-system, sans-serif"
							font-size="12"
							font-weight="500"
							fill="#06b6d4"
							text-anchor="middle"
							opacity="0.7"
						>ats-screener.vercel.app</text>

						<text
							x="300"
							y="785"
							font-family="system-ui, -apple-system, sans-serif"
							font-size="9"
							font-weight="400"
							fill="rgba(255,255,255,0.2)"
							text-anchor="middle"
						>Not an official ATS certification</text>
					</svg>
				</div>

				<!-- action buttons -->
				<div class="badge-actions">
					<button class="action-btn primary" onclick={downloadBadge}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="7,10 12,15 17,10" />
							<line x1="12" y1="15" x2="12" y2="3" />
						</svg>
						Download Badge
					</button>

					<button class="action-btn linkedin" onclick={shareToLinkedIn}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
							<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
						</svg>
						Share to LinkedIn
					</button>

					<button class="action-btn secondary" onclick={addToLinkedInProfile}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="8" x2="12" y2="16" />
							<line x1="8" y1="12" x2="16" y2="12" />
						</svg>
						Add to LinkedIn Profile
					</button>

					<button class="action-btn secondary" onclick={copyShareText}>
						{#if copied}
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
								<polyline points="20,6 9,17 4,12" />
							</svg>
							<span class="copied-text">Copied!</span>
						{:else}
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
								<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
							</svg>
							Copy Share Text
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.badge-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.65);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		animation: overlayIn 0.2s ease;
	}

	@keyframes overlayIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.badge-dialog {
		position: relative;
		width: 100%;
		max-width: 520px;
		max-height: 90vh;
		overflow-y: auto;
		background: rgba(18, 18, 30, 0.98);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 24px;
		backdrop-filter: blur(24px);
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
		animation: dialogIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes dialogIn {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.close-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 50%;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-tertiary);
		cursor: pointer;
		transition: color 0.2s ease, background 0.2s ease;
		z-index: 1;
	}

	.close-btn:hover {
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.1);
	}

	.badge-content {
		padding: 2rem;
	}

	.dialog-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 0.25rem 0;
	}

	.dialog-subtitle {
		font-size: 0.85rem;
		color: var(--text-tertiary);
		margin: 0 0 1.5rem 0;
	}

	.badge-preview {
		display: flex;
		justify-content: center;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 16px;
	}

	.badge-svg {
		width: 100%;
		max-width: 360px;
		height: auto;
	}

	.badge-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.7rem 1rem;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
		border: 1px solid transparent;
	}

	.action-btn.primary {
		background: rgba(6, 182, 212, 0.12);
		border-color: rgba(6, 182, 212, 0.25);
		color: #06b6d4;
	}

	.action-btn.primary:hover {
		background: rgba(6, 182, 212, 0.2);
		border-color: rgba(6, 182, 212, 0.4);
		box-shadow: 0 0 20px rgba(6, 182, 212, 0.1);
	}

	.action-btn.linkedin {
		background: rgba(10, 102, 194, 0.15);
		border-color: rgba(10, 102, 194, 0.3);
		color: #0a66c2;
	}

	.action-btn.linkedin:hover {
		background: rgba(10, 102, 194, 0.25);
		border-color: rgba(10, 102, 194, 0.45);
		box-shadow: 0 0 20px rgba(10, 102, 194, 0.1);
	}

	.action-btn.secondary {
		background: rgba(255, 255, 255, 0.04);
		border-color: rgba(255, 255, 255, 0.08);
		color: var(--text-secondary);
	}

	.action-btn.secondary:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.copied-text {
		color: #22c55e;
	}

	/* scrollbar styling for the dialog */
	.badge-dialog::-webkit-scrollbar {
		width: 4px;
	}

	.badge-dialog::-webkit-scrollbar-track {
		background: transparent;
	}

	.badge-dialog::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
	}

	@media (max-width: 640px) {
		.badge-overlay {
			padding: 0.5rem;
		}

		.badge-dialog {
			max-width: none;
			border-radius: 20px;
		}

		.badge-content {
			padding: 1.5rem;
		}

		.badge-preview {
			padding: 0.5rem;
		}
	}
</style>
