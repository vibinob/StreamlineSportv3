<script>
	import { page } from '$app/stores';
	import * as m from '$lib/paraglide/messages';
	import { CURRENT_CLUB, CURRENT_CLUB_ID } from '$lib/clubs/currentClub.js';

	const lang = $derived.by(() => {
		const paramLang = $page.params.lang;
		if (paramLang === 'en' || paramLang === 'fr') {
			return paramLang;
		}
		return 'fr';
	});

	// Auto-discover HomePage components for each club folder.
	// This picks up any `./clubs/<clubId>/HomePage.svelte` without manual imports.
	const homeModules = import.meta.glob('./clubs/*/HomePage.svelte', {
		eager: true
	});

	/** @type {Record<string, any>} */
	const HOME_COMPONENTS = {};
	for (const [path, mod] of Object.entries(homeModules)) {
		const match = path.match(/\.\/clubs\/([^/]+)\/HomePage\.svelte$/);
		if (match) {
			const clubId = match[1];
			// @ts-ignore - dynamic module default export is the Svelte component
			HOME_COMPONENTS[clubId] = mod.default;
		}
	}

	const HomeComponent = HOME_COMPONENTS[CURRENT_CLUB_ID] || HOME_COMPONENTS['swimdorval'];
</script>

<svelte:head>
	<title>{CURRENT_CLUB.titlePrefix} | {m.nav_home()}</title>
	<meta name="description" content={CURRENT_CLUB.description} />	
</svelte:head>

<HomeComponent />
