const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const runPayroll = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/api/payroll/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/csv, application/octet-stream, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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

  const reportText = await response.text();

  return {
    reportText,
    contentType: response.headers.get('content-type') || 'text/csv',
  };
};
