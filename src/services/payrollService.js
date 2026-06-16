const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const runPayroll = async (employees) => {
  const response = await fetch(`${API_BASE_URL}/api/payroll/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ employees }),
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

  return response.json();
};
