import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, RotateCcw, Upload, Download, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSitesApi, getSitesGeoJSONApi, updateSiteApi, deleteSiteApi } from '../api/sites';
import { getProjectsApi } from '../api/projects';
import { Site, Project } from '../types';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { SiteTable } from '../components/sites/SiteTable';
import { SiteEditModal } from '../components/sites/SiteEditModal';
import { GeoJSONImportModal } from '../components/sites/GeoJSONImportModal';

export const SitesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { success, error } = useToast();

  const [sites, setSites] = useState<Site[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [siteToEdit, setSiteToEdit] = useState<Site | null>(null);

  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSites = async () => {
    try {
      setLoading(true);
      const [sitesData, projectsData] = await Promise.all([
        getSitesApi(undefined, search || undefined),
        getProjectsApi({ limit: 100 }),
      ]);
      setSites(sitesData);
      setProjects(projectsData.items);
    } catch (err: any) {
      error(err.message || 'Failed to fetch sites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSites();
  };

  const handleUpdateSite = async (formData: any) => {
    if (!siteToEdit) return;
    setActionLoading(true);
    try {
      await updateSiteApi(siteToEdit.id, formData);
      success(`Site "${siteToEdit.name}" updated successfully`);
      setEditDialogOpen(false);
      setSiteToEdit(null);
      fetchSites();
    } catch (err: any) {
      error(err.message || 'Failed to update site');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSite = async () => {
    if (!siteToDelete) return;
    setActionLoading(true);
    try {
      await deleteSiteApi(siteToDelete.id);
      success(`Site "${siteToDelete.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setSiteToDelete(null);
      fetchSites();
    } catch (err: any) {
      error(err.message || 'Failed to delete site');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportAllGeoJSON = async () => {
    try {
      const geojson = await getSitesGeoJSONApi();
      const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `darukaa_earth_all_sites_${new Date().toISOString().slice(0, 10)}.geojson`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('Exported all sites to GeoJSON successfully');
    } catch (err: any) {
      error(err.message || 'Failed to export GeoJSON');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Conservation Sites</h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Spatial polygon sectors, vegetation indices, and verified field reserves.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleExportAllGeoJSON}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export GeoJSON
          </Button>

          {isAdmin && (
            <Button
              variant="secondary"
              onClick={() => setImportDialogOpen(true)}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Import GeoJSON
            </Button>
          )}

          <Button
            variant="primary"
            onClick={() => navigate('/map')}
            leftIcon={<Compass className="w-4 h-4" />}
          >
            Open Map to Draw
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0f1714] border border-[#1f352b] flex items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-96 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by site name..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-xs sm:text-sm"
          />
        </form>

        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              getSitesApi().then(setSites);
            }}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Clear Search
          </Button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : sites.length === 0 ? (
        <EmptyState
          title="No sites found"
          description="Draw a new polygon on the interactive map or import GeoJSON to register a site."
          actionText="Open Map to Draw"
          onAction={() => navigate('/map')}
        />
      ) : (
        <div className="space-y-4">
          <SiteTable
            sites={sites}
            isAdmin={isAdmin}
            onEdit={(s) => {
              setSiteToEdit(s);
              setEditDialogOpen(true);
            }}
            onDelete={(s) => {
              setSiteToDelete(s);
              setDeleteDialogOpen(true);
            }}
          />
          <div className="text-xs text-gray-400 px-2">
            Showing {sites.length} monitored spatial sectors
          </div>
        </div>
      )}

      {/* Edit Site Modal */}
      {editDialogOpen && siteToEdit && (
        <SiteEditModal
          isOpen={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSiteToEdit(null);
          }}
          onSubmit={handleUpdateSite}
          site={siteToEdit}
          isLoading={actionLoading}
        />
      )}

      {/* GeoJSON Import Modal */}
      {importDialogOpen && (
        <GeoJSONImportModal
          isOpen={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onSuccess={fetchSites}
          projects={projects}
        />
      )}

      {/* Delete Confirmation */}
      {deleteDialogOpen && siteToDelete && (
        <ConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setSiteToDelete(null);
          }}
          onConfirm={handleDeleteSite}
          title="Delete Site"
          message={`Are you sure you want to permanently delete site "${siteToDelete.name}"?`}
          confirmText="Delete Site"
          isDestructive={true}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};
