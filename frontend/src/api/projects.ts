import { apiClient } from './client';
import { ApiResponse, Project, ProjectListResponse, ProjectStats, Site } from '../types';

export interface ProjectFilters {
  page?: number;
  limit?: number;
  status?: string;
  project_type?: string;
  search?: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  project_type: 'Carbon' | 'Biodiversity' | 'Mixed';
  status?: 'Active' | 'Draft' | 'Completed' | 'Archived';
  total_area?: number;
  carbon_credits?: number;
  biodiversity_score?: number;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  project_type?: 'Carbon' | 'Biodiversity' | 'Mixed';
  status?: 'Active' | 'Draft' | 'Completed' | 'Archived';
  total_area?: number;
  carbon_credits?: number;
  biodiversity_score?: number;
}

export async function getProjectsApi(filters: ProjectFilters = {}): Promise<ProjectListResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.project_type) params.append('project_type', filters.project_type);
  if (filters.search) params.append('search', filters.search);

  const res = await apiClient.get<ApiResponse<ProjectListResponse>>(`/projects?${params.toString()}`);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to fetch projects');
  }
  return res.data.data;
}

export async function getProjectStatsApi(): Promise<ProjectStats> {
  const res = await apiClient.get<ApiResponse<ProjectStats>>('/projects/stats');
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to fetch dashboard stats');
  }
  return res.data.data;
}

export async function getProjectByIdApi(id: number): Promise<Project> {
  const res = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to fetch project');
  }
  return res.data.data;
}

export async function createProjectApi(payload: CreateProjectPayload): Promise<Project> {
  const res = await apiClient.post<ApiResponse<Project>>('/projects', payload);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to create project');
  }
  return res.data.data;
}

export async function updateProjectApi(id: number, payload: UpdateProjectPayload): Promise<Project> {
  const res = await apiClient.put<ApiResponse<Project>>(`/projects/${id}`, payload);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to update project');
  }
  return res.data.data;
}

export async function deleteProjectApi(id: number): Promise<void> {
  const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/projects/${id}`);
  if (!res.data.success) {
    throw new Error(res.data.error?.message || 'Failed to delete project');
  }
}

export async function getProjectSitesApi(projectId: number): Promise<Site[]> {
  const res = await apiClient.get<ApiResponse<Site[]>>(`/projects/${projectId}/sites`);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to fetch project sites');
  }
  return res.data.data;
}
