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
		deleteGalleryImage
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
	/** @type {File | null} */
	let selectedFile = $state(null);
	/** @type {HTMLInputElement | null} */
	let fileInput = $state(null);

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
			selectedFile = target.files[0];
		}
	}

	// Upload image
	async function uploadImage() {
		if (!selectedFile || !galleryId) return;

		uploading = true;
		error = null;
		try {
			const result = await uploadGalleryImage(galleryId, CURRENT_CLUB_ID, selectedFile);
			if (result.success) {
				selectedFile = null;
				if (fileInput) {
					fileInput.value = '';
				}
				await loadImages();
			} else {
				throw new Error(result.error || 'Failed to upload image');
			}
		} catch (err) {
			console.error('Error uploading image:', err);
			error = err instanceof Error ? err.message : 'Failed to upload image';
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
			</div>
		</div>

		<!-- Upload Section -->
		<div class="bg-white rounded-lg shadow-md p-6 mb-6">
			<h2 class="text-xl font-bold text-gray-800 mb-4">
				{lang === 'fr' ? 'Ajouter une image' : 'Add Image'}
			</h2>
			<div class="flex gap-4 items-end">
				<div class="flex-1">
					<label class="block text-sm font-bold mb-2">
						{lang === 'fr' ? 'Sélectionner une image' : 'Select Image'}
					</label>
					<input
						bind:this={fileInput}
						type="file"
						accept="image/*"
						onchange={handleFileSelect}
						class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
					/>
					{#if selectedFile}
						<p class="text-sm text-gray-600 mt-2">{selectedFile.name}</p>
					{/if}
				</div>
				<button
					type="button"
					onclick={uploadImage}
					disabled={!selectedFile || uploading}
					class="bg-[#1a3a5f] text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{uploading
						? (lang === 'fr' ? 'Téléchargement...' : 'Uploading...')
						: (lang === 'fr' ? 'Télécharger' : 'Upload')}
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
			<!-- Images Grid -->
			<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
				{#each images as image}
					<div class="bg-white rounded-lg shadow-md overflow-hidden">
						<div class="relative aspect-square">
							<img
								src={getImageUrl(image.thumbnail_filename, true)}
								alt={image.image_filename}
								class="w-full h-full object-cover"
								loading="lazy"
							/>
							<button
								type="button"
								onclick={() => deleteImage(image)}
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
		{/if}
	</div>
</div>

<AdminFooter />

