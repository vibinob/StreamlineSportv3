<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import AdminHeader from '../../../../lib/components/admin/AdminHeader.svelte';
	import AdminFooter from '../../../../lib/components/admin/AdminFooter.svelte';
	import { onMount } from 'svelte';
	import {
		getNews,
		createNews as createNewsApi,
		updateNews as updateNewsApi,
		deleteNews as deleteNewsApi,
		updateNewsOrder
	} from '$lib/apis/news-api';
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
	let newsItems = $state([]);
	let loading = $state(false);
	/** @type {string | null} */
	let error = $state(null);
	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	/** @type {any | null} */
	let selectedNews = $state(null);
	let viewMode = $state('list'); // 'grid' (Card) or 'list' (List)

	// Form state - only basic details
	let formData = $state({
		author: '',
		news_date: new Date().toISOString().split('T')[0],
		show_in_homepage: false,
		post_to_public: false,
		post_to_member: false,
		title_en: '',
		title_fr: ''
	});

	// Load news
	async function loadNews() {
		loading = true;
		error = null;
		try {
			const result = await getNews();
			if (result.success) {
				newsItems = result.data || [];
			} else {
				throw new Error(result.error || 'Failed to load news');
			}
		} catch (err) {
			console.error('Error loading news:', err);
			error = err instanceof Error ? err.message : 'Failed to load news';
		} finally {
			loading = false;
		}
	}

	// Open add modal
	function openAddModal() {
		formData = {
			author: '',
			news_date: new Date().toISOString().split('T')[0],
			show_in_homepage: false,
			post_to_public: false,
			post_to_member: false,
			title_en: '',
			title_fr: ''
		};
		showAddModal = true;
	}

	// Open edit modal
	/**
	 * @param {any} news
	 */
	function openEditModal(news) {
		selectedNews = news;
		formData = {
			author: news.author || '',
			news_date: news.news_date || new Date().toISOString().split('T')[0],
			show_in_homepage: news.show_in_homepage === 1,
			post_to_public: news.post_to_public === 1,
			post_to_member: news.post_to_member === 1,
			title_en: news.title_en || '',
			title_fr: news.title_fr || ''
		};
		showEditModal = true;
	}

	// Open delete modal
	/**
	 * @param {any} news
	 */
	function openDeleteModal(news) {
		selectedNews = news;
		showDeleteModal = true;
	}

	// Get image URL
	/**
	 * @param {string} filename
	 * @param {boolean} isThumbnail
	 */
	function getImageUrl(filename, isThumbnail = false) {
		if (!filename) return '';
		const subfolder = isThumbnail ? 'thumbnail' : '';
		return `/images/clubs/${CURRENT_CLUB_ID}/news/${subfolder ? subfolder + '/' : ''}${filename}`;
	}

	// Create news - only basic details
	async function createNews() {
		if (!formData.author) {
			error = lang === 'fr' ? 'L\'auteur est requis' : 'Author is required';
			return;
		}

		try {
			/** @type {any} */
			const newsData = {
				author: formData.author,
				news_date: formData.news_date,
				show_in_homepage: formData.show_in_homepage,
				post_to_public: formData.post_to_public,
				post_to_member: formData.post_to_member,
				club_id: CURRENT_CLUB_ID
			};

			// Add titles if provided (optional)
			if (formData.title_en && formData.title_en.trim()) {
				newsData.title_en = formData.title_en.trim();
			}
			if (formData.title_fr && formData.title_fr.trim()) {
				newsData.title_fr = formData.title_fr.trim();
			}
			
			console.log('[Create News] Sending data:', newsData); // Debug log
			const result = await createNewsApi(newsData);
			if (result.success) {
				showAddModal = false;
				await loadNews();
			} else {
				throw new Error(result.error || 'Failed to create news');
			}
		} catch (err) {
			console.error('Error creating news:', err);
			error = err instanceof Error ? err.message : 'Failed to create news';
		}
	}

	// Update news - only basic details
	async function updateNews() {
		if (!selectedNews) return;
		try {
			/** @type {any} */
			const newsData = {
				author: formData.author,
				news_date: formData.news_date,
				show_in_homepage: formData.show_in_homepage,
				post_to_public: formData.post_to_public,
				post_to_member: formData.post_to_member,
				club_id: CURRENT_CLUB_ID
			};
			const result = await updateNewsApi(selectedNews.id, newsData);
			if (result.success) {
				showEditModal = false;
				selectedNews = null;
				await loadNews();
			} else {
				throw new Error(result.error || 'Failed to update news');
			}
		} catch (err) {
			console.error('Error updating news:', err);
			error = err instanceof Error ? err.message : 'Failed to update news';
		}
	}

	// Delete news
	async function deleteNews() {
		if (!selectedNews) return;
		try {
			await deleteNewsApi(selectedNews.id);
			showDeleteModal = false;
			selectedNews = null;
			await loadNews();
		} catch (err) {
			console.error('Error deleting news:', err);
			error = err instanceof Error ? err.message : 'Failed to delete news';
		}
	}

	// Move news up (decrease order)
	/**
	 * @param {any} news
	 */
	async function moveNewsUp(news) {
		const currentIndex = newsItems.findIndex((n) => n.id === news.id);
		if (currentIndex <= 0) return; // Already at top

		const previousNews = newsItems[currentIndex - 1];
		const tempOrder = news.order;
		const newOrder = previousNews.order;

		try {
			// Swap orders
			await updateNewsOrder(news.id, newOrder);
			await updateNewsOrder(previousNews.id, tempOrder);
			await loadNews();
		} catch (err) {
			console.error('Error moving news up:', err);
			error = err instanceof Error ? err.message : 'Failed to move news';
		}
	}

	// Move news down (increase order)
	/**
	 * @param {any} news
	 */
	async function moveNewsDown(news) {
		const currentIndex = newsItems.findIndex((n) => n.id === news.id);
		if (currentIndex >= newsItems.length - 1) return; // Already at bottom

		const nextNews = newsItems[currentIndex + 1];
		const tempOrder = news.order;
		const newOrder = nextNews.order;

		try {
			// Swap orders
			await updateNewsOrder(news.id, newOrder);
			await updateNewsOrder(nextNews.id, tempOrder);
			await loadNews();
		} catch (err) {
			console.error('Error moving news down:', err);
			error = err instanceof Error ? err.message : 'Failed to move news';
		}
	}

	onMount(() => {
		loadNews();
	});
