<script>
	import { page } from '$app/stores';
	import * as m from '$lib/paraglide/messages';
	import Header from '$lib/components/Header.svelte';
	import HeroSlider from '$lib/components/HeroSlider.svelte';
	import MissionSection from '$lib/components/MissionSection.svelte';
	// import NewsSection from '$lib/components/NewsSection.svelte';
	import PartnersSection from '$lib/components/PartnersSection.svelte';
	import Footer from '$lib/components/Footer.svelte';

	const lang = $derived.by(() => {
		const paramLang = $page.params.lang;
		if (paramLang === 'en' || paramLang === 'fr') {
			return paramLang;
		}
		return 'fr';
	});
</script>

<svelte:head>
	<title>Swim Dorval | {m.nav_home()}</title>
	<meta name="description" content="Dorval Swim Club" />
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

