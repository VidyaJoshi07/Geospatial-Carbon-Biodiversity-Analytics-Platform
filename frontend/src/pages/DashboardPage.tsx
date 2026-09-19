import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle,
  MapPin,
  Maximize2,
  Leaf,
  Activity,
  Plus,
  Compass,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getProjectStatsApi, getProjectsApi, createProjectApi } from '../api/projects';
import { getSitesApi } from '../api/sites';
import { getGlobalAnalyticsDashboardApi } from '../api/analytics';
import { Project, Site, ProjectStats } from '../types';
import { formatHectares, formatCarbon } from '../utils/formatters';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { ProjectFormModal } from '../components/projects/ProjectFormModal';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentSites, setRecentSites] = useState<Site[]>([]);
  const [globalAnalytics, setGlobalAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsData, projectsData, sitesData, globalData] = await Promise.all([
        getProjectStatsApi(),
        getProjectsApi({ limit: 5 }),
        getSitesApi(),
        getGlobalAnalyticsDashboardApi().catch(() => null),
      ]);
      setStats(statsData);
      setRecentProjects(projectsData.items);
      setRecentSites(sitesData.slice(0, 5));
      setGlobalAnalytics(globalData);
    } catch (err: any) {
      error(err.message || 'Failed to load dashboard telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCreateProject = async (formData: any) => {
    try {
      await createProjectApi(formData);
      success('Conservation project created successfully');
      loadDashboard();
    } catch (err: any) {
      error(err.message || 'Failed to create project');
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1c15] via-[#10241b] to-[#0a1410] border border-[#1f352b] p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Telemetry Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome back, {user?.name?.split(' ')[0] || 'Researcher'}
            </h2>
            <p className="mt-1 text-sm text-gray-400 max-w-xl">
              Real-time ecological telemetry, PostGIS spatial boundary telemetry, and verified carbon & biodiversity indices.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate('/map')}
              leftIcon={<Compass className="w-4 h-4" />}
            >
              Open Interactive Map
            </Button>
            {isAdmin && (
              <Button
                variant="primary"
                onClick={() => setCreateModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create Project
              </Button>
            )}
          </div>
        </div>

        {/* Ambient decorative glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stat Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total Projects"
            value={stats?.total_projects || 0}
            subtitle="Registered"
            icon={<FolderKanban className="w-5 h-5" />}
          />
          <StatCard
            title="Active Projects"
            value={stats?.active_projects || 0}
            subtitle="Under Telemetry"
            icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
          />
          <StatCard
            title="Monitored Sites"
            value={stats?.total_sites || 0}
            subtitle="PostGIS Polygons"
            icon={<MapPin className="w-5 h-5 text-cyan-400" />}
          />
          <StatCard
            title="Total Area"
            value={formatHectares(stats?.total_area || 0)}
            subtitle="Land Protected"
            icon={<Maximize2 className="w-5 h-5 text-teal-400" />}
          />
          <StatCard
            title="Carbon Stock"
            value={formatCarbon(stats?.total_carbon_credits || 0)}
            subtitle="Verified tCO₂e"
            icon={<Leaf className="w-5 h-5 text-emerald-400" />}
            trend={{ value: '8.4%', isPositive: true }}
          />
          <StatCard
            title="Avg Biodiversity"
            value={`${stats?.avg_biodiversity_score || 0} / 100`}
            subtitle="Ecological Index"
            icon={<Activity className="w-5 h-5 text-purple-400" />}
            trend={{ value: '4.2%', isPositive: true }}
          />
        </div>
      )}

      {/* Ecosystem Health Overview Banner */}
      {globalAnalytics && (
        <div className="p-6 rounded-3xl bg-[#0e1914] border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">System Composite Telemetry</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Calculated across {globalAnalytics.total_monitored_sites} active polygon sites worldwide.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-sm">
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase font-medium">Mean Performance</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                {globalAnalytics.system_avg_performance} / 100
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase font-medium">Mean NDVI Index</div>
              <div className="text-lg font-bold text-teal-400 mt-0.5">
                {globalAnalytics.system_avg_ndvi}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Projects & Recent Sites Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <div className="bg-[#0f1714] border border-[#1f352b] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Active Conservation Projects</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/projects')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                View Registry
              </Button>
            </div>

            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="p-4 rounded-2xl bg-[#090f0c] border border-[#192b23] hover:border-emerald-500/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-4">
                    <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                      {project.name}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center space-x-2 mt-1">
                      <span>{project.project_type}</span>
                      <span>•</span>
                      <span>{formatHectares(project.total_area)}</span>
                    </div>
                  </div>
                  <Badge variant="emerald" size="sm">
                    {project.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Monitoring Sites */}
        <div className="bg-[#0f1714] border border-[#1f352b] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Monitored Sectors & Polygons</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/sites')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                All Sites
              </Button>
            </div>

            <div className="space-y-3">
              {recentSites.map((site) => (
                <div
                  key={site.id}
                  onClick={() => navigate(`/sites/${site.id}/analytics`)}
                  className="p-4 rounded-2xl bg-[#090f0c] border border-[#192b23] hover:border-emerald-500/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-4">
                    <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors flex items-center space-x-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{site.name}</span>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center space-x-2 mt-1">
                      <span>{site.project_name || 'Conservation'}</span>
                      <span>•</span>
                      <span className="text-emerald-400">{formatCarbon(site.carbon_value)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-white">
                      {formatHectares(site.area_hectares)}
                    </div>
                    <div className="text-[11px] text-cyan-400 mt-0.5">
                      Bio: {site.biodiversity_value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Project Form Modal */}
      {isAdmin && (
        <ProjectFormModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </div>
  );
};
