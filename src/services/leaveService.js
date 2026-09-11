import { apiFetch } from '../utils/apiClient';
import { LEAVE_TYPE_KEYS, normalizeLeaveTypeKey, normalizeLeaveBalances } from '../utils/leaveUtils';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Zero-filled, not a guess at real allocations - only used when there is no server data and no
// cache at all (e.g. first load while offline). Real allocations always come from the API, which
// reflects each org's admin-configured leave-settings.
const emptyLeaveBalances = () => LEAVE_TYPE_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});

const STORAGE_KEYS = {
  leaveRequests: 'leaveRequests',
  leaveBalances: 'leaveBalances',
};

const getCurrentYear = () => new Date().getFullYear();

const safeParseJSON = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const buildStorageKey = (key, employeeId) => `${key}_${employeeId}`;

const saveToStorage = (storageKey, value) => {
  localStorage.setItem(storageKey, JSON.stringify(value));
};

const loadFromStorage = (storageKey) => {
  const raw = localStorage.getItem(storageKey);
  return raw ? safeParseJSON(raw) : null;
};

const getStoredLeaveBalances = (employeeId) => {
  const stored = loadFromStorage(buildStorageKey(STORAGE_KEYS.leaveBalances, employeeId));
  if (!stored) return null;
  if (stored.year !== getCurrentYear()) {
    return null;
  }
  return stored;
};

const saveLeaveBalancesToStorage = (employeeId, balances) => {
  const normalized = normalizeLeaveBalances(balances, emptyLeaveBalances());
  const payload = { ...normalized, year: getCurrentYear() };
  saveToStorage(buildStorageKey(STORAGE_KEYS.leaveBalances, employeeId), payload);
  return payload;
};

const ensureLeaveBalancesForCurrentYear = (employeeId) => {
  const stored = getStoredLeaveBalances(employeeId);
  if (stored) {
    return stored;
  }

  return saveLeaveBalancesToStorage(employeeId, emptyLeaveBalances());
};

// Calculate working days (excluding weekends) between two dates
const calculateWorkingDaysBetween = (fromDate, toDate) => {
  if (!fromDate || !toDate) return 0;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return 0;
  }

  let workingDays = 0;
  const current = new Date(from);

  while (current <= to) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      workingDays += 1;
    }
    current.setDate(current.getDate() + 1);
  }

  return workingDays;
};

const getLeaveRequestsFromStorage = () => {
  return loadFromStorage(STORAGE_KEYS.leaveRequests) || [];
};

const saveLeaveRequestsToStorage = (requests) => {
  saveToStorage(STORAGE_KEYS.leaveRequests, requests);
};

const updateRequestInStorage = (request) => {
  const requests = getLeaveRequestsFromStorage();
  const existingIndex = requests.findIndex((item) => String(item.id) === String(request.id));
  const updatedRequests = [...requests];

  if (existingIndex >= 0) {
    updatedRequests[existingIndex] = { ...updatedRequests[existingIndex], ...request };
  } else {
    updatedRequests.push(request);
  }

  saveLeaveRequestsToStorage(updatedRequests);
  return updatedRequests;
};

const applyLeaveBalanceChange = (employeeId, leaveType, days) => {
  const balances = ensureLeaveBalancesForCurrentYear(employeeId);
  const normalizedType = normalizeLeaveTypeKey(leaveType);
  if (normalizedType && balances[normalizedType] !== undefined) {
    balances[normalizedType] = Math.max(0, Number(balances[normalizedType]) - Number(days));
    saveLeaveBalancesToStorage(employeeId, balances);
  }
  return balances;
};

const clearCachedLeaveBalances = (employeeId) => {
  const storageKey = buildStorageKey(STORAGE_KEYS.leaveBalances, employeeId);
  localStorage.removeItem(storageKey);
};

const mergeRequestsWithLocalFallback = (apiRequests) => {
  const storedRequests = getLeaveRequestsFromStorage();
  if (!storedRequests || storedRequests.length === 0) {
    return apiRequests;
  }

  const requestsById = new Map();
  apiRequests.forEach((request) => requestsById.set(String(request.id), request));
  storedRequests.forEach((request) => {
    const idKey = String(request.id);
    if (!requestsById.has(idKey)) {
      requestsById.set(idKey, request);
    }
  });

  return Array.from(requestsById.values());
};

// ============= LEAVE REQUEST API CALLS =============

