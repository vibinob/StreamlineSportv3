<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import AdminHeader from '../../../../../../lib/components/admin/AdminHeader.svelte';
	import AdminFooter from '../../../../../../lib/components/admin/AdminFooter.svelte';
	import { onMount } from 'svelte';
	import { getNewsById, updateNews as updateNewsApi } from '$lib/apis/news-api';
	import { CURRENT_CLUB_ID } from '$lib/clubs/currentClub.js';

	const lang = $derived.by(() => {
		try {
			const paramLang = $page.params?.lang;
			if (paramLang === 'en' || paramLang === 'fr') {
				return paramLang;
			}
		} catch (e) {
			// Handle SSR case
		}
		return 'fr';
	});

	const newsId = $derived.by(() => {
		try {
			return parseInt($page.params?.id || '0');
		} catch (e) {
			return 0;
		}
	});

	// State
	/** @type {any | null} */
	let news = $state(null);
	let loading = $state(true);
	/** @type {string | null} */
	let error = $state(null);
	let saving = $state(false);
	/** @type {'en' | 'fr'} */
	let selectedLanguage = $state('en'); // Language selection

	// Content for selected language
	let title = $state('');
	let summary = $state('');
	let article = $state('');
	let slug = $state('');
	/** @type {File | null} */
	let selectedImage = $state(null);

	// File inputs
	/** @type {HTMLInputElement | null} */
	let imageInput = $state(null);

	// Load news item
	async function loadNews() {
		const currentNewsId = newsId;
		if (!currentNewsId || isNaN(currentNewsId) || currentNewsId === 0) {
			error = lang === 'fr' ? 'ID d\'actualité invalide' : 'Invalid news ID';
			loading = false;
			return;
		}

		loading = true;
		error = null;
		try {
			const result = await getNewsById(currentNewsId);
			if (result.success && result.data) {
				news = result.data;
				loadLanguageContent(selectedLanguage);
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

	// Load content for selected language
	/**
	 * @param {'en' | 'fr'} language
	 */
	function loadLanguageContent(language) {
		if (!news) return;

		if (language === 'en') {
			title = news.title_en || '';
			summary = news.summary_en || '';
			article = news.article_en || '';
			slug = news.slug_en || '';
		} else {
			title = news.title_fr || '';
			summary = news.summary_fr || '';
			article = news.article_fr || '';
			slug = news.slug_fr || '';
		}
		selectedImage = null;
		if (imageInput) imageInput.value = '';
	}

	// Switch language
	/**
	 * @param {'en' | 'fr'} language
	 */
	function switchLanguage(language) {
		selectedLanguage = language;
		loadLanguageContent(language);
	}

	// Handle file selection
	/**
	 * @param {Event} e
	 */
	function handleFileSelect(e) {
		const target = e.target;
		if (target && target instanceof HTMLInputElement && target.files && target.files[0]) {
			selectedImage = target.files[0];
		}
	}

	// Generate slug from title
	/**
	 * @param {string} titleText
	 */
	function generateSlug(titleText) {
		return titleText
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, '')
			.replace(/[\s_-]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	// Save content for current language
	async function saveContent() {
		if (!news) return;

		if (!title.trim()) {
			error = lang === 'fr' ? 'Le titre est requis' : 'Title is required';
			return;
		}

		saving = true;
		error = null;
		try {
			/** @type {any} */
			const updateData = {
				club_id: CURRENT_CLUB_ID
			};

			if (selectedLanguage === 'en') {
				updateData.title_en = title;
				updateData.summary_en = summary || undefined;
				updateData.article_en = article || undefined;
				updateData.slug_en = slug || generateSlug(title);
				if (selectedImage) {
					updateData.image_en = selectedImage;
					// Thumbnail is auto-generated from image
				}
			} else {
				updateData.title_fr = title;
				updateData.summary_fr = summary || undefined;
				updateData.article_fr = article || undefined;
				updateData.slug_fr = slug || generateSlug(title);
				if (selectedImage) {
					updateData.image_fr = selectedImage;
					// Thumbnail is auto-generated from image
				}
			}

			const result = await updateNewsApi(newsId, updateData);

			if (result.success) {
				// Show success message
				alert(
					lang === 'fr'
						? 'Contenu enregistré avec succès!'
						: 'Content saved successfully!'
				);
				await loadNews(); // Reload to get updated data
			} else {
				throw new Error(result.error || 'Failed to save content');
			}
		} catch (err) {
			console.error('Error saving content:', err);
			error = err instanceof Error ? err.message : 'Failed to save content';
		} finally {
			saving = false;
		}
	}

	// Get image URL
	/**
	 * @param {string} filename
	 * @param {boolean} isThumbnail
	 */
	function getImageUrl(filename, isThumbnail = false) {
		if (!filename) return '';
		if (isThumbnail) {
			return `/images/clubs/${CURRENT_CLUB_ID}/news/thumbnail/${filename}`;
		}
		return `/images/clubs/${CURRENT_CLUB_ID}/news/${filename}`;
	}

	onMount(() => {
		loadNews();
	});
</script>

<svelte:head>
	<title>{lang === 'fr' ? 'Éditer le contenu' : 'Edit Content'} | Admin</title>
</svelte:head>

<AdminHeader />

<div class="min-h-screen bg-gray-50 py-8">
	<div class="container mx-auto px-4 max-w-6xl">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-md p-6 mb-6">
			<div class="flex justify-between items-center">
				<div>
					<h1 class="text-3xl font-bold text-gray-800 mb-2">
						{lang === 'fr' ? 'Éditer le contenu' : 'Edit Content'}
					</h1>
					{#if news}
						<p class="text-gray-600">
							{lang === 'fr' ? 'Auteur' : 'Author'}: {news.author} | {lang === 'fr' ? 'Date' : 'Date'}: {news.news_date}
						</p>
					{/if}
				</div>
				<button
					type="button"
					onclick={() => goto(`/${lang}/admin/news`)}
					class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					{lang === 'fr' ? '← Retour' : '← Back'}
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
		{:else if news}
			<!-- Language Selection Tabs -->
			<div class="bg-white rounded-lg shadow-md mb-6">
				<div class="flex border-b border-gray-200">
					<button
						type="button"
						onclick={() => switchLanguage('en')}
						class="flex-1 px-6 py-4 text-center font-semibold transition-colors {selectedLanguage === 'en' ? 'bg-[#1a3a5f] text-white border-b-2 border-[#1a3a5f]' : 'text-gray-700 hover:bg-gray-50'}"
					>
						English
					</button>
					<button
						type="button"
						onclick={() => switchLanguage('fr')}
						class="flex-1 px-6 py-4 text-center font-semibold transition-colors {selectedLanguage === 'fr' ? 'bg-[#1a3a5f] text-white border-b-2 border-[#1a3a5f]' : 'text-gray-700 hover:bg-gray-50'}"
					>
						Français
					</button>
				</div>
			</div>

			<!-- Content Editor -->
			<div class="bg-white rounded-lg shadow-md p-6">
				<form
					onsubmit={(e) => {
						e.preventDefault();
						saveContent();
					}}
					class="space-y-6"
				>
					<!-- Title -->
					<div>
						<label for="content-title" class="block text-sm font-bold mb-2">
							{selectedLanguage === 'en' ? 'Title' : 'Titre'}:
						</label>
						<input
							id="content-title"
							type="text"
							bind:value={title}
							oninput={(e) => {
								const target = e.target;
								if (target && target instanceof HTMLInputElement && !slug) {
									slug = generateSlug(target.value);
								}
							}}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
							required
						/>
					</div>

					<!-- Slug URL -->
					<div>
						<label for="content-slug" class="block text-sm font-bold mb-2">
							Slug URL:
						</label>
						<input
							id="content-slug"
							type="text"
							bind:value={slug}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
							placeholder={selectedLanguage === 'en' ? 'url-friendly-slug' : 'slug-url-friendly'}
						/>
					</div>

					<!-- Summary -->
					<div>
						<label for="content-summary" class="block text-sm font-bold mb-2">
							{selectedLanguage === 'en' ? 'Summary' : 'Résumé'}:
						</label>
						<textarea
							id="content-summary"
							bind:value={summary}
							rows="4"
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
							placeholder={selectedLanguage === 'en' ? 'Short summary of the news...' : 'Résumé court de l\'actualité...'}
						></textarea>
					</div>

					<!-- Image -->
					<div>
						<label for="content-image" class="block text-sm font-bold mb-2">
							{selectedLanguage === 'en' ? 'Image (Optional)' : 'Image (Optionnel)'}:
						</label>
						<input
							id="content-image"
							type="file"
							bind:this={imageInput}
							accept="image/*"
							onchange={(e) => handleFileSelect(e)}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
						/>
						<p class="text-xs text-gray-500 mt-1">
							{selectedLanguage === 'en'
								? 'Thumbnail will be auto-generated from this image'
								: 'La miniature sera générée automatiquement à partir de cette image'}
						</p>
						{#if selectedImage}
							<p class="text-sm text-gray-600 mt-1">{selectedImage.name}</p>
						{:else if (selectedLanguage === 'en' && news.image_en)}
							<div class="mt-2">
								<p class="text-sm text-gray-500 mb-1">Current:</p>
								<img
									src={getImageUrl(news.image_en)}
									alt="Current image"
									class="w-32 h-20 object-cover rounded"
								/>
								{#if news.thumbnail_en}
									<p class="text-xs text-gray-400 mt-1">
										Thumbnail: <img src={getImageUrl(news.thumbnail_en, true)} alt="Thumbnail" class="inline w-16 h-10 object-cover rounded" />
									</p>
								{/if}
							</div>
						{:else if (selectedLanguage === 'fr' && news.image_fr)}
							<div class="mt-2">
								<p class="text-sm text-gray-500 mb-1">Actuel:</p>
								<img
									src={getImageUrl(news.image_fr)}
									alt="Image actuelle"
									class="w-32 h-20 object-cover rounded"
								/>
								{#if news.thumbnail_fr}
									<p class="text-xs text-gray-400 mt-1">
										Miniature: <img src={getImageUrl(news.thumbnail_fr, true)} alt="Miniature" class="inline w-16 h-10 object-cover rounded" />
									</p>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Article -->
					<div>
						<label for="content-article" class="block text-sm font-bold mb-2">
							{selectedLanguage === 'en' ? 'Article' : 'Article'}:
						</label>
						<textarea
							id="content-article"
							bind:value={article}
							rows="25"
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f] font-mono text-sm"
							placeholder={selectedLanguage === 'en' ? 'Enter the full article content. You can use HTML formatting.' : 'Entrez le contenu complet de l\'article. Vous pouvez utiliser le formatage HTML.'}
						></textarea>
						<p class="text-xs text-gray-500 mt-2">
							{selectedLanguage === 'en'
								? 'You can use HTML to format the content. A rich text editor can be added here later.'
								: 'Vous pouvez utiliser du HTML pour formater le contenu. Un éditeur de texte riche peut être ajouté ici plus tard.'}
						</p>
					</div>

					<!-- Action Buttons -->
					<div class="flex gap-3 justify-end pt-4 border-t border-gray-200">
						<button
							type="button"
							onclick={() => goto(`/${lang}/admin/news`)}
							class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
						>
							{lang === 'fr' ? 'Annuler' : 'Cancel'}
						</button>
						<button
							type="submit"
							disabled={saving}
							class="px-6 py-2 bg-[#1a3a5f] text-white rounded-lg hover:bg-[#1a3a5f]/90 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{saving
								? (lang === 'fr' ? 'Enregistrement...' : 'Saving...')
								: (lang === 'fr' ? 'Enregistrer' : 'Save')}
						</button>
					</div>
				</form>
			</div>
		{/if}
	</div>
</div>

<AdminFooter />

