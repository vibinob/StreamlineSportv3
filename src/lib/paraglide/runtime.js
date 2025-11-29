/**
 * @fileoverview Paraglide runtime for language tag management
 */

import { writable, get, readable } from 'svelte/store';

/** @typedef {'en' | 'fr'} LanguageTag */

// Use a Svelte store to make it reactive
const _languageTagStore = writable(/** @type {LanguageTag} */ ('fr'));

/**
 * Get the current language tag (reactive)
 * @returns {LanguageTag}
 */
export function languageTag() {
	return get(_languageTagStore);
}

/**
 * Set the current language tag
 * @param {LanguageTag} tag
 */
export function setLanguageTag(tag) {
	_languageTagStore.set(tag);
}

/**
 * Get the language tag store for reactive subscriptions
 * @returns {import('svelte/store').Readable<LanguageTag>}
 */
export function languageTagStore() {
	return _languageTagStore;
}

/**
 * Get a reactive language tag value for use in components
 * This ensures components re-render when language changes
 * @returns {import('svelte/store').Readable<LanguageTag>}
 */
export function getReactiveLanguageTag() {
	return readable(get(_languageTagStore), (set) => {
		return _languageTagStore.subscribe(set);
	});
}

