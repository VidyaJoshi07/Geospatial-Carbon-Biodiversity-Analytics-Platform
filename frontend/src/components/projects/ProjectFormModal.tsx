import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Project } from '../../types';

const projectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().optional(),
  project_type: z.enum(['Carbon', 'Biodiversity', 'Mixed']),
  status: z.enum(['Active', 'Draft', 'Completed', 'Archived']),
  total_area: z.number().min(0).optional(),
  carbon_credits: z.number().min(0).optional(),
  biodiversity_score: z.number().min(0).max(100).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  initialData?: Project | null;
  isLoading?: boolean;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      project_type: 'Mixed',
      status: 'Active',
      total_area: 0,
      carbon_credits: 0,
      biodiversity_score: 75,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description || '',
        project_type: initialData.project_type,
        status: initialData.status,
        total_area: initialData.total_area,
        carbon_credits: initialData.carbon_credits,
        biodiversity_score: initialData.biodiversity_score,
      });
    } else {
      reset({
        name: '',
        description: '',
        project_type: 'Mixed',
        status: 'Active',
        total_area: 0,
        carbon_credits: 0,
        biodiversity_score: 75,
      });
    }
  }, [initialData, reset, isOpen]);

  const onFormSubmit = async (data: ProjectFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Conservation Project' : 'Create New Conservation Project'}
      description="Define the baseline ecological scope and governance parameters."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Project Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Project Name <span className="text-emerald-400">*</span>
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="e.g. Serengeti Biodiversity Wildlife Corridor"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
          />
          {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Ecological goals, target biomes, and monitoring methodologies..."
            className="w-full px-3.5 py-2 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm resize-none"
          />
        </div>

        {/* Project Type & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Project Type</label>
            <select
              {...register('project_type')}
              className="w-full px-3 py-2.5 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white focus:outline-none focus:border-emerald-500 text-sm"
            >
              <option value="Carbon">Carbon Sequestration</option>
              <option value="Biodiversity">Biodiversity Habitat</option>
              <option value="Mixed">Mixed Ecological</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Status</label>
            <select
              {...register('status')}
              className="w-full px-3 py-2.5 rounded-xl bg-[#080d0b] border border-[#1f352b] text-white focus:outline-none focus:border-emerald-500 text-sm"
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Completed">Completed</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-[#1f352b]">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {initialData ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
