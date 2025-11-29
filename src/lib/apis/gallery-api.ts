/**
 * Gallery API - Handles gallery CRUD operations
 */

const getApiBaseUrl = () => {
	const raw = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
	return raw.trim().replace(/^['"]+|['";]+$/g, '').replace(/\/+$/, '');
};

export interface Gallery {
	id: number;
	gallery_name_en: string;
	gallery_name_fr: string;
	description_en: string | null;
	description_fr: string | null;
	order: number;
	member_only: number;
	date_created: string;
	added_by: number | null;
	date_updated: string | null;
	updated_by: number | null;
	status: number;
}

export interface GalleryResponse {
	success: boolean;
	data: Gallery[];
	error?: string;
}

export interface SingleGalleryResponse {
	success: boolean;
	data: Gallery;
	error?: string;
}

export interface CreateGalleryData {
	gallery_name_en: string;
	gallery_name_fr: string;
	description_en?: string;
	description_fr?: string;
	order?: number;
	member_only?: number;
	added_by?: number | null;
}

export interface UpdateGalleryData {
	gallery_name_en: string;
	gallery_name_fr: string;
	description_en?: string;
	description_fr?: string;
	order?: number;
	member_only?: number;
	updated_by?: number | null;
}

/**
 * Get all galleries
 */
export async function getGalleries(): Promise<GalleryResponse> {
	const API_BASE_URL = getApiBaseUrl();
	const url = `${API_BASE_URL}/api/gallery`;

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error loading galleries:', error);
		throw error;
	}
}

/**
 * Get single gallery by ID
 */
export async function getGalleryById(id: number): Promise<SingleGalleryResponse> {
	const API_BASE_URL = getApiBaseUrl();
	const url = `${API_BASE_URL}/api/gallery/${id}`;

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error loading gallery:', error);
		throw error;
	}
}

/**
 * Create a new gallery
 */
export async function createGallery(galleryData: CreateGalleryData): Promise<{ success: boolean; data: { id: number }; error?: string }> {
	const API_BASE_URL = getApiBaseUrl();
	const url = `${API_BASE_URL}/api/gallery`;

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(galleryData)
		});
		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || 'Failed to create gallery');
		}
		return data;
	} catch (error) {
		console.error('Error creating gallery:', error);
		throw error;
	}
}

/**
 * Update an existing gallery
 */
export async function updateGallery(id: number, galleryData: UpdateGalleryData): Promise<{ success: boolean; error?: string }> {
	const API_BASE_URL = getApiBaseUrl();
	const url = `${API_BASE_URL}/api/gallery/${id}`;

	try {
		const response = await fetch(url, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(galleryData)
		});
		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || 'Failed to update gallery');
		}
		return data;
	} catch (error) {
		console.error('Error updating gallery:', error);
		throw error;
	}
}

/**
 * Delete a gallery (soft delete - sets status to 2)
 */
export async function deleteGallery(id: number): Promise<{ success: boolean; error?: string }> {
	const API_BASE_URL = getApiBaseUrl();
	const url = `${API_BASE_URL}/api/gallery/${id}`;

	try {
		const response = await fetch(url, {
			method: 'DELETE'
		});
		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || 'Failed to delete gallery');
		}
		return data;
	} catch (error) {
		console.error('Error deleting gallery:', error);
		throw error;
	}
}

/**
 * Update gallery order (move up or down)
 */
export async function updateGalleryOrder(id: number, newOrder: number): Promise<{ success: boolean; error?: string }> {
	const API_BASE_URL = getApiBaseUrl();
	const url = `${API_BASE_URL}/api/gallery/${id}/order`;

	try {
		const response = await fetch(url, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ order: newOrder })
		});
		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || 'Failed to update gallery order');
		}
		return data;
	} catch (error) {
		console.error('Error updating gallery order:', error);
		throw error;
	}
}

