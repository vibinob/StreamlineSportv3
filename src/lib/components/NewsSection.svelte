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

<!-- News Section -->
<section class="py-8 bg-[#FCF8EF]">
	<div class="container mx-auto px-4 max-w-7xl">
		<div class="flex flex-col md:flex-row gap-5 my-5 bg-white p-5 rounded">
			<div class="flex-none w-full md:w-[200px]">
				<img src="https://placehold.co/200x150/F5F5F5/666666?text=News+Image" alt="News" class="w-full h-auto" />
			</div>
			<div class="flex-1">
				<h3 class="font-montserrat text-xl font-bold text-gray-800 m-0 mb-2.5">{t(lang, 'news.title')}</h3>
				<div class="font-lato text-base text-gray-800 mb-4">{t(lang, 'news.date')}</div>
				<div>
					<a
						href="/{lang}/articlesnouvellelles10"
						class="inline-block px-4 py-2.5 border-0 rounded no-underline font-karla font-bold cursor-pointer transition-colors bg-[#ad0000] text-white hover:bg-[#8b0000]"
					>
						{t(lang, 'news.readMore')}
					</a>
				</div>
			</div>
		</div>
		<div class="text-center py-8">
			<a href="/{lang}/nouvellees" class="view-all-link">
				<img
					src="https://placehold.co/300x50/0099cc/FFFFFF?text={encodeURIComponent(t(lang, 'news.viewAll'))}"
					alt={t(lang, 'news.viewAll')}
					class="max-w-[300px] h-auto"
				/>
			</a>
		</div>
	</div>
</section>

