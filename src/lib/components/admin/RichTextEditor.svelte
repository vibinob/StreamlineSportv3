<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Image from '@tiptap/extension-image';
	import Link from '@tiptap/extension-link';
	import Placeholder from '@tiptap/extension-placeholder';
	import TextAlign from '@tiptap/extension-text-align';
	import Color from '@tiptap/extension-color';
	import { TextStyle } from '@tiptap/extension-text-style';
	import Underline from '@tiptap/extension-underline';
	import { Table } from '@tiptap/extension-table';
	import { TableRow } from '@tiptap/extension-table-row';
	import { TableCell } from '@tiptap/extension-table-cell';
	import { TableHeader } from '@tiptap/extension-table-header';
	import { ResizableImage } from '$lib/tiptap-extensions/resizable-image.js';
	import { CURRENT_CLUB_ID } from '$lib/clubs/currentClub.js';

	interface Props {
		value?: string;
		placeholder?: string;
		onChange?: (content: string) => void;
		height?: number;
	}

	let { value = $bindable(''), placeholder = '', onChange, height = 400 }: Props = $props();

	let editorContainer: HTMLDivElement | null = $state(null);
	let editor: Editor | null = $state(null);
	let imageUploadInput: HTMLInputElement | null = $state(null);
	let fileUploadInput: HTMLInputElement | null = $state(null);
	let fileDialogUploadInput: HTMLInputElement | null = $state(null);
	let uploadingImage = $state(false);
	let uploadingFile = $state(false);
	let showFileDialog = $state(false);
	let uploadedFiles = $state<Array<{ filename: string; url: string; size?: number }>>([]);
	let loadingFiles = $state(false);
	let showImageDialog = $state(false);
	let uploadedImages = $state<Array<{ filename: string; url: string; size?: number }>>([]);
	let loadingImages = $state(false);
	let imageDialogUploadInput: HTMLInputElement | null = $state(null);
	let showCodeView = $state(false);
	let codeViewTextarea: HTMLTextAreaElement | null = $state(null);

	onMount(() => {
		if (!browser || !editorContainer) return;

		editor = new Editor({
			element: editorContainer,
			extensions: [
				StarterKit.configure({
					heading: {
						levels: [1, 2, 3, 4, 5, 6]
					},
					// Disable link and underline from StarterKit since we're adding them separately with custom config
					link: false,
					underline: false
				}),
				// Use ResizableImage instead of regular Image extension
				ResizableImage,
				Link.configure({
					openOnClick: false,
					HTMLAttributes: {
						target: '_blank',
						rel: 'noopener noreferrer'
					}
				}),
				Placeholder.configure({
					placeholder: placeholder || 'Start typing...'
				}),
				TextAlign.configure({
					types: ['heading', 'paragraph']
				}),
				Color,
				TextStyle,
				Underline,
				Table.configure({
					resizable: true
				}),
				TableRow,
				TableCell,
				TableHeader
			],
			content: value || '',
			editorProps: {
				attributes: {
					class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
					style: `min-height: ${height}px;`
				}
			},
			onUpdate: ({ editor }) => {
				const html = editor.getHTML();
				value = html;
				onChange?.(html);
			}
		});

		// Set initial content
		if (value) {
			editor.commands.setContent(value);
		}
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
			editor = null;
		}
	});

	// Watch for external value changes (but not when in code view to avoid conflicts)
	$effect(() => {
		if (editor && !showCodeView) {
			const editorHtml = editor.getHTML();
			// Only update if value has actually changed and is different from editor content
			if (value !== editorHtml && value !== undefined) {
				// Use a small delay to ensure editor is ready
				setTimeout(() => {
					if (editor && !showCodeView) {
						editor.commands.setContent(value || '');
					}
				}, 0);
			}
		}
	});

	// Focus textarea when code view becomes active
	$effect(() => {
		if (showCodeView && codeViewTextarea) {
			// Use requestAnimationFrame to ensure the textarea is fully rendered
			requestAnimationFrame(() => {
				if (codeViewTextarea) {
					codeViewTextarea.focus();
					const length = codeViewTextarea.value.length;
					codeViewTextarea.setSelectionRange(length, length);
				}
			});
		}
	});

	// Toolbar functions
	function toggleBold() {
		editor?.chain().focus().toggleBold().run();
	}

	function toggleItalic() {
		editor?.chain().focus().toggleItalic().run();
	}

	function toggleUnderline() {
		editor?.chain().focus().toggleUnderline().run();
	}

	function toggleStrike() {
		editor?.chain().focus().toggleStrike().run();
	}

	function setHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
		editor?.chain().focus().toggleHeading({ level }).run();
	}

	function setParagraph() {
		editor?.chain().focus().setParagraph().run();
	}

	function toggleBulletList() {
		editor?.chain().focus().toggleBulletList().run();
	}

	function toggleOrderedList() {
		editor?.chain().focus().toggleOrderedList().run();
	}

	function toggleBlockquote() {
		editor?.chain().focus().toggleBlockquote().run();
	}

	function insertHorizontalRule() {
		editor?.chain().focus().setHorizontalRule().run();
	}

	function setLink() {
		const url = window.prompt('Enter URL:');
		if (url) {
			editor?.chain().focus().setLink({ href: url }).run();
		}
	}

	function addImage() {
		const url = window.prompt('Enter image URL:');
		if (url && editor) {
			editor.chain().focus().setImage({ src: url, alt: '' }).run();
		}
	}

	async function uploadImage(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file || !editor) return;

		uploadingImage = true;
		try {
			const formData = new FormData();
			formData.append('image', file);
			formData.append('club_id', CURRENT_CLUB_ID);

			const response = await fetch('/api/news/upload-image', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error('Failed to upload image');
			}

			const result = await response.json();
			if (result.success && result.url) {
				editor.chain().focus().setImage({ src: result.url, alt: result.filename || '' }).run();
			} else {
				throw new Error(result.error || 'Upload failed');
			}
		} catch (error) {
			console.error('Error uploading image:', error);
			alert('Failed to upload image. Please try again.');
		} finally {
			uploadingImage = false;
			if (imageUploadInput) {
				imageUploadInput.value = '';
			}
		}
	}

	function triggerImageUpload() {
		imageUploadInput?.click();
	}

	async function loadUploadedImages() {
		loadingImages = true;
		try {
			const response = await fetch(`/api/news/images?club_id=${CURRENT_CLUB_ID}`);
			if (!response.ok) {
				throw new Error('Failed to load images');
			}
			const result = await response.json();
			if (result.success && result.images) {
				uploadedImages = result.images;
			}
		} catch (error) {
			console.error('Error loading images:', error);
			uploadedImages = [];
		} finally {
			loadingImages = false;
		}
	}

	function openImageDialog() {
		showImageDialog = true;
		loadUploadedImages();
	}

	function closeImageDialog() {
		showImageDialog = false;
	}

	function insertImage(image: { filename: string; url: string }) {
		if (editor) {
			editor.chain().focus().setImage({ src: image.url, alt: image.filename }).run();
		}
		closeImageDialog();
	}

	async function uploadImageFromDialog(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		uploadingImage = true;
		try {
			const formData = new FormData();
			formData.append('image', file);
			formData.append('club_id', CURRENT_CLUB_ID);

			const response = await fetch('/api/news/upload-image', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error('Failed to upload image');
			}

			const result = await response.json();
			if (result.success && result.url) {
				// Reload image list
				await loadUploadedImages();
				// Optionally insert the image immediately
				insertImage({ filename: result.filename, url: result.url });
			} else {
				throw new Error(result.error || 'Upload failed');
			}
		} catch (error) {
			console.error('Error uploading image:', error);
			alert('Failed to upload image. Please try again.');
		} finally {
			uploadingImage = false;
			if (imageDialogUploadInput) {
				imageDialogUploadInput.value = '';
			}
		}
	}

	async function uploadFile(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file || !editor) return;

		uploadingFile = true;
		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('club_id', CURRENT_CLUB_ID);

			const response = await fetch('/api/news/upload-file', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error('Failed to upload file');
			}

			const result = await response.json();
			if (result.success && result.url) {
				// Insert link to the file
				const fileName = result.filename || file.name;
				editor.chain().focus().insertContent(`<a href="${result.url}" target="_blank" rel="noopener noreferrer">${fileName}</a>`).run();
			} else {
				throw new Error(result.error || 'Upload failed');
			}
		} catch (error) {
			console.error('Error uploading file:', error);
			alert('Failed to upload file. Please try again.');
		} finally {
			uploadingFile = false;
			if (fileUploadInput) {
				fileUploadInput.value = '';
			}
		}
	}

	function triggerFileUpload() {
		fileUploadInput?.click();
	}

	async function loadUploadedFiles() {
		loadingFiles = true;
		try {
			const response = await fetch(`/api/news/files?club_id=${CURRENT_CLUB_ID}`);
			if (!response.ok) {
				throw new Error('Failed to load files');
			}
			const result = await response.json();
			if (result.success && result.files) {
				uploadedFiles = result.files;
			}
		} catch (error) {
			console.error('Error loading files:', error);
			uploadedFiles = [];
		} finally {
			loadingFiles = false;
		}
	}

	function openFileDialog() {
		showFileDialog = true;
		loadUploadedFiles();
	}

	function closeFileDialog() {
		showFileDialog = false;
	}

	function insertFile(file: { filename: string; url: string }) {
		if (editor) {
			editor.chain().focus().insertContent(`<a href="${file.url}" target="_blank" rel="noopener noreferrer">${file.filename}</a>`).run();
		}
		closeFileDialog();
	}

	async function uploadFileFromDialog(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		uploadingFile = true;
		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('club_id', CURRENT_CLUB_ID);

			const response = await fetch('/api/news/upload-file', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error('Failed to upload file');
			}

			const result = await response.json();
			if (result.success && result.url) {
				// Reload file list
				await loadUploadedFiles();
				// Optionally insert the file immediately
				insertFile({ filename: result.filename, url: result.url });
			} else {
				throw new Error(result.error || 'Upload failed');
			}
		} catch (error) {
			console.error('Error uploading file:', error);
			alert('Failed to upload file. Please try again.');
		} finally {
			uploadingFile = false;
			if (fileDialogUploadInput) {
				fileDialogUploadInput.value = '';
			}
		}
	}

	// Table functions
	function insertTable() {
		editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
	}

	function addColumnBefore() {
		editor?.chain().focus().addColumnBefore().run();
	}

	function addColumnAfter() {
		editor?.chain().focus().addColumnAfter().run();
	}

	function deleteColumn() {
		editor?.chain().focus().deleteColumn().run();
	}

	function addRowBefore() {
		editor?.chain().focus().addRowBefore().run();
	}

	function addRowAfter() {
		editor?.chain().focus().addRowAfter().run();
	}

	function deleteRow() {
		editor?.chain().focus().deleteRow().run();
	}

	function deleteTable() {
		editor?.chain().focus().deleteTable().run();
	}

	function mergeCells() {
		editor?.chain().focus().mergeCells().run();
	}

	function splitCell() {
		editor?.chain().focus().splitCell().run();
	}

	function toggleHeaderColumn() {
		editor?.chain().focus().toggleHeaderColumn().run();
	}

	function toggleHeaderRow() {
		editor?.chain().focus().toggleHeaderRow().run();
	}

	function toggleHeaderCell() {
		editor?.chain().focus().toggleHeaderCell().run();
	}

	function setTextAlign(align: 'left' | 'center' | 'right' | 'justify') {
		editor?.chain().focus().setTextAlign(align).run();
	}

	function setColor(color: string) {
		editor?.chain().focus().setColor(color).run();
	}

	function undo() {
		editor?.chain().focus().undo().run();
	}

	function redo() {
		editor?.chain().focus().redo().run();
	}

	function toggleCodeView() {
		const wasInCodeView = showCodeView;
		showCodeView = !showCodeView;
		
		if (wasInCodeView) {
			// Switching from code view to editor view
			// Update editor with current HTML value
			// Use multiple animation frames to ensure DOM is fully updated and editor container is visible
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					if (editor && editorContainer) {
						const newHtml = value || '';
						// Always update the editor content when switching back from code view
						editor.commands.setContent(newHtml);
						// Force editor to focus to ensure it's active
						editor.commands.focus();
					}
				});
			});
		} else {
			// Switching from editor view to code view
			// Update code view with current editor HTML
			if (editor) {
				value = editor.getHTML();
			}
			// Focus will be handled by the $effect when codeViewTextarea becomes available
		}
	}
