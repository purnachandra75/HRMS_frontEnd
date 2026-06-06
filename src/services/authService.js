import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/employees';

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
    return {
      success: true,
      userId: response.data.userId,
      role: response.data.role,
      name: response.data.name,
    };
  } catch (error) {
    const message = error?.response?.data?.message || 'Invalid email or password';
    return { success: false, message };
  }
};

export const registerUser = async (profileData) => {
  try {
    const { confirmPassword, ...payload } = profileData;
    const response = await axios.post(API_BASE_URL, payload);
    return {
      success: true,
      message: 'Registration successful',
      employee: response.data,
    };
  } catch (error) {
    const message = error?.response?.data?.message || 'Registration failed';
    return { success: false, message };
  }
};
