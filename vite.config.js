import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit()
	],
	server: {
		port: parseInt(process.env.FRONTEND_PORT || '5555'),
		host: process.env.FRONTEND_HOST || '0.0.0.0', // 0.0.0.0 allows external connections
		proxy: {
			'/api': {
				target: process.env.VITE_API_BASE_URL || 'http://localhost:3111',
				changeOrigin: true
			}
		}
	}
});

