<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import AdminHeader from '../../../../../../lib/components/admin/AdminHeader.svelte';
	import AdminFooter from '../../../../../../lib/components/admin/AdminFooter.svelte';
	import { onMount } from 'svelte';
	import { CURRENT_CLUB_ID } from '$lib/clubs/currentClub.js';
	import {
		getGalleryImages,
		uploadGalleryImage,
		deleteGalleryImage,
		updateGalleryImageOrder
	} from '$lib/apis/gallery-images-api';

	const lang = $derived.by(() => {
		const paramLang = $page.params.lang;
		if (paramLang === 'en' || paramLang === 'fr') {
			return paramLang;
		}
		return 'fr';
	});

	const galleryId = $derived.by(() => {
		const paramId = $page.params.galleryId;
		if (!paramId) return null;
		const id = parseInt(paramId, 10);
		return isNaN(id) ? null : id;
	});

	// State
	/** @type {any[]} */
	let images = $state([]);
	let loading = $state(false);
	/** @type {string | null} */
	let error = $state(null);
	let uploading = $state(false);
	/** @type {File[]} */
	let selectedFiles = $state([]);
	/** @type {HTMLInputElement | null} */
	let fileInput = $state(null);
	let isDragging = $state(false);
	let viewMode = $state('thumbnail'); // 'thumbnail' or 'list'
	/** @type {any | null} */
	let selectedImageForView = $state(null);
	let showImageModal = $state(false);

	// Load images
	async function loadImages() {
		if (!galleryId) return;
		loading = true;
		error = null;
		try {
			const result = await getGalleryImages(galleryId);
			if (result.success) {
				images = result.data || [];
			} else {
				throw new Error(result.error || 'Failed to load images');
			}
		} catch (err) {
			console.error('Error loading images:', err);
			error = err instanceof Error ? err.message : 'Failed to load images';
		} finally {
			loading = false;
		}
	}

	// Handle file selection
	/**
	 * @param {Event} e
	 */
	function handleFileSelect(e) {
		const target = /** @type {HTMLInputElement} */ (e.target);
		if (target && target.files && target.files.length > 0) {
			const filesArray = Array.from(target.files);
			selectedFiles = filesArray.filter((file) => file.type.startsWith('image/'));
		}
	}

	// Handle drag and drop
	/**
	 * @param {FileList | null} files
	 */
	function processFiles(files) {
		if (files && files.length > 0) {
			const filesArray = Array.from(files);
			const imageFiles = filesArray.filter((file) => file.type.startsWith('image/'));
			selectedFiles = [...selectedFiles, ...imageFiles];
		}
	}

	/**
	 * @param {DragEvent} e
	 */
	function handleDragOver(e) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = true;
	}

	/**
	 * @param {DragEvent} e
	 */
	function handleDragLeave(e) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = false;
	}

	/**
	 * @param {DragEvent} e
	 */
	function handleDrop(e) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = false;

		const files = e.dataTransfer?.files;
		if (files) {
			processFiles(files);
		}
	}

	// Remove file from selection
	/**
	 * @param {number} index
	 */
	function removeFile(index) {
		selectedFiles = selectedFiles.filter((_, i) => i !== index);
	}

	// Clear all selected files
	function clearFiles() {
		selectedFiles = [];
		if (fileInput) {
			fileInput.value = '';
		}
	}

	// Upload images
	async function uploadImages() {
		if (selectedFiles.length === 0 || !galleryId) return;

		uploading = true;
		error = null;
		try {
			// Upload all files sequentially
			for (const file of selectedFiles) {
				const result = await uploadGalleryImage(galleryId, CURRENT_CLUB_ID, file);
				if (!result.success) {
					throw new Error(result.error || `Failed to upload ${file.name}`);
				}
			}
			clearFiles();
			await loadImages();
		} catch (err) {
			console.error('Error uploading images:', err);
			error = err instanceof Error ? err.message : 'Failed to upload images';
		} finally {
			uploading = false;
		}
	}

	// Delete image
	/**
	 * @param {any} image
	 */
	async function deleteImage(image) {
		if (!galleryId || !confirm(lang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cette image?' : 'Are you sure you want to delete this image?')) {
			return;
		}

		try {
			const result = await deleteGalleryImage(galleryId, image.id, CURRENT_CLUB_ID);
			if (result.success) {
				await loadImages();
			} else {
				throw new Error(result.error || 'Failed to delete image');
			}
		} catch (err) {
			console.error('Error deleting image:', err);
			error = err instanceof Error ? err.message : 'Failed to delete image';
		}
	}

	// Move image up (decrease order)
	/**
	 * @param {any} image
	 */
	async function moveImageUp(image) {
		if (!galleryId) return;
		const currentIndex = images.findIndex((img) => img.id === image.id);
		if (currentIndex <= 0) return; // Already at top

		const previousImage = images[currentIndex - 1];
		const tempOrder = image.order;
		const newOrder = previousImage.order;

		try {
			// Swap orders
			await updateGalleryImageOrder(galleryId, image.id, newOrder);
			await updateGalleryImageOrder(galleryId, previousImage.id, tempOrder);
			await loadImages();
		} catch (err) {
			console.error('Error moving image up:', err);
			error = err instanceof Error ? err.message : 'Failed to move image';
		}
	}

	// Move image down (increase order)
	/**
	 * @param {any} image
	 */
	async function moveImageDown(image) {
		if (!galleryId) return;
		const currentIndex = images.findIndex((img) => img.id === image.id);
		if (currentIndex >= images.length - 1) return; // Already at bottom

		const nextImage = images[currentIndex + 1];
		const tempOrder = image.order;
		const newOrder = nextImage.order;

		try {
			// Swap orders
			await updateGalleryImageOrder(galleryId, image.id, newOrder);
			await updateGalleryImageOrder(galleryId, nextImage.id, tempOrder);
			await loadImages();
		} catch (err) {
			console.error('Error moving image down:', err);
			error = err instanceof Error ? err.message : 'Failed to move image';
		}
	}

	// Get image URL
	/**
	 * @param {string} filename
	 * @param {boolean} isThumbnail
	 */
	function getImageUrl(filename, isThumbnail = false) {
		if (isThumbnail) {
			return `/images/clubs/${CURRENT_CLUB_ID}/gallery/${galleryId}/thumbnail/${filename}`;
		}
		return `/images/clubs/${CURRENT_CLUB_ID}/gallery/${galleryId}/${filename}`;
	}

	// Open image modal
	/**
	 * @param {any} image
	 */
	function openImageModal(image) {
		selectedImageForView = image;
		showImageModal = true;
	}

	// Close image modal
	function closeImageModal() {
		showImageModal = false;
		selectedImageForView = null;
	}

	onMount(() => {
		loadImages();
	});
</script>

<svelte:head>
	<title>{lang === 'fr' ? 'Images de la galerie' : 'Gallery Images'} | Admin</title>
</svelte:head>

<AdminHeader />

<div class="min-h-screen bg-gray-50 py-8">
	<div class="container mx-auto px-4 max-w-7xl">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-md p-6 mb-6">
			<div class="flex justify-between items-center">
				<div>
					<button
						type="button"
						onclick={() => goto(`/${lang}/admin/gallery`)}
						class="text-[#1a3a5f] hover:text-[#F45E12] mb-2 flex items-center gap-2"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
						{lang === 'fr' ? 'Retour à la galerie' : 'Back to Gallery'}
					</button>
					<h1 class="text-3xl font-bold text-gray-800 mb-2">
						{lang === 'fr' ? 'Images de la galerie' : 'Gallery Images'}
					</h1>
					<p class="text-gray-600">
						{lang === 'fr'
							? 'Gérez les images de cette galerie'
							: 'Manage images for this gallery'}
					</p>
				</div>
				<!-- View Mode Toggle -->
				<div class="flex border border-gray-300 rounded-lg overflow-hidden">
					<button
						type="button"
						onclick={() => (viewMode = 'thumbnail')}
						class="px-4 py-2 {viewMode === 'thumbnail' ? 'bg-[#1a3a5f] text-white' : 'bg-white text-gray-700'} transition-colors"
					>
						{lang === 'fr' ? 'Miniatures' : 'Thumbnail'}
					</button>
					<button
						type="button"
						onclick={() => (viewMode = 'list')}
						class="px-4 py-2 {viewMode === 'list' ? 'bg-[#1a3a5f] text-white' : 'bg-white text-gray-700'} transition-colors"
					>
						{lang === 'fr' ? 'Liste' : 'List'}
					</button>
				</div>
			</div>
		</div>

		<!-- Upload Section -->
		<div class="bg-white rounded-lg shadow-md p-6 mb-6">
			<h2 class="text-xl font-bold text-gray-800 mb-4">
				{lang === 'fr' ? 'Ajouter une image' : 'Add Image'}
			</h2>
			
			<!-- Drag and Drop Zone -->
			<div
				role="button"
				tabindex="0"
				class="border-2 border-dashed rounded-lg p-8 mb-4 transition-colors cursor-pointer {isDragging
					? 'border-[#1a3a5f] bg-blue-50'
					: 'border-gray-300 hover:border-gray-400'}"
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				ondrop={handleDrop}
			>
				<div class="text-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-12 w-12 mx-auto text-gray-400 mb-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
						/>
					</svg>
					<p class="text-gray-600 mb-2">
						{lang === 'fr'
							? 'Glissez-déposez des images ici'
							: 'Drag and drop images here'}
					</p>
					<p class="text-sm text-gray-500">
						{lang === 'fr' ? 'ou' : 'or'}
					</p>
				</div>
			</div>

			<!-- File Input Option -->
			<div class="mb-4">
				<label class="block text-sm font-bold mb-2">
					{lang === 'fr' ? 'Sélectionner des fichiers' : 'Select Files'}
				</label>
				<input
					bind:this={fileInput}
					type="file"
					accept="image/*"
					multiple
					onchange={handleFileSelect}
					class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
				/>
			</div>

			<!-- Selected Files Info -->
			{#if selectedFiles.length > 0}
				<div class="mb-4 p-4 bg-gray-50 rounded-lg">
					<div class="flex justify-between items-center mb-3">
						<p class="text-sm font-bold text-gray-700">
							{lang === 'fr' ? 'Fichiers sélectionnés:' : 'Selected files:'} ({selectedFiles.length})
						</p>
						<button
							type="button"
							onclick={clearFiles}
							class="text-sm text-red-600 hover:text-red-800"
						>
							{lang === 'fr' ? 'Tout effacer' : 'Clear all'}
						</button>
					</div>
					<div class="space-y-2 max-h-48 overflow-y-auto">
						{#each selectedFiles as file, index}
							<div class="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
								<div class="flex-1 min-w-0">
									<p class="text-sm text-gray-700 truncate">{file.name}</p>
									<p class="text-xs text-gray-500">
										{(file.size / 1024 / 1024).toFixed(2)} MB
									</p>
								</div>
								<button
									type="button"
									onclick={() => removeFile(index)}
									class="ml-2 text-red-600 hover:text-red-800 p-1"
									title={lang === 'fr' ? 'Supprimer' : 'Remove'}
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Upload Button -->
			<div class="flex justify-end">
				<button
					type="button"
					onclick={uploadImages}
					disabled={selectedFiles.length === 0 || uploading}
					class="bg-[#1a3a5f] text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{uploading
						? (lang === 'fr' ? 'Téléchargement...' : 'Uploading...')
						: (lang === 'fr'
								? `Télécharger ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`
								: `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`)}
				</button>
			</div>
		</div>

		<!-- Error Message -->
		{#if error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
				{error}
			</div>
		{/if}

		<!-- Loading State -->
		{#if loading}
			<div class="bg-white rounded-lg shadow-md p-8 text-center">
				<p class="text-gray-600">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</p>
			</div>
		{:else if images.length === 0}
			<!-- Empty State -->
			<div class="bg-white rounded-lg shadow-md p-8 text-center">
				<p class="text-gray-600">
					{lang === 'fr' ? 'Aucune image trouvée' : 'No images found'}
				</p>
			</div>
		{:else}
			<!-- Images Display -->
			{#if viewMode === 'thumbnail'}
				<!-- Thumbnail View -->
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
					{#each images as image}
						<div class="bg-white rounded-lg shadow-md overflow-hidden">
							<div class="relative aspect-square">
								<button
									type="button"
									onclick={() => openImageModal(image)}
									class="w-full h-full p-0 border-0 bg-transparent cursor-pointer"
								>
									<img
										src={getImageUrl(image.thumbnail_filename, true)}
										alt={image.image_filename}
										class="w-full h-full object-cover"
										loading="lazy"
									/>
								</button>
								<button
									type="button"
									onclick={(e) => {
										e.stopPropagation();
										deleteImage(image);
									}}
									class="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
									title={lang === 'fr' ? 'Supprimer' : 'Delete'}
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							</div>
							<div class="p-3">
								<p class="text-xs text-gray-500 truncate">{image.image_filename}</p>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<!-- List View (Table) -->
				<div class="bg-white rounded-lg shadow-md overflow-hidden">
					<div class="overflow-x-auto">
						<table class="w-full min-w-[640px]">
						<thead class="bg-gray-100">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
									{lang === 'fr' ? 'Image' : 'Image'}
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									{lang === 'fr' ? 'Nom du fichier' : 'Filename'}
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									{lang === 'fr' ? 'Date de création' : 'Date Created'}
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">
									{lang === 'fr' ? 'Ordre' : 'Order'}
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							{#each images as image, index}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4">
										<button
											type="button"
											onclick={() => openImageModal(image)}
											class="p-0 border-0 bg-transparent cursor-pointer"
										>
											<img
												src={getImageUrl(image.thumbnail_filename, true)}
												alt={image.image_filename}
												class="w-20 h-20 object-cover rounded"
												loading="lazy"
											/>
										</button>
									</td>
									<td class="px-6 py-4">
										<p class="text-sm text-gray-800">{image.image_filename}</p>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<p class="text-sm text-gray-600">
											{new Date(image.date_created).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}
										</p>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex flex-col gap-1">
											<button
												type="button"
												onclick={() => moveImageUp(image)}
												disabled={index === 0}
												class="p-1 text-gray-600 hover:text-[#1a3a5f] disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
												title={lang === 'fr' ? 'Déplacer vers le haut' : 'Move up'}
											>
												<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
												</svg>
											</button>
											<button
												type="button"
												onclick={() => moveImageDown(image)}
												disabled={index === images.length - 1}
												class="p-1 text-gray-600 hover:text-[#1a3a5f] disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
												title={lang === 'fr' ? 'Déplacer vers le bas' : 'Move down'}
											>
												<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
												</svg>
											</button>
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<button
											type="button"
											onclick={() => deleteImage(image)}
											class="text-red-600 hover:text-red-800"
										>
											{lang === 'fr' ? 'Supprimer' : 'Delete'}
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Image Modal -->
{#if showImageModal && selectedImageForView}
	<div
		class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
		onclick={closeImageModal}
		role="button"
		tabindex="0"
		onkeydown={(e) => {
			if (e.key === 'Escape') closeImageModal();
		}}
		aria-label={lang === 'fr' ? 'Fermer la modal' : 'Close modal'}
	>
		<div
			class="relative max-w-7xl max-h-[90vh] mx-4"
			role="dialog"
			aria-modal="true"
			aria-label={lang === 'fr' ? 'Image en grand' : 'Full size image'}
			tabindex="-1"
		>
			<!-- Close Button -->
			<button
				type="button"
				onclick={closeImageModal}
				class="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
				title={lang === 'fr' ? 'Fermer' : 'Close'}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
			<!-- Image Container (prevents backdrop click from closing) -->
			<div
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => {
					// Allow Escape key to bubble up to close modal
					if (e.key !== 'Escape') {
						e.stopPropagation();
					}
				}}
				role="presentation"
			>
				<img
					src={getImageUrl(selectedImageForView.image_filename, false)}
					alt={selectedImageForView.image_filename}
					class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
				/>
			</div>
			<!-- Image Info -->
			<div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
				<p class="text-sm font-medium">{selectedImageForView.image_filename}</p>
				<p class="text-xs text-gray-300 mt-1">
					{new Date(selectedImageForView.date_created).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}
				</p>
			</div>
		</div>
	</div>
{/if}

<AdminFooter />

