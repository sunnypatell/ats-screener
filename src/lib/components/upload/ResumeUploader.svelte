<script lang="ts">
	import { localeStore } from '$stores/locale.svelte';
	import { resumeStore } from '$stores/resume.svelte';

	let isDragging = $state(false);
	let fileInput: HTMLInputElement;
	const acceptedTypes = [
		'application/pdf',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	];

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		const file = event.dataTransfer?.files[0];
		if (file) validateAndSetFile(file);
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) validateAndSetFile(file);
	}

	function validateAndSetFile(file: File) {
		const extensionAccepted = /\.(pdf|docx)$/i.test(file.name);
		if (!acceptedTypes.includes(file.type) && !extensionAccepted) {
			resumeStore.setError(localeStore.t('uploader.invalid'));
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			resumeStore.setError(localeStore.t('uploader.large'));
			return;
		}
		resumeStore.setFile(file);
	}

	function openFilePicker() {
		fileInput.click();
	}

	function handleKey(event: KeyboardEvent) {
		if (event.target !== event.currentTarget) return;
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openFilePicker();
		}
	}
</script>

<div
	class="uploader"
	class:dragging={isDragging}
	class:has-file={resumeStore.file !== null}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	role="button"
	tabindex="0"
	aria-label={localeStore.t('uploader.aria')}
	onclick={openFilePicker}
	onkeydown={handleKey}
>
	<input
		bind:this={fileInput}
		type="file"
		accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
		onchange={handleFileSelect}
		class="visually-hidden"
	/>

	{#if resumeStore.isParsing}
		<div class="state-block">
			<div class="spinner"></div>
			<p class="primary">{localeStore.t('uploader.parsing')}</p>
			<p class="secondary">{localeStore.t('uploader.parsingHint')}</p>
		</div>
	{:else if resumeStore.file}
		<div class="file-info">
			<div class="file-icon" aria-hidden="true">▣</div>
			<div class="file-details">
				<p class="file-name">{resumeStore.file.name}</p>
				<p class="file-size">{(resumeStore.file.size / 1024).toFixed(0)} KB</p>
			</div>
			<div class="check" aria-hidden="true">✓</div>
		</div>
	{:else}
		<div class="state-block">
			<div class="upload-icon" aria-hidden="true">⇧</div>
			<p class="primary">{localeStore.t('uploader.title')}</p>
			<p class="secondary">{localeStore.t('uploader.hint')}</p>
			<div class="formats"><span>.PDF</span><span>.DOCX</span></div>
			<p class="privacy">{localeStore.t('uploader.privacy')}</p>
		</div>
	{/if}

	{#if resumeStore.error}
		<p class="error">{resumeStore.error}</p>
	{/if}
</div>

<style>
	.uploader {
		position: relative;
		padding: 2.5rem 1.5rem;
		background: var(--glass-bg);
		border: 2px dashed var(--glass-border);
		border-radius: var(--radius-xl);
		cursor: pointer;
		text-align: center;
		transition: 0.2s ease;
	}

	.uploader:hover,
	.uploader.dragging {
		border-color: var(--accent-cyan);
		background: rgba(6, 182, 212, 0.04);
	}

	.uploader.has-file {
		border-style: solid;
		border-color: rgba(34, 197, 94, 0.45);
		background: rgba(34, 197, 94, 0.035);
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.state-block {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.upload-icon,
	.file-icon {
		display: grid;
		place-items: center;
		width: 56px;
		height: 56px;
		margin-bottom: 1rem;
		border: 1px solid rgba(6, 182, 212, 0.25);
		border-radius: var(--radius-lg);
		background: rgba(6, 182, 212, 0.08);
		color: var(--accent-cyan);
		font-size: 1.75rem;
	}

	.primary {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.secondary,
	.privacy,
	.file-size {
		color: var(--text-tertiary);
	}

	.secondary {
		margin-top: 0.35rem;
		font-size: 0.88rem;
	}

	.privacy {
		max-width: 580px;
		margin-top: 1rem;
		font-size: 0.75rem;
		line-height: 1.45;
	}

	.formats {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.formats span {
		padding: 0.22rem 0.55rem;
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		font-size: 0.7rem;
		color: var(--text-tertiary);
	}

	.file-info {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.file-info .file-icon {
		margin: 0;
	}

	.file-details {
		min-width: 0;
		text-align: left;
	}

	.file-name {
		max-width: min(55vw, 430px);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 700;
		color: var(--text-primary);
	}

	.file-size {
		margin-top: 0.2rem;
		font-size: 0.8rem;
	}

	.check {
		color: #22c55e;
		font-size: 1.25rem;
	}

	.spinner {
		width: 34px;
		height: 34px;
		margin-bottom: 1rem;
		border: 3px solid rgba(6, 182, 212, 0.18);
		border-top-color: var(--accent-cyan);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.error {
		margin-top: 1rem;
		color: #ef4444;
		font-size: 0.86rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
