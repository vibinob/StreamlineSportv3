<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import AdminHeader from '../../../../../lib/components/admin/AdminHeader.svelte';
	import AdminFooter from '../../../../../lib/components/admin/AdminFooter.svelte';
	import { onMount } from 'svelte';
	import { getNewsById, updateNews as updateNewsApi } from '$lib/apis/news-api';

	const lang = $derived.by(() => {
		const paramLang = $page.params.lang;
		if (paramLang === 'en' || paramLang === 'fr') {
			return paramLang;
		}
		return 'fr';
	});

	const newsId = $derived(parseInt($page.params.id || '0'));

	// State
	/** @type {any | null} */
	let news = $state(null);
	let loading = $state(false);
	/** @type {string | null} */
	let error = $state(null);
	let saving = $state(false);

	// Article content
	let articleEn = $state('');
	let articleFr = $state('');

	// Load news item
	async function loadNews() {
		if (!newsId || isNaN(newsId)) {
			error = lang === 'fr' ? 'ID d\'actualité invalide' : 'Invalid news ID';
			return;
		}

		loading = true;
		error = null;
		try {
			const result = await getNewsById(newsId);
			if (result.success && result.data) {
				news = result.data;
				articleEn = news.article_en || '';
				articleFr = news.article_fr || '';
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

	// Save articles
	async function saveArticles() {
		if (!news) return;

		saving = true;
		error = null;
		try {
			const result = await updateNewsApi(newsId, {
				club_id: 'CLUB_ID', // TODO: Get from CURRENT_CLUB_ID if needed
				article_en: articleEn,
				article_fr: articleFr
			});

			if (result.success) {
				// Show success message and optionally redirect
				alert(lang === 'fr' ? 'Articles enregistrés avec succès!' : 'Articles saved successfully!');
				await loadNews(); // Reload to get updated data
			} else {
				throw new Error(result.error || 'Failed to save articles');
			}
		} catch (err) {
			console.error('Error saving articles:', err);
			error = err instanceof Error ? err.message : 'Failed to save articles';
		} finally {
			saving = false;
		}
	}

	onMount(() => {
		loadNews();
	});
</script>

<svelte:head>
	<title>{lang === 'fr' ? 'Éditer l\'article' : 'Edit Article'} | Admin</title>
</svelte:head>

<AdminHeader />

<div class="min-h-screen bg-gray-50 py-8">
	<div class="container mx-auto px-4 max-w-7xl">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-md p-6 mb-6">
			<div class="flex justify-between items-center">
				<div>
					<h1 class="text-3xl font-bold text-gray-800 mb-2">
						{lang === 'fr' ? 'Éditer l\'article' : 'Edit Article'}
					</h1>
					{#if news}
						<p class="text-gray-600">
							{lang === 'fr' ? (news.title_fr || news.title_en) : (news.title_en || news.title_fr)}
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
			<!-- Article Editor -->
			<div class="bg-white rounded-lg shadow-md p-6 mb-6">
				<form
					onsubmit={(e) => {
						e.preventDefault();
						saveArticles();
					}}
					class="space-y-6"
				>
					<!-- English Article -->
					<div class="border-b-2 border-gray-200 pb-6">
						<h2 class="text-xl font-bold mb-4">English Article</h2>
						<div class="mb-4">
							<label for="article-en" class="block text-sm font-bold mb-2">
								Article Content (EN):
							</label>
							<textarea
								id="article-en"
								bind:value={articleEn}
								rows="20"
								class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f] font-mono text-sm"
								placeholder="Enter the full article content in English. You can use HTML formatting."
							></textarea>
							<p class="text-xs text-gray-500 mt-2">
								{lang === 'fr'
									? 'Vous pouvez utiliser du HTML pour formater le contenu'
									: 'You can use HTML to format the content'}
							</p>
						</div>
					</div>

					<!-- French Article -->
					<div class="border-b-2 border-gray-200 pb-6">
						<h2 class="text-xl font-bold mb-4">Article français</h2>
						<div class="mb-4">
							<label for="article-fr" class="block text-sm font-bold mb-2">
								Contenu de l'article (FR):
							</label>
							<textarea
								id="article-fr"
								bind:value={articleFr}
								rows="20"
								class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#1a3a5f] font-mono text-sm"
								placeholder="Entrez le contenu complet de l'article en français. Vous pouvez utiliser le formatage HTML."
							></textarea>
							<p class="text-xs text-gray-500 mt-2">
								{lang === 'fr'
									? 'Vous pouvez utiliser du HTML pour formater le contenu'
									: 'You can use HTML to format the content'}
							</p>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex gap-3 justify-end pt-4">
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

			<!-- Rich Text Editor Note -->
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<p class="text-sm text-blue-800">
					<strong>{lang === 'fr' ? 'Note:' : 'Note:'}</strong>
					{lang === 'fr'
						? ' Un éditeur de texte riche peut être ajouté ici pour faciliter la mise en forme. Pour l\'instant, vous pouvez utiliser du HTML brut.'
						: ' A rich text editor can be added here to make formatting easier. For now, you can use raw HTML.'}
				</p>
			</div>
		{/if}
	</div>
</div>

<AdminFooter />

