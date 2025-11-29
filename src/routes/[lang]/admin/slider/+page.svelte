<script>
	import { page } from '$app/stores';
	import AdminHeader from '../../../../lib/components/admin/AdminHeader.svelte';
	import AdminFooter from '../../../../lib/components/admin/AdminFooter.svelte';
	import { onMount } from 'svelte';
	import {
		getSliders,
		createSlider as createSliderApi,
		updateSlider as updateSliderApi,
		deleteSlider as deleteSliderApi,
		updateSliderOrder
	} from '$lib/apis/slider-api';
	import { CURRENT_CLUB_ID } from '$lib/clubs/currentClub.js';

	const lang = $derived.by(() => {
		const paramLang = $page.params.lang;
		if (paramLang === 'en' || paramLang === 'fr') {
			return paramLang;
		}
		return 'fr';
	});

	// State
	/** @type {any[]} */
	let sliders = $state([]);
	let loading = $state(false);
	/** @type {string | null} */
	let error = $state(null);
	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	/** @type {any | null} */
	let selectedSlider = $state(null);
	let viewMode = $state('list'); // 'grid' (Card) or 'list' (List)

	// Form state
	let formData = $state({
		link_en: '',
		link_fr: ''
	});

	// File inputs
	/** @type {HTMLInputElement | null} */
	let imageEnInput = $state(null);
	/** @type {HTMLInputElement | null} */
	let imageFrInput = $state(null);
	/** @type {File | null} */
	let selectedImageEn = $state(null);
	/** @type {File | null} */
	let selectedImageFr = $state(null);

	// Load sliders
	async function loadSliders() {
		loading = true;
		error = null;
		try {
			const result = await getSliders();
			if (result.success) {
				sliders = result.data || [];
			} else {
				throw new Error(result.error || 'Failed to load sliders');
			}
		} catch (err) {
			console.error('Error loading sliders:', err);
			error = err instanceof Error ? err.message : 'Failed to load sliders';
		} finally {
			loading = false;
		}
	}

	// Open add modal
	function openAddModal() {
		formData = {
			link_en: '',
			link_fr: ''
		};
		selectedImageEn = null;
		selectedImageFr = null;
		if (imageEnInput) imageEnInput.value = '';
		if (imageFrInput) imageFrInput.value = '';
		showAddModal = true;
	}

	// Open edit modal
	/**
	 * @param {any} slider
	 */
	function openEditModal(slider) {
		selectedSlider = slider;
		formData = {
			link_en: slider.link_en || '',
			link_fr: slider.link_fr || ''
		};
		selectedImageEn = null;
		selectedImageFr = null;
		if (imageEnInput) imageEnInput.value = '';
		if (imageFrInput) imageFrInput.value = '';
		showEditModal = true;
	}

	// Open delete modal
	/**
	 * @param {any} slider
	 */
	function openDeleteModal(slider) {
		selectedSlider = slider;
		showDeleteModal = true;
	}

	// Get image URL
	/**
	 * @param {string} filename
	 */
	function getImageUrl(filename) {
		if (!filename) return '';
		return `/images/clubs/${CURRENT_CLUB_ID}/slider/${filename}`;
	}

	// Handle file selection
	/**
	 * @param {Event} e
	 * @param {string} type
	 */
	function handleFileSelect(e, type) {
		const target = e.target;
		if (target && target instanceof HTMLInputElement && target.files && target.files[0]) {
			if (type === 'en') {
				selectedImageEn = target.files[0];
			} else if (type === 'fr') {
				selectedImageFr = target.files[0];
			}
		}
	}

	// Create slider
	async function createSlider() {
		if (!selectedImageEn || !selectedImageFr) {
			error = lang === 'fr' ? 'Les deux images (EN et FR) sont requises' : 'Both images (EN and FR) are required';
			return;
		}

		try {
			/** @type {any} */
			const sliderData = {
				image_en: selectedImageEn,
				image_fr: selectedImageFr,
				link_en: formData.link_en || undefined,
				link_fr: formData.link_fr || undefined,
				club_id: CURRENT_CLUB_ID
			};
			const result = await createSliderApi(sliderData);
			if (result.success) {
				showAddModal = false;
				selectedImageEn = null;
				selectedImageFr = null;
				await loadSliders();
			} else {
				throw new Error(result.error || 'Failed to create slider');
			}
		} catch (err) {
			console.error('Error creating slider:', err);
			error = err instanceof Error ? err.message : 'Failed to create slider';
		}
	}

	// Update slider
	async function updateSlider() {
		if (!selectedSlider) return;
		try {
			/** @type {any} */
			const sliderData = {
				image_en: selectedImageEn || undefined,
				image_fr: selectedImageFr || undefined,
				link_en: formData.link_en || undefined,
				link_fr: formData.link_fr || undefined,
				club_id: CURRENT_CLUB_ID
			};
			const result = await updateSliderApi(selectedSlider.id, sliderData);
			if (result.success) {
				showEditModal = false;
				selectedSlider = null;
				selectedImageEn = null;
				selectedImageFr = null;
				await loadSliders();
			} else {
				throw new Error(result.error || 'Failed to update slider');
			}
		} catch (err) {
			console.error('Error updating slider:', err);
			error = err instanceof Error ? err.message : 'Failed to update slider';
		}
	}

	// Delete slider
	async function deleteSlider() {
		if (!selectedSlider) return;
		try {
			await deleteSliderApi(selectedSlider.id);
			showDeleteModal = false;
			selectedSlider = null;
			await loadSliders();
		} catch (err) {
			console.error('Error deleting slider:', err);
			error = err instanceof Error ? err.message : 'Failed to delete slider';
		}
	}

	// Move slider up (decrease order)
	/**
	 * @param {any} slider
	 */
	async function moveSliderUp(slider) {
		const currentIndex = sliders.findIndex((s) => s.id === slider.id);
		if (currentIndex <= 0) return; // Already at top

		const previousSlider = sliders[currentIndex - 1];
		const tempOrder = slider.order;
		const newOrder = previousSlider.order;

		try {
			// Swap orders
			await updateSliderOrder(slider.id, newOrder);
			await updateSliderOrder(previousSlider.id, tempOrder);
			await loadSliders();
		} catch (err) {
			console.error('Error moving slider up:', err);
			error = err instanceof Error ? err.message : 'Failed to move slider';
		}
	}

	// Move slider down (increase order)
	/**
	 * @param {any} slider
	 */
	async function moveSliderDown(slider) {
		const currentIndex = sliders.findIndex((s) => s.id === slider.id);
		if (currentIndex >= sliders.length - 1) return; // Already at bottom

		const nextSlider = sliders[currentIndex + 1];
		const tempOrder = slider.order;
		const newOrder = nextSlider.order;

		try {
			// Swap orders
			await updateSliderOrder(slider.id, newOrder);
			await updateSliderOrder(nextSlider.id, tempOrder);
			await loadSliders();
		} catch (err) {
			console.error('Error moving slider down:', err);
			error = err instanceof Error ? err.message : 'Failed to move slider';
		}
	}

	onMount(() => {
		loadSliders();
	});
