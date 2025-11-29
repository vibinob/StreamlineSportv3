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
	<title>{lang === 'fr' ? 'Tableau de bord' : 'Dashboard'} | Admin</title>
</svelte:head>

<AdminHeader />

<div class="min-h-screen bg-gray-50 py-8">
	<div class="container mx-auto px-4 max-w-7xl">
		<!-- Dashboard Header -->
		<div class="bg-white rounded-lg shadow-md p-6 mb-6">
			<h1 class="text-3xl font-bold text-gray-800 mb-2">
				{lang === 'fr' ? 'Tableau de bord' : 'Dashboard'}
			</h1>
			<p class="text-gray-600">
				{lang === 'fr'
					? 'Bienvenue dans le panneau d\'administration'
					: 'Welcome to the admin panel'}
			</p>
		</div>

		<!-- Welcome Card -->
		<div class="bg-white rounded-lg shadow-md p-8">
			<div class="text-center">
				<div class="mb-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-16 w-16 mx-auto text-blue-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
						/>
					</svg>
				</div>
				<h2 class="text-2xl font-semibold text-gray-800 mb-4">
					{lang === 'fr' ? 'Bienvenue!' : 'Welcome!'}
				</h2>
				<p class="text-gray-600 text-lg max-w-2xl mx-auto">
					{lang === 'fr'
						? 'Vous êtes connecté au panneau d\'administration. Utilisez le menu pour accéder aux différentes fonctionnalités.'
						: 'You are logged into the admin panel. Use the menu to access different features.'}
				</p>
			</div>
		</div>
	</div>
</div>

<AdminFooter />

