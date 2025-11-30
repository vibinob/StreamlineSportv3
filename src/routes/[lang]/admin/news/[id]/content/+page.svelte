<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import AdminHeader from '../../../../../../lib/components/admin/AdminHeader.svelte';
	import AdminFooter from '../../../../../../lib/components/admin/AdminFooter.svelte';
	import { onMount } from 'svelte';
	import { getNewsById, updateNews as updateNewsApi, getNews } from '$lib/apis/news-api';
	import { CURRENT_CLUB_ID } from '$lib/clubs/currentClub.js';
	import RichTextEditor from '$lib/components/admin/RichTextEditor.svelte';

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
	let slugManuallyEdited = $state(false); // Track if slug was manually edited
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
		slugManuallyEdited = false; // Reset when loading new language
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

	// Get preview URL for selected image
	let imagePreviewUrl = $state('');
	
	$effect(() => {
		if (selectedImage) {
			const reader = new FileReader();
			reader.onload = (e) => {
				if (e.target && e.target.result && typeof e.target.result === 'string') {
					imagePreviewUrl = e.target.result;
				}
			};
			reader.readAsDataURL(selectedImage);
		} else {
			imagePreviewUrl = '';
		}
	});

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

	// Check if slug is duplicate
	/**
	 * @param {string} slugToCheck
	 * @param {'en' | 'fr'} language
	 */
	async function isSlugDuplicate(slugToCheck, language) {
		if (!slugToCheck || !slugToCheck.trim()) return false;
		
		try {
			const result = await getNews();
			if (!result.success || !result.data) return false;
			
			const duplicate = result.data.find((item) => {
				if (item.id === newsId) return false; // Exclude current news item
				if (language === 'en') {
					return item.slug_en && item.slug_en.toLowerCase() === slugToCheck.toLowerCase();
				} else {
					return item.slug_fr && item.slug_fr.toLowerCase() === slugToCheck.toLowerCase();
				}
			});
			
			return !!duplicate;
		} catch (err) {
			console.error('Error checking slug duplicate:', err);
			return false; // If check fails, allow save (backend will catch it)
		}
	}

	// Save content for current language
	async function saveContent() {
		if (!news) return;

		if (!title.trim()) {
			error = lang === 'fr' ? 'Le titre est requis' : 'Title is required';
			return;
		}

		const finalSlug = slug || generateSlug(title);
		if (!finalSlug.trim()) {
			error = lang === 'fr' ? 'Le slug ne peut pas être vide' : 'Slug cannot be empty';
			return;
		}

		// Check for duplicate slug
		const isDuplicate = await isSlugDuplicate(finalSlug, selectedLanguage);
		if (isDuplicate) {
			error = lang === 'fr' 
				? `Le slug "${finalSlug}" existe déjà. Veuillez utiliser un slug unique.`
				: `The slug "${finalSlug}" already exists. Please use a unique slug.`;
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
				updateData.slug_en = finalSlug;
				if (selectedImage) {
					updateData.image_en = selectedImage;
					// Thumbnail is auto-generated from image
				}
			} else {
				updateData.title_fr = title;
				updateData.summary_fr = summary || undefined;
				updateData.article_fr = article || undefined;
				updateData.slug_fr = finalSlug;
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
								if (target && target instanceof HTMLInputElement) {
									// Auto-generate slug from title if not manually edited
									if (!slugManuallyEdited) {
										slug = generateSlug(target.value);
									}
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
							oninput={() => {
								// Mark slug as manually edited when user types in it
								slugManuallyEdited = true;
							}}
							onfocus={() => {
								// If slug is empty or matches auto-generated, allow manual edit
								if (!slug || slug === generateSlug(title)) {
									slugManuallyEdited = true;
								}
							}}
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f]"
							placeholder={selectedLanguage === 'en' ? 'url-friendly-slug' : 'slug-url-friendly'}
						/>
						<p class="text-xs text-gray-500 mt-1">
							{selectedLanguage === 'en'
								? 'Auto-generated from title. You can edit it manually if needed.'
								: 'Généré automatiquement à partir du titre. Vous pouvez le modifier manuellement si nécessaire.'}
						</p>
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
							<div class="mt-3">
								<p class="text-sm text-gray-600 mb-2">{selectedImage.name}</p>
								{#if imagePreviewUrl}
									<img
										src={imagePreviewUrl}
										alt="Preview"
										class="w-48 h-32 object-cover rounded border-2 border-gray-300"
									/>
								{/if}
							</div>
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
						<div class="border-2 border-gray-300 rounded-lg overflow-hidden">
							<RichTextEditor
								bind:value={article}
								placeholder={selectedLanguage === 'en' ? 'Enter the full article content...' : 'Entrez le contenu complet de l\'article...'}
								height={500}
							/>
						</div>
						<p class="text-xs text-gray-500 mt-2">
							{selectedLanguage === 'en'
								? 'Use the toolbar to format your content. You can insert images, links, tables, and more.'
								: 'Utilisez la barre d\'outils pour formater votre contenu. Vous pouvez insérer des images, des liens, des tableaux et plus encore.'}
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

