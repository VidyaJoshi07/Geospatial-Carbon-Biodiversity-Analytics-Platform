import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit2, Trash2, MapPin } from 'lucide-react';
import { Project } from '../../types';
import { formatHectares, formatCarbon, formatDate } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface ProjectTableProps {
  projects: Project[];
  isAdmin?: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  isAdmin = false,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

  const getTypeBadgeVariant = (type: string) => {
    if (type === 'Carbon') return 'emerald';
    if (type === 'Biodiversity') return 'cyan';
    return 'purple';
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === 'Active') return 'emerald';
    if (status === 'Draft') return 'amber';
    if (status === 'Completed') return 'cyan';
    return 'slate';
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[#1f352b] bg-[#0c1411]">
      <table className="w-full text-left text-sm border-collapse min-w-[850px]">
        <thead>
          <tr className="border-b border-[#1f352b] bg-[#080d0b] text-xs uppercase font-semibold text-gray-400">
            <th className="py-3.5 px-4">Project Name</th>
            <th className="py-3.5 px-4">Type</th>
            <th className="py-3.5 px-4 text-center">Sites</th>
            <th className="py-3.5 px-4 text-right">Total Area</th>
            <th className="py-3.5 px-4 text-right">Carbon</th>
            <th className="py-3.5 px-4 text-right">Biodiversity</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Created</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#182821]">
          {projects.map((project) => (
            <tr
              key={project.id}
              className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              {/* Project Name */}
              <td className="py-4 px-4">
                <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  {project.name}
                </div>
                {project.description && (
                  <div className="text-xs text-gray-400 truncate max-w-xs mt-0.5">
                    {project.description}
                  </div>
                )}
              </td>

              {/* Type */}
              <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                <Badge variant={getTypeBadgeVariant(project.project_type)} size="sm">
                  {project.project_type}
                </Badge>
              </td>

              {/* Sites Count */}
              <td className="py-4 px-4 text-center font-medium text-gray-300">
                <div className="inline-flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{project.site_count || 0}</span>
                </div>
              </td>

              {/* Area */}
              <td className="py-4 px-4 text-right font-medium text-gray-200">
                {formatHectares(project.total_area)}
              </td>

              {/* Carbon */}
              <td className="py-4 px-4 text-right font-medium text-emerald-400">
                {formatCarbon(project.carbon_credits)}
              </td>

              {/* Biodiversity */}
              <td className="py-4 px-4 text-right font-medium text-cyan-400">
                {project.biodiversity_score} <span className="text-xs text-gray-400">/ 100</span>
              </td>

              {/* Status */}
              <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                <Badge variant={getStatusBadgeVariant(project.status)} size="sm">
                  {project.status}
                </Badge>
              </td>

              {/* Created Date */}
              <td className="py-4 px-4 text-xs text-gray-400">{formatDate(project.created_at)}</td>

              {/* Actions */}
              <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end space-x-1">
                  <button
                    title="View Project"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {isAdmin && onEdit && (
                    <button
                      title="Edit Project"
                      onClick={() => onEdit(project)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {isAdmin && onDelete && (
                    <button
                      title="Delete Project"
                      onClick={() => onDelete(project)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