</script>

<svelte:head>
	<title>{lang === 'fr' ? 'Slider' : 'Slider'} | Admin</title>
</svelte:head>

<AdminHeader />

<div class="min-h-screen bg-gray-50 py-8">
	<div class="container mx-auto px-4 max-w-7xl">
		<!-- Slider Header -->
		<div class="bg-white rounded-lg shadow-md p-6 mb-6">
			<div class="flex justify-between items-center">
				<div>
					<h1 class="text-3xl font-bold text-gray-800 mb-2">
						{lang === 'fr' ? 'Slider' : 'Slider'}
					</h1>
					<p class="text-gray-600">
						{lang === 'fr'
							? 'Gérez vos images de slider'
							: 'Manage your slider images'}
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
							Card
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
		{:else if sliders.length === 0}
			<!-- Empty State -->
			<div class="bg-white rounded-lg shadow-md p-8 text-center">
				<p class="text-gray-600">
					{lang === 'fr' ? 'Aucun slider trouvé' : 'No sliders found'}
				</p>
			</div>
		{:else}
			<!-- Slider Card/Grid -->
			{#if viewMode === 'grid'}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each sliders as slider, index}
						<div class="bg-white rounded-lg shadow-md overflow-hidden">
							<!-- Both Images Side by Side -->
							<div class="grid grid-cols-2 gap-2 p-2">
								<div class="relative aspect-video">
									<p class="text-xs text-gray-500 mb-1 text-center">EN</p>
									<img
										src={getImageUrl(slider.image_en)}
										alt="Slider EN"
										class="w-full h-full object-cover rounded"
										loading="lazy"
									/>
								</div>
								<div class="relative aspect-video">
									<p class="text-xs text-gray-500 mb-1 text-center">FR</p>
									<img
										src={getImageUrl(slider.image_fr)}
										alt="Slider FR"
										class="w-full h-full object-cover rounded"
										loading="lazy"
									/>
								</div>
							</div>
							<!-- Order Controls -->
							<div class="px-4 pb-2 flex justify-end gap-1">
								<button
									type="button"
									onclick={() => moveSliderUp(slider)}
									disabled={index === 0}
									class="p-1 bg-gray-100 text-gray-600 hover:text-[#1a3a5f] disabled:text-gray-300 disabled:cursor-not-allowed transition-colors rounded"
									title={lang === 'fr' ? 'Déplacer vers la gauche' : 'Move left'}
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
									</svg>
								</button>
								<button
									type="button"
									onclick={() => moveSliderDown(slider)}
									disabled={index === sliders.length - 1}
									class="p-1 bg-gray-100 text-gray-600 hover:text-[#1a3a5f] disabled:text-gray-300 disabled:cursor-not-allowed transition-colors rounded"
									title={lang === 'fr' ? 'Déplacer vers la droite' : 'Move right'}
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
									</svg>
								</button>
							</div>
							<div class="p-4">
								{#if (lang === 'fr' ? slider.link_fr : slider.link_en)}
									<p class="text-sm text-gray-600 mb-2 truncate">
										{lang === 'fr' ? slider.link_fr : slider.link_en}
									</p>
								{/if}
								<div class="flex gap-2">
									<button
										type="button"
										onclick={() => openEditModal(slider)}
										class="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
									>
										{lang === 'fr' ? 'Modifier' : 'Edit'}
									</button>
									<button
										type="button"
										onclick={() => openDeleteModal(slider)}
										class="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
									>
										{lang === 'fr' ? 'Supprimer' : 'Delete'}
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<!-- List View -->
				<div class="bg-white rounded-lg shadow-md overflow-hidden">
					<div class="overflow-x-auto">
						<table class="w-full min-w-[640px]">
							<thead class="bg-gray-100">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-96">
										{lang === 'fr' ? 'Image EN' : 'Image EN'}
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-96">
										{lang === 'fr' ? 'Image FR' : 'Image FR'}
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										{lang === 'fr' ? 'Lien' : 'Link'}
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
								{#each sliders as slider, index}
									<tr class="hover:bg-gray-50">
										<td class="px-6 py-4">
											<img
												src={getImageUrl(slider.image_en)}
												alt="Slider EN"
												class="w-72 h-40 object-cover rounded"
												loading="lazy"
											/>
										</td>
										<td class="px-6 py-4">
											<img
												src={getImageUrl(slider.image_fr)}
												alt="Slider FR"
												class="w-72 h-40 object-cover rounded"
												loading="lazy"
											/>
										</td>
										<td class="px-6 py-4">
											<p class="text-sm text-gray-600 truncate max-w-xs">
												{lang === 'fr' ? (slider.link_fr || '-') : (slider.link_en || '-')}
											</p>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="flex flex-col gap-1">
												<button
													type="button"
													onclick={() => moveSliderUp(slider)}
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
													onclick={() => moveSliderDown(slider)}
													disabled={index === sliders.length - 1}
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
											<div class="flex gap-2">
												<button
													type="button"
													onclick={() => openEditModal(slider)}
													class="text-blue-600 hover:text-blue-800"
												>
													{lang === 'fr' ? 'Modifier' : 'Edit'}
												</button>
												<button
													type="button"
													onclick={() => openDeleteModal(slider)}
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
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Add Modal -->
{#if showAddModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
			<h2 class="text-2xl font-bold mb-6">{lang === 'fr' ? 'Ajouter un slider' : 'Add Slider'}</h2>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					createSlider();
				}}
				class="space-y-4"
			>
				<div>
					<label for="add-image-en" class="block text-sm font-bold mb-2">Image EN:</label>
					<input
						id="add-image-en"
						type="file"
						bind:this={imageEnInput}
						accept="image/*"
						onchange={(e) => handleFileSelect(e, 'en')}
						class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
						required
					/>
					{#if selectedImageEn}
						<p class="text-sm text-gray-600 mt-1">{selectedImageEn.name}</p>
					{/if}
				</div>
				<div>
					<label for="add-image-fr" class="block text-sm font-bold mb-2">Image FR:</label>
					<input
						id="add-image-fr"
						type="file"
						bind:this={imageFrInput}
						accept="image/*"
						onchange={(e) => handleFileSelect(e, 'fr')}
						class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
						required
					/>
					{#if selectedImageFr}
						<p class="text-sm text-gray-600 mt-1">{selectedImageFr.name}</p>
					{/if}
				</div>
				<div>
					<label for="add-link-en" class="block text-sm font-bold mb-2">Link EN (Optional):</label>
					<input
						id="add-link-en"
						type="url"
						bind:value={formData.link_en}
						class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
						placeholder="https://example.com"
					/>
				</div>
				<div>
					<label for="add-link-fr" class="block text-sm font-bold mb-2">Link FR (Optional):</label>
					<input
						id="add-link-fr"
						type="url"
						bind:value={formData.link_fr}
						class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
						placeholder="https://exemple.com"
					/>
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
			<h2 class="text-2xl font-bold mb-6">{lang === 'fr' ? 'Modifier le slider' : 'Edit Slider'}</h2>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					updateSlider();
				}}
				class="space-y-4"
			>
				<div>
					<label for="edit-image-en" class="block text-sm font-bold mb-2">Image EN (Optional - leave empty to keep current):</label>
					<input
						id="edit-image-en"
						type="file"
						bind:this={imageEnInput}
						accept="image/*"
						onchange={(e) => handleFileSelect(e, 'en')}
						class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
					/>
					{#if selectedImageEn}
						<p class="text-sm text-gray-600 mt-1">{selectedImageEn.name}</p>
					{:else if selectedSlider}
						<p class="text-sm text-gray-500 mt-1">Current: {selectedSlider.image_en}</p>
					{/if}
				</div>
				<div>
					<label for="edit-image-fr" class="block text-sm font-bold mb-2">Image FR (Optional - leave empty to keep current):</label>
					<input
						id="edit-image-fr"
						type="file"
						bind:this={imageFrInput}
						accept="image/*"
						onchange={(e) => handleFileSelect(e, 'fr')}
						class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
					/>
					{#if selectedImageFr}
						<p class="text-sm text-gray-600 mt-1">{selectedImageFr.name}</p>
					{:else if selectedSlider}
						<p class="text-sm text-gray-500 mt-1">Current: {selectedSlider.image_fr}</p>
					{/if}
				</div>
				<div>
					<label class="block text-sm font-bold mb-2">Link EN (Optional):</label>
					<input
						type="url"
						bind:value={formData.link_en}
						class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
						placeholder="https://example.com"
					/>
				</div>
				<div>
					<label class="block text-sm font-bold mb-2">Link FR (Optional):</label>
					<input
						type="url"
						bind:value={formData.link_fr}
						class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
						placeholder="https://exemple.com"
					/>
				</div>
				<div class="flex gap-3 justify-end pt-4">
					<button
						type="button"
						onclick={() => {
							showEditModal = false;
							selectedSlider = null;
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
{#if showDeleteModal && selectedSlider}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
			<h2 class="text-2xl font-bold mb-4">{lang === 'fr' ? 'Supprimer le slider' : 'Delete Slider'}</h2>
			<p class="text-gray-600 mb-6">
				{lang === 'fr'
					? 'Êtes-vous sûr de vouloir supprimer ce slider?'
					: 'Are you sure you want to delete this slider?'}
			</p>
			<div class="flex gap-3 justify-end">
				<button
					type="button"
					onclick={() => {
						showDeleteModal = false;
						selectedSlider = null;
					}}
					class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					{lang === 'fr' ? 'Annuler' : 'Cancel'}
				</button>
				<button
					type="button"
					onclick={deleteSlider}
					class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
				>
					{lang === 'fr' ? 'Supprimer' : 'Delete'}
				</button>
			</div>
		</div>
	</div>
{/if}

<AdminFooter />

