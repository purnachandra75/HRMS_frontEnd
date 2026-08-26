import { apiFetch } from '../utils/apiClient';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Cheap check for whether the logged-in employee currently manages an active project - used to
// decide whether "My Team" nav/dashboard entries should even be shown, not just whether the page
// itself would deny them. Fails safe (false) on any error so the nav simply omits the entry.
export const getManagerStatus = async () => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/manager/status`);
    if (!response.ok) return false;
    const data = await response.json();
    return Boolean(data.isManager);
  } catch {
    return false;
  }
};

// All endpoints below are scoped server-side to whoever the JWT says is calling - there's no
// clientside "which manager" param to pass. A non-2xx means the logged-in employee isn't a
// Project Manager (or, for the leave-status endpoint, the request isn't one of their team's).
export const getMyTeam = async () => {
  const response = await apiFetch(`${API_BASE_URL}/api/manager/team`);
  // Any non-2xx here (403 = not a PM, but also 404/500 if the backend is out of sync with the
  // frontend build) degrades to the same "you don't manage a team" state instead of a raw error -
  // there's nothing actionable a manager can do differently for either case.
  if (!response.ok) {
    return { forbidden: true, team: [] };
  }
  return { forbidden: false, team: await response.json() };
};

export const getTeamLeaveRequests = async (status = '') => {
  const params = new URLSearchParams();
  if (status && status.toLowerCase() !== 'all') {
    params.append('status', status);
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await apiFetch(`${API_BASE_URL}/api/manager/leave-requests${query}`);
  if (!response.ok) {
    return { forbidden: true, requests: [] };
  }
  return { forbidden: false, requests: await response.json() };
};

export const updateTeamLeaveRequestStatus = async (requestId, status) => {
  const response = await apiFetch(`${API_BASE_URL}/api/manager/leave-requests/${requestId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update leave request');
  }
  return data;
};

// Once-a-week rollup of the team's daily updates, sent to HR as a single report instead of HR
// seeing each project employee's entry individually.
export const submitWeeklyReport = async ({ weekStartDate, weekEndDate, notes }) => {
  const response = await apiFetch(`${API_BASE_URL}/api/manager/weekly-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weekStartDate, weekEndDate, notes }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send weekly report');
  }
  return data;
};

export const getMyWeeklyReports = async () => {
  const response = await apiFetch(`${API_BASE_URL}/api/manager/weekly-reports`);
  if (!response.ok) {
    return { forbidden: true, reports: [] };
  }
  return { forbidden: false, reports: await response.json() };
};
