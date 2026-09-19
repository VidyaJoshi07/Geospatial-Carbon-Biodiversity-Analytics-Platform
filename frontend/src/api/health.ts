import { apiClient } from './client';

export interface HealthStatus {
  status: string;
  database: string;
  service: string;
}

export async function getHealthApi(): Promise<HealthStatus> {
  const res = await apiClient.get<HealthStatus>('/health');
  return res.data;
}
