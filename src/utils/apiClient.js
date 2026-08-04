import axios from 'axios';

const USER_STORAGE_KEY = 'user';

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

export const getToken = () => {
  const user = getStoredUser();
  return user?.token || null;
};

export const clearSession = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
};

let unauthorizedHandler = () => {
  window.location.href = '/login';
};

// Lets App.js swap in a handler that also resets in-memory auth state instead of
// relying on a hard page navigation.
export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

const handleUnauthorized = () => {
  clearSession();
  unauthorizedHandler();
};

// authService/employeeService/holidayService all import the default axios instance, so
// registering the interceptor once here attaches it to every axios call in the app.
axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

// Drop-in replacement for the native fetch() used by services that don't go through axios
// (leaveService, payrollService, attendanceService, and a few page components). Attaches the
// bearer token and reacts to session expiry the same way the axios interceptor does.
export const apiFetch = async (url, options = {}) => {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    handleUnauthorized();
  }
  return response;
};
