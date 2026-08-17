import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/employees`;

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
    if (response.data.otpRequired) {
      return {
        success: true,
        otpRequired: true,
        userId: response.data.userId,
        email: response.data.email || email,
        message: response.data.message,
      };
    }
    return {
      success: true,
      userId: response.data.userId,
      role: response.data.role,
      name: response.data.name,
      token: response.data.token,
    };
  } catch (error) {
    const message = error?.response?.data?.message || 'Invalid email or password';
    return { success: false, message };
  }
};

export const verifyOtp = async (userId, otp) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/verify-otp`, { userId, otp });
    return {
      success: true,
      userId: response.data.userId,
      role: response.data.role,
      name: response.data.name,
      token: response.data.token,
    };
  } catch (error) {
    const message = error?.response?.data?.message || 'Invalid or expired OTP';
    return { success: false, message };
  }
};

export const resendOtp = async (userId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/resend-otp`, { userId });
    return { success: true, message: response.data?.message || 'A new OTP has been sent to your email' };
  } catch (error) {
    const message = error?.response?.data?.message || 'Failed to resend OTP';
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

export const requestPasswordReset = async (email) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/forgot-password`, { email });
    return { success: true, message: response.data?.message };
  } catch (error) {
    const message = error?.response?.data?.message || 'Failed to request password reset';
    return { success: false, message };
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/reset-password`, { token, newPassword });
    return { success: true, message: response.data?.message };
  } catch (error) {
    const message = error?.response?.data?.message || 'Failed to reset password';
    return { success: false, message };
  }
};