</script>

{#if browser}
	<div class="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
		<!-- Toolbar -->
		<div class="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
			<!-- Text Formatting -->
			<button
				type="button"
				onclick={toggleBold}
				class="px-2 py-1 rounded hover:bg-gray-200 {editor?.isActive('bold') ? 'bg-gray-300' : ''}"
				title="Bold"
			>
				<strong>B</strong>
			</button>
			<button
				type="button"
				onclick={toggleItalic}
				class="px-2 py-1 rounded hover:bg-gray-200 {editor?.isActive('italic') ? 'bg-gray-300' : ''}"
				title="Italic"
			>
				<em>I</em>
			</button>
			<button
				type="button"
				onclick={toggleUnderline}
				class="px-2 py-1 rounded hover:bg-gray-200 {editor?.isActive('underline') ? 'bg-gray-300' : ''}"
				title="Underline"
			>
				<u>U</u>
			</button>
			<button
				type="button"
				onclick={toggleStrike}
				class="px-2 py-1 rounded hover:bg-gray-200 {editor?.isActive('strike') ? 'bg-gray-300' : ''}"
				title="Strikethrough"
			>
				<s>S</s>
			</button>

			<div class="w-px h-6 bg-gray-300 mx-1"></div>

			<!-- Headings -->
			<button
				type="button"
				onclick={() => setHeading(1)}
				class="px-2 py-1 rounded hover:bg-gray-200 {editor?.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''}"
				title="Heading 1"
			>
				H1
			</button>
			<button
				type="button"
				onclick={() => setHeading(2)}
				class="px-2 py-1 rounded hover:bg-gray-200 {editor?.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''}"
				title="Heading 2"
			>
				H2
			</button>
			<button
				type="button"
				onclick={() => setHeading(3)}
				class="px-2 py-1 rounded hover:bg-gray-200 {editor?.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''}"
				title="Heading 3"
			>
				H3
			</button>
			<button
				type="button"
				onclick={setParagraph}
				class="px-2 py-1 rounded hover:bg-gray-200 {editor?.isActive('paragraph') ? 'bg-gray-300' : ''}"
				title="Paragraph"
			>
				P
			</button>

			<div class="w-px h-6 bg-gray-300 mx-1"></div>

			<!-- Lists -->
			<button
				type="button"
				onclick={toggleBulletList}
				class="px-2 py-1 rounded hover:bg-gray-200 {editor?.isActive('bulletList') ? 'bg-gray-300' : ''}"
				title="Bullet List"
			>
				•
			</button>
			<button
				type="button"
				onclick={toggleOrderedList}
				class="px-2 py-1 rounded hover:bg-gray-200 {editor?.isActive('orderedList') ? 'bg-gray-300' : ''}"
				title="Numbered List"
			>
				1.
			</button>
			<button
				type="button"
				onclick={toggleBlockquote}
				class="px-2 py-1 rounded hover:bg-gray-200 {editor?.isActive('blockquote') ? 'bg-gray-300' : ''}"
				title="Quote"
			>
				"
			</button>
			<button
				type="button"
				onclick={insertHorizontalRule}
				class="px-2 py-1 rounded hover:bg-gray-200"
				title="Insert Horizontal Rule"
			>
				―
			</button>

			<div class="w-px h-6 bg-gray-300 mx-1"></div>

			<!-- Alignment -->
			<button
				type="button"
				onclick={() => setTextAlign('left')}
				class="px-2 py-1 rounded hover:bg-gray-200 {editor?.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''}"
				title="Align Left"
			>
				←
			</button>
			<button
				type="button"
				onclick={() => setTextAlign('center')}
				class="px-2 py-1 rounded hover:bg-gray-200 {editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''}"
				title="Align Center"
			>
				↔
			</button>
			<button
				type="button"
				onclick={() => setTextAlign('right')}
				class="px-2 py-1 rounded hover:bg-gray-200 {editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''}"
				title="Align Right"
			>
				→
			</button>
			<button
				type="button"
				onclick={() => setTextAlign('justify')}
				class="px-2 py-1 rounded hover:bg-gray-200 {editor?.isActive({ textAlign: 'justify' }) ? 'bg-gray-300' : ''}"
				title="Justify"
			>
				⇔
			</button>

			<div class="w-px h-6 bg-gray-300 mx-1"></div>

			<!-- Links & Images -->
			<button
				type="button"
				onclick={setLink}
				class="px-2 py-1 rounded hover:bg-gray-200 {editor?.isActive('link') ? 'bg-gray-300' : ''}"
				title="Insert Link"
			>
				🔗
			</button>
			<button
				type="button"
				onclick={openImageDialog}
				class="px-2 py-1 rounded hover:bg-gray-200"
				title="Image Manager - Upload or Insert Images"
				disabled={uploadingImage}
			>
				{uploadingImage ? '⏳' : '🖼️'}
			</button>
			<button
				type="button"
				onclick={addImage}
				class="px-2 py-1 rounded hover:bg-gray-200"
				title="Insert Image URL"
			>
				📷
			</button>
			<input
				type="file"
				bind:this={imageUploadInput}
				accept="image/*"
				onchange={uploadImage}
				class="hidden"
			/>
			<button
				type="button"
				onclick={openFileDialog}
				class="px-2 py-1 rounded hover:bg-gray-200"
				title="File Manager - Upload or Insert Files"
			>
				📎
			</button>
			<input
				type="file"
				bind:this={fileUploadInput}
				accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
				onchange={uploadFile}
				class="hidden"
			/>

			<div class="w-px h-6 bg-gray-300 mx-1"></div>

			<!-- Table -->
			<button
				type="button"
				onclick={insertTable}
				class="px-2 py-1 rounded hover:bg-gray-200"
				title="Insert Table"
			>
				📊
			</button>
			{#if editor?.isActive('table')}
				<button
					type="button"
					onclick={addColumnBefore}
					class="px-2 py-1 rounded hover:bg-gray-200"
					title="Add Column Before"
				>
					⬅️+
				</button>
				<button
					type="button"
					onclick={addColumnAfter}
					class="px-2 py-1 rounded hover:bg-gray-200"
					title="Add Column After"
				>
					+➡️
				</button>
				<button
					type="button"
					onclick={deleteColumn}
					class="px-2 py-1 rounded hover:bg-gray-200"
					title="Delete Column"
				>
					🗑️⬇️
				</button>
				<button
					type="button"
					onclick={addRowBefore}
					class="px-2 py-1 rounded hover:bg-gray-200"
					title="Add Row Before"
				>
					⬆️+
				</button>
				<button
					type="button"
					onclick={addRowAfter}
					class="px-2 py-1 rounded hover:bg-gray-200"
					title="Add Row After"
				>
					+⬇️
				</button>
				<button
					type="button"
					onclick={deleteRow}
					class="px-2 py-1 rounded hover:bg-gray-200"
					title="Delete Row"
				>
					🗑️➡️
				</button>
				<button
					type="button"
					onclick={deleteTable}
					class="px-2 py-1 rounded hover:bg-gray-200"
					title="Delete Table"
				>
					🗑️📊
				</button>
			{/if}

			<div class="w-px h-6 bg-gray-300 mx-1"></div>

			<!-- Color -->
			<input
				type="color"
				onchange={(e) => {
					const target = e.target as HTMLInputElement;
					if (target.value) setColor(target.value);
				}}
				class="w-8 h-8 rounded border border-gray-300 cursor-pointer"
				title="Text Color"
			/>

			<div class="w-px h-6 bg-gray-300 mx-1"></div>

			<!-- Undo/Redo -->
			<button
				type="button"
				onclick={undo}
				class="px-2 py-1 rounded hover:bg-gray-200"
				title="Undo"
			>
				↶
			</button>
			<button
				type="button"
				onclick={redo}
				class="px-2 py-1 rounded hover:bg-gray-200"
				title="Redo"
			>
				↷
			</button>

			<div class="w-px h-6 bg-gray-300 mx-1"></div>

			<!-- Code View Toggle -->
			<button
				type="button"
				onclick={toggleCodeView}
				class="px-2 py-1 rounded hover:bg-gray-200 {showCodeView ? 'bg-gray-300' : ''}"
				title={showCodeView ? 'Switch to Visual Editor' : 'Switch to Code View (HTML)'}
			>
				{#if showCodeView}
					👁️
				{:else}
					&lt;/&gt;
				{/if}
			</button>
		</div>

		<!-- Editor or Code View -->
		{#if showCodeView}
			<textarea
				bind:this={codeViewTextarea}
				bind:value={value}
				oninput={(e) => {
					const target = e.target as HTMLTextAreaElement;
					value = target.value;
					onChange?.(target.value);
				}}
				class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg font-mono text-sm min-h-[200px] resize-y"
				style="min-height: {height}px;"
				placeholder="HTML code will appear here..."
			></textarea>
		{/if}
		<!-- Always keep editor container in DOM, just hide it when in code view -->
		<div 
			bind:this={editorContainer} 
			class="min-h-[200px]"
			style="display: {showCodeView ? 'none' : 'block'};"
		></div>
	</div>

	<!-- Image Dialog -->
	{#if showImageDialog}
		<div 
			class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
			onclick={closeImageDialog}
			onkeydown={(e) => e.key === 'Escape' && closeImageDialog()}
			role="button"
			tabindex="0"
			aria-label="Close image dialog"
		>
			<div 
				class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto" 
				onclick={(e) => e.stopPropagation()} 
				onkeydown={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="image-dialog-title"
				tabindex="-1"
			>
				<div class="flex justify-between items-center mb-4">
					<h3 id="image-dialog-title" class="text-xl font-bold">Image Manager</h3>
					<button
						type="button"
						onclick={closeImageDialog}
						class="text-gray-500 hover:text-gray-700 text-2xl"
					>
						×
					</button>
				</div>

				<!-- Upload New Image Section -->
				<div class="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
					<label for="image-dialog-upload" class="block text-sm font-bold mb-2">Upload New Image:</label>
					<div class="flex gap-2 items-center">
						<input
							id="image-dialog-upload"
							type="file"
							bind:this={imageDialogUploadInput}
							accept="image/*"
							onchange={uploadImageFromDialog}
							class="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg"
							disabled={uploadingImage}
						/>
						{#if uploadingImage}
							<span class="text-sm text-gray-500">Uploading...</span>
						{/if}
					</div>
					<p class="text-xs text-gray-500 mt-2">
						Supported: JPG, JPEG, PNG, GIF, WEBP, SVG
					</p>
				</div>

				<!-- Images List -->
				<div>
					<h4 class="text-lg font-bold mb-3">Uploaded Images:</h4>
					{#if loadingImages}
						<div class="text-center py-8 text-gray-500">Loading images...</div>
					{:else if uploadedImages.length === 0}
						<div class="text-center py-8 text-gray-500">No images uploaded yet.</div>
					{:else}
						<div class="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
							{#each uploadedImages as image}
								<div class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
									<div class="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
										<img 
											src={image.url} 
											alt={image.filename}
											class="max-w-full max-h-full object-contain"
											loading="lazy"
										/>
									</div>
									<div class="p-3">
										<p class="text-xs font-medium truncate mb-1" title={image.filename}>{image.filename}</p>
										{#if image.size}
											<p class="text-xs text-gray-500 mb-2">{(image.size / 1024).toFixed(2)} KB</p>
										{/if}
										<button
											type="button"
											onclick={() => insertImage(image)}
											class="w-full px-3 py-2 bg-[#1a3a5f] text-white rounded-lg hover:bg-[#1a3a5f]/90 text-sm"
										>
											Insert
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- File Dialog -->
	{#if showFileDialog}
		<div 
			class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
			onclick={closeFileDialog}
			onkeydown={(e) => e.key === 'Escape' && closeFileDialog()}
			role="button"
			tabindex="0"
			aria-label="Close file dialog"
		>
			<div 
				class="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto" 
				onclick={(e) => e.stopPropagation()} 
				onkeydown={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="file-dialog-title"
				tabindex="-1"
			>
				<div class="flex justify-between items-center mb-4">
					<h3 id="file-dialog-title" class="text-xl font-bold">File Manager</h3>
					<button
						type="button"
						onclick={closeFileDialog}
						class="text-gray-500 hover:text-gray-700 text-2xl"
					>
						×
					</button>
				</div>

				<!-- Upload New File Section -->
				<div class="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
					<label for="file-dialog-upload" class="block text-sm font-bold mb-2">Upload New File:</label>
					<div class="flex gap-2 items-center">
						<input
							id="file-dialog-upload"
							type="file"
							bind:this={fileDialogUploadInput}
							accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
							onchange={uploadFileFromDialog}
							class="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg"
							disabled={uploadingFile}
						/>
						{#if uploadingFile}
							<span class="text-sm text-gray-500">Uploading...</span>
						{/if}
					</div>
					<p class="text-xs text-gray-500 mt-2">
						Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, ZIP, RAR, 7Z
					</p>
				</div>

				<!-- Files List -->
				<div>
					<h4 class="text-lg font-bold mb-3">Uploaded Files:</h4>
					{#if loadingFiles}
						<div class="text-center py-8 text-gray-500">Loading files...</div>
					{:else if uploadedFiles.length === 0}
						<div class="text-center py-8 text-gray-500">No files uploaded yet.</div>
					{:else}
						<div class="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
							{#each uploadedFiles as file}
								<div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
									<div class="flex items-center gap-3 flex-1 min-w-0">
										<span class="text-2xl">📄</span>
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium truncate" title={file.filename}>{file.filename}</p>
											{#if file.size}
												<p class="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
											{/if}
										</div>
									</div>
									<button
										type="button"
										onclick={() => insertFile(file)}
										class="px-4 py-2 bg-[#1a3a5f] text-white rounded-lg hover:bg-[#1a3a5f]/90 text-sm"
									>
										Insert
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
{:else}
	<textarea
		class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
		rows="10"
		placeholder={placeholder}
		disabled
	>{value}</textarea>
{/if}

<style>
	:global(.ProseMirror) {
		outline: none;
		padding: 1rem;
		min-height: 200px;
	}

	:global(.ProseMirror p.is-editor-empty:first-child::before) {
		color: #adb5bd;
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}

	/* Heading styles */
	:global(.ProseMirror h1) {
		font-size: 2.25rem;
		font-weight: 800;
		line-height: 1.2;
		margin-top: 0;
		margin-bottom: 0.75rem;
		color: #1a3a5f;
	}

	:global(.ProseMirror h2) {
		font-size: 1.875rem;
		font-weight: 700;
		line-height: 1.3;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		color: #1a3a5f;
	}

	:global(.ProseMirror h3) {
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 1.4;
		margin-top: 1.25rem;
		margin-bottom: 0.5rem;
		color: #1a3a5f;
	}

	:global(.ProseMirror h4) {
		font-size: 1.25rem;
		font-weight: 600;
		line-height: 1.5;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
		color: #1a3a5f;
	}

	:global(.ProseMirror h5) {
		font-size: 1.125rem;
		font-weight: 600;
		line-height: 1.5;
		margin-top: 0.75rem;
		margin-bottom: 0.5rem;
		color: #1a3a5f;
	}

	:global(.ProseMirror h6) {
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.5;
		margin-top: 0.75rem;
		margin-bottom: 0.5rem;
		color: #1a3a5f;
	}

	:global(.ProseMirror img) {
		max-width: 100%;
		height: auto;
	}

	:global(.resizable-image-wrapper) {
		position: relative;
		display: inline-block;
		max-width: 100%;
		margin: 0.5rem 0;
	}

	:global(.resizable-image-wrapper img) {
		display: block;
		max-width: 100%;
		height: auto;
	}

	:global(.resizable-image-wrapper .resize-handle) {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 16px;
		height: 16px;
		background: #1a3a5f;
		border: 2px solid white;
		border-radius: 2px;
		cursor: nwse-resize;
		opacity: 0;
		transition: opacity 0.2s;
		z-index: 10;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	:global(.resizable-image-wrapper:hover .resize-handle),
	:global(.resizable-image-wrapper.selected .resize-handle) {
		opacity: 1;
	}

	:global(.ProseMirror .resizable-image-wrapper.ProseMirror-selectednode) {
		outline: 2px solid #1a3a5f;
		outline-offset: 2px;
	}

	:global(.ProseMirror a) {
		color: #1a3a5f;
		text-decoration: underline;
	}

	/* List styles */
	:global(.ProseMirror ul) {
		list-style-type: disc;
		padding-left: 1.5rem;
		margin: 0.75rem 0;
	}

	:global(.ProseMirror ul li) {
		display: list-item;
		margin: 0.25rem 0;
		padding-left: 0.25rem;
	}

	:global(.ProseMirror ul ul) {
		list-style-type: circle;
		margin-top: 0.25rem;
		margin-bottom: 0.25rem;
	}

	:global(.ProseMirror ul ul ul) {
		list-style-type: square;
	}

	:global(.ProseMirror ol) {
		list-style-type: decimal;
		padding-left: 1.5rem;
		margin: 0.75rem 0;
	}

	:global(.ProseMirror ol li) {
		display: list-item;
		margin: 0.25rem 0;
		padding-left: 0.25rem;
	}

	:global(.ProseMirror ol ol) {
		list-style-type: lower-alpha;
		margin-top: 0.25rem;
		margin-bottom: 0.25rem;
	}

	:global(.ProseMirror ol ol ol) {
		list-style-type: lower-roman;
	}

	:global(.ProseMirror blockquote) {
		border-left: 4px solid #1a3a5f;
		padding-left: 1rem;
		margin: 1rem 0;
		font-style: italic;
	}

	:global(.ProseMirror table) {
		border-collapse: collapse;
		margin: 1rem 0;
		table-layout: fixed;
		width: 100%;
	}

	:global(.ProseMirror table td, .ProseMirror table th) {
		min-width: 1em;
		border: 1px solid #ddd;
		padding: 6px 8px;
		vertical-align: top;
		box-sizing: border-box;
		position: relative;
	}

	:global(.ProseMirror table th) {
		font-weight: bold;
		text-align: left;
		background-color: #f1f3f5;
	}

	:global(.ProseMirror table .selectedCell:after) {
		z-index: 2;
		position: absolute;
		content: '';
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: rgba(200, 200, 255, 0.4);
		pointer-events: none;
	}

	:global(.ProseMirror table .column-resize-handle) {
		position: absolute;
		right: -2px;
		top: 0;
		bottom: -2px;
		width: 4px;
		background-color: #adf;
		pointer-events: none;
	}
</style>
