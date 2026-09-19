import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Site } from '../../types';
import { formatHectares } from '../../utils/formatters';

const editSiteSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().optional(),
  status: z.string().default('Active'),
  carbon_value: z.number().min(0, 'Carbon value cannot be negative'),
  biodiversity_value: z.number().min(0).max(100, 'Score must be 0 to 100'),
  area_hectares: z.number().min(0).optional(),
});

type EditSiteFormData = z.infer<typeof editSiteSchema>;

export interface SiteEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditSiteFormData) => Promise<void>;
  site: Site | null;
  isLoading?: boolean;
}

export const SiteEditModal: React.FC<SiteEditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  site,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditSiteFormData>({
    resolver: zodResolver(editSiteSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'Active',
      carbon_value: 0,
      biodiversity_value: 0,
      area_hectares: 0,
    },
  });

  useEffect(() => {
    if (site) {
      reset({
        name: site.name,
        description: site.description || '',
        status: site.status || 'Active',
        carbon_value: site.carbon_value,
        biodiversity_value: site.biodiversity_value,
        area_hectares: site.area_hectares,
      });
    }
  }, [site, reset, isOpen]);

  const onFormSubmit = async (data: EditSiteFormData) => {
    await onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Site: ${site?.name || ''}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {site && (
          <div className="p-3 rounded-xl bg-[#080d0b] border border-[#1f352b] flex items-center justify-between text-xs">
            <span className="text-gray-400">Associated Project:</span>
            <span className="text-emerald-400 font-semibold">{site.project_name || 'Project #' + site.project_id}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
            Site Name *
          </label>
          <input
            {...register('name')}
            type="text"
            className="w-full px-3.5 py-2 rounded-xl bg-[#0a110e] border border-[#1f352b] text-white text-sm focus:outline-none focus:border-emerald-500"
          />
          {errors.name && (
            <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={2}
            className="w-full px-3.5 py-2 rounded-xl bg-[#0a110e] border border-[#1f352b] text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
              Status
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 rounded-xl bg-[#0a110e] border border-[#1f352b] text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="Active">Active</option>
              <option value="Restoration">Restoration</option>
              <option value="Monitoring">Monitoring</option>
              <option value="Verified">Verified</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
              Area (Hectares)
            </label>
            <input
              {...register('area_hectares', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className="w-full px-3.5 py-2 rounded-xl bg-[#0a110e] border border-[#1f352b] text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
              Carbon (tCO2e)
            </label>
            <input
              {...register('carbon_value', { valueAsNumber: true })}
              type="number"
              step="0.1"
              className="w-full px-3.5 py-2 rounded-xl bg-[#0a110e] border border-[#1f352b] text-white text-sm focus:outline-none focus:border-emerald-500"
            />
            {errors.carbon_value && (
              <p className="text-rose-400 text-xs mt-1">{errors.carbon_value.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
              Biodiversity Score (0-100)
            </label>
            <input
              {...register('biodiversity_value', { valueAsNumber: true })}
              type="number"
              step="1"
              className="w-full px-3.5 py-2 rounded-xl bg-[#0a110e] border border-[#1f352b] text-white text-sm focus:outline-none focus:border-emerald-500"
            />
            {errors.biodiversity_value && (
              <p className="text-rose-400 text-xs mt-1">{errors.biodiversity_value.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#1f352b]">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
