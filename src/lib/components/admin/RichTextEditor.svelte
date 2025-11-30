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
	let uploadingImage = $state(false);
	let uploadingFile = $state(false);

	onMount(() => {
		if (!browser || !editorContainer) return;

		editor = new Editor({
			element: editorContainer,
			extensions: [
				StarterKit.configure({
					heading: {
						levels: [1, 2, 3, 4, 5, 6]
					}
				}),
				Image.configure({
					inline: true,
					allowBase64: true
				}),
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

	// Watch for external value changes
	$effect(() => {
		if (editor && value !== editor.getHTML()) {
			editor.commands.setContent(value || '');
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

	function setLink() {
		const url = window.prompt('Enter URL:');
		if (url) {
			editor?.chain().focus().setLink({ href: url }).run();
		}
	}

	function addImage() {
		const url = window.prompt('Enter image URL:');
		if (url) {
			editor?.chain().focus().setImage({ src: url }).run();
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
				editor.chain().focus().setImage({ src: result.url }).run();
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
				onclick={triggerImageUpload}
				class="px-2 py-1 rounded hover:bg-gray-200"
				title="Upload Image"
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
				onclick={triggerFileUpload}
				class="px-2 py-1 rounded hover:bg-gray-200"
				title="Upload File (PDF, DOC, XLS, etc.)"
				disabled={uploadingFile}
			>
				{uploadingFile ? '⏳' : '📎'}
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
		</div>

		<!-- Editor -->
		<div bind:this={editorContainer} class="min-h-[200px]"></div>
	</div>
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

	:global(.ProseMirror img) {
		max-width: 100%;
		height: auto;
	}

	:global(.ProseMirror a) {
		color: #1a3a5f;
		text-decoration: underline;
	}

	:global(.ProseMirror ul, .ProseMirror ol) {
		padding-left: 1.5rem;
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
