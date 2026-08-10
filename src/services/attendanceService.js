import { apiFetch } from '../utils/apiClient';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const getAttendanceRecords = async ({ employeeId, month, year, monthNumber, search } = {}) => {
  const params = new URLSearchParams();
  if (employeeId) params.append('employeeId', employeeId);
  if (month) params.append('month', month);
  if (year) params.append('year', year);
  if (monthNumber) params.append('monthNumber', monthNumber);
  if (search) params.append('search', search);

  const url = `${API_BASE_URL}/api/attendance${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiFetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch attendance records');
  }
  return response.json();
};
