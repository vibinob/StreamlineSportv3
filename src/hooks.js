/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const { pathname } = event.url;
	
	// Skip redirect for API routes, static assets, and special paths
	if (
		pathname.startsWith('/api') ||
		pathname.startsWith('/_app') ||
		pathname.startsWith('/.well-known') ||
		pathname.includes('.')
	) {
		return resolve(event);
	}
	
	// If no language in URL, redirect to French by default
	if (!pathname.startsWith('/fr') && !pathname.startsWith('/en')) {
		return new Response(null, {
			status: 302,
			headers: {
				Location: `/fr${pathname === '/' ? '' : pathname}`
			}
		});
	}
	
	return resolve(event);
}

