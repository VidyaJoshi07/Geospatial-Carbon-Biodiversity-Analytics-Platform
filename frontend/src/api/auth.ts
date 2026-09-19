import { apiClient } from './client';
import { ApiResponse, User } from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'USER';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponseData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export async function registerApi(payload: RegisterPayload): Promise<User> {
  const res = await apiClient.post<ApiResponse<User>>('/auth/register', payload);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Registration failed');
  }
  return res.data.data;
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponseData> {
  const res = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', payload);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Login failed');
  }
  return res.data.data;
}

export async function getMeApi(): Promise<User> {
  const res = await apiClient.get<ApiResponse<User>>('/auth/me');
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to fetch profile');
  }
  return res.data.data;
}

export async function logoutApi(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    localStorage.removeItem('darukaa_access_token');
    localStorage.removeItem('darukaa_refresh_token');
    localStorage.removeItem('darukaa_user');
  }
}
