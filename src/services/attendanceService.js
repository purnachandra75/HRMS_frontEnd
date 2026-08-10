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

// Single consolidated call for the Reports module's Attendance Report - the backend
// joins employees + that month's attendance and paginates server-side, instead of the
// frontend hitting /api/employees and /api/attendance separately and joining them here.
export const getAttendanceReportPage = async ({ page = 1, size = 10, department = '', status = '', year, month } = {}) => {
  const params = new URLSearchParams();
  params.append('page', Math.max(0, page - 1));
  params.append('size', size);

  const normalizedDepartment = department && department.trim().toLowerCase() !== 'all' ? department.trim() : '';
  if (normalizedDepartment) params.append('department', normalizedDepartment);

  const normalizedStatus = status && status.trim().toLowerCase() !== 'all' ? status.trim() : '';
  if (normalizedStatus) params.append('status', normalizedStatus);

  if (year) params.append('year', year);
  if (month) params.append('month', month);

  const response = await apiFetch(`${API_BASE_URL}/api/reports/attendance?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch attendance report');
  }
  const data = await response.json();

  return {
    rows: Array.isArray(data.content) ? data.content : [],
    total: data.totalElements ?? 0,
    pageSize: data.size ?? size,
    totalPages: data.totalPages ?? 1,
  };
};
