import { apiFetch } from '../utils/apiClient';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const runPayroll = async (payload) => {
  const response = await apiFetch(`${API_BASE_URL}/api/payroll/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = 'Failed to run payroll';
    try {
      const errorData = await response.json();
      message = errorData.message || errorData.error || message;
    } catch (error) {
      // Keep the default message when the response is not JSON.
    }
    throw new Error(message);
  }

  const disposition = response.headers.get('content-disposition') || '';
  const filenameMatch = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : null;
  const fileBlob = await response.blob();

  return {
    fileBlob,
    filename,
    contentType: response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
};

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

const fetchFirstAvailableJson = async (requests, fallbackMessage) => {
  const notFoundUrls = [];
  let lastErrorMessage = fallbackMessage;

  for (const request of requests) {
    const response = await apiFetch(request.url, request.options);

    if (response.status === 404) {
      notFoundUrls.push(request.url);
      continue;
    }

    try {
      return await parseJsonResponse(response, fallbackMessage);
    } catch (error) {
      lastErrorMessage = error.message || fallbackMessage;
      throw error;
    }
  }

  throw new Error(`${lastErrorMessage}. Backend payroll report endpoint was not found. Tried: ${notFoundUrls.join(', ')}`);
};

export const getPayrollReport = async ({ month, year, employeeId, employeeName } = {}) => {
  const params = new URLSearchParams({
    month: String(month),
    year: String(year),
  });
  if (employeeId) params.append('employeeId', String(employeeId));
  if (employeeName) params.append('employeeName', employeeName);
  const query = params.toString();

  return fetchFirstAvailableJson(
    [
      { url: `${API_BASE_URL}/api/payroll/report?${query}` },
      { url: `${API_BASE_URL}/api/payroll/reports?${query}` },
      { url: `${API_BASE_URL}/api/payroll?${query}` },
      { url: `${API_BASE_URL}/api/payroll/${year}/${month}` },
      { url: `${API_BASE_URL}/api/payroll/report/${year}/${month}` },
    ],
    'Failed to load payroll report'
  );
};

export const updatePayrollStatus = async ({ payrollId, employeeId, month, year, status }) => {
  const options = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      employeeId,
      month,
      year,
      status,
      creditStatus: status,
      paymentStatus: status,
    }),
  };

  const requests = payrollId
    ? [
        { url: `${API_BASE_URL}/api/payroll/${payrollId}/status`, options },
        { url: `${API_BASE_URL}/api/payroll/status`, options },
        { url: `${API_BASE_URL}/api/payroll/${payrollId}/payment-status`, options },
      ]
    : [
        { url: `${API_BASE_URL}/api/payroll/status`, options },
        { url: `${API_BASE_URL}/api/payroll/payment-status`, options },
      ];

  return fetchFirstAvailableJson(requests, 'Failed to update payroll status');
};

export const updatePayslipMode = async ({ payrollId, employeeId, month, year, manualPayslip }) => {
  const response = await apiFetch(`${API_BASE_URL}/api/payroll/${payrollId}/payslip-mode`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ employeeId, month, year, manualPayslip }),
  });

  return parseJsonResponse(response, 'Failed to update payslip mode');
};

export const uploadManualPayslip = async (payrollId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiFetch(`${API_BASE_URL}/api/payroll/${payrollId}/payslip`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = 'Failed to upload payslip';
    try {
      const errorData = await response.json();
      message = errorData.message || errorData.error || message;
    } catch (error) {
      // Keep the default message when the response is not JSON.
    }
    throw new Error(message);
  }
};

export const getManualPayslipUrl = (payrollId) => `${API_BASE_URL}/api/payroll/${payrollId}/payslip`;
