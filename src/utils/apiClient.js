import { getApiUrl } from '../config/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return { data };
};

const apiClient = {
  async get(path) {
    const response = await fetch(getApiUrl(`api/${path}`));
    return handleResponse(response);
  },

  async post(path, data) {
    const response = await fetch(getApiUrl(`api/${path}`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async put(path, data) {
    const response = await fetch(getApiUrl(`api/${path}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async delete(path) {
    const response = await fetch(getApiUrl(`api/${path}`), {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

export default apiClient;
