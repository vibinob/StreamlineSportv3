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
		const unsubscribe = languageStore.subscribe(value => {
			_langTracker = value;
			// Update the global language tag in messages module
			m.setCurrentLanguageTag(value);
		});
		return unsubscribe;
	});
	
	// Helper function to get translations with current language
	/**
	 * @param {(lang: import('$lib/paraglide/runtime').LanguageTag) => string} fn
	 * @returns {string}
	 */
	const t = (fn) => fn(_langTracker);
</script>

<!-- Mission Section -->
<section class="py-16 bg-gradient-to-b from-gray-50 to-white">
	<!-- Hidden element to track language changes -->
	<span style="display: none;">{_langTracker}</span>
	<div class="container mx-auto px-4 max-w-7xl">
		<div class="max-w-5xl mx-auto">
			<!-- Welcome Section -->
			<div class="text-center mb-12">
				<div class="flex items-center justify-center gap-4 mb-6">
					<div class="h-0.5 bg-[#8B4513] flex-1 max-w-[200px]"></div>
					<h1 class="text-3xl md:text-5xl font-bold text-black whitespace-nowrap">
						{t(m.mission_welcome)}
					</h1>
					<div class="h-0.5 bg-[#8B4513] flex-1 max-w-[200px]"></div>
				</div>
			</div>

			<!-- Description with Image -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
				<div class="order-2 md:order-1">
					<div class="relative rounded-xl overflow-hidden shadow-2xl">
						<img
							src="https://placehold.co/600x400/0099cc/FFFFFF?text=Dorval+Aquatic+Complex"
							alt="Dorval Aquatic and Sports Complex"
							class="w-full h-auto"
						/>
						<div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
					</div>
				</div>
				<div class="order-1 md:order-2 flex items-center">
					<div class="bg-white rounded-xl p-6 shadow-lg border-l-4 border-[#F45E12]">
						<p class="text-base md:text-lg text-gray-700 leading-relaxed">
							{t(m.mission_description)}
						</p>
					</div>
				</div>
			</div>

			<!-- Mission Statement -->
			<div
				class="relative rounded-2xl p-8 md:p-12 mb-16 text-black overflow-hidden shadow-2xl"
				style="background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%); background-size: 400% 400%; animation: gradient 15s ease infinite;"
			>
				<div class="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>
				<div class="relative z-10">
					<div class="text-center mb-8">
						<div class="inline-block bg-[#F45E12] px-6 py-2 rounded-full">
							<h2 class="text-2xl md:text-3xl font-bold text-white">
								{t(m.mission_missionTitle)}
							</h2>
						</div>
					</div>
					<div class="text-center max-w-4xl mx-auto">
						<div class="bg-white/60 backdrop-blur-sm rounded-lg p-4 shadow-md">
							<div class="space-y-4">
								<p class="text-base md:text-lg text-gray-800">
									{t(m.mission_mission1)}
								</p>
								<p class="text-base md:text-lg text-gray-800">
									{t(m.mission_mission2)}
								</p>
								<p class="text-base md:text-lg text-gray-800">
									{t(m.mission_mission3)}
								</p>
								<p class="text-base md:text-lg text-gray-800">
									{t(m.mission_mission4)}
								</p>
								<p class="text-base md:text-lg text-gray-800">
									{t(m.mission_mission5)}
								</p>
								<p class="text-base md:text-lg text-gray-800">
									{t(m.mission_mission6)}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Coaches Section -->
			<div
				class="relative rounded-2xl p-8 md:p-12 mb-16 text-black overflow-hidden shadow-2xl"
				style="background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%); background-size: 400% 400%; animation: gradient 15s ease infinite;"
			>
				<div class="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>
				<div class="relative z-10">
					<div class="text-center mb-8">
						<div class="inline-block bg-[#F45E12] px-6 py-2 rounded-full">
							<h2 class="text-2xl md:text-3xl font-bold text-white">
								{t(m.mission_coachesTitle)}
							</h2>
						</div>
					</div>
					<div class="text-center max-w-4xl mx-auto">
						<div class="bg-white/60 backdrop-blur-sm rounded-lg p-4 shadow-md">
							<p class="text-base md:text-lg text-gray-800">
								{t(m.mission_coaches1)} {t(m.mission_coaches2)} {t(m.mission_coaches3)}
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Image Gallery -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
				<div class="relative group overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
					<img
						src="https://placehold.co/300x200/0099cc/FFFFFF?text=Swimming+1"
						alt="Swimming"
						class="w-full h-auto rounded-xl transform group-hover:scale-110 transition-transform duration-300"
					/>
					<div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
				</div>
				<div class="relative group overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
					<img
						src="https://placehold.co/300x200/0099cc/FFFFFF?text=Swimming+2"
						alt="Swimming"
						class="w-full h-auto rounded-xl transform group-hover:scale-110 transition-transform duration-300"
					/>
					<div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
				</div>
				<div class="relative group overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
					<img
						src="https://placehold.co/300x200/0099cc/FFFFFF?text=Swimming+3"
						alt="Swimming"
						class="w-full h-auto rounded-xl transform group-hover:scale-110 transition-transform duration-300"
					/>
					<div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
				</div>
				<div class="relative group overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
					<img
						src="https://placehold.co/300x200/0099cc/FFFFFF?text=Masters"
						alt="Masters Swimming"
						class="w-full h-auto rounded-xl transform group-hover:scale-110 transition-transform duration-300"
					/>
					<div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	@keyframes gradient {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}
</style>
