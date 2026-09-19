import { apiClient } from './client';
import { ApiResponse, User } from '../types';

export interface UpdateUserProfilePayload {
  name?: string;
  email?: string;
}

export async function getUserProfileApi(): Promise<User> {
  const res = await apiClient.get<ApiResponse<User>>('/users/profile');
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to fetch user profile');
  }
  return res.data.data;
}

export async function updateUserProfileApi(payload: UpdateUserProfilePayload): Promise<User> {
  const res = await apiClient.put<ApiResponse<User>>('/users/profile', payload);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to update user profile');
  }
  return res.data.data;
}
