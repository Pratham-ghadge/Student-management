import axios from 'axios';

// ✅ Get API URL (production OR fallback to local)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ✅ Create Axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
});

// ✅ Request interceptor (attach token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Response interceptor (handle auth error)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('sms_token');
      localStorage.removeItem('sms_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;