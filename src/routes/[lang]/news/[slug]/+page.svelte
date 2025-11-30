<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getNewsBySlug } from '$lib/apis/news-api';
	import { CURRENT_CLUB_ID } from '$lib/clubs/currentClub.js';

	const lang = $derived.by(() => {
		const paramLang = $page.params.lang;
		if (paramLang === 'en' || paramLang === 'fr') {
			return paramLang;
		}
		return 'fr';
	});

	const slug = $derived.by(() => $page.params.slug);

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
	/** @type {any | null} */
	let news = $state(null);
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

	// Load news by slug
	async function loadNews() {
		const currentSlug = slug;
		if (!currentSlug) {
			error = lang === 'fr' ? 'Slug invalide' : 'Invalid slug';
			loading = false;
			return;
		}

		loading = true;
		error = null;
		try {
			const result = await getNewsBySlug(currentSlug, lang);
			if (result.success && result.data) {
				news = result.data;
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

	onMount(() => {
		loadNews();
	});
</script>

<svelte:head>
	<title>{news?.title || (lang === 'fr' ? 'Actualité' : 'News')} | {CURRENT_CLUB_ID}</title>
	<meta name="description" content={news?.summary || ''} />
</svelte:head>

<HeaderComponent />

<div class="min-h-screen bg-gray-50 py-8">
	<div class="container mx-auto px-4 max-w-4xl">
		<!-- Back Button -->
		<div class="mb-6">
			<button
				type="button"
				onclick={() => goto(`/${lang}/news`)}
				class="text-[#1a3a5f] hover:text-[#1a3a5f]/80 font-semibold flex items-center gap-2"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				{lang === 'fr' ? 'Retour aux actualités' : 'Back to news'}
			</button>
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
			<!-- News Article -->
			<article class="bg-white rounded-lg shadow-md overflow-hidden">
				<!-- Featured Image -->
				{#if news.image}
					<div class="w-full h-96 overflow-hidden">
						<img
							src={getImageUrl(news.image, false)}
							alt={news.title || 'News'}
							class="w-full h-full object-cover"
							loading="lazy"
						/>
					</div>
				{/if}

				<!-- Article Content -->
				<div class="p-8">
					<!-- Date and Author -->
					<div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
						{#if news.news_date}
							<span>{formatDate(news.news_date)}</span>
						{/if}
						{#if news.author}
							<span>•</span>
							<span>{lang === 'fr' ? 'Par' : 'By'} {news.author}</span>
						{/if}
					</div>

					<!-- Title -->
					<h1 class="text-4xl font-bold text-gray-800 mb-4">
						{news.title || (lang === 'fr' ? 'Sans titre' : 'No title')}
					</h1>

					<!-- Summary -->
					{#if news.summary}
						<p class="text-xl text-gray-600 mb-6 leading-relaxed">{news.summary}</p>
					{/if}

					<!-- Article Content (HTML) -->
					{#if news.article}
						<div class="prose prose-lg max-w-none mt-8">
							{@html news.article}
						</div>
					{:else}
						<p class="text-gray-500 italic">
							{lang === 'fr' ? 'Le contenu de l\'article n\'est pas disponible.' : 'Article content is not available.'}
						</p>
					{/if}
				</div>
			</article>
		{/if}
	</div>
</div>

<FooterComponent />

<style>
	:global(.prose) {
		color: #374151;
	}

	:global(.prose h1) {
		font-size: 2.25rem;
		font-weight: 800;
		margin-top: 2em;
		margin-bottom: 1em;
		color: #1a3a5f;
	}

	:global(.prose h2) {
		font-size: 1.875rem;
		font-weight: 700;
		margin-top: 1.5em;
		margin-bottom: 0.75em;
		color: #1a3a5f;
	}

	:global(.prose h3) {
		font-size: 1.5rem;
		font-weight: 600;
		margin-top: 1.25em;
		margin-bottom: 0.5em;
		color: #1a3a5f;
	}

	:global(.prose p) {
		margin-bottom: 1.25em;
		line-height: 1.75;
	}

	:global(.prose img) {
		max-width: 100%;
		height: auto;
		margin: 2em 0;
		border-radius: 0.5rem;
	}

	:global(.prose a) {
		color: #1a3a5f;
		text-decoration: underline;
	}

	:global(.prose ul, .prose ol) {
		margin: 1.25em 0;
		padding-left: 1.75em;
	}

	:global(.prose li) {
		margin-bottom: 0.5em;
	}

	:global(.prose blockquote) {
		border-left: 4px solid #1a3a5f;
		padding-left: 1rem;
		margin: 1.5rem 0;
		font-style: italic;
		color: #6b7280;
	}

	:global(.prose table) {
		width: 100%;
		border-collapse: collapse;
		margin: 1.5rem 0;
	}

	:global(.prose table th, .prose table td) {
		border: 1px solid #e5e7eb;
		padding: 0.75rem;
		text-align: left;
	}

	:global(.prose table th) {
		background-color: #f9fafb;
		font-weight: 600;
	}
</style>

