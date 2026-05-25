import axios, { type AxiosError } from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('yeldo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/auth')) {
      localStorage.removeItem('yeldo_token');
      localStorage.removeItem('yeldo_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  },
);
