import { apiClient } from './client';
import { ApiResponse, Site, GeoJSONFeatureCollection } from '../types';

export interface CreateSitePayload {
  name: string;
  description?: string;
  location: any; // GeoJSON geometry
  area_hectares?: number;
  status?: string;
  carbon_value?: number;
  biodiversity_value?: number;
}

export interface UpdateSitePayload {
  name?: string;
  description?: string;
  location?: any;
  area_hectares?: number;
  status?: string;
  carbon_value?: number;
  biodiversity_value?: number;
}

export async function getSitesApi(projectId?: number, search?: string): Promise<Site[]> {
  const params = new URLSearchParams();
  if (projectId) params.append('project_id', projectId.toString());
  if (search) params.append('search', search);

  const res = await apiClient.get<ApiResponse<Site[]>>(`/sites?${params.toString()}`);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to fetch sites');
  }
  return res.data.data;
}

export async function getSitesGeoJSONApi(projectId?: number): Promise<GeoJSONFeatureCollection> {
  const params = new URLSearchParams();
  if (projectId) params.append('project_id', projectId.toString());

  const res = await apiClient.get<ApiResponse<GeoJSONFeatureCollection>>(`/sites/geojson?${params.toString()}`);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to fetch GeoJSON');
  }
  return res.data.data;
}

export async function getSiteByIdApi(id: number): Promise<Site> {
  const res = await apiClient.get<ApiResponse<Site>>(`/sites/${id}`);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to fetch site');
  }
  return res.data.data;
}

export async function createSiteApi(projectId: number, payload: CreateSitePayload): Promise<Site> {
  const res = await apiClient.post<ApiResponse<Site>>(`/projects/${projectId}/sites`, payload);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to create site');
  }
  return res.data.data;
}

export async function createSiteFromGeoJSONApi(feature: any): Promise<Site> {
  const res = await apiClient.post<ApiResponse<Site>>('/sites/geojson', feature);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to create site from GeoJSON');
  }
  return res.data.data;
}

export async function updateSiteApi(id: number, payload: UpdateSitePayload): Promise<Site> {
  const res = await apiClient.put<ApiResponse<Site>>(`/sites/${id}`, payload);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to update site');
  }
  return res.data.data;
}

export async function deleteSiteApi(id: number): Promise<void> {
  const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/sites/${id}`);
  if (!res.data.success) {
    throw new Error(res.data.error?.message || 'Failed to delete site');
  }
}
