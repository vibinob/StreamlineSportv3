import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export function load({ params }) {
	const lang = params.lang || 'fr';
	// Redirect /accueil to landing page
	throw redirect(302, `/${lang}`);
}

