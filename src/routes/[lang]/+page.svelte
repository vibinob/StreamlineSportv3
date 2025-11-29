<script>
	import { page } from '$app/stores';
	import * as m from '$lib/paraglide/messages';
	import { CURRENT_CLUB, CURRENT_CLUB_ID } from '$lib/clubs/currentClub.js';

	import SwimDorvalHome from './clubs/SwimDorvalHome.svelte';
	// When you add another club, create its home component and import here.
	// import SamakHome from './clubs/SamakHome.svelte';

	const lang = $derived.by(() => {
		const paramLang = $page.params.lang;
		if (paramLang === 'en' || paramLang === 'fr') {
			return paramLang;
		}
		return 'fr';
	});

	// Pick the correct home component based on the env-selected club.
	const HomeComponent =
		CURRENT_CLUB_ID === 'swimdorval'
			? SwimDorvalHome
			: SwimDorvalHome; // fallback for now
</script>

<svelte:head>
	<title>{CURRENT_CLUB.titlePrefix} | {m.nav_home()}</title>
	<meta name="description" content={CURRENT_CLUB.description} />	
</svelte:head>

<HomeComponent />
