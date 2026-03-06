<script lang="ts">
	import { scoresStore } from '$stores/scores.svelte';
	import { authStore } from '$stores/auth.svelte';
	import { getScoreColor, getScoreLabel } from '$engine/scorer/classification';

	let { open = $bindable(false) }: { open: boolean } = $props();

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

	const scoreColor = $derived(getScoreColor(avgScore));
	const scoreLabel = $derived(getScoreLabel(avgScore));

	// circumference for the score ring (radius 58)
	const circumference = 2 * Math.PI * 58;
	const dashOffset = $derived(circumference - (avgScore / 100) * circumference);

	const shareText = $derived(
		`Just scored ${avgScore}/100 on ATS Screener, a free open-source resume tool by linkedin.com/in/sunny-patel-30b460204 that simulates how real ATS platforms (Workday, Taleo, iCIMS, Greenhouse, Lever, and SuccessFactors) parse your resume.\n\n${passCount}/${totalCount} systems passed. Try it free at ats-screener.vercel.app\n\n#ATSScreener #Resume #JobSearch #OpenSource #CareerTips`
	);

	function close() {
		open = false;
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
				const d = new Date();
				const dateStr = d
					.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
					.replace(',', '');
				a.download = `${displayName} - ATS Screener Badge - ${dateStr}.png`;
				a.click();
				URL.revokeObjectURL(a.href);
			}, 'image/png');

			URL.revokeObjectURL(url);
		};
		img.src = url;
	}

	function shareToLinkedIn() {
		const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`;
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	function addToLinkedInProfile() {
		const d = new Date();
		const year = d.getFullYear();
		const month = d.getMonth() + 1;
		const url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent('ATS Screening Report')}&organizationName=${encodeURIComponent('ATS Screener')}&issueYear=${year}&issueMonth=${month}&certUrl=${encodeURIComponent('https://ats-screener.vercel.app')}`;
		window.open(url, '_blank', 'noopener,noreferrer');
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="badge-overlay"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		tabindex="-1"
		use:autoFocus
	>
		<div class="badge-dialog" role="dialog" aria-label="Share badge">
			<button class="close-btn" onclick={close} aria-label="Close">
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
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
						width="520"
						height="720"
						viewBox="0 0 520 720"
						class="badge-svg"
					>
						<defs>
							<linearGradient id="badge-bgGrad" x1="0" y1="0" x2="0.5" y2="1">
								<stop offset="0%" stop-color="#0c0c20" />
								<stop offset="50%" stop-color="#0a0a1a" />
								<stop offset="100%" stop-color="#0e0b1e" />
							</linearGradient>
							<linearGradient id="badge-accentGrad" x1="0" y1="0" x2="1" y2="1">
								<stop offset="0%" stop-color="#06b6d4" />
								<stop offset="50%" stop-color="#3b82f6" />
								<stop offset="100%" stop-color="#8b5cf6" />
							</linearGradient>
							<linearGradient id="badge-borderGrad" x1="0" y1="0" x2="1" y2="1">
								<stop offset="0%" stop-color="#06b6d4" stop-opacity="0.6" />
								<stop offset="25%" stop-color="#3b82f6" stop-opacity="0.2" />
								<stop offset="50%" stop-color="#8b5cf6" stop-opacity="0.6" />
								<stop offset="75%" stop-color="#3b82f6" stop-opacity="0.2" />
								<stop offset="100%" stop-color="#06b6d4" stop-opacity="0.6" />
							</linearGradient>
							<filter id="badge-glow">
								<feGaussianBlur stdDeviation="6" result="blur" />
								<feMerge>
									<feMergeNode in="blur" />
									<feMergeNode in="SourceGraphic" />
								</feMerge>
							</filter>
							<filter id="badge-sealGlow">
								<feGaussianBlur stdDeviation="3" result="blur" />
								<feMerge>
									<feMergeNode in="blur" />
									<feMergeNode in="SourceGraphic" />
								</feMerge>
							</filter>
							<clipPath id="badge-cardClip">
								<rect x="4" y="4" width="512" height="712" rx="28" ry="28" />
							</clipPath>
						</defs>

						<!-- gradient border frame -->
						<rect width="520" height="720" rx="30" ry="30" fill="url(#badge-borderGrad)" />

						<!-- inner card background -->
						<rect x="4" y="4" width="512" height="712" rx="28" ry="28" fill="url(#badge-bgGrad)" />

						<!-- subtle grid pattern -->
						<g opacity="0.025" clip-path="url(#badge-cardClip)">
							{#each Array(18) as _, i}
								<line x1="4" y1={i * 42} x2="516" y2={i * 42} stroke="white" stroke-width="0.5" />
								<line
									x1={i * 30 + 4}
									y1="4"
									x2={i * 30 + 4}
									y2="716"
									stroke="white"
									stroke-width="0.5"
								/>
							{/each}
						</g>

						<!-- top accent bar gradient -->
						<rect
							x="4"
							y="4"
							width="512"
							height="3"
							fill="url(#badge-accentGrad)"
							clip-path="url(#badge-cardClip)"
						/>

						<!-- decorative corner glows -->
						<circle cx="480" cy="50" r="100" fill="#06b6d4" opacity="0.025" />
						<circle cx="40" cy="670" r="80" fill="#8b5cf6" opacity="0.025" />

						<!-- branding header -->
						<g transform="translate(260, 52)">
							<!-- shield icon -->
							<g transform="translate(-72, 0)">
								<path
									d="M0-14 L-9-9 L-9 2 C-9 9 0 14 0 14 C0 14 9 9 9 2 L9-9 Z"
									fill="rgba(6,182,212,0.08)"
									stroke="url(#badge-accentGrad)"
									stroke-width="1.5"
								/>
								<path
									d="M-3.5 0.5 L-1 3 L4.5 -2.5"
									fill="none"
									stroke="#06b6d4"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</g>
							<text
								x="-52"
								y="5"
								font-family="system-ui, -apple-system, sans-serif"
								font-size="15"
								font-weight="700"
								fill="rgba(255,255,255,0.9)"
								text-anchor="start"
								letter-spacing="0.1em">ATS SCREENER</text
							>
						</g>

						<!-- thin divider -->
						<line
							x1="80"
							y1="84"
							x2="440"
							y2="84"
							stroke="rgba(255,255,255,0.06)"
							stroke-width="1"
						/>

						<!-- verification seal watermark (top right) -->
						<g transform="translate(430, 130)" opacity="0.06">
							<circle cx="0" cy="0" r="36" fill="none" stroke="white" stroke-width="1" />
							<circle cx="0" cy="0" r="28" fill="none" stroke="white" stroke-width="0.5" />
							{#each Array(12) as _, i}
								{@const angle = (i * 30 * Math.PI) / 180}
								<line
									x1={Math.cos(angle) * 28}
									y1={Math.sin(angle) * 28}
									x2={Math.cos(angle) * 36}
									y2={Math.sin(angle) * 36}
									stroke="white"
									stroke-width="1"
								/>
							{/each}
							<text
								x="0"
								y="2"
								font-family="system-ui, sans-serif"
								font-size="7"
								fill="white"
								text-anchor="middle"
								dominant-baseline="central"
								font-weight="700"
								letter-spacing="0.1em">VERIFIED</text
							>
						</g>

						<!-- score ring section -->
						<g transform="translate(260, 210)">
							<!-- outer decorative ring -->
							<circle
								cx="0"
								cy="0"
								r="82"
								fill="none"
								stroke={scoreColor}
								stroke-width="0.5"
								opacity="0.15"
							/>
							<circle
								cx="0"
								cy="0"
								r="86"
								fill="none"
								stroke={scoreColor}
								stroke-width="0.5"
								opacity="0.08"
								stroke-dasharray="4 8"
							/>

							<!-- background track -->
							<circle
								cx="0"
								cy="0"
								r="58"
								fill="none"
								stroke="rgba(255,255,255,0.05)"
								stroke-width="10"
							/>

							<!-- score progress arc -->
							<circle
								cx="0"
								cy="0"
								r="58"
								fill="none"
								stroke={scoreColor}
								stroke-width="10"
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
								font-size="52"
								font-weight="800"
								fill={scoreColor}
								text-anchor="middle"
								dominant-baseline="central">{avgScore}</text
							>

							<!-- /100 label -->
							<text
								x="0"
								y="26"
								font-family="system-ui, -apple-system, sans-serif"
								font-size="13"
								font-weight="500"
								fill="rgba(255,255,255,0.35)"
								text-anchor="middle">/ 100</text
							>
						</g>

						<!-- verdict -->
						<text
							x="260"
							y="328"
							font-family="system-ui, -apple-system, sans-serif"
							font-size="20"
							font-weight="700"
							fill={scoreColor}
							text-anchor="middle"
							letter-spacing="0.08em">{scoreLabel.toUpperCase()}</text
						>

						<!-- systems passed pill -->
						<g transform="translate(260, 365)">
							<rect
								x="-72"
								y="-14"
								width="144"
								height="28"
								rx="14"
								fill="rgba(255,255,255,0.04)"
								stroke="rgba(255,255,255,0.08)"
								stroke-width="1"
							/>
							<text
								x="0"
								y="1"
								font-family="system-ui, -apple-system, sans-serif"
								font-size="12"
								font-weight="600"
								fill="rgba(255,255,255,0.7)"
								text-anchor="middle"
								dominant-baseline="central">{passCount}/{totalCount} Systems Passed</text
							>
						</g>

						<!-- divider -->
						<line
							x1="80"
							y1="405"
							x2="440"
							y2="405"
							stroke="rgba(255,255,255,0.06)"
							stroke-width="1"
						/>

						<!-- candidate name -->
						<g transform="translate(260, 444)">
							<text
								x="0"
								y="0"
								font-family="system-ui, -apple-system, sans-serif"
								font-size="10"
								font-weight="600"
								fill="rgba(255,255,255,0.3)"
								text-anchor="middle"
								letter-spacing="0.14em">CANDIDATE</text
							>
							<text
								x="0"
								y="24"
								font-family="system-ui, -apple-system, sans-serif"
								font-size="19"
								font-weight="600"
								fill="rgba(255,255,255,0.9)"
								text-anchor="middle">{displayName}</text
							>
						</g>

						<!-- mode + date row -->
						<g transform="translate(260, 510)">
							<g transform="translate(-90, 0)">
								<text
									x="0"
									y="0"
									font-family="system-ui, -apple-system, sans-serif"
									font-size="9"
									font-weight="600"
									fill="rgba(255,255,255,0.3)"
									text-anchor="middle"
									letter-spacing="0.12em">MODE</text
								>
								<text
									x="0"
									y="20"
									font-family="system-ui, -apple-system, sans-serif"
									font-size="13"
									font-weight="500"
									fill="#06b6d4"
									text-anchor="middle">{modeLabel}</text
								>
							</g>
							<line
								x1="0"
								y1="-8"
								x2="0"
								y2="24"
								stroke="rgba(255,255,255,0.06)"
								stroke-width="1"
							/>
							<g transform="translate(90, 0)">
								<text
									x="0"
									y="0"
									font-family="system-ui, -apple-system, sans-serif"
									font-size="9"
									font-weight="600"
									fill="rgba(255,255,255,0.3)"
									text-anchor="middle"
									letter-spacing="0.12em">SCAN DATE</text
								>
								<text
									x="0"
									y="20"
									font-family="system-ui, -apple-system, sans-serif"
									font-size="13"
									font-weight="500"
									fill="rgba(255,255,255,0.7)"
									text-anchor="middle">{scanDate}</text
								>
							</g>
						</g>

						<!-- divider before scores -->
						<line
							x1="80"
							y1="550"
							x2="440"
							y2="550"
							stroke="rgba(255,255,255,0.06)"
							stroke-width="1"
						/>

						<!-- individual system scores -->
						<g transform="translate(260, 582)">
							{#each scoresStore.results as result, i}
								{@const col = i % 3}
								{@const row = Math.floor(i / 3)}
								{@const x = (col - 1) * 148}
								{@const y = row * 34}
								<g transform="translate({x}, {y})">
									<rect
										x="-64"
										y="-11"
										width="128"
										height="22"
										rx="6"
										fill="rgba(255,255,255,0.02)"
										stroke="rgba(255,255,255,0.03)"
										stroke-width="0.5"
									/>
									<text
										x="-54"
										y="1"
										font-family="system-ui, -apple-system, sans-serif"
										font-size="9.5"
										font-weight="500"
										fill="rgba(255,255,255,0.5)"
										dominant-baseline="central">{result.system}</text
									>
									<text
										x="54"
										y="1"
										font-family="system-ui, -apple-system, sans-serif"
										font-size="11"
										font-weight="700"
										fill={getScoreColor(result.overallScore)}
										text-anchor="end"
										dominant-baseline="central">{result.overallScore}</text
									>
								</g>
							{/each}
						</g>

						<!-- footer divider -->
						<line
							x1="60"
							y1="656"
							x2="460"
							y2="656"
							stroke="rgba(255,255,255,0.06)"
							stroke-width="1"
						/>

						<!-- footer -->
						<text
							x="260"
							y="682"
							font-family="system-ui, -apple-system, sans-serif"
							font-size="11"
							font-weight="500"
							fill="#06b6d4"
							text-anchor="middle"
							opacity="0.6">ats-screener.vercel.app</text
						>

						<text
							x="260"
							y="702"
							font-family="system-ui, -apple-system, sans-serif"
							font-size="8"
							font-weight="400"
							fill="rgba(255,255,255,0.18)"
							text-anchor="middle">Not an official ATS certification</text
						>
					</svg>
				</div>

				<!-- action buttons -->
				<div class="badge-actions">
					<button class="action-btn primary" onclick={downloadBadge}>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="7,10 12,15 17,10" />
							<line x1="12" y1="15" x2="12" y2="3" />
						</svg>
						Download Badge
					</button>

					<button class="action-btn linkedin" onclick={shareToLinkedIn}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
							/>
						</svg>
						Share to LinkedIn
					</button>

					<button class="action-btn secondary" onclick={addToLinkedInProfile}>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="8" x2="12" y2="16" />
							<line x1="8" y1="12" x2="16" y2="12" />
						</svg>
						Add to LinkedIn Profile
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
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
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
		transition:
			color 0.2s ease,
			background 0.2s ease;
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
