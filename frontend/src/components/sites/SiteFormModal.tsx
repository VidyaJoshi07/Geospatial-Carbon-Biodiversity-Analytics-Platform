import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Project } from '../../types';
import { formatHectares } from '../../utils/formatters';

const siteSchema = z.object({
  project_id: z.number().min(1, 'Please select a project'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().optional(),
  status: z.string().default('Active'),
  carbon_value: z.number().min(0, 'Carbon value cannot be negative'),
  biodiversity_value: z.number().min(0).max(100, 'Score must be 0 to 100'),
  area_hectares: z.number().min(0).optional(),
});

type SiteFormData = z.infer<typeof siteSchema>;

export interface SiteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SiteFormData & { location: any }) => Promise<void>;
  projects: Project[];
  preselectedProjectId?: number;
  initialGeometry?: any;
  initialAreaHa?: number;
  isLoading?: boolean;
}

export const SiteFormModal: React.FC<SiteFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projects,
  preselectedProjectId,
  initialGeometry,
  initialAreaHa,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      project_id: preselectedProjectId || (projects[0]?.id ?? 1),
      name: '',
      description: '',
      status: 'Active',
      carbon_value: 500,
      biodiversity_value: 80,
      area_hectares: initialAreaHa || 0,
    },
  });

  useEffect(() => {
    if (preselectedProjectId) {
      setValue('project_id', preselectedProjectId);
    } else if (projects.length > 0) {
      setValue('project_id', projects[0].id);
    }
    if (initialAreaHa !== undefined) {
      setValue('area_hectares', initialAreaHa);
    }
  }, [preselectedProjectId, initialAreaHa, projects, setValue, isOpen]);

  const onFormSubmit = async (data: SiteFormData) => {
    // Default polygon if none provided (e.g. standard sample polygon around Western Ghats/Amazon)
    const geom = initialGeometry || {
      type: 'Polygon',
      coordinates: [
        [
          [-60.12, -2.98],
          [-60.08, -2.98],
          [-60.08, -3.02],
          [-60.12, -3.02],
          [-60.12, -2.98],
        ],
      ],
    };

    await onSubmit({
      ...data,
      location: geom,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save Conservation Site Polygon"
      description="Register the spatial geometry in PostgreSQL/PostGIS with baseline telemetry."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Parent Project Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Associated Project <span className="text-emerald-400">*</span>
          </label>
          <select
            {...register('project_id', { valueAsNumber: true })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white focus:outline-none focus:border-emerald-500 text-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.project_type})
              </option>
            ))}
          </select>
          {errors.project_id && (
            <p className="text-xs text-rose-400 mt-1">{errors.project_id.message}</p>
          )}
        </div>

        {/* Site Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Site Sector Name <span className="text-emerald-400">*</span>
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="e.g. Central Riparian Restoration Sector"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
          />
          {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">Description</label>
          <textarea
            {...register('description')}
            rows={2}
            placeholder="Vegetation characteristics, soil condition, or target species..."
            className="w-full px-3.5 py-2 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm resize-none"
          />
        </div>

        {/* Area Display (Computed from drawn polygon) */}
        {initialAreaHa !== undefined && initialAreaHa > 0 && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
            <span className="text-emerald-300 font-medium">Computed Geodesic Polygon Area:</span>
            <span className="font-bold text-white text-sm">{formatHectares(initialAreaHa)}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Carbon Value (tCO₂e)
            </label>
            <input
              type="number"
              step="any"
              {...register('carbon_value', { valueAsNumber: true })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Biodiversity Score (0-100)
            </label>
            <input
              type="number"
              step="any"
              {...register('biodiversity_value', { valueAsNumber: true })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-[#1f352b]">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Save to PostGIS
          </Button>
        </div>
      </form>
    </Modal>
  );
};
