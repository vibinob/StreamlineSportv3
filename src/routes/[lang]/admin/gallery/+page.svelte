<script>
	import { page } from '$app/stores';
	import AdminHeader from '../../../../lib/components/admin/AdminHeader.svelte';
	import AdminFooter from '../../../../lib/components/admin/AdminFooter.svelte';
	import { onMount } from 'svelte';
	import {
		getGalleries,
		createGallery as createGalleryApi,
		updateGallery as updateGalleryApi,
		deleteGallery as deleteGalleryApi,
		updateGalleryOrder
	} from '$lib/apis/gallery-api';

	const lang = $derived.by(() => {
		const paramLang = $page.params.lang;
		if (paramLang === 'en' || paramLang === 'fr') {
			return paramLang;
		}
		return 'fr';
	});

	// State
	/** @type {any[]} */
	let galleries = $state([]);
	let loading = $state(false);
	/** @type {string | null} */
	let error = $state(null);
	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	/** @type {any | null} */
	let selectedGallery = $state(null);
	let viewMode = $state('grid'); // 'grid' or 'list'

	// Form state
	let formData = $state({
		gallery_name_en: '',
		gallery_name_fr: '',
		description_en: '',
		description_fr: '',
		order: 0,
		member_only: 0
	});

	// Load galleries
	async function loadGalleries() {
		loading = true;
		error = null;
		try {
			const result = await getGalleries();
			if (result.success) {
				galleries = result.data || [];
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

	// Open add modal
	function openAddModal() {
		formData = {
			gallery_name_en: '',
			gallery_name_fr: '',
			description_en: '',
			description_fr: '',
			order: galleries.length + 1,
			member_only: 0
		};
		showAddModal = true;
	}

	// Open edit modal
	/**
	 * @param {any} gallery
	 */
	function openEditModal(gallery) {
		selectedGallery = gallery;
		formData = {
			gallery_name_en: gallery.gallery_name_en || '',
			gallery_name_fr: gallery.gallery_name_fr || '',
			description_en: gallery.description_en || '',
			description_fr: gallery.description_fr || '',
			order: gallery.order || 0,
			member_only: gallery.member_only || 0
		};
		showEditModal = true;
	}

	// Open delete modal
	/**
	 * @param {any} gallery
	 */
	function openDeleteModal(gallery) {
		selectedGallery = gallery;
		showDeleteModal = true;
	}

	// Create gallery
	async function createGallery() {
		try {
			/** @type {any} */
			const galleryData = formData;
			await createGalleryApi(galleryData);
			showAddModal = false;
			await loadGalleries();
		} catch (err) {
			console.error('Error creating gallery:', err);
			error = err instanceof Error ? err.message : 'Failed to create gallery';
		}
	}

	// Update gallery
	async function updateGallery() {
		if (!selectedGallery) return;
		try {
			/** @type {any} */
			const galleryData = formData;
			await updateGalleryApi(selectedGallery.id, galleryData);
			showEditModal = false;
			selectedGallery = null;
			await loadGalleries();
		} catch (err) {
			console.error('Error updating gallery:', err);
			error = err instanceof Error ? err.message : 'Failed to update gallery';
		}
	}

	// Delete gallery
	async function deleteGallery() {
		if (!selectedGallery) return;
		try {
			await deleteGalleryApi(selectedGallery.id);
			showDeleteModal = false;
			selectedGallery = null;
			await loadGalleries();
		} catch (err) {
			console.error('Error deleting gallery:', err);
			error = err instanceof Error ? err.message : 'Failed to delete gallery';
		}
	}

	// Move gallery up (decrease order)
	/**
	 * @param {any} gallery
	 */
	async function moveGalleryUp(gallery) {
		const currentIndex = galleries.findIndex((g) => g.id === gallery.id);
		if (currentIndex <= 0) return; // Already at top

		const previousGallery = galleries[currentIndex - 1];
		const tempOrder = gallery.order;
		const newOrder = previousGallery.order;

		try {
			// Swap orders
			await updateGalleryOrder(gallery.id, newOrder);
			await updateGalleryOrder(previousGallery.id, tempOrder);
			await loadGalleries();
		} catch (err) {
			console.error('Error moving gallery up:', err);
			error = err instanceof Error ? err.message : 'Failed to move gallery';
		}
	}

	// Move gallery down (increase order)
	/**
	 * @param {any} gallery
	 */
	async function moveGalleryDown(gallery) {
		const currentIndex = galleries.findIndex((g) => g.id === gallery.id);
		if (currentIndex >= galleries.length - 1) return; // Already at bottom

		const nextGallery = galleries[currentIndex + 1];
		const tempOrder = gallery.order;
		const newOrder = nextGallery.order;

		try {
			// Swap orders
			await updateGalleryOrder(/** @type {any} */ (gallery).id, newOrder);
			await updateGalleryOrder(/** @type {any} */ (nextGallery).id, tempOrder);
			await loadGalleries();
		} catch (err) {
			console.error('Error moving gallery down:', err);
			error = err instanceof Error ? err.message : 'Failed to move gallery';
		}
	}

	onMount(() => {
		loadGalleries();
	});
</script>

<svelte:head>
	<title>{lang === 'fr' ? 'Galerie' : 'Gallery'} | Admin</title>
</svelte:head>

<AdminHeader />

<div class="min-h-screen bg-gray-50 py-8">
	<div class="container mx-auto px-4 max-w-7xl">
		<!-- Gallery Header -->
		<div class="bg-white rounded-lg shadow-md p-6 mb-6">
			<div class="flex justify-between items-center">
				<div>
					<h1 class="text-3xl font-bold text-gray-800 mb-2">
						{lang === 'fr' ? 'Galerie' : 'Gallery'}
					</h1>
					<p class="text-gray-600">
						{lang === 'fr'
							? 'Gérez vos galeries d\'images'
							: 'Manage your image galleries'}
					</p>
				</div>
				<div class="flex gap-3">
					<!-- View Mode Toggle -->
					<div class="flex border border-gray-300 rounded-lg overflow-hidden">
						<button
							type="button"
							onclick={() => (viewMode = 'grid')}
							class="px-4 py-2 {viewMode === 'grid' ? 'bg-[#1a3a5f] text-white' : 'bg-white text-gray-700'} transition-colors"
						>
							Grid
						</button>
						<button
							type="button"
							onclick={() => (viewMode = 'list')}
							class="px-4 py-2 {viewMode === 'list' ? 'bg-[#1a3a5f] text-white' : 'bg-white text-gray-700'} transition-colors"
						>
							List
						</button>
					</div>
					<!-- Add Button -->
					<button
						type="button"
						onclick={openAddModal}
						class="bg-[#1a3a5f] text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
					>
						{lang === 'fr' ? '+ Ajouter' : '+ Add'}
					</button>
				</div>
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
		{:else if galleries.length === 0}
			<!-- Empty State -->
			<div class="bg-white rounded-lg shadow-md p-8 text-center">
				<p class="text-gray-600">
					{lang === 'fr' ? 'Aucune galerie trouvée' : 'No galleries found'}
				</p>
			</div>
		{:else}
			<!-- Gallery Grid/List -->
			{#if viewMode === 'grid'}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each galleries as gallery}
						<div class="bg-white rounded-lg shadow-md p-6">
							<h3 class="text-xl font-bold text-gray-800 mb-2">
								{lang === 'fr' ? gallery.gallery_name_fr : gallery.gallery_name_en}
							</h3>
							<p class="text-gray-600 text-sm mb-4">
								{lang === 'fr' ? gallery.description_fr : gallery.description_en}
							</p>
							<div class="flex justify-between items-center text-sm text-gray-500 mb-4">
								<span>Order: {gallery.order}</span>
								<span>{gallery.member_only ? 'Members Only' : 'Public'}</span>
							</div>
							<div class="flex gap-2">
								<button
									type="button"
									onclick={() => openEditModal(gallery)}
									class="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
								>
									{lang === 'fr' ? 'Modifier' : 'Edit'}
								</button>
								<button
									type="button"
									onclick={() => openDeleteModal(gallery)}
									class="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
								>
									{lang === 'fr' ? 'Supprimer' : 'Delete'}
								</button>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<!-- List View -->
				<div class="bg-white rounded-lg shadow-md overflow-hidden">
					<table class="w-full">
						<thead class="bg-gray-100">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">
									{lang === 'fr' ? 'Ordre' : 'Order'}
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									{lang === 'fr' ? 'Nom' : 'Name'}
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									{lang === 'fr' ? 'Description' : 'Description'}
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									{lang === 'fr' ? 'Type' : 'Type'}
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							{#each galleries as gallery, index}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex flex-col gap-1">
											<button
												type="button"
												onclick={() => moveGalleryUp(gallery)}
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
												onclick={() => moveGalleryDown(gallery)}
												disabled={index === galleries.length - 1}
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
										{lang === 'fr' ? gallery.gallery_name_fr : gallery.gallery_name_en}
									</td>
									<td class="px-6 py-4">
										{lang === 'fr' ? gallery.description_fr : gallery.description_en}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										{gallery.member_only ? 'Members Only' : 'Public'}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex gap-2">
											<button
												type="button"
												onclick={() => openEditModal(gallery)}
												class="text-blue-600 hover:text-blue-800"
											>
												{lang === 'fr' ? 'Modifier' : 'Edit'}
											</button>
											<button
												type="button"
												onclick={() => openDeleteModal(gallery)}
												class="text-red-600 hover:text-red-800"
											>
												{lang === 'fr' ? 'Supprimer' : 'Delete'}
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Add Modal -->
{#if showAddModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
			<h2 class="text-2xl font-bold mb-6">{lang === 'fr' ? 'Ajouter une galerie' : 'Add Gallery'}</h2>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					createGallery();
				}}
				class="space-y-4"
			>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-bold mb-2">Gallery Name (EN):</label>
						<input
							type="text"
							bind:value={formData.gallery_name_en}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
							required
						/>
					</div>
					<div>
						<label class="block text-sm font-bold mb-2">Gallery Name (FR):</label>
						<input
							type="text"
							bind:value={formData.gallery_name_fr}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
							required
						/>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-bold mb-2">Description (EN):</label>
						<textarea
							bind:value={formData.description_en}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
							rows="3"
						></textarea>
					</div>
					<div>
						<label class="block text-sm font-bold mb-2">Description (FR):</label>
						<textarea
							bind:value={formData.description_fr}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
							rows="3"
						></textarea>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-bold mb-2">Order:</label>
						<input
							type="number"
							bind:value={formData.order}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
						/>
					</div>
					<div>
						<label class="block text-sm font-bold mb-2">Member Only:</label>
						<select
							bind:value={formData.member_only}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
						>
							<option value={0}>Public</option>
							<option value={1}>Members Only</option>
						</select>
					</div>
				</div>
				<div class="flex gap-3 justify-end pt-4">
					<button
						type="button"
						onclick={() => (showAddModal = false)}
						class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
					>
						{lang === 'fr' ? 'Annuler' : 'Cancel'}
					</button>
					<button
						type="submit"
						class="px-6 py-2 bg-[#1a3a5f] text-white rounded-lg hover:bg-[#1a3a5f]/90"
					>
						{lang === 'fr' ? 'Créer' : 'Create'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Edit Modal -->
{#if showEditModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
			<h2 class="text-2xl font-bold mb-6">{lang === 'fr' ? 'Modifier la galerie' : 'Edit Gallery'}</h2>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					updateGallery();
				}}
				class="space-y-4"
			>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-bold mb-2">Gallery Name (EN):</label>
						<input
							type="text"
							bind:value={formData.gallery_name_en}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
							required
						/>
					</div>
					<div>
						<label class="block text-sm font-bold mb-2">Gallery Name (FR):</label>
						<input
							type="text"
							bind:value={formData.gallery_name_fr}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
							required
						/>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-bold mb-2">Description (EN):</label>
						<textarea
							bind:value={formData.description_en}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
							rows="3"
						></textarea>
					</div>
					<div>
						<label class="block text-sm font-bold mb-2">Description (FR):</label>
						<textarea
							bind:value={formData.description_fr}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
							rows="3"
						></textarea>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-bold mb-2">Order:</label>
						<input
							type="number"
							bind:value={formData.order}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
						/>
					</div>
					<div>
						<label class="block text-sm font-bold mb-2">Member Only:</label>
						<select
							bind:value={formData.member_only}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
						>
							<option value={0}>Public</option>
							<option value={1}>Members Only</option>
						</select>
					</div>
				</div>
				<div class="flex gap-3 justify-end pt-4">
					<button
						type="button"
						onclick={() => {
							showEditModal = false;
							selectedGallery = null;
						}}
						class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
					>
						{lang === 'fr' ? 'Annuler' : 'Cancel'}
					</button>
					<button
						type="submit"
						class="px-6 py-2 bg-[#1a3a5f] text-white rounded-lg hover:bg-[#1a3a5f]/90"
					>
						{lang === 'fr' ? 'Enregistrer' : 'Save'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete Modal -->
{#if showDeleteModal && selectedGallery}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
			<h2 class="text-2xl font-bold mb-4">{lang === 'fr' ? 'Supprimer la galerie' : 'Delete Gallery'}</h2>
			<p class="text-gray-600 mb-6">
				{lang === 'fr'
					? `Êtes-vous sûr de vouloir supprimer "${selectedGallery.gallery_name_fr || selectedGallery.gallery_name_en}"?`
					: `Are you sure you want to delete "${selectedGallery.gallery_name_en || selectedGallery.gallery_name_fr}"?`}
			</p>
			<div class="flex gap-3 justify-end">
				<button
					type="button"
					onclick={() => {
						showDeleteModal = false;
						selectedGallery = null;
					}}
					class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					{lang === 'fr' ? 'Annuler' : 'Cancel'}
				</button>
				<button
					type="button"
					onclick={deleteGallery}
					class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
				>
					{lang === 'fr' ? 'Supprimer' : 'Delete'}
				</button>
			</div>
		</div>
	</div>
{/if}

<AdminFooter />
