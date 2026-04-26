import axios from 'axios';

// ✅ Detect environment
const isDev = import.meta.env.DEV;

// ✅ Use correct API URL
const API_URL = isDev
  ? 'http://localhost:5000'   // local backend
  : import.meta.env.VITE_API_URL; // deployed backend

// ❗ Safety check (VERY IMPORTANT)
if (!API_URL) {
  console.error("❌ VITE_API_URL is not defined");
}

// ✅ Axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  withCredentials: true, // useful if using cookies
});

// ✅ Request interceptor (attach token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle Unauthorized
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('sms_token');
      localStorage.removeItem('sms_user');
      window.location.href = '/login';
    }

    // Optional: better debugging
    console.error("API ERROR:", error?.response || error.message);

    return Promise.reject(error);
  }
);

export default api;