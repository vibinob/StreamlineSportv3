<script>
	import { page } from '$app/stores';
	import { t } from '$lib/i18n/index.js';

	const lang = $derived.by(() => {
		const paramLang = $page.params.lang;
		if (paramLang === 'en' || paramLang === 'fr') {
			return paramLang;
		}
		return 'fr';
	});
</script>

<!-- Footer -->
<footer class="bg-black text-white pt-12 pb-4">
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
						<div class="font-oswald font-bold text-[#F45E12] text-base uppercase mb-2">
							{t(lang, 'footer.address')}
						</div>
						<div class="font-lato font-normal text-[#95cbf9] text-sm mb-1">
							{t(lang, 'footer.complex')}
						</div>
						<div class="font-lato font-normal text-white text-sm">
							{t(lang, 'footer.street')}
						</div>
						<div class="font-lato font-normal text-white text-sm">
							{t(lang, 'footer.city')}
						</div>
					</div>
				</div>
			</div>

			<!-- Contact Section -->
			<div class="md:col-span-3 pt-10 md:pt-12 px-2 md:px-0">
				<div class="font-oswald font-bold text-[#F45E12] text-base uppercase mb-2">
					{t(lang, 'footer.contact')}
				</div>
				<div class="font-lato font-normal text-[#95cbf9] text-sm mb-2">
					{t(lang, 'footer.complex')}
				</div>
				<div class="font-lato font-normal text-white text-sm mb-2 flex items-center gap-2">
					<img
						src="https://placehold.co/20x20/FFFFFF/000000?text=📞"
						alt="Phone"
						class="w-5 h-5"
					/>
					<span>{t(lang, 'footer.phone')}</span>
				</div>
				<div class="font-lato font-normal text-[#95cbf9] text-sm flex items-center gap-2">
					<img
						src="https://placehold.co/20x20/FFFFFF/000000?text=✉"
						alt="Email"
						class="w-5 h-5"
					/>
					<a href="mailto:info@swimdorval.ca" class="text-[#F45E12] hover:underline">
						{t(lang, 'footer.email')}
					</a>
				</div>
			</div>

			<!-- Social Media Section -->
			<div class="md:col-span-2 pt-10 md:pt-12 px-2 md:px-0">
				<div class="font-oswald font-bold text-[#F45E12] text-base uppercase mb-2">
					{t(lang, 'footer.socialize')}
				</div>
				<div class="space-y-2">
					<div class="font-lato font-normal text-white text-sm flex items-center gap-2">
						<img
							src="https://placehold.co/20x20/FFFFFF/000000?text=🐦"
							alt="Twitter"
							class="w-5 h-5"
						/>
						<a
							href="https://twitter.com/swimdorval"
							target="_blank"
							rel="noopener"
							class="text-white hover:underline"
						>
							{t(lang, 'footer.twitter')}
						</a>
					</div>
					<div class="font-lato font-normal text-white text-sm flex items-center gap-2">
						<img
							src="https://placehold.co/20x20/FFFFFF/000000?text=f"
							alt="Facebook"
							class="w-5 h-5"
						/>
						<a
							href="https://www.facebook.com/profile.php?id=100009819467280"
							target="_blank"
							rel="noopener"
							class="text-white hover:underline"
						>
							{t(lang, 'footer.facebook')}
						</a>
					</div>
					<div class="font-lato font-normal text-white text-sm flex items-center gap-2">
						<img
							src="https://placehold.co/20x20/FFFFFF/000000?text=📷"
							alt="Instagram"
							class="w-5 h-5"
						/>
						<a
							href="https://www.instagram.com/swimdorval"
							target="_blank"
							rel="noopener"
							class="text-white hover:underline"
						>
							{t(lang, 'footer.instagram')}
						</a>
					</div>
					<div class="font-lato font-normal text-white text-sm flex items-center gap-2">
						<img
							src="https://placehold.co/20x20/FFFFFF/000000?text=▶"
							alt="YouTube"
							class="w-5 h-5"
						/>
						<a
							href="https://www.youtube.com/channel/UCVTuqX-XllHwNOwog7mDk4Q"
							target="_blank"
							rel="noopener"
							class="text-white hover:underline"
						>
							{t(lang, 'footer.youtube')}
						</a>
					</div>
				</div>
			</div>

			<!-- Sponsors Section -->
			<div class="md:col-span-2 pt-10 md:pt-12 px-2 md:px-0">
				<div class="font-oswald font-bold text-[#F45E12] text-base uppercase mb-2">
					{t(lang, 'footer.sponsors')}
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
			<div class="font-lato font-normal text-white text-sm">
				{t(lang, 'footer.copyright')} <span>{t(lang, 'footer.clubName')}</span>
			</div>
		</div>
	</div>
</footer>

<style>
	.font-oswald {
		font-family: 'Oswald', sans-serif;
	}
</style>
