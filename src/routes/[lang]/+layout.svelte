<script>
	import { page } from '$app/stores';
	import { setLanguageTag } from '$lib/paraglide/runtime';
	import '../../app.css';

	const lang = $derived.by(() => {
		const paramLang = $page.params.lang;
		if (paramLang === 'en' || paramLang === 'fr') {
			return paramLang;
		}
		return 'fr';
	});
	
	$effect(() => {
		setLanguageTag(lang);
	});
</script>

<slot />

