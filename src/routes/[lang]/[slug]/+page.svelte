<script>
	import { page } from '$app/stores';
	import { CURRENT_CLUB_ID } from '$lib/clubs/currentClub.js';

	const lang = $derived.by(() => {
		const paramLang = $page.params.lang;
		if (paramLang === 'en' || paramLang === 'fr') {
			return paramLang;
		}
		return 'fr';
	});

	const slug = $derived.by(() => $page.params.slug);

	// Auto-discover page components from pages folder
	const pageModules = import.meta.glob('$lib/components/pages/*.svelte', {
		eager: true
	});

	/** @type {Record<string, any>} */
	const PAGE_COMPONENTS = {};
	for (const [path, mod] of Object.entries(pageModules)) {
		const match = path.match(/pages\/([^/]+)\.svelte$/);
		if (match) {
			const pageName = match[1];
			// @ts-ignore - dynamic module default export is the Svelte component
			PAGE_COMPONENTS[pageName] = mod.default;
		}
	}

	// Map slug to page component name
	// Gallery/Galerie -> Gallery
	/**
	 * @param {string} currentSlug
	 */
	const getPageComponentName = (currentSlug) => {
		if (currentSlug === 'Gallery' || currentSlug === 'Galerie') {
			return 'Gallery';
		}
		return currentSlug;
	};

	const pageComponentName = $derived.by(() => {
		if (!slug) return '';
		return getPageComponentName(slug);
	});
	const PageComponent = $derived.by(() => {
		if (!pageComponentName) return null;
		return PAGE_COMPONENTS[pageComponentName] || null;
	});
	const hasPageComponent = $derived.by(() => !!PageComponent);

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
			// @ts-ignore - dynamic module default export is the Svelte component
			HEADER_COMPONENTS[clubId] = mod.default;
		}
	}

	/** @type {Record<string, any>} */
	const FOOTER_COMPONENTS = {};
	for (const [path, mod] of Object.entries(footerModules)) {
		const match = path.match(/clubs\/([^/]+)\/Footer\.svelte$/);
		if (match) {
			const clubId = match[1];
			// @ts-ignore - dynamic module default export is the Svelte component
			FOOTER_COMPONENTS[clubId] = mod.default;
		}
	}

	const HeaderComponent = HEADER_COMPONENTS[CURRENT_CLUB_ID] || HEADER_COMPONENTS['swimdorval'];
	const FooterComponent = FOOTER_COMPONENTS[CURRENT_CLUB_ID] || FOOTER_COMPONENTS['swimdorval'];
</script>

<svelte:head>
	<title>{slug} | {CURRENT_CLUB_ID}</title>
	<meta name="description" content={`Page: ${slug}`} />
</svelte:head>

<HeaderComponent />

{#if hasPageComponent && PageComponent}
	<PageComponent {lang} />
{:else}
	<!-- Page Not Found -->
	<div class="min-h-screen bg-gray-50 py-8">
		<div class="container mx-auto px-4 max-w-7xl">
			<div class="bg-white rounded-lg shadow-md p-8 text-center">
				<h1 class="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h1>
				<p class="text-gray-600">The page "{slug}" does not exist.</p>
			</div>
		</div>
	</div>
{/if}

<FooterComponent />

