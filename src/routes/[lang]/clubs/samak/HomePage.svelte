<script>
	import * as m from '$lib/paraglide/messages';
	import { CURRENT_CLUB } from '$lib/clubs/currentClub.js';

	import Header from '$lib/components/clubs/swimdorval/Header.svelte';
	import HeroSlider from '$lib/components/clubs/swimdorval/HeroSlider.svelte';
	import MissionSection from '$lib/components/clubs/swimdorval/MissionSection.svelte';
	// import NewsSection from '$lib/components/NewsSection.svelte';
	import PartnersSection from '$lib/components/clubs/swimdorval/PartnersSection.svelte';
	import Footer from '$lib/components/clubs/swimdorval/Footer.svelte';
</script>

<svelte:head>
	<title>{CURRENT_CLUB.titlePrefix} | {m.nav_home()}</title>
	<meta name="description" content={CURRENT_CLUB.description} />
	<link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet" />
	<link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet" />
	<link href="https://fonts.googleapis.com/css?family=Karla" rel="stylesheet" />
	<link href="https://fonts.googleapis.com/css?family=Rubik" rel="stylesheet" />
	<link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet" />
	<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&display=swap" rel="stylesheet" />
</svelte:head>

<Header />
<HeroSlider />
<MissionSection />
<!-- <NewsSection /> -->
<PartnersSection />
<Footer />

