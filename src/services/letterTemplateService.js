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

export const getLetterTemplates = async (letterType) => {
  const response = await apiFetch(`${API_BASE_URL}/api/letter-templates?letterType=${encodeURIComponent(letterType)}`);
  return parseJsonResponse(response, 'Failed to load letter templates');
};

export const createLetterTemplate = async (payload) => {
  const response = await apiFetch(`${API_BASE_URL}/api/letter-templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(response, 'Failed to create letter template');
};

export const updateLetterTemplate = async (id, payload) => {
  const response = await apiFetch(`${API_BASE_URL}/api/letter-templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(response, 'Failed to update letter template');
};

export const deleteLetterTemplate = async (id) => {
  const response = await apiFetch(`${API_BASE_URL}/api/letter-templates/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    let message = 'Failed to delete letter template';
    try {
      const errorData = await response.json();
      message = errorData.message || errorData.error || message;
    } catch (error) {
      // Keep the default message when the response is not JSON.
    }
    throw new Error(message);
  }
};

const uploadImage = async (id, slug, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiFetch(`${API_BASE_URL}/api/letter-templates/${id}/${slug}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = `Failed to upload ${slug}`;
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
// token - fetch the image through apiFetch and hand back an object URL instead. Returns null
// when no image has been uploaded yet (or the request otherwise fails) rather than throwing,
// since "no image" is an expected state callers should render a fallback for.
const fetchImageObjectUrl = async (id, slug) => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/letter-templates/${id}/${slug}`);
    if (!response.ok) return null;
    const blob = await response.blob();
    return window.URL.createObjectURL(blob);
  } catch (error) {
    return null;
  }
};

// Preview-only: parses an uploaded .docx into paragraphs + suggested fields for the admin to
// review before anything is saved. Does not persist a template.
export const parseLetterTemplateDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiFetch(`${API_BASE_URL}/api/letter-templates/parse-document`, {
    method: 'POST',
    body: formData,
  });
  return parseJsonResponse(response, 'Failed to read the uploaded document');
};

export const uploadLetterTemplateLogo = (id, file) => uploadImage(id, 'logo', file);
export const fetchLetterTemplateLogoObjectUrl = (id) => fetchImageObjectUrl(id, 'logo');

export const uploadLetterTemplateSignature = (id, file) => uploadImage(id, 'signature', file);
export const fetchLetterTemplateSignatureObjectUrl = (id) => fetchImageObjectUrl(id, 'signature');
