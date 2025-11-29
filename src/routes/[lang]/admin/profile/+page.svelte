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

	// Form state
	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let password = $state('');
	let phone = $state('');
	let role = $state('');

	/**
	 * @param {Event} e
	 */
	function handleSubmit(e) {
		e.preventDefault();
		console.log('Profile save:', {
			firstName,
			lastName,
			email,
			password,
			phone,
			role
		});
		// TODO: Implement profile save API call
	}
</script>

<svelte:head>
	<title>{lang === 'fr' ? 'Profil' : 'Profile'} | Admin</title>
</svelte:head>

<AdminHeader />

<div class="min-h-screen bg-gray-50 py-8">
	<div class="container mx-auto px-4 max-w-7xl">
		<!-- Profile Header -->
		<div class="bg-white rounded-lg shadow-md p-6 mb-6">
			<h1 class="text-3xl font-bold text-gray-800 mb-2">
				{lang === 'fr' ? 'Profil' : 'Profile'}
			</h1>			
		</div>

		<!-- Profile Form -->
		<div class="bg-white rounded-lg shadow-md p-8">
			<form onsubmit={handleSubmit}>
				<div class="space-y-6">
					<!-- Prénom / First Name -->
					<div>
						<label
							for="firstName"
							class="block text-sm font-bold text-gray-700 mb-2"
						>
							{lang === 'fr' ? 'Prénom:' : 'First Name:'}
						</label>
						<input
							type="text"
							id="firstName"
							bind:value={firstName}
							class="w-full md:w-2/3 lg:w-1/2 px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a5f]/20 hover:border-gray-400 bg-white shadow-sm border-2 border-gray-300 focus:border-[#1a3a5f]"
							required
						/>
					</div>

					<!-- Nom de Famille / Last Name -->
					<div>
						<label
							for="lastName"
							class="block text-sm font-bold text-gray-700 mb-2"
						>
							{lang === 'fr' ? 'Nom de Famille:' : 'Last Name:'}
						</label>
						<input
							type="text"
							id="lastName"
							bind:value={lastName}
							class="w-full md:w-2/3 lg:w-1/2 px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a5f]/20 hover:border-gray-400 bg-white shadow-sm border-2 border-gray-300 focus:border-[#1a3a5f]"
							required
						/>
					</div>

					<!-- Courriel / Email -->
					<div>
						<label
							for="email"
							class="block text-sm font-bold text-gray-700 mb-2"
						>
							{lang === 'fr' ? 'Courriel:' : 'Email:'}
						</label>
						<input
							type="email"
							id="email"
							bind:value={email}
							class="w-full md:w-2/3 lg:w-1/2 px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a5f]/20 hover:border-gray-400 bg-white shadow-sm border-2 border-gray-300 focus:border-[#1a3a5f]"
							required
						/>
					</div>

					<!-- Mot de Passe / Password -->
					<div>
						<label
							for="password"
							class="block text-sm font-bold text-gray-700 mb-2"
						>
							{lang === 'fr' ? 'Mot de Passe:' : 'Password:'}
						</label>
						<input
							type="password"
							id="password"
							bind:value={password}
							class="w-full md:w-2/3 lg:w-1/2 px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a5f]/20 hover:border-gray-400 bg-white shadow-sm border-2 border-gray-300 focus:border-[#1a3a5f]"
							required
						/>
					</div>

					<!-- Téléphone / Phone -->
					<div>
						<label
							for="phone"
							class="block text-sm font-bold text-gray-700 mb-2"
						>
							{lang === 'fr' ? 'Téléphone:' : 'Phone:'}
						</label>
						<input
							type="tel"
							id="phone"
							bind:value={phone}
							class="w-full md:w-2/3 lg:w-1/2 px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a5f]/20 hover:border-gray-400 bg-white shadow-sm border-2 border-gray-300 focus:border-[#1a3a5f]"
							required
						/>
					</div>

					<!-- Rôle / Role -->
					<div>
						<label
							for="role"
							class="block text-sm font-bold text-gray-700 mb-2"
						>
							{lang === 'fr' ? 'Rôle:' : 'Role:'}
						</label>
						<input
							type="text"
							id="role"
							bind:value={role}
							class="w-full md:w-2/3 lg:w-1/2 px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a5f]/20 hover:border-gray-400 bg-white shadow-sm border-2 border-gray-300 focus:border-[#1a3a5f]"
							required
						/>
					</div>

					<!-- Save Button -->
					<div class="pt-4">
						<button
							type="submit"
							class="bg-[#1a3a5f] text-white py-3 px-12 rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-0 transition-all duration-200 w-full md:w-[200px]"
						>
							{lang === 'fr' ? 'Enregistrer' : 'Save'}
						</button>
					</div>
				</div>
			</form>
		</div>
	</div>
</div>

<AdminFooter />

