/**
 * Profile API - Handles user profile operations
 */

const getApiBaseUrl = () => {
	const raw = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3111';
	return raw.trim().replace(/^['"]+|['";]+$/g, '').replace(/\/+$/, '');
};

export interface ProfileData {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	phone: string;
	role: string;
}

export interface ProfileResponse {
	success: boolean;
	data?: ProfileData;
	error?: string;
}

/**
 * Get user profile
 */
export async function getProfile(): Promise<ProfileResponse> {
	const API_BASE_URL = getApiBaseUrl();
	const url = `${API_BASE_URL}/api/profile`;

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error loading profile:', error);
		throw error;
	}
}

/**
 * Update user profile
 */
export async function updateProfile(profileData: ProfileData): Promise<ProfileResponse> {
	const API_BASE_URL = getApiBaseUrl();
	const url = `${API_BASE_URL}/api/profile`;

	try {
		const response = await fetch(url, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(profileData)
		});
		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || 'Failed to update profile');
		}
		return data;
	} catch (error) {
		console.error('Error updating profile:', error);
		throw error;
	}
}

