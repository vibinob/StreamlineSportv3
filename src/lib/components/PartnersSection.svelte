<script>
	import { page } from '$app/stores';
	import * as m from '$lib/paraglide/messages';
	import { languageTagStore } from '$lib/paraglide/runtime';
	import { get } from 'svelte/store';

	const lang = $derived.by(() => {
		const paramLang = $page.params.lang;
		if (paramLang === 'en' || paramLang === 'fr') {
			return paramLang;
		}
		return 'fr';
	});

	// Subscribe to language tag store to make messages reactive
	const languageStore = languageTagStore();
	let _langTracker = $state(get(languageStore));
	const initialLang = get(languageStore);
	// Initialize the global language tag
	m.setCurrentLanguageTag(initialLang);
	
	$effect(() => {
		return languageStore.subscribe(value => {
			_langTracker = value;
			// Update the global language tag in messages module
			m.setCurrentLanguageTag(value);
		});
	});
	
	// Helper function to get translations with current language
	/**
	 * @param {(lang: import('$lib/paraglide/runtime').LanguageTag) => string} fn
	 * @returns {string}
	 */
	const t = (fn) => fn(_langTracker);

	const partners = [
		{ id: 1, logo: 'https://placehold.co/150x100/E0E0E0/666666?text=Partner+1' },
		{ id: 2, logo: 'https://placehold.co/150x100/E0E0E0/666666?text=Partner+2' },
		{ id: 3, logo: 'https://placehold.co/150x100/E0E0E0/666666?text=Partner+3' },
		{ id: 4, logo: 'https://placehold.co/150x100/E0E0E0/666666?text=Partner+4' },
		{ id: 5, logo: 'https://placehold.co/150x100/E0E0E0/666666?text=Partner+5' },
		{ id: 6, logo: 'https://placehold.co/150x100/E0E0E0/666666?text=Partner+6' },
		{ id: 7, logo: 'https://placehold.co/150x100/E0E0E0/666666?text=Partner+7' }
	];
</script>

<!-- Partners Section -->
<section class="py-12 bg-[#F4F4F4] text-center">
	<!-- Hidden element to track language changes -->
	<span style="display: none;">{_langTracker}</span>
	<div class="container mx-auto px-4 max-w-7xl">
		<h2 class="font-roboto text-3xl text-black mb-8">{t(m.partners_title)}</h2>
		<div class="flex justify-center items-center flex-wrap gap-5 md:gap-8 p-5">
			{#each partners as partner}
				<div class="flex-none">
					<img
						src={partner.logo}
						alt="Partner {partner.id}"
						class="max-w-[100px] md:max-w-[150px] h-auto grayscale transition-all hover:grayscale-0"
					/>
				</div>
			{/each}
		</div>
	</div>
</section>

