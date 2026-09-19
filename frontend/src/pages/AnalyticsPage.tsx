import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  Leaf,
  Activity,
  Maximize2,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getSitesApi } from '../api/sites';
import { getSiteAnalyticsApi } from '../api/analytics';
import { Site, SiteAnalyticsResponse } from '../types';
import { formatHectares, formatCarbon } from '../utils/formatters';
import { AnalyticsChart } from '../components/analytics/AnalyticsChart';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

export const AnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error } = useToast();

  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(() =>
    id ? Number(id) : null
  );
  const [timeRange, setTimeRange] = useState<string>('1Y');
  const [analyticsData, setAnalyticsData] = useState<SiteAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);

  // Load sites list
  useEffect(() => {
    async function loadSites() {
      try {
        setLoading(true);
        const data = await getSitesApi();
        setSites(data);
        if (!selectedSiteId && data.length > 0) {
          setSelectedSiteId(data[0].id);
        }
      } catch (err: any) {
        error(err.message || 'Failed to fetch sites list');
      } finally {
        setLoading(false);
      }
    }
    loadSites();
  }, []);

  // Update selected site if param changes
  useEffect(() => {
    if (id) {
      setSelectedSiteId(Number(id));
    }
  }, [id]);

  // Load analytics when selectedSiteId or timeRange changes
  useEffect(() => {
    if (!selectedSiteId) return;

    async function fetchAnalytics() {
      setAnalyticsLoading(true);
      try {
        const res = await getSiteAnalyticsApi(selectedSiteId!, timeRange);
        setAnalyticsData(res);
      } catch (err: any) {
        error(err.message || 'Failed to fetch telemetry analytics');
      } finally {
        setAnalyticsLoading(false);
      }
    }
    fetchAnalytics();
  }, [selectedSiteId, timeRange]);

  const timeRanges = [
    { label: '7 Days', value: '7D' },
    { label: '30 Days', value: '30D' },
    { label: '3 Months', value: '3M' },
    { label: '6 Months', value: '6M' },
    { label: '1 Year', value: '1Y' },
    { label: 'All Time', value: 'ALL' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <EmptyState
        title="No conservation sites available"
        description="Create projects and draw site polygons on the interactive map to inspect time-series telemetry."
        actionText="Open Map"
        onAction={() => navigate('/map')}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header & Site Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            <span>Site Ecological Analytics</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Longitudinal vegetation index (NDVI), carbon sequestration curves, and biodiversity trends.
          </p>
        </div>

        {/* Site Selector Dropdown & Time Range Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <select
              value={selectedSiteId || ''}
              onChange={(e) => {
                const newId = Number(e.target.value);
                setSelectedSiteId(newId);
                navigate(`/sites/${newId}/analytics`);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#0f1714] border border-[#1f352b] text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-medium"
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} ({site.project_name})
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Filter Buttons */}
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-[#0f1714] border border-[#1f352b]">
            {timeRanges.map((r) => (
              <button
                key={r.value}
                onClick={() => setTimeRange(r.value)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeRange === r.value
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {r.value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Site Metadata Header Card */}
      {analyticsData && (
        <div className="p-6 rounded-3xl bg-[#0f1714] border border-[#1f352b] shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1.5">
                <Badge variant="emerald" size="sm">
                  {analyticsData.project_name}
                </Badge>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-400">
                  {formatHectares(analyticsData.area_hectares)}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">{analyticsData.site_name}</h3>
            </div>

            <div className="text-xs text-gray-400 flex items-center space-x-1 bg-[#090f0c] px-3 py-1.5 rounded-xl border border-[#192b23]">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{analyticsData.summary.total_records} Recorded Telemetry Intervals</span>
            </div>
          </div>

          {/* Summary KPI Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#192b23]">
            <div className="p-3.5 rounded-xl bg-[#080d0b] border border-[#192b23]">
              <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-medium">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                <span>Latest Carbon</span>
              </div>
              <div className="text-lg font-bold text-emerald-400 mt-1">
                {formatCarbon(analyticsData.summary.latest_carbon)}
              </div>
              <div className="text-[10px] text-emerald-400/80 font-medium mt-0.5">
                +{analyticsData.summary.carbon_growth_pct}% growth
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#080d0b] border border-[#192b23]">
              <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-medium">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Biodiversity Score</span>
              </div>
              <div className="text-lg font-bold text-cyan-400 mt-1">
                {analyticsData.summary.latest_biodiversity} / 100
              </div>
              <div className="text-[10px] text-cyan-400/80 font-medium mt-0.5">
                +{analyticsData.summary.biodiversity_growth_pct}% recovery
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#080d0b] border border-[#192b23]">
              <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                <span>Vegetation NDVI</span>
              </div>
              <div className="text-lg font-bold text-teal-400 mt-1">
                {analyticsData.summary.latest_ndvi}
              </div>
              <div className="text-[10px] text-gray-400 font-medium mt-0.5">Healthy canopy density</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#080d0b] border border-[#192b23]">
              <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-medium">
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Performance Index</span>
              </div>
              <div className="text-lg font-bold text-amber-400 mt-1">
                {analyticsData.summary.latest_performance} / 100
              </div>
              <div className="text-[10px] text-gray-400 font-medium mt-0.5">Composite telemetry score</div>
            </div>
          </div>
        </div>
      )}

      {/* Chart.js Time-Series Grid */}
      {analyticsLoading || !analyticsData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Carbon Sequestration over time */}
          <AnalyticsChart
            records={analyticsData.time_series}
            type="carbon"
            title="Carbon Stock & Net Sequestration (tCO₂e)"
          />

          {/* 2. Biodiversity Index over time */}
          <AnalyticsChart
            records={analyticsData.time_series}
            type="biodiversity"
            title="Biodiversity Health Index Telemetry (0 - 100)"
          />

          {/* 3. Vegetation Index (NDVI) over time */}
          <AnalyticsChart
            records={analyticsData.time_series}
            type="ndvi"
            title="Satellite Multispectral Vegetation Index (NDVI)"
          />

          {/* 4. Area Change Delta */}
          <AnalyticsChart
            records={analyticsData.time_series}
            type="area_change"
            title="Net Canopy Delta & Land Cover Variation (%)"
          />

          {/* 5. Composite Performance Score (Span full width) */}
          <div className="lg:col-span-2">
            <AnalyticsChart
              records={analyticsData.time_series}
              type="performance"
              title="Comprehensive Multi-Factor Ecological Performance Score"
            />
          </div>
        </div>
      )}
    </div>
  );
};
