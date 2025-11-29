/**
 * Slider API - Handles slider CRUD operations
 */

const getApiBaseUrl = () => {
	const raw = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
	return raw.trim().replace(/^['"]+|['";]+$/g, '').replace(/\/+$/, '');
};

export interface Slider {
	id: number;
	image_en: string;
	image_fr: string;
	link_en: string | null;
	link_fr: string | null;
	order: number;
	status: 0 | 1 | 2;
	date_created: string;
	added_by: number | null;
	date_updated: string | null;
	updated_by: number | null;
}

export interface CreateSliderData {
	image_en: File | null;
	image_fr: File | null;
	link_en?: string;
	link_fr?: string;
	club_id: string;
}

export interface UpdateSliderData {
	image_en?: File | null;
	image_fr?: File | null;
	link_en?: string;
	link_fr?: string;
	club_id: string;
	status?: 0 | 1 | 2;
}

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

const API_BASE_URL = getApiBaseUrl();

/**
 * Get all sliders
 */
export async function getSliders(): Promise<ApiResponse<Slider[]>> {
	try {
		const response = await fetch(`${API_BASE_URL}/api/slider`);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return await response.json();
	} catch (err: any) {
		console.error('Error fetching sliders:', err);
		return { success: false, error: err.message || 'Failed to fetch sliders' };
	}
}

/**
 * Get single slider by ID
 */
export async function getSliderById(id: number): Promise<ApiResponse<Slider>> {
	try {
		const response = await fetch(`${API_BASE_URL}/api/slider/${id}`);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return await response.json();
	} catch (err: any) {
		console.error(`Error fetching slider ${id}:`, err);
		return { success: false, error: err.message || `Failed to fetch slider ${id}` };
	}
}

/**
 * Create a new slider
 */
export async function createSlider(data: CreateSliderData): Promise<ApiResponse<any>> {
	try {
		const formData = new FormData();
		if (data.image_en) {
			formData.append('image_en', data.image_en);
		}
		if (data.image_fr) {
			formData.append('image_fr', data.image_fr);
		}
		if (data.link_en) {
			formData.append('link_en', data.link_en);
		}
		if (data.link_fr) {
			formData.append('link_fr', data.link_fr);
		}
		formData.append('club_id', data.club_id);

		const response = await fetch(`${API_BASE_URL}/api/slider`, {
			method: 'POST',
			body: formData
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return await response.json();
	} catch (err: any) {
		console.error('Error creating slider:', err);
		return { success: false, error: err.message || 'Failed to create slider' };
	}
}

/**
 * Update an existing slider
 */
export async function updateSlider(id: number, data: UpdateSliderData): Promise<ApiResponse<any>> {
	try {
		const formData = new FormData();
		if (data.image_en) {
			formData.append('image_en', data.image_en);
		}
		if (data.image_fr) {
			formData.append('image_fr', data.image_fr);
		}
		if (data.link_en !== undefined) {
			formData.append('link_en', data.link_en || '');
		}
		if (data.link_fr !== undefined) {
			formData.append('link_fr', data.link_fr || '');
		}
		if (data.status !== undefined) {
			formData.append('status', String(data.status));
		}
		formData.append('club_id', data.club_id);

		const response = await fetch(`${API_BASE_URL}/api/slider/${id}`, {
			method: 'PUT',
			body: formData
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return await response.json();
	} catch (err: any) {
		console.error(`Error updating slider ${id}:`, err);
		return { success: false, error: err.message || `Failed to update slider ${id}` };
	}
}

/**
 * Delete a slider (soft delete - sets status to 2)
 */
export async function deleteSlider(id: number): Promise<ApiResponse<any>> {
	try {
		const response = await fetch(`${API_BASE_URL}/api/slider/${id}`, {
			method: 'DELETE'
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return await response.json();
	} catch (err: any) {
		console.error(`Error deleting slider ${id}:`, err);
		return { success: false, error: err.message || `Failed to delete slider ${id}` };
	}
}

/**
 * Update slider order (move up or down)
 */
export async function updateSliderOrder(id: number, newOrder: number): Promise<{ success: boolean; error?: string }> {
	try {
		const response = await fetch(`${API_BASE_URL}/api/slider/${id}/order`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ order: newOrder })
		});
		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || 'Failed to update slider order');
		}
		return data;
	} catch (error) {
		console.error('Error updating slider order:', error);
		throw error;
	}
}

