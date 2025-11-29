<script>
	import { page } from '$app/stores';
	import { CURRENT_CLUB_ID } from '$lib/clubs/currentClub.js';

	const lang = $derived.by(() => {
		const paramLang = $page.params.lang;
		if (paramLang === 'en' || paramLang === 'fr') {
			return paramLang;
		}
		return 'fr';
	});

	// Auto-discover Header components for each club folder
	const headerModules = import.meta.glob('$lib/components/clubs/*/Header.svelte', {
		eager: true
	});

	// Auto-discover Footer components for each club folder
	const footerModules = import.meta.glob('$lib/components/clubs/*/Footer.svelte', {
		eager: true
	});

	/** @type {Record<string, any>} */
	const HEADER_COMPONENTS = {};
	for (const [path, mod] of Object.entries(headerModules)) {
		const match = path.match(/clubs\/([^/]+)\/Header\.svelte$/);
		if (match) {
			const clubId = match[1];
			// @ts-ignore - dynamic module default export is the Svelte component
			HEADER_COMPONENTS[clubId] = mod.default;
		}
	}

	/** @type {Record<string, any>} */
	const FOOTER_COMPONENTS = {};
	for (const [path, mod] of Object.entries(footerModules)) {
		const match = path.match(/clubs\/([^/]+)\/Footer\.svelte$/);
		if (match) {
			const clubId = match[1];
			// @ts-ignore - dynamic module default export is the Svelte component
			FOOTER_COMPONENTS[clubId] = mod.default;
		}
	}

	const HeaderComponent = HEADER_COMPONENTS[CURRENT_CLUB_ID] || HEADER_COMPONENTS['swimdorval'];
	const FooterComponent = FOOTER_COMPONENTS[CURRENT_CLUB_ID] || FOOTER_COMPONENTS['swimdorval'];

	// Tab state
	let activeTab = $state('login'); // 'login', 'forgot', 'create'

	// Form states
	let loginEmail = $state('');
	let loginPassword = $state('');
	let forgotEmail = $state('');
	let createEmail = $state('');
	let createEmailConfirm = $state('');
	let createPassword = $state('');
	let createPasswordConfirm = $state('');

	// Form handlers
	/**
	 * @param {Event} e
	 */
	function handleLogin(e) {
		e.preventDefault();
		console.log('Login:', { email: loginEmail, password: loginPassword });
		// TODO: Implement login API call
	}

	/**
	 * @param {Event} e
	 */
	function handleForgotPassword(e) {
		e.preventDefault();
		console.log('Forgot password:', { email: forgotEmail });
		// TODO: Implement forgot password API call
	}

	/**
	 * @param {Event} e
	 */
	function handleCreateAccount(e) {
		e.preventDefault();
		console.log('Create account:', {
			email: createEmail,
			emailConfirm: createEmailConfirm,
			password: createPassword,
			passwordConfirm: createPasswordConfirm
		});
		// TODO: Implement create account API call
	}
</script>

<svelte:head>
	<title>{lang === 'fr' ? 'Connexion' : 'Login'} | {lang === 'fr' ? 'Créer un compte' : 'Create Account'}</title>
</svelte:head>

<HeaderComponent />

