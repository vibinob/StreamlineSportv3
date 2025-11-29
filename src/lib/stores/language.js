import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getLanguage } from '../i18n/index.js';

// Language store
export const currentLang = writable('fr');

// Initialize language from URL or localStorage
export function initLanguage(pathname) {
	if (browser) {
		const lang = getLanguage(pathname);
		currentLang.set(lang);
		localStorage.setItem('preferred-language', lang);
		return lang;
	}
	return 'fr';
}

// Set language and update localStorage
export function setLanguage(lang) {
	if (browser) {
		currentLang.set(lang);
		localStorage.setItem('preferred-language', lang);
	}
}

