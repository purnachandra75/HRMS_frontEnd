import { apiFetch } from '../utils/apiClient';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const parseJsonResponse = async (response, fallbackMessage) => {
  if (!response.ok) {
    let message = fallbackMessage;
    try {
      const errorData = await response.json();
      message = errorData.message || errorData.error || message;
    } catch (error) {
      // Keep the default message when the response is not JSON.
    }
    throw new Error(message);
  }

  return response.json();
};

export const getLeaveSettings = async () => {
  const response = await apiFetch(`${API_BASE_URL}/api/leave-settings`);
  return parseJsonResponse(response, 'Failed to load leave settings');
};

export const updateLeaveSettings = async (payload) => {
  const response = await apiFetch(`${API_BASE_URL}/api/leave-settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(response, 'Failed to update leave settings');
};
