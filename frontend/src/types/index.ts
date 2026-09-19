export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type ProjectType = 'Carbon' | 'Biodiversity' | 'Mixed';
export type ProjectStatus = 'Active' | 'Draft' | 'Completed' | 'Archived';

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  project_type: ProjectType;
  status: ProjectStatus;
  total_area: number;
  carbon_credits: number;
  biodiversity_score: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  site_count?: number;
}

export interface GeoJSONGeometry {
  type: string;
  coordinates: any;
}

export interface Site {
  id: number;
  project_id: number;
  name: string;
  description?: string | null;
  location: GeoJSONGeometry;
  area_hectares: number;
  status: string;
  carbon_value: number;
  biodiversity_value: number;
  created_at: string;
  updated_at: string;
  project_name?: string | null;
}

export interface GeoJSONFeature {
  type: 'Feature';
  id: number;
  geometry: GeoJSONGeometry;
  properties: {
    id: number;
    project_id: number;
    project_name?: string;
    project_type?: string;
    name: string;
    description?: string;
    area_hectares: number;
    status: string;
    carbon_value: number;
    biodiversity_value: number;
    created_at: string;
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface AnalyticsRecord {
  id: number;
  site_id: number;
  recorded_date: string;
  carbon_value: number;
  biodiversity_value: number;
  vegetation_index: number;
  area_change: number;
  performance_score: number;
  created_at: string;
}

export interface AnalyticsSummary {
  latest_carbon: number;
  latest_biodiversity: number;
  latest_ndvi: number;
  latest_performance: number;
  carbon_growth_pct: number;
  biodiversity_growth_pct: number;
  total_records: number;
}

export interface SiteAnalyticsResponse {
  site_id: number;
  site_name: string;
  project_id: number;
  project_name: string;
  area_hectares: number;
  summary: AnalyticsSummary;
  time_series: AnalyticsRecord[];
}

export interface ProjectStats {
  total_projects: number;
  active_projects: number;
  total_sites: number;
  total_area: number;
  total_carbon_credits: number;
  avg_biodiversity_score: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ProjectListResponse {
  items: Project[];
  pagination: PaginationMeta;
}
