<script>
	import { page } from '$app/stores';
	import * as m from '$lib/paraglide/messages';
	import { languageTagStore } from '$lib/paraglide/runtime';
	import { get } from 'svelte/store';

	let currentSlide = $state(0);

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

	// Load hero images based on language
	const slides = $derived.by(() => {
		const imageLang = lang;
		if (imageLang === 'en') {
			return [
				{ id: 1, image: '/images/hero/en/1_img.jpg', alt: 'Hero slider image 1' },
				{ id: 2, image: '/images/hero/en/4_img.jpg', alt: 'Hero slider image 2' }
			];
		} else {
			return [
				{ id: 1, image: '/images/hero/fr/1_img_fr.jpg', alt: 'Image du slider héro 1' },
				{ id: 2, image: '/images/hero/fr/4_img_fr.jpg', alt: 'Image du slider héro 2' }
			];
		}
	});

	function nextSlide() {
		currentSlide = (currentSlide + 1) % slides.length;
	}

	function prevSlide() {
		currentSlide = (currentSlide - 1 + slides.length) % slides.length;
	}
</script>

<!-- Hero Slider -->
<section class="relative w-full mb-0">
	<!-- Hidden element to track language changes -->
	<span style="display: none;">{_langTracker}</span>
	<div class="relative w-full">
		<div class="relative w-full h-auto">
			{#each slides as slide, index}
				<div class="w-full" class:hidden={index !== currentSlide}>
					<img src={slide.image} alt={slide.alt} class="w-full h-auto block" />
				</div>
			{/each}
		</div>
		<button
			class="absolute top-1/2 -translate-y-1/2 left-0 bg-black/50 border-0 text-white text-4xl px-5 py-4 cursor-pointer z-10 transition-colors hover:bg-black/70"
			onclick={prevSlide}
			aria-label="Previous slide"
		>
			<span>‹</span>
		</button>
		<button
			class="absolute top-1/2 -translate-y-1/2 right-0 bg-black/50 border-0 text-white text-4xl px-5 py-4 cursor-pointer z-10 transition-colors hover:bg-black/70"
			onclick={nextSlide}
			aria-label="Next slide"
		>
			<span>›</span>
		</button>
		<div class="absolute bottom-10 md:bottom-10 right-[15%] md:right-[10%] z-10">
			<a href="/{lang}/essais" class="join-button">
				<img
					src="https://placehold.co/200x60/212E65/FFFFFF?text={encodeURIComponent(t(m.hero_joinTeam))}"
					alt={t(m.hero_joinTeam)}
					class="max-w-[150px] md:max-w-[200px] h-auto"
				/>
			</a>
		</div>
	</div>
</section>

