import React, { useState, useEffect } from 'react';
import { Search, Plus, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getProjectsApi,
  createProjectApi,
  updateProjectApi,
  deleteProjectApi,
} from '../api/projects';
import { Project, PaginationMeta } from '../types';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ProjectTable } from '../components/projects/ProjectTable';
import { ProjectFormModal } from '../components/projects/ProjectFormModal';

export const ProjectsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { success, error } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 1,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProjects = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await getProjectsApi({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        project_type: typeFilter || undefined,
      });
      setProjects(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      error(err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(1);
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
  };

  const handleSaveProject = async (data: any) => {
    setActionLoading(true);
    try {
      if (editingProject) {
        await updateProjectApi(editingProject.id, data);
        success('Project updated successfully');
      } else {
        await createProjectApi(data);
        success('New conservation project created');
      }
      fetchProjects(pagination.page);
    } catch (err: any) {
      error(err.message || 'Failed to save project');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setActionLoading(true);
    try {
      await deleteProjectApi(projectToDelete.id);
      success(`Project "${projectToDelete.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      fetchProjects(1);
    } catch (err: any) {
      error(err.message || 'Failed to delete project');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Conservation Projects</h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Registered ecological restoration reserves, biodiversity zones, and carbon initiatives.
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            onClick={() => {
              setEditingProject(null);
              setFormModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Project
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0f1714] border border-[#1f352b] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project name..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-xs sm:text-sm"
          />
        </form>

        {/* Filters and Clear */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#080d0b] border border-[#1f352b] text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Project Types</option>
            <option value="Carbon">Carbon</option>
            <option value="Biodiversity">Biodiversity</option>
            <option value="Mixed">Mixed</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#080d0b] border border-[#1f352b] text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>

          {(search || statusFilter || typeFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Projects Table or Loading/Empty States */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Try adjusting your filters or search query, or create a new conservation project."
          actionText={isAdmin ? 'Create Project' : undefined}
          onAction={
            isAdmin
              ? () => {
                  setEditingProject(null);
                  setFormModalOpen(true);
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <ProjectTable
            projects={projects}
            isAdmin={isAdmin}
            onEdit={(p) => {
              setEditingProject(p);
              setFormModalOpen(true);
            }}
            onDelete={(p) => {
              setProjectToDelete(p);
              setDeleteDialogOpen(true);
            }}
          />

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-2 text-xs text-gray-400">
            <div>
              Showing {projects.length} of {pagination.total} registered projects
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchProjects(pagination.page - 1)}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>
              <span className="px-2 font-medium text-white">
                {pagination.page} / {pagination.total_pages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => fetchProjects(pagination.page + 1)}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {formModalOpen && (
        <ProjectFormModal
          isOpen={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          onSubmit={handleSaveProject}
          initialData={editingProject}
          isLoading={actionLoading}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && projectToDelete && (
        <ConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setProjectToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Conservation Project"
          message={`Are you sure you want to permanently delete "${projectToDelete.name}"? All associated site polygons and historical telemetry records will be cascade deleted.`}
          confirmText="Delete Project"
          isDestructive={true}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};
