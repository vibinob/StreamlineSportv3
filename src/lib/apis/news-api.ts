/**
 * News API - Handles news CRUD operations with bilingual support
 */

const getApiBaseUrl = () => {
	const raw = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3111';
	return raw.trim().replace(/^['"]+|['";]+$/g, '').replace(/\/+$/, '');
};

export interface News {
	id: number;
	author: string;
	news_date: string;
	show_in_homepage: 0 | 1;
	order: number;
	post_to_public: 0 | 1;
	post_to_member: 0 | 1;
	date_added: string;
	status: 0 | 1 | 2;
	// English content
	content_en_id?: number;
	language_en_id?: number;
	title_en?: string;
	summary_en?: string;
	article_en?: string;
	image_en?: string;
	thumbnail_en?: string;
	slug_en?: string;
	// French content
	content_fr_id?: number;
	language_fr_id?: number;
	title_fr?: string;
	summary_fr?: string;
	article_fr?: string;
	image_fr?: string;
	thumbnail_fr?: string;
	slug_fr?: string;
}

export interface CreateNewsData {
	author: string;
	news_date: string;
	show_in_homepage?: boolean;
	post_to_public?: boolean;
	post_to_member?: boolean;
	club_id: string;
	// English content
	title_en?: string;
	summary_en?: string;
	article_en?: string;
	image_en?: File | null;
	thumbnail_en?: File | null;
	slug_en?: string;
	// French content
	title_fr?: string;
	summary_fr?: string;
	article_fr?: string;
	image_fr?: File | null;
	thumbnail_fr?: File | null;
	slug_fr?: string;
	added_by?: number | null;
}

export interface UpdateNewsData {
	author?: string;
	news_date?: string;
	show_in_homepage?: boolean;
	order?: number;
	post_to_public?: boolean;
	post_to_member?: boolean;
	club_id: string;
	// English content
	title_en?: string;
	summary_en?: string;
	article_en?: string;
	image_en?: File | null;
	thumbnail_en?: File | null;
	slug_en?: string;
	// French content
	title_fr?: string;
	summary_fr?: string;
	article_fr?: string;
	image_fr?: File | null;
	thumbnail_fr?: File | null;
	slug_fr?: string;
	updated_by?: number | null;
}

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

const API_BASE_URL = getApiBaseUrl();

/**
 * Get all news items
 */
export async function getNews(): Promise<ApiResponse<News[]>> {
	try {
		const response = await fetch(`${API_BASE_URL}/api/news`);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return await response.json();
	} catch (err: any) {
		console.error('Error fetching news:', err);
		return { success: false, error: err.message || 'Failed to fetch news' };
	}
}

/**
 * Get single news item by ID
 */
export async function getNewsById(id: number): Promise<ApiResponse<News>> {
	try {
		const response = await fetch(`${API_BASE_URL}/api/news/${id}`);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return await response.json();
	} catch (err: any) {
		console.error(`Error fetching news ${id}:`, err);
		return { success: false, error: err.message || `Failed to fetch news ${id}` };
	}
}

/**
 * Create a new news item
 */
export async function createNews(data: CreateNewsData): Promise<ApiResponse<any>> {
	try {
		const formData = new FormData();
		
		// Main news fields
		formData.append('author', data.author);
		formData.append('news_date', data.news_date);
		formData.append('show_in_homepage', data.show_in_homepage ? '1' : '0');
		formData.append('post_to_public', data.post_to_public ? '1' : '0');
		formData.append('post_to_member', data.post_to_member ? '1' : '0');
		formData.append('club_id', data.club_id);
		
		// English content
		if (data.title_en) formData.append('title_en', data.title_en);
		if (data.summary_en) formData.append('summary_en', data.summary_en);
		if (data.article_en) formData.append('article_en', data.article_en);
		if (data.image_en) formData.append('image_en', data.image_en);
		if (data.thumbnail_en) formData.append('thumbnail_en', data.thumbnail_en);
		if (data.slug_en) formData.append('slug_en', data.slug_en);
		
		// French content
		if (data.title_fr) formData.append('title_fr', data.title_fr);
		if (data.summary_fr) formData.append('summary_fr', data.summary_fr);
		if (data.article_fr) formData.append('article_fr', data.article_fr);
		if (data.image_fr) formData.append('image_fr', data.image_fr);
		if (data.thumbnail_fr) formData.append('thumbnail_fr', data.thumbnail_fr);
		if (data.slug_fr) formData.append('slug_fr', data.slug_fr);
		
		if (data.added_by) formData.append('added_by', String(data.added_by));

		const response = await fetch(`${API_BASE_URL}/api/news`, {
			method: 'POST',
			body: formData
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return await response.json();
	} catch (err: any) {
		console.error('Error creating news:', err);
		return { success: false, error: err.message || 'Failed to create news' };
	}
}

/**
 * Update an existing news item
 */
export async function updateNews(id: number, data: UpdateNewsData): Promise<ApiResponse<any>> {
	try {
		const formData = new FormData();
		
		// Main news fields
		if (data.author !== undefined) formData.append('author', data.author);
		if (data.news_date !== undefined) formData.append('news_date', data.news_date);
		if (data.show_in_homepage !== undefined) formData.append('show_in_homepage', data.show_in_homepage ? '1' : '0');
		if (data.order !== undefined) formData.append('order', String(data.order));
		if (data.post_to_public !== undefined) formData.append('post_to_public', data.post_to_public ? '1' : '0');
		if (data.post_to_member !== undefined) formData.append('post_to_member', data.post_to_member ? '1' : '0');
		formData.append('club_id', data.club_id);
		
		// English content
		if (data.title_en !== undefined) formData.append('title_en', data.title_en);
		if (data.summary_en !== undefined) formData.append('summary_en', data.summary_en || '');
		if (data.article_en !== undefined) formData.append('article_en', data.article_en || '');
		if (data.image_en) formData.append('image_en', data.image_en);
		if (data.thumbnail_en) formData.append('thumbnail_en', data.thumbnail_en);
		if (data.slug_en !== undefined) formData.append('slug_en', data.slug_en || '');
		
		// French content
		if (data.title_fr !== undefined) formData.append('title_fr', data.title_fr);
		if (data.summary_fr !== undefined) formData.append('summary_fr', data.summary_fr || '');
		if (data.article_fr !== undefined) formData.append('article_fr', data.article_fr || '');
		if (data.image_fr) formData.append('image_fr', data.image_fr);
		if (data.thumbnail_fr) formData.append('thumbnail_fr', data.thumbnail_fr);
		if (data.slug_fr !== undefined) formData.append('slug_fr', data.slug_fr || '');
		
		if (data.updated_by) formData.append('updated_by', String(data.updated_by));

		const response = await fetch(`${API_BASE_URL}/api/news/${id}`, {
			method: 'PUT',
			body: formData
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return await response.json();
	} catch (err: any) {
		console.error(`Error updating news ${id}:`, err);
		return { success: false, error: err.message || `Failed to update news ${id}` };
	}
}

/**
 * Delete a news item (soft delete - sets status to 2)
 */
export async function deleteNews(id: number): Promise<ApiResponse<any>> {
	try {
		const response = await fetch(`${API_BASE_URL}/api/news/${id}`, {
			method: 'DELETE'
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return await response.json();
	} catch (err: any) {
		console.error(`Error deleting news ${id}:`, err);
		return { success: false, error: err.message || `Failed to delete news ${id}` };
	}
}

/**
 * Update news order (move up or down)
 */
export async function updateNewsOrder(id: number, newOrder: number): Promise<{ success: boolean; error?: string }> {
	try {
		const response = await fetch(`${API_BASE_URL}/api/news/${id}/order`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ order: newOrder })
		});
		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || 'Failed to update news order');
		}
		return data;
	} catch (error) {
		console.error('Error updating news order:', error);
		throw error;
	}
}

