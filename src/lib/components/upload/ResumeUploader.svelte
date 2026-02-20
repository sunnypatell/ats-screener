<script lang="ts">
	import { resumeStore } from '$stores/resume.svelte';

	// visual feedback for the drag-and-drop zone
	let isDragging = $state(false);
	// ref to the hidden file input for programmatic click
	let fileInput: HTMLInputElement;

	// MIME types we accept (PDF and DOCX only)
	const ACCEPTED_TYPES = [
		'application/pdf',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	];

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const file = e.dataTransfer?.files[0];
		if (file) validateAndSetFile(file);
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) validateAndSetFile(file);
	}

	// validates type + size before passing to the store
	function validateAndSetFile(file: File) {
		if (!ACCEPTED_TYPES.includes(file.type)) {
			resumeStore.setError('Please upload a PDF or DOCX file.');
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			resumeStore.setError('File too large (max 10MB).');
			return;
		}
		resumeStore.setFile(file);
	}

	function openFilePicker() {
		fileInput.click();
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
	onclick={openFilePicker}
	onkeydown={(e) => e.key === 'Enter' && openFilePicker()}
>
	<input
		bind:this={fileInput}
		type="file"
		accept=".pdf,.docx"
		onchange={handleFileSelect}
		class="visually-hidden"
	/>

	{#if resumeStore.file}
		<div class="file-info">
			<div class="file-icon">
				{#if resumeStore.file.name.endsWith('.pdf')}
					<svg
						width="28"
						height="28"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
						<polyline points="14,2 14,8 20,8" />
						<path d="M10 12l2 2 4-4" />
					</svg>
				{:else}
					<svg
						width="28"
						height="28"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
						<polyline points="14,2 14,8 20,8" />
						<line x1="16" y1="13" x2="8" y2="13" />
						<line x1="16" y1="17" x2="8" y2="17" />
					</svg>
				{/if}
			</div>
			<div class="file-details">
				<p class="file-name">{resumeStore.file.name}</p>
				<p class="file-size">{(resumeStore.file.size / 1024).toFixed(0)} KB</p>
			</div>
			<div class="file-check">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
				>
					<polyline points="20,6 9,17 4,12" />
				</svg>
			</div>
		</div>
	{:else if resumeStore.isParsing}
		<div class="parsing">
			<div class="spinner"></div>
			<p class="parsing-text">Parsing Your Resume...</p>
			<p class="parsing-hint">Extracting text, sections, and metadata</p>
		</div>
	{:else}
		<div class="upload-prompt">
			<div class="upload-icon-wrapper">
				<svg
					class="upload-icon"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="17,8 12,3 7,8" />
					<line x1="12" y1="3" x2="12" y2="15" />
				</svg>
			</div>
			<p class="upload-text">Drag & Drop Your Resume Here</p>
			<p class="upload-hint">or click to browse. PDF or DOCX, max 10MB.</p>
			<div class="supported-formats">
				<span class="format-badge">.PDF</span>
				<span class="format-badge">.DOCX</span>
			</div>
		</div>
	{/if}

	{#if resumeStore.error}
		<p class="error">{resumeStore.error}</p>
	{/if}
</div>

<style>
	.uploader {
		position: relative;
		padding: 3rem 2rem;
		background: var(--glass-bg);
		border: 2px dashed var(--glass-border);
		border-radius: var(--radius-xl);
		backdrop-filter: blur(var(--glass-blur));
		cursor: pointer;
		transition:
			border-color 0.3s ease,
			background 0.3s ease,
			box-shadow 0.3s ease;
		text-align: center;
	}

	.uploader:hover,
	.uploader.dragging {
		border-color: var(--accent-cyan);
		background: rgba(6, 182, 212, 0.03);
		box-shadow: 0 0 30px rgba(6, 182, 212, 0.08);
	}

	.uploader.has-file {
		border-style: solid;
		border-color: rgba(34, 197, 94, 0.3);
		background: rgba(34, 197, 94, 0.03);
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}

	.upload-icon-wrapper {
		width: 64px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.25rem;
		border-radius: var(--radius-lg);
		background: rgba(6, 182, 212, 0.08);
		border: 1px solid rgba(6, 182, 212, 0.15);
		color: var(--accent-cyan);
	}

	.upload-text {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.4rem;
	}

	.upload-hint {
		font-size: 0.88rem;
		color: var(--text-tertiary);
		margin-bottom: 1rem;
	}

	.supported-formats {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
	}

	.format-badge {
		padding: 0.2rem 0.6rem;
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-tertiary);
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		letter-spacing: 0.05em;
	}

	.file-info {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.file-icon {
		color: var(--accent-cyan);
	}

	.file-details {
		text-align: left;
	}

	.file-name {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 1rem;
	}

	.file-size {
		font-size: 0.82rem;
		color: var(--text-tertiary);
		margin-top: 0.15rem;
	}

	.file-check {
		color: #22c55e;
	}

	.parsing {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.parsing-text {
		font-weight: 600;
		color: var(--text-primary);
	}

	.parsing-hint {
		font-size: 0.85rem;
		color: var(--text-tertiary);
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--glass-border);
		border-top-color: var(--accent-cyan);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error {
		margin-top: 1rem;
		color: #ef4444;
		font-size: 0.9rem;
	}
</style>
