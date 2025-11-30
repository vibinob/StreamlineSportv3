<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import LanguageSwitcher from '../clubs/swimdorval/LanguageSwitcher.svelte';

	const lang = $derived.by(() => {
		const paramLang = $page.params.lang;
		if (paramLang === 'en' || paramLang === 'fr') {
			return paramLang;
		}
		return 'fr';
	});

	let mobileMenuOpen = $state(false);
	let languageDropdownOpen = $state(false);

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function handleNavClick() {
		mobileMenuOpen = false;
	}

	function toggleLanguageDropdown() {
		languageDropdownOpen = !languageDropdownOpen;
	}

	// Close mobile menu when window is resized to desktop view
	$effect(() => {
		function handleResize() {
			if (window.innerWidth >= 768 && mobileMenuOpen) {
				mobileMenuOpen = false;
			}
		}

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	function handleHomeClick() {
		goto(`/${lang}`);
	}

	/**
	 * @param {string} path
	 */
	function handleMenuClick(path) {
		mobileMenuOpen = false;
		goto(`/${lang}/admin${path}`);
	}
</script>

<!-- Admin Header -->
<header>
	<!-- First Row: Logo Banner (Light Blue) -->
	<div class="bg-blue-100 py-3 shadow-sm">
		<div class="container mx-auto px-4 max-w-7xl">
			<div class="flex justify-between items-center">
				<button
					type="button"
					onclick={handleHomeClick}
					class="text-2xl font-bold hover:opacity-80 transition-opacity bg-transparent border-0 cursor-pointer flex items-center gap-1"
				>
					<span class="text-black">STREAMLINE</span>
					<span class="text-[#F45E12]">SPORT</span>
				</button>
				<!-- Language Switcher -->
				<div class="relative">
					<LanguageSwitcher />
				</div>
			</div>
		</div>
	</div>

	<!-- Second Row: Navigation Menu (Dark Gray) -->
	<nav class="bg-gray-800 shadow-md relative" style="background-color: #1f2937;">
		<div class="container mx-auto px-4 max-w-7xl">
			<div class="flex justify-between items-center">
				<!-- Mobile Menu Toggle -->
				<button
					class="md:hidden flex flex-col bg-transparent border-0 cursor-pointer p-1"
					onclick={toggleMobileMenu}
					aria-label="Toggle menu"
				>
					<span class="w-6 h-0.5 bg-white my-1 transition-all"></span>
					<span class="w-6 h-0.5 bg-white my-1 transition-all"></span>
					<span class="w-6 h-0.5 bg-white my-1 transition-all"></span>
				</button>

				<!-- Navigation Menu Items -->
				<ul
					class="list-none m-0 p-0 gap-0 items-center"
					class:hidden={!mobileMenuOpen}
					class:flex={mobileMenuOpen}
					class:flex-col={mobileMenuOpen}
					class:absolute={mobileMenuOpen}
					class:top-full={mobileMenuOpen}
					class:left-0={mobileMenuOpen}
					class:w-full={mobileMenuOpen}
					class:shadow-md={mobileMenuOpen}
					class:z-[1000]={mobileMenuOpen}
					class:md:flex={true}
					class:md:static={true}
					class:md:bg-transparent={true}
					class:md:shadow-none={true}
					class:md:w-auto={true}
					style={mobileMenuOpen ? 'background-color: #1f2937;' : ''}
				>
					<li class="relative">
						<button
							type="button"
							onclick={() => handleMenuClick('/dashboard')}
							class="block px-4 py-3 text-white no-underline font-roboto text-sm font-bold uppercase border-b-2 border-transparent transition-colors hover:bg-gray-600 bg-transparent border-0 cursor-pointer w-full text-left md:w-auto"
							class:bg-gray-800={$page.url.pathname === `/${lang}/admin/dashboard` || $page.url.pathname === `/${lang}/admin` || $page.url.pathname === `/${lang}/admin/`}
						>
							{lang === 'fr' ? 'Tableau de bord' : 'Dashboard'}
						</button>
					</li>
					<li class="relative">
						<button
							type="button"
							onclick={() => handleMenuClick('/web-pages')}
							class="block px-4 py-3 text-white no-underline font-roboto text-sm font-bold uppercase border-b-2 border-transparent transition-colors hover:bg-gray-600 bg-transparent border-0 cursor-pointer w-full text-left md:w-auto"
							class:bg-gray-800={$page.url.pathname.startsWith(`/${lang}/admin/web-pages`)}
						>
							{lang === 'fr' ? 'Pages Web' : 'Web pages'}
						</button>
					</li>
					<li class="relative">
						<button
							type="button"
							onclick={() => handleMenuClick('/calendar')}
							class="block px-4 py-3 text-white no-underline font-roboto text-sm font-bold uppercase border-b-2 border-transparent transition-colors hover:bg-gray-600 bg-transparent border-0 cursor-pointer w-full text-left md:w-auto"
							class:bg-gray-800={$page.url.pathname.startsWith(`/${lang}/admin/calendar`)}
						>
							{lang === 'fr' ? 'Calendrier' : 'Calendar'}
						</button>
					</li>
					<li class="relative">
						<button
							type="button"
							onclick={() => handleMenuClick('/slider')}
							class="block px-4 py-3 text-white no-underline font-roboto text-sm font-bold uppercase border-b-2 border-transparent transition-colors hover:bg-gray-600 bg-transparent border-0 cursor-pointer w-full text-left md:w-auto"
							class:bg-gray-800={$page.url.pathname.startsWith(`/${lang}/admin/slider`)}
						>
							{lang === 'fr' ? 'Diaporama' : 'Slider'}
						</button>
					</li>
					<li class="relative">
						<button
							type="button"
							onclick={() => handleMenuClick('/gallery')}
							class="block px-4 py-3 text-white no-underline font-roboto text-sm font-bold uppercase border-b-2 border-transparent transition-colors hover:bg-gray-600 bg-transparent border-0 cursor-pointer w-full text-left md:w-auto"
							class:bg-gray-800={$page.url.pathname.startsWith(`/${lang}/admin/gallery`)}
						>
							{lang === 'fr' ? 'Galerie' : 'Gallery'}
						</button>
					</li>
					<li class="relative">
						<button
							type="button"
							onclick={() => handleMenuClick('/news')}
							class="block px-4 py-3 text-white no-underline font-roboto text-sm font-bold uppercase border-b-2 border-transparent transition-colors hover:bg-gray-600 bg-transparent border-0 cursor-pointer w-full text-left md:w-auto"
							class:bg-gray-800={$page.url.pathname.startsWith(`/${lang}/admin/news`)}
						>
							{lang === 'fr' ? 'Actualités' : 'News'}
						</button>
					</li>
					<li class="relative">
						<button
							type="button"
							onclick={() => handleMenuClick('/profile')}
							class="block px-4 py-3 text-white no-underline font-roboto text-sm font-bold uppercase border-b-2 border-transparent transition-colors hover:bg-gray-600 bg-transparent border-0 cursor-pointer w-full text-left md:w-auto"
							class:bg-gray-800={$page.url.pathname.startsWith(`/${lang}/admin/profile`)}
						>
							{lang === 'fr' ? 'Profil' : 'Profile'}
						</button>
					</li>
					<li class="relative">
						<button
							type="button"
							onclick={() => handleMenuClick('/logout')}
							class="block px-4 py-3 text-white no-underline font-roboto text-sm font-bold uppercase border-b-2 border-transparent transition-colors hover:bg-gray-600 bg-transparent border-0 cursor-pointer w-full text-left md:w-auto"
							class:bg-gray-800={$page.url.pathname.startsWith(`/${lang}/admin/logout`)}
						>
							{lang === 'fr' ? 'Déconnexion' : 'Logout'}
						</button>
					</li>
				</ul>
			</div>
		</div>
	</nav>
</header>

