<script>
	import { page } from '$app/stores';
	import AdminHeader from '../../../../lib/components/admin/AdminHeader.svelte';
	import AdminFooter from '../../../../lib/components/admin/AdminFooter.svelte';

	const lang = $derived.by(() => {
		const paramLang = $page.params.lang;
		if (paramLang === 'en' || paramLang === 'fr') {
			return paramLang;
		}
		return 'fr';
	});
</script>

<svelte:head>
	<title>{lang === 'fr' ? 'Galerie' : 'Gallery'} | Admin</title>
</svelte:head>

<AdminHeader />

<div class="min-h-screen bg-gray-50 py-8">
	<div class="container mx-auto px-4 max-w-7xl">
		<!-- Gallery Header -->
		<div class="bg-white rounded-lg shadow-md p-6 mb-6">
			<h1 class="text-3xl font-bold text-gray-800 mb-2">
				{lang === 'fr' ? 'Galerie' : 'Gallery'}
			</h1>
			<p class="text-gray-600">
				{lang === 'fr'
					? 'Gérez vos galeries d\'images'
					: 'Manage your image galleries'}
			</p>
		</div>

		<!-- Gallery Content -->
		<div class="bg-white rounded-lg shadow-md p-8">
			<div class="text-center">
				<p class="text-gray-600">
					{lang === 'fr'
						? 'Fonctionnalité de galerie à venir'
						: 'Gallery functionality coming soon'}
				</p>
			</div>
		</div>
	</div>
</div>

<AdminFooter />

