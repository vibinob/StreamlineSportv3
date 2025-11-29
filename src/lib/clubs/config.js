// Central list of clubs and their settings.
// KISS: keep it plain JS, data-driven so we don't duplicate components.

/**
 * @typedef {Object} ClubConfig
 * @property {string} id
 * @property {string} name
 * @property {string} titlePrefix
 * @property {string} description
 */

/** @type {Record<string, ClubConfig>} */
export const clubs = {
	swimdorval: {
		id: 'swimdorval',
		name: 'Dorval Swim Club',
		titlePrefix: 'Swim Dorval',
		description: 'Dorval Swim Club'
		// Later: colors, logos, hero image paths, etc.
	}
	// Add new clubs here, e.g.:
	// samak: {
	// 	id: 'samak',
	// 	name: 'Club Samak',
	// 	titlePrefix: 'Samak',
	// 	description: 'Club Samak'
	// }
};

/**
 * Return a valid club config; falls back to swimdorval if unknown.
 * @param {string | undefined | null} id
 * @returns {ClubConfig}
 */
export function getClubConfig(id) {
	if (id && Object.prototype.hasOwnProperty.call(clubs, id)) {
		return clubs[id];
	}
	return clubs.swimdorval;
}


