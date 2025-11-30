/**
 * Menu API - Handles menu data fetching from backend
 */

const getApiBaseUrl = () => {
	const raw = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3111';
	return raw.trim().replace(/^['"]+|['";]+$/g, '').replace(/\/+$/, '');
};

export interface MenuItem {
	id: number;
	parentId: number | null;
	title: string;
	url: string;
	pageTypeId: number;
	sortOrder: number;
	children: MenuItem[];
}

export interface MenuResponse {
	success: boolean;
	data: MenuItem[];
	error?: string;
}

/**
 * Fetch menu items from backend API
 * @param lang - Language code ('en' or 'fr')
 * @returns Promise with menu items
 */
export async function fetchMenu(lang: string = 'fr'): Promise<MenuResponse> {
	const API_BASE_URL = getApiBaseUrl();
	const url = `${API_BASE_URL}/api/menu?lang=${encodeURIComponent(lang)}`;

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status} while fetching menu`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Menu fetch error:', error);
		throw error;
	}
}

