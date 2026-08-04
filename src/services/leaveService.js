import { apiFetch } from '../utils/apiClient';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const DEFAULT_LEAVE_BALANCES = {
  casual: 18,
  sick: 6,
  paid: 12,
};

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

const normalizeLeaveTypeKey = (leaveType) => {
  if (!leaveType) return null;
  const normalized = String(leaveType).trim().toLowerCase();
  if (DEFAULT_LEAVE_BALANCES[normalized] !== undefined) {
    return normalized;
  }
  return Object.keys(DEFAULT_LEAVE_BALANCES).find(
    (key) => key.toLowerCase() === normalized
  ) || null;
};

const normalizeLeaveBalancesPayload = (balances) => {
  const normalizedBalances = {};

  if (Array.isArray(balances)) {
    balances.forEach((item) => {
      const normalizedKey = normalizeLeaveTypeKey(item?.leaveType);
      if (normalizedKey && item.balance !== undefined) {
        normalizedBalances[normalizedKey] = Number(item.balance) || 0;
      }
    });
  } else if (typeof balances === 'object' && balances !== null) {
    if (balances.leaveType && balances.balance !== undefined) {
      const normalizedKey = normalizeLeaveTypeKey(balances.leaveType);
      if (normalizedKey) {
        normalizedBalances[normalizedKey] = Number(balances.balance) || 0;
      }
    } else {
      Object.entries(balances).forEach(([key, value]) => {
        const normalizedKey = normalizeLeaveTypeKey(key);
        if (normalizedKey) {
          normalizedBalances[normalizedKey] = Number(value) || 0;
        }
      });
    }
  }

  return Object.keys(normalizedBalances).length > 0
    ? { ...DEFAULT_LEAVE_BALANCES, ...normalizedBalances }
    : { ...DEFAULT_LEAVE_BALANCES };
};

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
  const normalized = normalizeLeaveBalancesPayload(balances);
  const payload = { ...normalized, year: getCurrentYear() };
  saveToStorage(buildStorageKey(STORAGE_KEYS.leaveBalances, employeeId), payload);
  return payload;
};

const ensureLeaveBalancesForCurrentYear = (employeeId) => {
  const stored = getStoredLeaveBalances(employeeId);
  if (stored) {
    return stored;
  }

  return saveLeaveBalancesToStorage(employeeId, { ...DEFAULT_LEAVE_BALANCES });
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

const getNextLocalRequestId = (requests) => {
  const localRequests = requests.filter((req) => typeof req.id === 'string' && req.id.startsWith('local-'));
  if (localRequests.length === 0) {
    return `local-${Date.now()}`;
  }
  return `local-${Date.now()}`;
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

const updateLocalLeaveRequestStatus = (requestId, status) => {
  const requests = getLeaveRequestsFromStorage();
  const updatedRequests = requests.map((request) => {
    if (String(request.id) !== String(requestId)) {
      return request;
    }

    const previousStatus = (request.status || '').toLowerCase();
    const newStatus = String(status);
    
    // Always calculate correct working days from dates
    const correctDays = calculateWorkingDaysBetween(request.fromDate, request.toDate);
    const updatedRequest = { 
      ...request, 
      status: newStatus,
      days: correctDays > 0 ? correctDays : (request.days || 0) // Update stored days with correct value
    };

    if (previousStatus !== 'approved' && newStatus.toLowerCase() === 'approved') {
      // Use the correct calculated working days for deduction
      const daysToDeduct = updatedRequest.days;
      
      applyLeaveBalanceChange(request.employeeId, request.leaveType || request.type, daysToDeduct);
      // Clear cached balance to force fresh fetch on next request
      clearCachedLeaveBalances(request.employeeId);
    }

    return updatedRequest;
  });

  saveLeaveRequestsToStorage(updatedRequests);
  return updatedRequests.find((request) => String(request.id) === String(requestId));
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
  try {
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
        // If response body is not JSON, use default message
      }
      throw new Error(errorMessage);
    }
    const responseData = await response.json();
    if (responseData && responseData.id) {
      updateRequestInStorage(responseData);
    }
    return responseData;
  } catch (error) {
    console.error('Error creating leave request:', error);
    const requests = getLeaveRequestsFromStorage();
    const nextId = getNextLocalRequestId(requests);
    const localRequest = {
      id: nextId,
      employeeId: requestData.employeeId,
      employeeName: requestData.employeeName,
      leaveType: requestData.leaveType || requestData.type,
      type: requestData.type,
      fromDate: requestData.fromDate,
      toDate: requestData.toDate,
      days: requestData.days,
      reason: requestData.reason,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    const updatedRequests = [...requests, localRequest];
    saveLeaveRequestsToStorage(updatedRequests);
    return localRequest;
  }
};

export const updateLeaveRequestStatus = async (requestId, status) => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/leave-requests/${requestId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      throw new Error('Failed to update leave request status');
    }
    const responseData = await response.json();
    if (responseData && responseData.id) {
      const requests = getLeaveRequestsFromStorage();
      const existingRequest = requests.find((request) => String(request.id) === String(responseData.id));
      if (existingRequest) {
        const previousStatus = (existingRequest.status || '').toLowerCase();
        // Calculate correct working days from dates
        const fromDate = responseData.fromDate || existingRequest.fromDate;
        const toDate = responseData.toDate || existingRequest.toDate;
        const correctDays = calculateWorkingDaysBetween(fromDate, toDate);
        const calculatedDays = correctDays > 0 ? correctDays : (responseData.days || existingRequest.days || 0);
        
        // Update the response object with correct days before storing
        const updatedResponseData = { ...responseData, days: calculatedDays };
        updateRequestInStorage(updatedResponseData);
        
        if (previousStatus !== 'approved' && (responseData.status || status).toLowerCase() === 'approved') {
          // Use the correct calculated working days for deduction
          applyLeaveBalanceChange(
            responseData.employeeId || existingRequest.employeeId,
            responseData.leaveType || responseData.type || existingRequest.leaveType || existingRequest.type,
            calculatedDays
          );
          // Clear cached balance to force fresh fetch on next request
          clearCachedLeaveBalances(responseData.employeeId || existingRequest.employeeId);
        }
      } else {
        // Request not found in local storage, process new response
        const correctDays = calculateWorkingDaysBetween(responseData.fromDate, responseData.toDate);
        const calculatedDays = correctDays > 0 ? correctDays : (responseData.days || 0);
        
        // Update the response object with correct days before storing
        const updatedResponseData = { ...responseData, days: calculatedDays };
        updateRequestInStorage(updatedResponseData);
        
        if ((responseData.status || status).toLowerCase() === 'approved') {
          // Use the correct calculated working days for deduction
          applyLeaveBalanceChange(
            responseData.employeeId,
            responseData.leaveType || responseData.type,
            calculatedDays
          );
          // Clear cached balance to force fresh fetch on next request
          clearCachedLeaveBalances(responseData.employeeId);
        }
      }
    } else {
      updateLocalLeaveRequestStatus(requestId, status);
    }
    return responseData;
  } catch (error) {
    console.error('Error updating leave request status:', error);
    const updatedRequest = updateLocalLeaveRequestStatus(requestId, status);
    if (!updatedRequest) {
      throw error;
    }
    return updatedRequest;
  }
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
