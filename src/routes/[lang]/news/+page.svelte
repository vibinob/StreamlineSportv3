<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getPublicNews } from '$lib/apis/news-api';
	import { CURRENT_CLUB_ID } from '$lib/clubs/currentClub.js';

	const lang = $derived.by(() => {
		const paramLang = $page.params.lang;
		if (paramLang === 'en' || paramLang === 'fr') {
			return paramLang;
		}
		return 'fr';
	});

	// Auto-discover Header and Footer components
	const headerModules = import.meta.glob('$lib/components/clubs/*/Header.svelte', {
		eager: true
	});
	const footerModules = import.meta.glob('$lib/components/clubs/*/Footer.svelte', {
		eager: true
	});

	/** @type {Record<string, any>} */
	const HEADER_COMPONENTS = {};
	for (const [path, mod] of Object.entries(headerModules)) {
		const match = path.match(/clubs\/([^/]+)\/Header\.svelte$/);
		if (match) {
			const clubId = match[1];
			HEADER_COMPONENTS[clubId] = mod.default;
		}
	}

	/** @type {Record<string, any>} */
	const FOOTER_COMPONENTS = {};
	for (const [path, mod] of Object.entries(footerModules)) {
		const match = path.match(/clubs\/([^/]+)\/Footer\.svelte$/);
		if (match) {
			const clubId = match[1];
			FOOTER_COMPONENTS[clubId] = mod.default;
		}
	}

	const HeaderComponent = HEADER_COMPONENTS[CURRENT_CLUB_ID] || HEADER_COMPONENTS['swimdorval'];
	const FooterComponent = FOOTER_COMPONENTS[CURRENT_CLUB_ID] || FOOTER_COMPONENTS['swimdorval'];

	// State
	/** @type {any[]} */
	let newsItems = $state([]);
	let loading = $state(true);
	/** @type {string | null} */
	let error = $state(null);

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

	// Format date
	/**
	 * @param {string} dateString
	 */
	function formatDate(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Load public news
	async function loadNews() {
		loading = true;
		error = null;
		try {
			const result = await getPublicNews(lang);
			if (result.success && result.data) {
				newsItems = result.data;
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

	// Navigate to news detail
	/**
	 * @param {any} news
	 */
	function viewNews(news) {
		if (news.slug) {
			goto(`/${lang}/news/${news.slug}`);
		}
	}

	onMount(() => {
		loadNews();
	});
</script>

<svelte:head>
	<title>{lang === 'fr' ? 'Actualités' : 'News'} | {CURRENT_CLUB_ID}</title>
	<meta name="description" content={lang === 'fr' ? 'Actualités et nouvelles' : 'News and updates'} />
</svelte:head>

<HeaderComponent />

<div class="min-h-screen bg-gray-50 py-8">
	<div class="container mx-auto px-4 max-w-7xl">
		<!-- Page Header -->
		<div class="mb-8">
			<h1 class="text-4xl font-bold text-gray-800 mb-2">
				{lang === 'fr' ? 'Actualités' : 'News'}
			</h1>
			<p class="text-gray-600">
				{lang === 'fr' ? 'Découvrez nos dernières actualités et mises à jour' : 'Discover our latest news and updates'}
			</p>
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
				<p class="text-gray-600 text-lg">
					{lang === 'fr' ? 'Aucune actualité disponible pour le moment.' : 'No news available at the moment.'}
				</p>
			</div>
		{:else}
			<!-- News Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each newsItems as news}
					<div
						class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
						onclick={() => viewNews(news)}
					>
						<!-- Image or Placeholder -->
						<div class="h-48 overflow-hidden bg-gray-200 flex items-center justify-center">
							{#if news.thumbnail || news.image}
								<img
									src={getImageUrl(news.thumbnail || news.image, !!news.thumbnail)}
									alt={news.title || 'News'}
									class="w-full h-full object-cover"
									loading="lazy"
								/>
							{:else}
								<!-- Placeholder Box -->
								<div class="w-full h-full flex items-center justify-center bg-gray-200">
									<svg
										class="w-16 h-16 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
								</div>
							{/if}
						</div>

						<!-- Content -->
						<div class="p-6">
							<!-- Date -->
							<p class="text-sm text-gray-500 mb-2">{formatDate(news.news_date)}</p>

							<!-- Title -->
							<h2 class="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
								{news.title || (lang === 'fr' ? 'Sans titre' : 'No title')}
							</h2>

							<!-- Summary -->
							{#if news.summary}
								<p class="text-gray-600 mb-4 line-clamp-3">{news.summary}</p>
							{/if}

							<!-- Author -->
							{#if news.author}
								<p class="text-sm text-gray-500">
									{lang === 'fr' ? 'Par' : 'By'} {news.author}
								</p>
							{/if}

							<!-- Read More Link -->
							<div class="mt-4">
								<span class="text-[#1a3a5f] font-semibold hover:underline">
									{lang === 'fr' ? 'Lire la suite →' : 'Read more →'}
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<FooterComponent />

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>

