const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// ============= LEAVE REQUEST API CALLS =============

export const getLeaveRequests = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leave-requests`);
    if (!response.ok) {
      throw new Error('Failed to fetch leave requests');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    throw error;
  }
};

export const getEmployeeLeaveRequests = async (employeeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leave-requests/employee/${employeeId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch employee leave requests');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching employee leave requests:', error);
    throw error;
  }
};

export const createLeaveRequest = async (requestData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leave-requests`, {
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
    return response.json();
  } catch (error) {
    console.error('Error creating leave request:', error);
    throw error;
  }
};

export const updateLeaveRequestStatus = async (requestId, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leave-requests/${requestId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      throw new Error('Failed to update leave request status');
    }
    return response.json();
  } catch (error) {
    console.error('Error updating leave request status:', error);
    throw error;
  }
};

export const getLeaveBalances = async (employeeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leave-balances/${employeeId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch leave balances');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching leave balances:', error);
    throw error;
  }
};
