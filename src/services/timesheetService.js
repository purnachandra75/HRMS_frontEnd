import { apiFetch } from '../utils/apiClient';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const parseOrThrow = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || fallbackMessage);
  }
  return data;
};

// Employee self-service: submit today's work update and view my own submission history.
// Routing (PM vs HR) is decided server-side from the employee's current project/bench status.
export const submitTimesheet = async ({ workDate, description, hoursWorked }) => {
  const response = await apiFetch(`${API_BASE_URL}/api/timesheets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workDate, description, hoursWorked }),
  });
  return parseOrThrow(response, 'Failed to submit timesheet');
};

export const getMyTimesheets = async () => {
  const response = await apiFetch(`${API_BASE_URL}/api/timesheets/my`);
  return parseOrThrow(response, 'Failed to load your timesheets');
};

// Manager (Project Manager) view: only teammates currently on one of their managed projects.
export const getTeamTimesheets = async (status = '') => {
  const params = new URLSearchParams();
  if (status && status.toLowerCase() !== 'all') {
    params.append('status', status);
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await apiFetch(`${API_BASE_URL}/api/manager/timesheets${query}`);
  // Any non-2xx (403 = not a PM, but also 404/500 if the backend is out of sync with the
  // frontend build) degrades to "you don't manage a team" rather than a raw error banner.
  if (!response.ok) {
    return { forbidden: true, timesheets: [] };
  }
  return { forbidden: false, timesheets: await response.json() };
};

export const updateTeamTimesheetStatus = async (id, status) => {
  const response = await apiFetch(`${API_BASE_URL}/api/manager/timesheets/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return parseOrThrow(response, 'Failed to update timesheet');
};

// Admin/HR view: employees who were on the bench (no PM to route to) when they submitted.
export const getHrTimesheets = async (status = '') => {
  const params = new URLSearchParams();
  if (status && status.toLowerCase() !== 'all') {
    params.append('status', status);
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await apiFetch(`${API_BASE_URL}/api/timesheets${query}`);
  return parseOrThrow(response, 'Failed to load HR timesheet queue');
};

export const updateTimesheetStatusAsAdmin = async (id, status) => {
  const response = await apiFetch(`${API_BASE_URL}/api/timesheets/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return parseOrThrow(response, 'Failed to update timesheet');
};

// Weekly PM -> HR rollups. Project employees' daily entries never reach HR individually - only
// bundled into whichever weekly report their PM sent (see getHrTimesheets above for the
// bench-employee daily queue, which is separate).
export const getWeeklyReportsForHr = async () => {
  const response = await apiFetch(`${API_BASE_URL}/api/timesheets/weekly-reports`);
  return parseOrThrow(response, 'Failed to load weekly reports');
};