export const getLeaveRequests = async () => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/leave-requests`);
    if (!response.ok) {
      throw new Error('Failed to fetch leave requests');
    }
    const data = await response.json();
    const mergedRequests = mergeRequestsWithLocalFallback(Array.isArray(data) ? data : []);
    saveLeaveRequestsToStorage(mergedRequests);
    return mergedRequests;
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return getLeaveRequestsFromStorage();
  }
};

// Server-side paginated + filtered fetch (used by the admin Leave Requests table and
// the Monthly Leave Report). `page` is 1-based on the frontend; converted to the
// backend's 0-based page index. `search` matches employee ID exactly or employee
// name as a substring - the backend decides which based on whether it's numeric.
export const getLeaveRequestsPage = async ({ page = 1, size = 10, status = '', search = '', month = null, year = null } = {}) => {
  const params = new URLSearchParams();
  params.append('page', Math.max(0, page - 1));
  params.append('size', size);

  const normalizedStatus = status && status.trim().toLowerCase() !== 'all' ? status.trim() : '';
  if (normalizedStatus) {
    params.append('status', normalizedStatus);
  }

  const trimmedSearch = search ? search.trim() : '';
  if (trimmedSearch) {
    params.append('search', trimmedSearch);
  }

  if (month) params.append('month', month);
  if (year) params.append('year', year);

  const response = await apiFetch(`${API_BASE_URL}/api/leave-requests?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch leave requests');
  }
  const data = await response.json();

  if (Array.isArray(data)) {
    return { requests: data, total: data.length, pageSize: size, totalPages: 1 };
  }

  return {
    requests: Array.isArray(data.content) ? data.content : [],
    total: data.totalElements ?? 0,
    pageSize: data.size ?? size,
    totalPages: data.totalPages ?? 1,
  };
};

export const getEmployeeLeaveRequests = async (employeeId) => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/leave-requests/employee/${employeeId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch employee leave requests');
    }
    const data = await response.json();
    const employeeRequests = Array.isArray(data) ? data : [];
    const storedRequests = getLeaveRequestsFromStorage().filter(
      (request) => String(request.employeeId) === String(employeeId)
    );
    const mergedEmployeeRequests = [
      ...employeeRequests,
      ...storedRequests.filter(
        (stored) => !employeeRequests.some((request) => String(request.id) === String(stored.id))
      )
    ];

    const mergedGlobalRequests = mergeRequestsWithLocalFallback(employeeRequests);
    saveLeaveRequestsToStorage(mergedGlobalRequests);

    return mergedEmployeeRequests;
  } catch (error) {
    console.error('Error fetching employee leave requests:', error);
    return getLeaveRequestsFromStorage().filter(
      (request) => String(request.employeeId) === String(employeeId)
    );
  }
};

export const createLeaveRequest = async (requestData) => {
  const response = await apiFetch(`${API_BASE_URL}/api/leave-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  });

  if (!response.ok) {
    let errorMessage = 'Failed to create leave request';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // response body wasn't JSON (e.g. network/proxy error page) - use the default message
    }
    throw new Error(errorMessage);
  }

  const responseData = await response.json();
  if (responseData && responseData.id) {
    updateRequestInStorage(responseData);
  }
  return responseData;
};

export const updateLeaveRequestStatus = async (requestId, status) => {
  const response = await apiFetch(`${API_BASE_URL}/api/leave-requests/${requestId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    let errorMessage = 'Failed to update leave request status';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // response body wasn't JSON (e.g. network/proxy error page) - use the default message
    }
    throw new Error(errorMessage);
  }

  const responseData = await response.json();
  if (responseData && responseData.id) {
    // Cache-only bookkeeping for a CONFIRMED server update - never fabricates a change
    // that didn't actually happen, just mirrors it locally for immediate UI feedback.
    const requests = getLeaveRequestsFromStorage();
    const existingRequest = requests.find((request) => String(request.id) === String(responseData.id));
    const previousStatus = (existingRequest?.status || '').toLowerCase();

    const fromDate = responseData.fromDate || existingRequest?.fromDate;
    const toDate = responseData.toDate || existingRequest?.toDate;
    const correctDays = calculateWorkingDaysBetween(fromDate, toDate);
    const calculatedDays = correctDays > 0 ? correctDays : (responseData.days || existingRequest?.days || 0);

    const updatedResponseData = { ...responseData, days: calculatedDays };
    updateRequestInStorage(updatedResponseData);

    if (previousStatus !== 'approved' && (responseData.status || status).toLowerCase() === 'approved') {
      const employeeId = responseData.employeeId || existingRequest?.employeeId;
      applyLeaveBalanceChange(
        employeeId,
        responseData.leaveType || responseData.type || existingRequest?.leaveType || existingRequest?.type,
        calculatedDays
      );
      // Clear cached balance to force fresh fetch on next request
      clearCachedLeaveBalances(employeeId);
    }
  }

  return responseData;
};

export const getLeaveBalances = async (employeeId) => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/leave-balances/${employeeId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch leave balances');
    }
    const data = await response.json();
    // Always save fresh data from server to update cache
    return saveLeaveBalancesToStorage(employeeId, data);
  } catch (error) {
    console.error('Error fetching leave balances:', error);
    // Only use cache as fallback if server fails
    const stored = getStoredLeaveBalances(employeeId);
    if (stored) {
      return stored;
    }
    return ensureLeaveBalancesForCurrentYear(employeeId);
  }
};
