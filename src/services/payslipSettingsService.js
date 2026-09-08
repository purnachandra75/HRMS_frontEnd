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

export const getPayslipSettings = async () => {
  const response = await apiFetch(`${API_BASE_URL}/api/payslip-settings`);
  return parseJsonResponse(response, 'Failed to load payslip settings');
};

export const updatePayslipSettings = async (payload) => {
  const response = await apiFetch(`${API_BASE_URL}/api/payslip-settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(response, 'Failed to update payslip settings');
};

export const uploadPayslipLogo = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiFetch(`${API_BASE_URL}/api/payslip-settings/logo`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = 'Failed to upload logo';
    try {
      const errorData = await response.json();
      message = errorData.message || errorData.error || message;
    } catch (error) {
      // Keep the default message when the response is not JSON.
    }
    throw new Error(message);
  }
};

// Auth here is bearer-token based (see apiClient.js), so a plain <img src> can't carry the
// token - fetch the logo through apiFetch and hand back an object URL instead. Returns null
// when no logo has been uploaded yet (or the request otherwise fails) rather than throwing,
// since "no logo" is an expected state callers should render a fallback for.
export const fetchPayslipLogoObjectUrl = async () => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/payslip-settings/logo`);
    if (!response.ok) return null;
    const blob = await response.blob();
    return window.URL.createObjectURL(blob);
  } catch (error) {
    return null;
  }
};
