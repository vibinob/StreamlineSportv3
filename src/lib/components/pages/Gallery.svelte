<script>
	import { onMount } from 'svelte';
	import { CURRENT_CLUB_ID } from '$lib/clubs/currentClub.js';
	import { getPublicGalleries } from '$lib/apis/gallery-api';
	import { getGalleryImages } from '$lib/apis/gallery-images-api';

	// Props
	let { lang = 'fr' } = $props();

	// State
	/** @type {any[]} */
	let galleries = $state([]);
	/** @type {any[]} */
	let images = $state([]);
	let loading = $state(false);
	/** @type {string | null} */
	let error = $state(null);
	/** @type {any | null} */
	let selectedGallery = $state(null);
	/** @type {any | null} */
	let selectedImageForView = $state(null);
	let showImageModal = $state(false);
	let currentImageIndex = $state(0);

	// Load galleries
	async function loadGalleries() {
		loading = true;
		error = null;
		try {
			const result = await getPublicGalleries();
			if (result.success && result.data) {
				// Filter only active galleries (status = 1) - API already filters member_only=0
				galleries = result.data.filter((g) => g.status === 1);
				// Sort by order
				galleries.sort((a, b) => a.order - b.order);
				// Select first gallery by default
				if (galleries.length > 0 && !selectedGallery) {
					selectedGallery = galleries[0];
					await loadImages(galleries[0].id);
				}
			} else {
				throw new Error(result.error || 'Failed to load galleries');
			}
		} catch (err) {
			console.error('Error loading galleries:', err);
			error = err instanceof Error ? err.message : 'Failed to load galleries';
		} finally {
			loading = false;
		}
	}

	// Load images for selected gallery
	/**
	 * @param {number} galleryId
	 */
	async function loadImages(galleryId) {
		if (!galleryId) return;
		loading = true;
		error = null;
		try {
			const result = await getGalleryImages(galleryId);
			if (result.success && result.data) {
				// Filter only active images (status = 1) and sort by order
				images = result.data.filter((img) => img.status === 1);
				images.sort((a, b) => a.order - b.order);
			} else {
				throw new Error(result.error || 'Failed to load images');
			}
		} catch (err) {
			console.error('Error loading images:', err);
			error = err instanceof Error ? err.message : 'Failed to load images';
			images = [];
		} finally {
			loading = false;
		}
	}

	// Handle gallery selection
	/**
	 * @param {any} gallery
	 */
	function selectGallery(gallery) {
		if (gallery) {
			selectedGallery = gallery;
			loadImages(gallery.id);
		}
	}

	// Get image URL
	/**
	 * @param {string} filename
	 * @param {boolean} isThumbnail
	 */
	function getImageUrl(filename, isThumbnail = false) {
		if (!selectedGallery) return '';
		if (isThumbnail) {
			return `/images/clubs/${CURRENT_CLUB_ID}/gallery/${selectedGallery.id}/thumbnail/${filename}`;
		}
		return `/images/clubs/${CURRENT_CLUB_ID}/gallery/${selectedGallery.id}/${filename}`;
	}

	// Open image modal
	/**
	 * @param {any} image
	 */
	function openImageModal(image) {
		const index = images.findIndex((img) => img.id === image.id);
		if (index !== -1) {
			currentImageIndex = index;
			selectedImageForView = image;
			showImageModal = true;
		}
	}

	// Close image modal
	function closeImageModal() {
		showImageModal = false;
		selectedImageForView = null;
		currentImageIndex = 0;
	}

	// Navigate to previous image
	function previousImage() {
		if (currentImageIndex > 0) {
			currentImageIndex--;
			selectedImageForView = images[currentImageIndex];
		} else {
			// Loop to last image
			currentImageIndex = images.length - 1;
			selectedImageForView = images[currentImageIndex];
		}
	}

	// Navigate to next image
	function nextImage() {
		if (currentImageIndex < images.length - 1) {
			currentImageIndex++;
			selectedImageForView = images[currentImageIndex];
		} else {
			// Loop to first image
			currentImageIndex = 0;
			selectedImageForView = images[currentImageIndex];
		}
	}

	// Get gallery name based on language
	/**
	 * @param {any} gallery
	 */
	function getGalleryName(gallery) {
		if (!gallery) return '';
		return lang === 'fr' ? gallery.gallery_name_fr : gallery.gallery_name_en;
	}

	// Get gallery description based on language
	/**
	 * @param {any} gallery
	 */
	function getGalleryDescription(gallery) {
		if (!gallery) return '';
		return lang === 'fr' ? gallery.description_fr : gallery.description_en;
	}

	onMount(() => {
		loadGalleries();
	});
