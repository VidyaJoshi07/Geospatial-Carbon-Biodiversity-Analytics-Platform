import axios, { AxiosError } from 'axios';
import { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('darukaa_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 & token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<any>>) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('darukaa_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });

          if (res.data?.success && res.data?.data?.access_token) {
            const newAccess = res.data.data.access_token;
            const newRefresh = res.data.data.refresh_token;

            localStorage.setItem('darukaa_access_token', newAccess);
            if (newRefresh) {
              localStorage.setItem('darukaa_refresh_token', newRefresh);
            }

            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return apiClient(originalRequest);
          }
        } catch {
          // Refresh failed, clean storage
          localStorage.removeItem('darukaa_access_token');
          localStorage.removeItem('darukaa_refresh_token');
          localStorage.removeItem('darukaa_user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } else {
        localStorage.removeItem('darukaa_access_token');
        localStorage.removeItem('darukaa_refresh_token');
        localStorage.removeItem('darukaa_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    // Extract cleanest user-facing error message
    const errorMsg =
      error.response?.data?.error?.message ||
      error.message ||
      'An unexpected network error occurred';

    return Promise.reject(new Error(errorMsg));
  }
);
