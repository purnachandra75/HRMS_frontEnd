import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const HOLIDAY_API = `${API_BASE_URL}/api/holidays`;

const getAuthHeaders = () => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return {};

  try {
    const { role, name } = JSON.parse(storedUser);
    return {
      'X-User-Role': role || '',
      'X-User-Name': name || '',
    };
  } catch (error) {
    return {};
  }
};

// Helper to extract the list of years from the API.
export const getAllYears = async () => {
  const response = await axios.get(`${HOLIDAY_API}/years`, { headers: getAuthHeaders() });
  return response.data || [];
};

export const getHolidays = async (year) => {
  const params = {};
  if (year) params.year = year;
  const response = await axios.get(HOLIDAY_API, { params, headers: getAuthHeaders() });
  return response.data || [];
};

export const createHoliday = async ({ date, title, description }) => {
  const response = await axios.post(HOLIDAY_API, { date, title, description }, { headers: getAuthHeaders() });
  return response.data;
};

export const deleteHoliday = async (id) => {
  await axios.delete(`${HOLIDAY_API}/${id}`, { headers: getAuthHeaders() });
  return true;
};

export const updateHoliday = async (id, patch) => {
  const response = await axios.put(`${HOLIDAY_API}/${id}`, patch, { headers: getAuthHeaders() });
  return response.data;
};

export default {
  getAllYears,
  getHolidays,
  createHoliday,
  deleteHoliday,
  updateHoliday,
};
