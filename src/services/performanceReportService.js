import { apiFetch } from '../utils/apiClient';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const parseErrorMessage = async (response, fallback) => {
  try {
    const errorData = await response.json();
    return errorData.message || errorData.error || fallback;
  } catch (e) {
    return fallback;
  }
};

// Client admin's read-only view - scoped, filtered, and paginated server-side. Returns Spring
// Data's Page shape: { content, totalElements, totalPages, ... }.
export const getClientPerformanceReports = async ({ page = 0, size = 15, month, employeeName } = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (month && month !== 'all') {
    params.append('month', String(month));
  }
  if (employeeName) {
    params.append('employeeName', employeeName);
  }
  const response = await apiFetch(`${API_BASE_URL}/api/performance-reports?${params.toString()}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Failed to load performance reports'));
  }
  return response.json();
};
