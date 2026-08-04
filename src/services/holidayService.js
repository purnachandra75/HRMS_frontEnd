import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const HOLIDAY_API = `${API_BASE_URL}/api/holidays`;

// Helper to extract the list of years from the API.
export const getAllYears = async () => {
  const response = await axios.get(`${HOLIDAY_API}/years`);
  return response.data || [];
};

export const getHolidays = async (year) => {
  const params = {};
  if (year) params.year = year;
  const response = await axios.get(HOLIDAY_API, { params });
  return response.data || [];
};

export const createHoliday = async ({ date, title, description }) => {
  const response = await axios.post(HOLIDAY_API, { date, title, description });
  return response.data;
};

export const deleteHoliday = async (id) => {
  await axios.delete(`${HOLIDAY_API}/${id}`);
  return true;
};

export const updateHoliday = async (id, patch) => {
  const response = await axios.put(`${HOLIDAY_API}/${id}`, patch);
  return response.data;
};

const holidayService = {
  getAllYears,
  getHolidays,
  createHoliday,
  deleteHoliday,
  updateHoliday,
};

export default holidayService;