</script>

<svelte:head>
	<title>{lang === 'fr' ? 'Actualités' : 'News'} | Admin</title>
</svelte:head>

<AdminHeader />

<div class="min-h-screen bg-gray-50 py-8">
	<div class="container mx-auto px-4 max-w-7xl">
		<!-- News Header -->
		<div class="bg-white rounded-lg shadow-md p-6 mb-6">
			<div class="flex justify-between items-center">
				<div>
					<h1 class="text-3xl font-bold text-gray-800 mb-2">
						{lang === 'fr' ? 'Actualités' : 'News'}
					</h1>
					<p class="text-gray-600">
						{lang === 'fr'
							? 'Gérez vos actualités et articles'
							: 'Manage your news and articles'}
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
		{:else if newsItems.length === 0}
			<!-- Empty State -->
			<div class="bg-white rounded-lg shadow-md p-8 text-center">
				<p class="text-gray-600">
					{lang === 'fr' ? 'Aucune actualité trouvée' : 'No news found'}
				</p>
			</div>
		{:else}
			<!-- News Card/Grid -->
			{#if viewMode === 'grid'}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
					{#each newsItems as news, index}
						<div class="bg-white rounded-lg shadow-md overflow-hidden">
							<!-- Images -->
							<div class="grid {news.image_en && news.image_fr ? 'grid-cols-2' : 'grid-cols-1'} gap-2 p-2">
								{#if news.image_en}
									<div class="relative aspect-video">
										<p class="text-xs text-gray-500 mb-1 text-center">EN</p>
										<img
											src={getImageUrl(news.image_en)}
											alt={news.title_en || 'News EN'}
											class="w-full h-full object-cover rounded"
											loading="lazy"
										/>
									</div>
								{/if}
								{#if news.image_fr}
									<div class="relative aspect-video">
										<p class="text-xs text-gray-500 mb-1 text-center">FR</p>
										<img
											src={getImageUrl(news.image_fr)}
											alt={news.title_fr || 'News FR'}
											class="w-full h-full object-cover rounded"
											loading="lazy"
										/>
									</div>
								{/if}
							</div>
							<!-- Content -->
							<div class="p-4">
								<h3 class="font-bold text-lg mb-2 line-clamp-2">
									{lang === 'fr' ? (news.title_fr || news.title_en) : (news.title_en || news.title_fr)}
								</h3>
								<p class="text-sm text-gray-600 mb-2">
									{lang === 'fr' ? (news.summary_fr || news.summary_en) : (news.summary_en || news.summary_fr)}
								</p>
								<div class="flex flex-wrap gap-2 mb-3">
									{#if news.show_in_homepage === 1}
										<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Homepage</span>
									{/if}
									{#if news.post_to_public === 1}
										<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Public</span>
									{/if}
									{#if news.post_to_member === 1}
										<span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Member</span>
									{/if}
								</div>
								<p class="text-xs text-gray-500 mb-3">
									{lang === 'fr' ? 'Auteur' : 'Author'}: {news.author} | {lang === 'fr' ? 'Date' : 'Date'}: {news.news_date}
								</p>
								<!-- Order Controls -->
								<div class="flex justify-end gap-1 mb-3">
									<button
										type="button"
										onclick={() => moveNewsUp(news)}
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
										onclick={() => moveNewsDown(news)}
										disabled={index === newsItems.length - 1}
										class="p-1 bg-gray-100 text-gray-600 hover:text-[#1a3a5f] disabled:text-gray-300 disabled:cursor-not-allowed transition-colors rounded"
										title={lang === 'fr' ? 'Déplacer vers la droite' : 'Move right'}
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
										</svg>
									</button>
								</div>
								<div class="flex gap-2">
									<button
										type="button"
										onclick={() => openEditModal(news)}
										class="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
									>
										{lang === 'fr' ? 'Modifier' : 'Edit'}
									</button>
									<button
										type="button"
										onclick={() => openDeleteModal(news)}
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
						<table class="w-full min-w-[800px]">
							<thead class="bg-gray-100">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">
										{lang === 'fr' ? 'Image' : 'Image'}
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										{lang === 'fr' ? 'Titre' : 'Title'}
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										{lang === 'fr' ? 'Auteur' : 'Author'}
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										{lang === 'fr' ? 'Date' : 'Date'}
									</th>
									<th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">
										{lang === 'fr' ? 'Page d\'accueil' : 'Homepage'}
									</th>
									<th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">
										{lang === 'fr' ? 'Public' : 'Public'}
									</th>
									<th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">
										{lang === 'fr' ? 'Membres' : 'Members'}
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">
										{lang === 'fr' ? 'Ordre' : 'Order'}
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										{lang === 'fr' ? 'Contenu' : 'Content'}
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Actions
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200">
								{#each newsItems as news, index}
									<tr class="hover:bg-gray-50">
										<td class="px-6 py-4">
											{#if news.image_en || news.image_fr}
												<img
													src={getImageUrl(news.image_en || news.image_fr)}
													alt={news.title_en || news.title_fr || 'News'}
													class="w-32 h-20 object-cover rounded"
													loading="lazy"
												/>
											{:else}
												<p class="text-sm text-gray-400 italic">No image</p>
											{/if}
										</td>
										<td class="px-6 py-4">
											<p class="font-semibold text-gray-900">
												{lang === 'fr' ? (news.title_fr || news.title_en) : (news.title_en || news.title_fr)}
											</p>
											<p class="text-sm text-gray-600 line-clamp-2">
												{lang === 'fr' ? (news.summary_fr || news.summary_en) : (news.summary_en || news.summary_fr)}
											</p>
										</td>
										<td class="px-6 py-4">
											<p class="text-sm text-gray-600">{news.author}</p>
										</td>
										<td class="px-6 py-4">
											<p class="text-sm text-gray-600">{news.news_date}</p>
										</td>
										<td class="px-6 py-4 text-center">
											{#if news.show_in_homepage === 1}
												<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
												</svg>
											{:else}
												<span class="text-gray-300">—</span>
											{/if}
										</td>
										<td class="px-6 py-4 text-center">
											{#if news.post_to_public === 1}
												<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
												</svg>
											{:else}
												<span class="text-gray-300">—</span>
											{/if}
										</td>
										<td class="px-6 py-4 text-center">
											{#if news.post_to_member === 1}
												<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
												</svg>
											{:else}
												<span class="text-gray-300">—</span>
											{/if}
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="flex flex-col gap-1">
												<button
													type="button"
													onclick={() => moveNewsUp(news)}
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
													onclick={() => moveNewsDown(news)}
													disabled={index === newsItems.length - 1}
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
												onclick={() => goto(`/${lang}/admin/news/${news.id}/content`)}
												class="text-green-600 hover:text-green-800 font-semibold"
											>
												{lang === 'fr' ? '📝 Contenu' : '📝 Content'}
											</button>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="flex gap-2">
												<button
													type="button"
													onclick={() => openEditModal(news)}
													class="text-blue-600 hover:text-blue-800"
												>
													{lang === 'fr' ? 'Modifier' : 'Edit'}
												</button>
												<button
													type="button"
													onclick={() => openDeleteModal(news)}
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
		<div class="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
			<h2 class="text-2xl font-bold mb-6">{lang === 'fr' ? 'Ajouter une actualité' : 'Add News'}</h2>
			<p class="text-sm text-gray-600 mb-4">
				{lang === 'fr' ? 'Ajoutez les détails de base. Le contenu peut être ajouté plus tard.' : 'Add basic details. Content can be added later.'}
			</p>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					createNews();
				}}
				class="space-y-4"
			>
				<!-- Main News Fields -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="add-author" class="block text-sm font-bold mb-2">{lang === 'fr' ? 'Auteur' : 'Author'}:</label>
						<input
							id="add-author"
							type="text"
							bind:value={formData.author}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
							required
						/>
					</div>
					<div>
						<label for="add-news-date" class="block text-sm font-bold mb-2">{lang === 'fr' ? 'Date' : 'Date'}:</label>
						<input
							id="add-news-date"
							type="date"
							bind:value={formData.news_date}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
							required
						/>
					</div>
				</div>

				<!-- Title Fields (Optional) -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="add-title-en" class="block text-sm font-bold mb-2">
							{lang === 'fr' ? 'Titre (Anglais)' : 'Title (English)'}:
							<span class="text-gray-500 font-normal text-xs ml-1">({lang === 'fr' ? 'Optionnel' : 'Optional'})</span>
						</label>
						<input
							id="add-title-en"
							type="text"
							bind:value={formData.title_en}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
							placeholder={lang === 'fr' ? 'Titre en anglais...' : 'English title...'}
						/>
					</div>
					<div>
						<label for="add-title-fr" class="block text-sm font-bold mb-2">
							{lang === 'fr' ? 'Titre (Français)' : 'Title (French)'}:
							<span class="text-gray-500 font-normal text-xs ml-1">({lang === 'fr' ? 'Optionnel' : 'Optional'})</span>
						</label>
						<input
							id="add-title-fr"
							type="text"
							bind:value={formData.title_fr}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
							placeholder={lang === 'fr' ? 'Titre en français...' : 'French title...'}
						/>
					</div>
				</div>

				<div class="grid grid-cols-3 gap-4">
					<label class="flex items-center gap-2">
						<input type="checkbox" bind:checked={formData.show_in_homepage} class="w-4 h-4" />
						<span class="text-sm font-bold">{lang === 'fr' ? 'Afficher sur la page d\'accueil' : 'Show on homepage'}</span>
					</label>
					<label class="flex items-center gap-2">
						<input type="checkbox" bind:checked={formData.post_to_public} class="w-4 h-4" />
						<span class="text-sm font-bold">{lang === 'fr' ? 'Publier pour le public' : 'Post to public'}</span>
					</label>
					<label class="flex items-center gap-2">
						<input type="checkbox" bind:checked={formData.post_to_member} class="w-4 h-4" />
						<span class="text-sm font-bold">{lang === 'fr' ? 'Publier pour les membres' : 'Post to members'}</span>
					</label>
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
{#if showEditModal && selectedNews}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
			<h2 class="text-2xl font-bold mb-6">{lang === 'fr' ? 'Modifier l\'actualité' : 'Edit News'}</h2>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					updateNews();
				}}
				class="space-y-4"
			>
				<!-- Main News Fields -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="edit-author" class="block text-sm font-bold mb-2">{lang === 'fr' ? 'Auteur' : 'Author'}:</label>
						<input
							id="edit-author"
							type="text"
							bind:value={formData.author}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
						/>
					</div>
					<div>
						<label for="edit-news-date" class="block text-sm font-bold mb-2">{lang === 'fr' ? 'Date' : 'Date'}:</label>
						<input
							id="edit-news-date"
							type="date"
							bind:value={formData.news_date}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
						/>
					</div>
				</div>

				<!-- Title Fields (Optional) -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="edit-title-en" class="block text-sm font-bold mb-2">
							{lang === 'fr' ? 'Titre (Anglais)' : 'Title (English)'}:
							<span class="text-gray-500 font-normal text-xs ml-1">({lang === 'fr' ? 'Optionnel' : 'Optional'})</span>
						</label>
						<input
							id="edit-title-en"
							type="text"
							bind:value={formData.title_en}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
							placeholder={lang === 'fr' ? 'Titre en anglais...' : 'English title...'}
						/>
					</div>
					<div>
						<label for="edit-title-fr" class="block text-sm font-bold mb-2">
							{lang === 'fr' ? 'Titre (Français)' : 'Title (French)'}:
							<span class="text-gray-500 font-normal text-xs ml-1">({lang === 'fr' ? 'Optionnel' : 'Optional'})</span>
						</label>
						<input
							id="edit-title-fr"
							type="text"
							bind:value={formData.title_fr}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
							placeholder={lang === 'fr' ? 'Titre en français...' : 'French title...'}
						/>
					</div>
				</div>

				<div class="grid grid-cols-3 gap-4">
					<label class="flex items-center gap-2">
						<input type="checkbox" bind:checked={formData.show_in_homepage} class="w-4 h-4" />
						<span class="text-sm font-bold">{lang === 'fr' ? 'Afficher sur la page d\'accueil' : 'Show on homepage'}</span>
					</label>
					<label class="flex items-center gap-2">
						<input type="checkbox" bind:checked={formData.post_to_public} class="w-4 h-4" />
						<span class="text-sm font-bold">{lang === 'fr' ? 'Publier pour le public' : 'Post to public'}</span>
					</label>
					<label class="flex items-center gap-2">
						<input type="checkbox" bind:checked={formData.post_to_member} class="w-4 h-4" />
						<span class="text-sm font-bold">{lang === 'fr' ? 'Publier pour les membres' : 'Post to members'}</span>
					</label>
				</div>

				<div class="flex gap-3 justify-end pt-4">
					<button
						type="button"
						onclick={() => {
							showEditModal = false;
							selectedNews = null;
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
{#if showDeleteModal && selectedNews}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
			<h2 class="text-2xl font-bold mb-4">{lang === 'fr' ? 'Supprimer l\'actualité' : 'Delete News'}</h2>
			<p class="text-gray-600 mb-6">
				{lang === 'fr'
					? 'Êtes-vous sûr de vouloir supprimer cette actualité?'
					: 'Are you sure you want to delete this news?'}
			</p>
			<div class="flex gap-3 justify-end">
				<button
					type="button"
					onclick={() => {
						showDeleteModal = false;
						selectedNews = null;
					}}
					class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					{lang === 'fr' ? 'Annuler' : 'Cancel'}
				</button>
				<button
					type="button"
					onclick={deleteNews}
					class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
				>
					{lang === 'fr' ? 'Supprimer' : 'Delete'}
				</button>
			</div>
		</div>
	</div>
{/if}

<AdminFooter />

