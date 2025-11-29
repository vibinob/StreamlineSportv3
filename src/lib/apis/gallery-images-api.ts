const getApiBaseUrl = () => {
	const raw = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
	return raw.trim().replace(/^['"]+|['";]+$/g, '').replace(/\/+$/, '');
};

export interface GalleryImage {
	id: number;
	gallery_id: number;
	image_filename: string;
	thumbnail_filename: string;
	order: number;
	date_created: string;
	added_by: number | null;
	status: 0 | 1 | 2;
}

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

/**
 * Get all images for a gallery
 */
export async function getGalleryImages(galleryId: number): Promise<ApiResponse<GalleryImage[]>> {
	try {
		const API_BASE_URL = getApiBaseUrl();
		const response = await fetch(`${API_BASE_URL}/api/gallery/${galleryId}/images`);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return await response.json();
	} catch (err: any) {
		console.error('Error fetching gallery images:', err);
		return { success: false, error: err.message || 'Failed to fetch gallery images' };
	}
}

/**
 * Upload an image to a gallery
 */
export async function uploadGalleryImage(
	galleryId: number,
	clubId: string,
	file: File
): Promise<ApiResponse<GalleryImage>> {
	try {
		const API_BASE_URL = getApiBaseUrl();
		const formData = new FormData();
		formData.append('image', file);
		formData.append('club_id', clubId);

		const response = await fetch(`${API_BASE_URL}/api/gallery/${galleryId}/images`, {
			method: 'POST',
			body: formData
		});

		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return await response.json();
	} catch (err: any) {
		console.error('Error uploading gallery image:', err);
		return { success: false, error: err.message || 'Failed to upload image' };
	}
}

/**
 * Delete a gallery image
 */
export async function deleteGalleryImage(
	galleryId: number,
	imageId: number,
	clubId: string
): Promise<ApiResponse<any>> {
	try {
		const API_BASE_URL = getApiBaseUrl();
		const response = await fetch(`${API_BASE_URL}/api/gallery/${galleryId}/images/${imageId}`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ club_id: clubId })
		});

		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return await response.json();
	} catch (err: any) {
		console.error('Error deleting gallery image:', err);
		return { success: false, error: err.message || 'Failed to delete image' };
	}
}

