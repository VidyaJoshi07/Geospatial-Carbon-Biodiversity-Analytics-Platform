import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Upload, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSitesGeoJSONApi, createSiteApi } from '../api/sites';
import { getProjectsApi } from '../api/projects';
import { GeoJSONFeatureCollection, Project } from '../types';
import { MapView } from '../components/map/MapView';
import { SiteFormModal } from '../components/sites/SiteFormModal';
import { GeoJSONImportModal } from '../components/sites/GeoJSONImportModal';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';

export const MapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const { success, error } = useToast();

  const [geojsonData, setGeojsonData] = useState<GeoJSONFeatureCollection | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawn polygon modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [drawnGeometry, setDrawnGeometry] = useState<any | null>(null);
  const [drawnAreaHa, setDrawnAreaHa] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);

  // Import modal state
  const [importModalOpen, setImportModalOpen] = useState(false);

  const preselectedProjectId = searchParams.get('project_id')
    ? Number(searchParams.get('project_id'))
    : undefined;

  const loadData = async () => {
    try {
      setLoading(true);
      const [geoData, projList] = await Promise.all([
        getSitesGeoJSONApi(),
        getProjectsApi({ limit: 100 }),
      ]);
      setGeojsonData(geoData);
      setProjects(projList.items);
    } catch (err: any) {
      error(err.message || 'Failed to load map spatial features');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePolygonDrawn = (geometry: any, areaHa: number) => {
    setDrawnGeometry(geometry);
    setDrawnAreaHa(areaHa);
    setModalOpen(true);
  };

  const handleSaveSite = async (formData: any) => {
    setActionLoading(true);
    try {
      await createSiteApi(formData.project_id, {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        area_hectares: formData.area_hectares,
        status: formData.status,
        carbon_value: formData.carbon_value,
        biodiversity_value: formData.biodiversity_value,
      });

      success(`Site "${formData.name}" persisted to PostGIS successfully!`);
      setModalOpen(false);
      setDrawnGeometry(null);
      // Refresh map features from backend
      const updatedGeoJSON = await getSitesGeoJSONApi();
      setGeojsonData(updatedGeoJSON);
    } catch (err: any) {
      error(err.message || 'Failed to save site polygon');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportGeoJSON = () => {
    if (!geojsonData) return;
    const blob = new Blob([JSON.stringify(geojsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `darukaa_earth_postgis_features_${new Date().toISOString().slice(0, 10)}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('Exported PostGIS FeatureCollection');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Geospatial Intelligence Map
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Real-time PostGIS polygon boundaries, vegetative indices, and ecological land sectors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{geojsonData?.features?.length || 0} PostGIS Polygons</span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportGeoJSON}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export GeoJSON
          </Button>

          {isAdmin && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setImportModalOpen(true)}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
            >
              Import GeoJSON
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="w-full h-[650px] lg:h-[750px] rounded-3xl" />
      ) : (
        <MapView
          geojsonData={geojsonData}
          onPolygonDrawn={handlePolygonDrawn}
          isAdmin={isAdmin}
        />
      )}

      {/* Site Creation Modal Triggered by Drawn Polygon */}
      {modalOpen && (
        <SiteFormModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setDrawnGeometry(null);
          }}
          onSubmit={handleSaveSite}
          projects={projects}
          preselectedProjectId={preselectedProjectId}
          initialGeometry={drawnGeometry}
          initialAreaHa={drawnAreaHa}
          isLoading={actionLoading}
        />
      )}

      {/* GeoJSON Import Modal */}
      {importModalOpen && (
        <GeoJSONImportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onSuccess={loadData}
          projects={projects}
        />
      )}
    </div>
  );
};