</script>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="container mx-auto px-4 max-w-7xl">
		<!-- Page Header -->
		<div class="mb-8">
			<h1 class="text-4xl font-bold text-gray-800 mb-4">
				{lang === 'fr' ? 'Galerie' : 'Gallery'}
			</h1>
			<p class="text-gray-600 text-lg">
				{lang === 'fr'
					? 'Découvrez nos galeries de photos'
					: 'Discover our photo galleries'}
			</p>
		</div>

		<!-- Gallery Navigation Tabs -->
		{#if galleries.length > 0}
			<div class="bg-white rounded-lg shadow-md p-4 mb-8">
				<div class="flex flex-wrap gap-2 mb-3">
					{#each galleries as gallery}
						<button
							type="button"
							onclick={() => selectGallery(gallery)}
							class="px-4 py-2 rounded-lg font-semibold transition-all {selectedGallery?.id === gallery.id
								? 'bg-[#1a3a5f] text-white shadow-md'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
						>
							{getGalleryName(gallery)}
						</button>
					{/each}
				</div>
				<!-- Description below tabs -->
				{#if selectedGallery && getGalleryDescription(selectedGallery)}
					<p class="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200">
						{getGalleryDescription(selectedGallery)}
					</p>
				{/if}
			</div>
		{/if}

		<!-- Error Message -->
		{#if error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
				{error}
			</div>
		{/if}

		<!-- Loading State -->
		{#if loading && images.length === 0}
			<div class="bg-white rounded-lg shadow-md p-8 text-center">
				<p class="text-gray-600">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</p>
			</div>
		{:else if selectedGallery && images.length === 0}
			<!-- Empty State -->
			<div class="bg-white rounded-lg shadow-md p-8 text-center">
				<p class="text-gray-600">
					{lang === 'fr' ? 'Aucune image dans cette galerie' : 'No images in this gallery'}
				</p>
			</div>
		{:else if images.length > 0}
			<!-- Images Grid -->
			<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{#each images as image}
					<button
						type="button"
						onclick={() => openImageModal(image)}
						class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer p-0 border-0"
					>
						<div class="relative aspect-square">
							<img
								src={getImageUrl(image.thumbnail_filename, true)}
								alt={image.image_filename}
								class="w-full h-full object-cover"
								loading="lazy"
							/>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Image Lightbox Modal -->
{#if showImageModal && selectedImageForView}
	<div
		class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
		role="button"
		tabindex="0"
		onkeydown={(e) => {
			if (e.key === 'Escape') closeImageModal();
			if (e.key === 'ArrowLeft') previousImage();
			if (e.key === 'ArrowRight') nextImage();
		}}
		aria-label={lang === 'fr' ? 'Fermer la modal' : 'Close modal'}
	>
		<div
			class="relative max-w-7xl max-h-[90vh] mx-4 w-full"
			role="dialog"
			aria-modal="true"
			aria-label={lang === 'fr' ? 'Image en grand' : 'Full size image'}
			tabindex="-1"
		>
			<!-- Close Button -->
			<button
				type="button"
				onclick={closeImageModal}
				class="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
				title={lang === 'fr' ? 'Fermer' : 'Close'}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			<!-- Previous Button -->
			{#if images.length > 1}
				<button
					type="button"
					onclick={previousImage}
					class="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-3 z-10"
					title={lang === 'fr' ? 'Précédent' : 'Previous'}
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				</button>
			{/if}

			<!-- Next Button -->
			{#if images.length > 1}
				<button
					type="button"
					onclick={nextImage}
					class="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-3 z-10"
					title={lang === 'fr' ? 'Suivant' : 'Next'}
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</button>
			{/if}

			<!-- Image Container -->
			<div
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => {
					// Allow Escape and arrow keys to bubble up for modal control
					if (e.key !== 'Escape' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
						e.stopPropagation();
					}
				}}
				role="presentation"
			>
				<img
					src={getImageUrl(selectedImageForView.image_filename, false)}
					alt={selectedImageForView.image_filename}
					class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl mx-auto block"
				/>
			</div>

			<!-- Image Info and Counter -->
			<div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
				<p class="text-sm font-medium">{selectedImageForView.image_filename}</p>
				{#if images.length > 1}
					<p class="text-xs text-gray-300 mt-1">
						{currentImageIndex + 1} / {images.length}
					</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

