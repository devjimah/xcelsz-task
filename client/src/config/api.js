const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const endpoints = {
  meetings: `${API_URL}/api/meetings`,
  notifications: `${API_URL}/api/notifications`
};

export const fetchApi = async (endpoint, options = {}) => {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
