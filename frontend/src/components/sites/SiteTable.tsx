import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, MapPin, Trash2, Edit2 } from 'lucide-react';
import { Site } from '../../types';
import { formatHectares, formatCarbon, formatDate } from '../../utils/formatters';
import { Badge } from '../ui/Badge';

export interface SiteTableProps {
  sites: Site[];
  isAdmin?: boolean;
  onEdit?: (site: Site) => void;
  onDelete?: (site: Site) => void;
}

export const SiteTable: React.FC<SiteTableProps> = ({
  sites,
  isAdmin = false,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[#1f352b] bg-[#0c1411]">
      <table className="w-full text-left text-sm border-collapse min-w-[750px]">
        <thead>
          <tr className="border-b border-[#1f352b] bg-[#080d0b] text-xs uppercase font-semibold text-gray-400">
            <th className="py-3.5 px-4">Site Name</th>
            <th className="py-3.5 px-4">Project</th>
            <th className="py-3.5 px-4 text-right">Area</th>
            <th className="py-3.5 px-4 text-right">Carbon</th>
            <th className="py-3.5 px-4 text-right">Biodiversity</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Created</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#182821]">
          {sites.map((site) => (
            <tr
              key={site.id}
              className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
              onClick={() => navigate(`/sites/${site.id}`)}
            >
              {/* Site Name */}
              <td className="py-4 px-4">
                <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{site.name}</span>
                </div>
                {site.description && (
                  <div className="text-xs text-gray-400 truncate max-w-xs mt-0.5">
                    {site.description}
                  </div>
                )}
              </td>

              {/* Project */}
              <td className="py-4 px-4 text-gray-300 font-medium">{site.project_name || '-'}</td>

              {/* Area */}
              <td className="py-4 px-4 text-right font-medium text-gray-200">
                {formatHectares(site.area_hectares)}
              </td>

              {/* Carbon */}
              <td className="py-4 px-4 text-right font-medium text-emerald-400">
                {formatCarbon(site.carbon_value)}
              </td>

              {/* Biodiversity */}
              <td className="py-4 px-4 text-right font-medium text-cyan-400">
                {site.biodiversity_value} <span className="text-xs text-gray-400">/ 100</span>
              </td>

              {/* Status */}
              <td className="py-4 px-4">
                <Badge variant="emerald" size="sm">
                  {site.status}
                </Badge>
              </td>

              {/* Created */}
              <td className="py-4 px-4 text-xs text-gray-400">{formatDate(site.created_at)}</td>

              {/* Actions */}
              <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end space-x-1">
                  <button
                    title="View Site Details"
                    onClick={() => navigate(`/sites/${site.id}`)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </button>
                  {isAdmin && onEdit && (
                    <button
                      title="Edit Site Metadata"
                      onClick={() => onEdit(site)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-teal-400 hover:bg-teal-500/10 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {isAdmin && onDelete && (
                    <button
                      title="Delete Site"
                      onClick={() => onDelete(site)}
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