<div class="bg-white p-4 pt-8">
	<div class="bg-white rounded-lg shadow-xl w-full max-w-4xl p-8 mx-auto">
		<!-- Title - Dynamic based on active tab -->
		<h1 class="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">
			{#if activeTab === 'login'}
				{lang === 'fr' ? 'Connexion' : 'Login'}
			{:else if activeTab === 'forgot'}
				{lang === 'fr' ? 'Mot de passe oublié' : 'Forgot Password'}
			{:else if activeTab === 'create'}
				{lang === 'fr' ? 'Créer un compte' : 'Create Account'}
			{/if}
		</h1>
		<hr class="border-gray-300 mb-8" />

		<!-- Tab Content -->
		<div class="grid md:grid-cols-2 gap-8" class:grid-cols-1={activeTab === 'create'}>
			<!-- Left Column - Instructions (Login & Forgot tabs only) -->
			{#if activeTab === 'login' || activeTab === 'forgot'}
				<div class="space-y-4">
					{#if activeTab === 'login'}
						<p class="text-gray-700">
							{lang === 'fr'
								? "Utilisez vos courriel et mot de passe pour vous connecter à la section des membres. Cliquez sur «Mot de passe oublié?» pour le recevoir par courriel."
								: 'Use your email and password to log in to the members section. Click on "Forgot password?" to receive it by email.'}
						</p>
						<p class="text-gray-700">
							{lang === 'fr'
								? "Nouveau au club? Utilisez le lien «Créer un compte» dans le coin inférieur droit de la fenêtre."
								: "New to the club? Use the 'Create an account' link in the bottom right corner of the window."}
						</p>
					{:else if activeTab === 'forgot'}
						<p class="text-gray-700">
							{lang === 'fr'
								? "Entrez votre adresse courriel et nous vous enverrons un lien pour réinitialiser votre mot de passe."
								: 'Enter your email address and we will send you a link to reset your password.'}
						</p>
					{/if}
				</div>
			{/if}

			<!-- Right Column - Form (full width for create tab) -->
			<div class="space-y-6" class:md:col-span-2={activeTab === 'create'}>
				{#if activeTab === 'login'}
					<!-- Login Form -->
					<form onsubmit={handleLogin} class="space-y-4">
						<div>
							<label for="login-email" class="block text-sm font-medium text-gray-700 mb-2">
								{lang === 'fr' ? 'Courriel' : 'Email'}
							</label>
							<input
								type="email"
								id="login-email"
								bind:value={loginEmail}
								placeholder={lang === 'fr' ? 'Saisissez votre courriel' : 'Enter your email'}
								class="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a5f]/20 hover:border-gray-400 bg-white shadow-sm border-2 border-gray-300 focus:border-[#1a3a5f]"
								required
							/>
						</div>
						<div>
							<label for="login-password" class="block text-sm font-medium text-gray-700 mb-2">
								{lang === 'fr' ? 'Mot de passe' : 'Password'}
							</label>
							<input
								type="password"
								id="login-password"
								bind:value={loginPassword}
								placeholder={lang === 'fr' ? 'Saisissez votre mot de passe' : 'Enter your password'}
								class="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a5f]/20 hover:border-gray-400 bg-white shadow-sm border-2 border-gray-300 focus:border-[#1a3a5f]"
								required
							/>
						</div>
						<button
							type="button"
							onclick={() => (activeTab = 'forgot')}
							class="text-blue-600 hover:text-blue-700 text-sm block mb-4 text-left"
						>
							{lang === 'fr' ? 'Mot de passe oublié?' : 'Forgot password?'}
						</button>
						<button
							type="submit"
							class="w-full bg-[#1a3a5f] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#152d4a] transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-0"
							style="background-color: #1a3a5f; color: white;"
						>
							{lang === 'fr' ? 'Se connecter' : 'Log in'}
						</button>
						<button
							type="button"
							onclick={() => (activeTab = 'create')}
							class="text-blue-600 hover:text-blue-700 text-sm block text-right"
						>
							{lang === 'fr' ? 'Nouveau? Créer un compte' : 'New? Create an account'}
						</button>
					</form>

				{:else if activeTab === 'forgot'}
					<!-- Forgot Password Form -->
					<form onsubmit={handleForgotPassword} class="space-y-4">
						<div>
							<label for="forgot-email" class="block text-sm font-medium text-gray-700 mb-2">
								{lang === 'fr' ? 'Courriel' : 'Email'}
							</label>
							<input
								type="email"
								id="forgot-email"
								bind:value={forgotEmail}
								placeholder={lang === 'fr' ? 'Saisissez votre courriel' : 'Enter your email'}
								class="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a5f]/20 hover:border-gray-400 bg-white shadow-sm border-2 border-gray-300 focus:border-[#1a3a5f]"
								required
							/>
						</div>
						<button
							type="submit"
							class="w-full bg-[#1a3a5f] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#152d4a] transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-0"
							style="background-color: #1a3a5f; color: white;"
						>
							{lang === 'fr' ? 'Envoyez-moi mon mot de passe' : 'Send me my password'}
						</button>
						<button
							type="button"
							onclick={() => (activeTab = 'login')}
							class="text-blue-600 hover:text-blue-700 text-sm block text-center"
						>
							{lang === 'fr' ? 'Retourner à la page connexion' : 'Return to the login page'}
						</button>
						<button
							type="button"
							onclick={() => (activeTab = 'create')}
							class="text-blue-600 hover:text-blue-700 text-sm block text-right"
						>
							{lang === 'fr' ? 'Nouveau? Créer un compte' : 'New? Create an account'}
						</button>
					</form>

				{:else if activeTab === 'create'}
					<!-- Create Account Form -->
					<form onsubmit={handleCreateAccount} class="space-y-4 w-full max-w-2xl mx-auto">
						<div class="grid md:grid-cols-2 gap-4">
							<div>
								<label for="create-email" class="block text-sm font-medium text-gray-700 mb-2">
									{lang === 'fr' ? 'Courriel' : 'Email'}
								</label>
								<input
									type="email"
									id="create-email"
									bind:value={createEmail}
									placeholder={lang === 'fr' ? 'Saisissez votre courriel' : 'Enter your email'}
									class="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a5f]/20 hover:border-gray-400 bg-white shadow-sm border-2 border-gray-300 focus:border-[#1a3a5f]"
									required
								/>
							</div>
							<div>
								<label for="create-email-confirm" class="block text-sm font-medium text-gray-700 mb-2">
									{lang === 'fr' ? 'Confirmez votre courriel' : 'Confirm your email'}
								</label>
								<input
									type="email"
									id="create-email-confirm"
									bind:value={createEmailConfirm}
									placeholder={lang === 'fr' ? 'Confirmez votre courriel' : 'Confirm your email'}
									class="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a5f]/20 hover:border-gray-400 bg-white shadow-sm border-2 border-gray-300 focus:border-[#1a3a5f]"
									required
								/>
							</div>
						</div>
						<div class="grid md:grid-cols-2 gap-4">
							<div>
								<label for="create-password" class="block text-sm font-medium text-gray-700 mb-2">
									{lang === 'fr' ? 'Mot de passe' : 'Password'}
								</label>
								<input
									type="password"
									id="create-password"
									bind:value={createPassword}
									placeholder={lang === 'fr' ? 'Saisissez votre mot de passe' : 'Enter your password'}
									class="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a5f]/20 hover:border-gray-400 bg-white shadow-sm border-2 border-gray-300 focus:border-[#1a3a5f]"
									required
								/>
							</div>
							<div>
								<label for="create-password-confirm" class="block text-sm font-medium text-gray-700 mb-2">
									{lang === 'fr' ? 'Confirmez le mot de passe' : 'Confirm password'}
								</label>
								<input
									type="password"
									id="create-password-confirm"
									bind:value={createPasswordConfirm}
									placeholder={lang === 'fr' ? 'Confirmez le mot de passe' : 'Confirm password'}
									class="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a5f]/20 hover:border-gray-400 bg-white shadow-sm border-2 border-gray-300 focus:border-[#1a3a5f]"
									required
								/>
							</div>
						</div>
						<button
							type="submit"
							class="w-full bg-[#1a3a5f] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#152d4a] transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-0"
							style="background-color: #1a3a5f; color: white;"
						>
							{lang === 'fr' ? 'Créer un compte' : 'Create an account'}
						</button>
						<button
							type="button"
							onclick={() => (activeTab = 'login')}
							class="text-blue-600 hover:text-blue-700 text-sm block text-center"
						>
							{lang === 'fr' ? 'Retourner à la page connexion' : 'Return to the login page'}
						</button>
					</form>
				{/if}
			</div>
		</div>
	</div>
</div>

<FooterComponent />

