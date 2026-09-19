import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  MapPin,
  Maximize2,
  Leaf,
  Activity,
  Plus,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getProjectByIdApi,
  getProjectSitesApi,
  updateProjectApi,
  deleteProjectApi,
} from '../api/projects';
import { deleteSiteApi, updateSiteApi } from '../api/sites';
import { Project, Site } from '../types';
import { formatHectares, formatCarbon, formatDate } from '../utils/formatters';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ProjectFormModal } from '../components/projects/ProjectFormModal';
import { SiteTable } from '../components/sites/SiteTable';
import { SiteEditModal } from '../components/sites/SiteEditModal';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { success, error } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSiteDialogOpen, setDeleteSiteDialogOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [editSiteModalOpen, setEditSiteModalOpen] = useState(false);
  const [siteToEdit, setSiteToEdit] = useState<Site | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const projectId = Number(id);

  const loadData = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projData, sitesData] = await Promise.all([
        getProjectByIdApi(projectId),
        getProjectSitesApi(projectId),
      ]);
      setProject(projData);
      setSites(sitesData);
    } catch (err: any) {
      error(err.message || 'Failed to load project details');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleUpdate = async (formData: any) => {
    if (!project) return;
    setActionLoading(true);
    try {
      const updated = await updateProjectApi(project.id, formData);
      setProject(updated);
      success('Project updated successfully');
    } catch (err: any) {
      error(err.message || 'Failed to update project');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    setActionLoading(true);
    try {
      await deleteProjectApi(project.id);
      success(`Project "${project.name}" deleted successfully`);
      navigate('/projects');
    } catch (err: any) {
      error(err.message || 'Failed to delete project');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSite = async () => {
    if (!siteToDelete) return;
    setActionLoading(true);
    try {
      await deleteSiteApi(siteToDelete.id);
      success(`Site "${siteToDelete.name}" deleted`);
      setDeleteSiteDialogOpen(false);
      setSiteToDelete(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to delete site');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSite = async (formData: any) => {
    if (!siteToEdit) return;
    setActionLoading(true);
    try {
      await updateSiteApi(siteToEdit.id, formData);
      success(`Site "${siteToEdit.name}" updated successfully`);
      setEditSiteModalOpen(false);
      setSiteToEdit(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to update site');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-8">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/projects')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Projects
        </Button>

        {isAdmin && (
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditModalOpen(true)}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit Details
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
          </div>
        )}
      </div>

      {/* Project Overview Card */}
      <div className="bg-[#0f1714] border border-[#1f352b] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="emerald" size="md">
                {project.project_type} Project
              </Badge>
              <Badge variant="slate" size="md">
                {project.status}
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {project.name}
            </h2>
            <p className="text-sm text-gray-300 mt-2 max-w-2xl leading-relaxed">
              {project.description || 'No description provided.'}
            </p>
            <div className="text-xs text-gray-400 mt-4">
              Registered on {formatDate(project.created_at)}
            </div>
          </div>

          {/* Quick Action: Add Site via Map */}
          {isAdmin && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(`/map?project_id=${project.id}&mode=draw`)}
              leftIcon={<Plus className="w-4 h-4" />}
              rightIcon={<Compass className="w-4 h-4" />}
            >
              Add Site on Map
            </Button>
          )}
        </div>

        {/* Aggregated Project Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-[#192b23]">
          <div className="p-4 rounded-2xl bg-[#09100d] border border-[#192b23]">
            <div className="flex items-center space-x-2 text-xs text-gray-400 font-medium">
              <Maximize2 className="w-4 h-4 text-teal-400" />
              <span>Total Area</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">
              {formatHectares(project.total_area)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#09100d] border border-[#192b23]">
            <div className="flex items-center space-x-2 text-xs text-gray-400 font-medium">
              <Leaf className="w-4 h-4 text-emerald-400" />
              <span>Carbon Credits</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">
              {formatCarbon(project.carbon_credits)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#09100d] border border-[#192b23]">
            <div className="flex items-center space-x-2 text-xs text-gray-400 font-medium">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Biodiversity Index</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-cyan-400 mt-1">
              {project.biodiversity_score} <span className="text-xs text-gray-400">/ 100</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#09100d] border border-[#192b23]">
            <div className="flex items-center space-x-2 text-xs text-gray-400 font-medium">
              <MapPin className="w-4 h-4 text-purple-400" />
              <span>Monitored Sectors</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">{sites.length} sites</div>
          </div>
        </div>
      </div>

      {/* Child Sites Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Project Sites & Spatial Polygons</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Individual PostGIS polygon sectors tracked under this project
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/map')}
            leftIcon={<Compass className="w-3.5 h-3.5" />}
          >
            View on Map
          </Button>
        </div>

        {sites.length === 0 ? (
          <EmptyState
            title="No sites added yet"
            description="Open the interactive map to draw a polygon and persist a new site for this project."
            actionText={isAdmin ? 'Draw Site on Map' : undefined}
            onAction={
              isAdmin
                ? () => navigate(`/map?project_id=${project.id}&mode=draw`)
                : undefined
            }
          />
        ) : (
          <SiteTable
            sites={sites}
            isAdmin={isAdmin}
            onEdit={(s) => {
              setSiteToEdit(s);
              setEditSiteModalOpen(true);
            }}
            onDelete={(s) => {
              setSiteToDelete(s);
              setDeleteSiteDialogOpen(true);
            }}
          />
        )}
      </div>

      {/* Edit Modal */}
      <ProjectFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleUpdate}
        initialData={project}
        isLoading={actionLoading}
      />

      {/* Delete Project Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to permanently delete "${project.name}"?`}
        confirmText="Delete Project"
        isDestructive={true}
        isLoading={actionLoading}
      />

      {/* Delete Site Dialog */}
      {deleteSiteDialogOpen && siteToDelete && (
        <ConfirmDialog
          isOpen={deleteSiteDialogOpen}
          onClose={() => {
            setDeleteSiteDialogOpen(false);
            setSiteToDelete(null);
          }}
          onConfirm={handleDeleteSite}
          title="Delete Site"
          message={`Are you sure you want to remove site "${siteToDelete.name}"?`}
          confirmText="Delete Site"
          isDestructive={true}
          isLoading={actionLoading}
        />
      )}

      {/* Edit Site Modal */}
      {editSiteModalOpen && siteToEdit && (
        <SiteEditModal
          isOpen={editSiteModalOpen}
          onClose={() => {
            setEditSiteModalOpen(false);
            setSiteToEdit(null);
          }}
          onSubmit={handleUpdateSite}
          site={siteToEdit}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};
