import { apiClient } from './client';
import { ApiResponse, SiteAnalyticsResponse } from '../types';

export interface GlobalDashboardAnalytics {
  total_monitored_sites: number;
  system_avg_performance: number;
  system_avg_ndvi: number;
  top_performing_sites: Array<{
    id: number;
    name: string;
    project_name: string;
    area_hectares: number;
    carbon_value: number;
    biodiversity_value: number;
  }>;
}

export async function getSiteAnalyticsApi(
  siteId: number,
  timeRange: string = '1Y'
): Promise<SiteAnalyticsResponse> {
  const res = await apiClient.get<ApiResponse<SiteAnalyticsResponse>>(
    `/sites/${siteId}/analytics?time_range=${timeRange}`
  );
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to fetch analytics data');
  }
  return res.data.data;
}

export async function getGlobalAnalyticsDashboardApi(): Promise<GlobalDashboardAnalytics> {
  const res = await apiClient.get<ApiResponse<GlobalDashboardAnalytics>>('/analytics/dashboard');
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to fetch global analytics');
  }
  return res.data.data;
}
