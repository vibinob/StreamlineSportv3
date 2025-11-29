<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	const currentLang = $derived.by(() => {
		const paramLang = $page.params.lang;
		if (paramLang === 'en' || paramLang === 'fr') {
			return paramLang;
		}
		return 'fr';
	});
	const currentPath = $derived($page.url.pathname.replace(/^\/[^/]+/, ''));

	/**
	 * @param {string} newLang
	 */
	function switchLanguage(newLang) {
		const newPath = `/${newLang}${currentPath || ''}`;
		goto(newPath);
	}
</script>

<div class="relative">
	<button
		onclick={() => switchLanguage(currentLang === 'en' ? 'fr' : 'en')}
		class="flex items-center gap-1 px-2 py-1 text-sm font-roboto text-gray-700 hover:text-gray-900 transition-colors bg-transparent border-0 cursor-pointer"
	>
		<span class="uppercase">{currentLang === 'en' ? 'English' : 'Français'}</span>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-4 w-4"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
		</svg>
	</button>
</div>
