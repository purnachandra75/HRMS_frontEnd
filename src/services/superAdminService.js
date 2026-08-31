import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/super-admin`;

export const superAdminLogin = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
    return {
      success: true,
      userId: response.data.userId,
      role: response.data.role,
      name: response.data.name,
      token: response.data.token,
    };
  } catch (error) {
    const message = error?.response?.data?.error || 'Invalid email or password';
    return { success: false, message };
  }
};

export const getDashboardStats = async () => {
  const response = await axios.get(`${API_BASE_URL}/dashboard`);
  return response.data;
};

export const getClients = async () => {
  const response = await axios.get(`${API_BASE_URL}/clients`);
  return response.data;
};

export const getClient = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/clients/${id}`);
  return response.data;
};

export const createClient = async (payload) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/clients`, payload);
    return { success: true, client: response.data };
  } catch (error) {
    const message = error?.response?.data?.error || 'Failed to create client';
    return { success: false, message };
  }
};

export const getClientEmployees = async (id, page = 0, size = 20) => {
  const response = await axios.get(`${API_BASE_URL}/clients/${id}/employees`, {
    params: { page, size },
  });
  return response.data;
};

export const updateClientStatus = async (id, status) => {
  const response = await axios.patch(`${API_BASE_URL}/clients/${id}/status`, { status });
  return response.data;
};
