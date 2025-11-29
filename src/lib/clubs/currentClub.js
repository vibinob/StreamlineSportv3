// Helper that reads the club ID from env and exposes the active club config.

import { getClubConfig } from './config.js';

// We access the env variable via import.meta.env for JS friendliness.
// In SvelteKit, public env vars must start with PUBLIC_.
const envClubId = import.meta.env?.PUBLIC_CLUB_ID;

export const CURRENT_CLUB_ID = envClubId || 'swimdorval';
export const CURRENT_CLUB = getClubConfig(CURRENT_CLUB_ID);


