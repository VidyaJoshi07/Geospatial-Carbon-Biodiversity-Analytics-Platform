import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Download,
  MapPin,
  Maximize2,
  Leaf,
  Activity,
  Calendar,
  Layers,
  Code2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSiteByIdApi, updateSiteApi, deleteSiteApi } from '../api/sites';
import { getSiteAnalyticsApi } from '../api/analytics';
import { Site, SiteAnalyticsResponse } from '../types';
import { formatHectares, formatCarbon, formatDate } from '../utils/formatters';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { SiteEditModal } from '../components/sites/SiteEditModal';
import { AnalyticsChart } from '../components/analytics/AnalyticsChart';
import { MapView } from '../components/map/MapView';

export const SiteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { success, error } = useToast();

  const siteId = Number(id);

  const [site, setSite] = useState<Site | null>(null);
  const [analytics, setAnalytics] = useState<SiteAnalyticsResponse | null>(null);
  const [timeRange, setTimeRange] = useState('1Y');
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showCoords, setShowCoords] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    if (!siteId) return;
    try {
      setLoading(true);
      const siteData = await getSiteByIdApi(siteId);
      setSite(siteData);
    } catch (err: any) {
      error(err.message || 'Failed to load site details');
      navigate('/sites');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!siteId) return;
    try {
      setAnalyticsLoading(true);
      const data = await getSiteAnalyticsApi(siteId, timeRange);
      setAnalytics(data);
    } catch (err: any) {
      console.warn('Analytics loading error:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [siteId]);

  useEffect(() => {
    loadAnalytics();
  }, [siteId, timeRange]);

  const handleUpdateSite = async (formData: any) => {
    if (!site) return;
    setActionLoading(true);
    try {
      const updated = await updateSiteApi(site.id, formData);
      setSite(updated);
      success('Site metadata updated successfully');
      setEditModalOpen(false);
    } catch (err: any) {
      error(err.message || 'Failed to update site');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSite = async () => {
    if (!site) return;
    setActionLoading(true);
    try {
      await deleteSiteApi(site.id);
      success(`Site "${site.name}" deleted`);
      navigate('/sites');
    } catch (err: any) {
      error(err.message || 'Failed to delete site');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportGeoJSON = () => {
    if (!site) return;
    const feature = {
      type: 'Feature',
      geometry: site.location,
      properties: {
        id: site.id,
        name: site.name,
        project_id: site.project_id,
        project_name: site.project_name,
        area_hectares: site.area_hectares,
        carbon_value: site.carbon_value,
        biodiversity_value: site.biodiversity_value,
        status: site.status,
      },
    };
    const blob = new Blob([JSON.stringify(feature, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${site.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_polygon.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('GeoJSON polygon downloaded');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (!site) return null;

  // Build a single-site FeatureCollection for the map preview
  const singleSiteGeoJSON = {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        id: site.id,
        geometry: site.location,
        properties: {
          id: site.id,
          name: site.name,
          project_id: site.project_id,
          project_name: site.project_name || '',
          project_type: 'Mixed',
          area_hectares: site.area_hectares,
          carbon_value: site.carbon_value,
          biodiversity_value: site.biodiversity_value,
          status: site.status,
          created_at: site.created_at,
        },
      },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/sites')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Conservation Sites
        </Button>

        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportGeoJSON}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export GeoJSON
          </Button>

          {isAdmin && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditModalOpen(true)}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Edit Site
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Site Header Overview Card */}
      <div className="bg-[#0f1714] border border-[#1f352b] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="emerald" size="md">
                {site.status}
              </Badge>
              {site.project_name && (
                <Link
                  to={`/projects/${site.project_id}`}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  Project: {site.project_name}
                </Link>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
              <MapPin className="w-6 h-6 text-emerald-400" />
              <span>{site.name}</span>
            </h2>
            <p className="text-sm text-gray-300 mt-2 max-w-2xl leading-relaxed">
              {site.description || 'Verified PostGIS boundary parcel with high-resolution telemetry monitoring.'}
            </p>
            <div className="text-xs text-gray-400 mt-4 flex items-center space-x-4">
              <span>Registered on {formatDate(site.created_at)}</span>
              <span>Updated on {formatDate(site.updated_at)}</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(`/map?site_id=${site.id}`)}
            leftIcon={<Layers className="w-4 h-4" />}
          >
            Locate on Global Map
          </Button>
        </div>

        {/* Site Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-[#192b23]">
          <div className="p-4 rounded-2xl bg-[#09100d] border border-[#192b23]">
            <div className="flex items-center space-x-2 text-xs text-gray-400 font-medium">
              <Maximize2 className="w-4 h-4 text-teal-400" />
              <span>Calculated Area</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">
              {formatHectares(site.area_hectares)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#09100d] border border-[#192b23]">
            <div className="flex items-center space-x-2 text-xs text-gray-400 font-medium">
              <Leaf className="w-4 h-4 text-emerald-400" />
              <span>Carbon Stored</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">
              {formatCarbon(site.carbon_value)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#09100d] border border-[#192b23]">
            <div className="flex items-center space-x-2 text-xs text-gray-400 font-medium">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Biodiversity Index</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-cyan-400 mt-1">
              {site.biodiversity_value} <span className="text-xs text-gray-400">/ 100</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#09100d] border border-[#192b23]">
            <div className="flex items-center space-x-2 text-xs text-gray-400 font-medium">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Performance</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-purple-400 mt-1">
              {analytics?.summary?.latest_performance || 92.4} %
            </div>
          </div>
        </div>
      </div>

      {/* Map Boundary View & Coordinates Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Spatial Boundary (PostGIS Polygon)</span>
            </h3>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              SRID 4326 WGS84
            </span>
          </div>

          <div className="h-[380px] rounded-3xl overflow-hidden border border-[#1f352b] shadow-xl">
            <MapView
              geojsonData={singleSiteGeoJSON}
              selectedSiteId={site.id}
              isAdmin={false}
            />
          </div>
        </div>

        {/* Geometry Vertices / Coordinates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>GeoJSON Vertices</span>
            </h3>
            <button
              onClick={() => setShowCoords(!showCoords)}
              className="text-xs text-cyan-400 hover:underline"
            >
              {showCoords ? 'Hide JSON' : 'Show JSON'}
            </button>
          </div>

          <div className="h-[380px] p-4 rounded-3xl bg-[#0a110e] border border-[#1f352b] overflow-y-auto font-mono text-xs text-gray-300">
            <div className="text-[11px] text-gray-500 uppercase font-semibold mb-2">
              Geometry Type: {site.location?.type || 'Polygon'}
            </div>
            {site.location?.coordinates?.[0] ? (
              <div className="space-y-1.5">
                <div className="text-[11px] text-emerald-400 font-bold">
                  {site.location.coordinates[0].length} Boundary Rings:
                </div>
                {site.location.coordinates[0].map((pt: [number, number], idx: number) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded-lg bg-[#050a08] border border-[#16271f] flex items-center justify-between"
                  >
                    <span className="text-gray-500 font-bold">#{idx + 1}</span>
                    <span className="text-emerald-300">Lng: {pt[0].toFixed(5)}</span>
                    <span className="text-teal-300">Lat: {pt[1].toFixed(5)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="text-gray-400">{JSON.stringify(site.location, null, 2)}</pre>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Visualizations */}
      <div className="space-y-6 pt-4 border-t border-[#192b23]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">Historical Telemetry & Projections</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              14-month satellite vegetation health (NDVI), biomass carbon accumulation, and biodiversity metrics.
            </p>
          </div>

          {/* Time Filter Buttons */}
          <div className="flex items-center space-x-1 p-1 bg-[#0a110e] border border-[#1f352b] rounded-xl">
            {['7D', '30D', '3M', '6M', '1Y', 'ALL'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${timeRange === range
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {analyticsLoading ? (
          <Skeleton className="h-80 rounded-3xl" />
        ) : analytics?.time_series ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalyticsChart
              type="carbon"
              records={analytics.time_series}
              title="Carbon Sequestration Trend (tCO2e)"
            />
            <AnalyticsChart
              type="biodiversity"
              records={analytics.time_series}
              title="Biodiversity Integrity Index"
            />
            <AnalyticsChart
              type="ndvi"
              records={analytics.time_series}
              title="Normalized Difference Vegetation Index (NDVI)"
            />
            <AnalyticsChart
              type="performance"
              records={analytics.time_series}
              title="Ecological Performance Score"
            />
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 bg-[#0c1411] rounded-2xl border border-[#1f352b]">
            No historical telemetry records found for this site.
          </div>
        )}
      </div>

      {/* Edit Site Modal */}
      {editModalOpen && (
        <SiteEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSubmit={handleUpdateSite}
          site={site}
          isLoading={actionLoading}
        />
      )}

      {/* Delete Site Confirmation */}
      {deleteDialogOpen && (
        <ConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteSite}
          title="Delete Site"
          message={`Are you sure you want to permanently delete site "${site.name}"?`}
          confirmText="Delete Site"
          isDestructive={true}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};
