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
</script>

<!-- Footer -->
<footer class="bg-black text-white pt-12 pb-4">
	<!-- Hidden element to track language changes -->
	<span style="display: none;">{_langTracker}</span>
	<div class="container mx-auto px-4 max-w-7xl">
		<div class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-4">
			<!-- Logo and Address Section -->
			<div class="md:col-span-5 pt-10 md:pt-12 px-2 md:px-0">
				<div class="flex flex-col md:flex-row gap-6">
					<div class="md:w-1/3">
						<img
							src="https://placehold.co/150x100/FFFFFF/000000?text=Swim+Dorval+Logo"
							alt="Swim Dorval Logo"
							class="w-full max-w-[150px] h-auto"
						/>
					</div>
					<div class="md:w-2/3">
						<div class="font-oswald font-bold text-[#F45E12] text-lg uppercase mb-2">
							{t(m.footer_address)}
						</div>
						<div class="font-lato font-normal text-[#95cbf9] text-base mb-1">
							{t(m.footer_complex)}
						</div>
						<div class="font-lato font-normal text-white text-base">
							{t(m.footer_street)}
						</div>
						<div class="font-lato font-normal text-white text-base">
							{t(m.footer_city)}
						</div>
					</div>
				</div>
			</div>

			<!-- Contact Section -->
			<div class="md:col-span-3 pt-10 md:pt-12 px-2 md:px-0">
				<div class="font-oswald font-bold text-[#F45E12] text-lg uppercase mb-2">
					{t(m.footer_contact)}
				</div>
				<div class="font-lato font-normal text-[#95cbf9] text-base mb-2">
					{t(m.footer_complex)}
				</div>
				<div class="font-lato font-normal text-white text-base mb-2 flex items-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
						<path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
					</svg>
					<span>{t(m.footer_phone)}</span>
				</div>
				<div class="font-lato font-normal text-[#95cbf9] text-base flex items-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-[#95cbf9]" fill="currentColor" viewBox="0 0 24 24">
						<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
					</svg>
					<a href="mailto:info@swimdorval.ca" class="text-[#F45E12] hover:underline">
						{t(m.footer_email)}
					</a>
				</div>
			</div>

			<!-- Social Media Section -->
			<div class="md:col-span-2 pt-10 md:pt-12 px-2 md:px-0">
				<div class="font-oswald font-bold text-[#F45E12] text-lg uppercase mb-2">
					{t(m.footer_socialize)}
				</div>
				<div class="space-y-2">
					<div class="font-lato font-normal text-white text-base flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
							<path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
						</svg>
						<a
							href="https://twitter.com/swimdorval"
							target="_blank"
							rel="noopener"
							class="text-white hover:text-[#F45E12] transition-colors"
						>
							{t(m.footer_twitter)}
						</a>
					</div>
					<div class="font-lato font-normal text-white text-base flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
							<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
						</svg>
						<a
							href="https://www.facebook.com/profile.php?id=100009819467280"
							target="_blank"
							rel="noopener"
							class="text-white hover:text-[#F45E12] transition-colors"
						>
							{t(m.footer_facebook)}
						</a>
					</div>
					<div class="font-lato font-normal text-white text-base flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
						</svg>
						<a
							href="https://www.instagram.com/swimdorval"
							target="_blank"
							rel="noopener"
							class="text-white hover:text-[#F45E12] transition-colors"
						>
							{t(m.footer_instagram)}
						</a>
					</div>
					<div class="font-lato font-normal text-white text-base flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
							<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
						</svg>
						<a
							href="https://www.youtube.com/channel/UCVTuqX-XllHwNOwog7mDk4Q"
							target="_blank"
							rel="noopener"
							class="text-white hover:text-[#F45E12] transition-colors"
						>
							{t(m.footer_youtube)}
						</a>
					</div>
				</div>
			</div>

			<!-- Sponsors Section -->
			<div class="md:col-span-2 pt-10 md:pt-12 px-2 md:px-0">
				<div class="font-oswald font-bold text-[#F45E12] text-lg uppercase mb-2">
					{t(m.footer_sponsors)}
				</div>
				<div class="space-y-3">
					<div>
						<img
							src="https://placehold.co/120x60/FFFFFF/000000?text=Finis"
							alt="Finis Sponsor"
							class="w-full max-w-[120px] h-auto"
						/>
					</div>
					<div>
						<img
							src="https://placehold.co/120x60/FFFFFF/000000?text=GoSwim"
							alt="GoSwim Sponsor"
							class="w-full max-w-[120px] h-auto"
						/>
					</div>
					<div>
						<img
							src="https://placehold.co/120x60/FFFFFF/000000?text=Kinatex"
							alt="Kinatex Sponsor"
							class="w-full max-w-[120px] h-auto"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Copyright Section -->
		<div class="text-center w-full pt-5 pb-2 mt-8 border-t border-gray-800">
			<div class="font-lato font-normal text-white text-base">
				{t(m.footer_copyright)} <span>{t(m.footer_clubName)}</span>
			</div>
		</div>
	</div>
</footer>

<style>
	.font-oswald {
		font-family: 'Oswald', sans-serif;
	}
</style>
