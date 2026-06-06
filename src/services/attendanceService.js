const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const getAttendanceRecords = async ({ employeeId, month } = {}) => {
  const params = new URLSearchParams();
  if (employeeId) params.append('employeeId', employeeId);
  if (month) params.append('month', month);

  const url = `${API_BASE_URL}/api/attendance${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch attendance records');
  }
  return response.json();
};
