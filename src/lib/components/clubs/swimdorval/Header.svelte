<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages';
	import { languageTagStore } from '$lib/paraglide/runtime';
	import { get } from 'svelte/store';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import { CURRENT_CLUB_ID } from '$lib/clubs/currentClub.js';

	let mobileMenuOpen = $state(false);
	let languageDropdownOpen = $state(false);

	// Menu state loaded from backend API
	/** @type {{ id:number; parentId:number|null; title:string; url:string; pageTypeId:number; sortOrder:number; children:any[] }[]} */
	let menuItems = $state([]);
	let menuLoading = $state(false);
	/** @type {string | null} */
	let menuError = $state(null);

	const lang = $derived.by(() => {
		const paramLang = $page.params.lang;
		if (paramLang === 'en' || paramLang === 'fr') {
			return paramLang;
		}
		return 'fr';
	});

	// Current path, used to highlight the active menu item.
	const currentPath = $derived.by(() => $page.url.pathname);

	import { fetchMenu } from '$lib/apis/menu-api';

	/**
	 * Build href for a menu entry, prefixing with language when needed
	 * @param {string} itemUrl
	 */
	function buildHref(itemUrl) {
		if (!itemUrl) return `/${lang}`;
		if (itemUrl.startsWith('http://') || itemUrl.startsWith('https://')) {
			return itemUrl;
		}
		// URLs starting with '/' are treated as app-relative, we prefix with lang
		if (itemUrl.startsWith('/')) {
			return `/${lang}${itemUrl}`;
		}
		// Fallback: treat as path segment
		return `/${lang}/${itemUrl}`;
	}

	// Subscribe to language tag store to make messages reactive
	// This ensures components re-render when language changes
	const languageStore = languageTagStore();
	
	// Track language changes reactively
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
	
	// Force reactivity - reference _langTracker in template to ensure tracking
	// This ensures message functions are called again when language changes

	// Load menu from backend whenever club or language changes
	$effect(() => {
		menuLoading = true;
		menuError = null;

		fetchMenu(lang)
			.then((data) => {
				if (!data || !data.success) {
					menuError = data?.error || 'Failed to load menu';
					menuItems = [];
					return;
				}
				menuItems = Array.isArray(data.data) ? data.data : [];
			})
			.catch((err) => {
				console.error('Menu fetch error:', err);
				menuError = err instanceof Error ? err.message : 'Failed to load menu';
				menuItems = [];
			})
			.finally(() => {
				menuLoading = false;
			});
	});

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function handleNavClick() {
		// Close mobile menu after navigating on small screens
		mobileMenuOpen = false;
	}

	function toggleLanguageDropdown() {
		languageDropdownOpen = !languageDropdownOpen;
	}

	function handleLoginClick() {
		goto(`/${lang}/login`);
	}
</script>

<!-- Top Utility Bar (White Background) -->
<div class="bg-white py-2 border-b border-gray-200">
	<div class="container mx-auto px-4 max-w-7xl">
		<div class="flex justify-end items-center gap-4">
			<!-- Social Media Icons (Orange) -->
			<div class="flex gap-3 items-center">
				<!-- Twitter -->
				<a
					href="https://twitter.com/swimdorval"
					target="_blank"
					rel="noopener"
					class="text-[#F45E12] hover:text-[#d14a0f] transition-colors"
					aria-label="Twitter"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
						/>
					</svg>
				</a>
				<!-- Facebook -->
				<a
					href="https://www.facebook.com/profile.php?id=100009819467280"
					target="_blank"
					rel="noopener"
					class="text-[#F45E12] hover:text-[#d14a0f] transition-colors"
					aria-label="Facebook"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
						/>
					</svg>
				</a>
				<!-- Instagram -->
				<a
					href="https://www.instagram.com/swimdorval"
					target="_blank"
					rel="noopener"
					class="text-[#F45E12] hover:text-[#d14a0f] transition-colors"
					aria-label="Instagram"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
						/>
					</svg>
				</a>
				<!-- YouTube -->
				<a
					href="https://www.youtube.com/channel/UCVTuqX-XllHwNOwog7mDk4Q"
					target="_blank"
					rel="noopener"
					class="text-[#F45E12] hover:text-[#d14a0f] transition-colors"
					aria-label="YouTube"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
						/>
					</svg>
				</a>
			</div>

			<!-- User Icon (Blue) - Login Button -->
			<button
				type="button"
				onclick={handleLoginClick}
				class="bg-transparent border-0 p-0 cursor-pointer text-blue-600 hover:text-blue-700 transition-colors"
				aria-label={t(m.topBar_member)}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
					<path
						d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
					/>
				</svg>
			</button>

			<!-- Language Selector Dropdown -->
			<div class="relative">
				<LanguageSwitcher />
			</div>
		</div>
	</div>
</div>

<!-- Main Navigation Bar (Black Background) -->
<header class="bg-black py-3">
	<div class="container mx-auto px-4 max-w-7xl">
		<div class="flex justify-between items-center flex-wrap">
			<!-- Logo -->
			<div class="logo flex-shrink-0">
				<a href="/{lang}">
					<img
						src="https://placehold.co/150x80/000000/F45E12?text=DSC+Logo"
						alt="Dorval Swim Club Logo"
						class="h-16 md:h-20"
					/>
				</a>
			</div>

			<!-- Navigation Menu -->
			<nav class="flex-1 relative">
				<button
					class="md:hidden flex flex-col bg-transparent border-0 cursor-pointer p-1"
					onclick={toggleMobileMenu}
					aria-label="Toggle menu"
				>
					<span class="w-6 h-0.5 bg-white my-1 transition-all"></span>
					<span class="w-6 h-0.5 bg-white my-1 transition-all"></span>
					<span class="w-6 h-0.5 bg-white my-1 transition-all"></span>
				</button>
				<ul
					class="list-none m-0 p-0 gap-0 items-center justify-end"
					class:hidden={!mobileMenuOpen}
					class:flex={mobileMenuOpen}
					class:flex-col={mobileMenuOpen}
					class:absolute={mobileMenuOpen}
					class:top-full={mobileMenuOpen}
					class:left-0={mobileMenuOpen}
					class:w-full={mobileMenuOpen}
					class:bg-black={mobileMenuOpen}
					class:shadow-md={mobileMenuOpen}
					class:z-[1000]={mobileMenuOpen}
					class:md:flex={true}
					class:md:static={true}
					class:md:bg-transparent={true}
					class:md:shadow-none={true}
				>
					{#if menuLoading}
						<li class="px-4 py-3 text-white text-sm">Loading...</li>
					{:else if menuError}
						<li class="px-4 py-3 text-red-400 text-sm">Menu error</li>
					{:else}
						{#each menuItems as item}
							{#if item}
								<li class="relative">
									<a
										href={buildHref(item.url)}
										onclick={handleNavClick}
										class="block px-4 py-3 text-white no-underline font-roboto text-sm font-bold uppercase border-b-2 border-transparent transition-colors hover:border-[#F45E12]"
										class:border-[#F45E12]={currentPath === buildHref(item.url) || currentPath.startsWith(buildHref(item.url) + '/')}
									>
										{item.title}
									</a>
								</li>
							{/if}
						{/each}
					{/if}
				</ul>
			</nav>
		</div>
	</div>
</header>
