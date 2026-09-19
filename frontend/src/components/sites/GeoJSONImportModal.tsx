import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Project } from '../../types';
import { createSiteFromGeoJSONApi } from '../../api/sites';
import { useToast } from '../../context/ToastContext';

export interface GeoJSONImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projects: Project[];
}

export const GeoJSONImportModal: React.FC<GeoJSONImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projects,
}) => {
  const { success, error } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<number>(() => projects[0]?.id || 1);
  const [siteName, setSiteName] = useState('');
  const [rawGeoJSON, setRawGeoJSON] = useState('');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedFeature, setParsedFeature] = useState<any | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawGeoJSON(text);
      validateAndParse(text);
    };
    reader.readAsText(file);
  };

  const validateAndParse = (jsonString: string) => {
    setValidationError(null);
    try {
      const parsed = JSON.parse(jsonString);
      let feature: any = null;

      if (parsed.type === 'Feature') {
        feature = parsed;
      } else if (parsed.type === 'FeatureCollection' && parsed.features?.length > 0) {
        feature = parsed.features[0];
      } else if (parsed.type === 'Polygon' || parsed.type === 'MultiPolygon') {
        feature = {
          type: 'Feature',
          geometry: parsed,
          properties: {},
        };
      } else {
        throw new Error('Unrecognized GeoJSON structure. Must be Feature, FeatureCollection, or Polygon.');
      }

      setParsedFeature(feature);
      if (!siteName && feature.properties?.name) {
        setSiteName(feature.properties.name);
      }
    } catch (err: any) {
      setValidationError(err.message || 'Invalid JSON syntax');
      setParsedFeature(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedFeature) {
      setValidationError('Please upload or paste valid GeoJSON geometry');
      return;
    }

    setIsLoading(true);
    try {
      // Ensure feature properties has project_id and name
      const payloadFeature = {
        ...parsedFeature,
        properties: {
          ...parsedFeature.properties,
          project_id: selectedProjectId,
          name: siteName.trim() || parsedFeature.properties?.name || 'Imported GIS Sector',
          carbon_value: parsedFeature.properties?.carbon_value || 850.0,
          biodiversity_value: parsedFeature.properties?.biodiversity_value || 85.0,
          status: parsedFeature.properties?.status || 'Active',
        },
      };

      await createSiteFromGeoJSONApi(payloadFeature);
      success(`Site "${payloadFeature.properties.name}" imported and persisted to PostGIS!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to import GeoJSON site');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import GeoJSON Feature into PostGIS"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Target */}
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
            Target Project *
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-[#0a110e] border border-[#1f352b] text-white text-sm focus:outline-none focus:border-emerald-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.project_type})
              </option>
            ))}
          </select>
        </div>

        {/* Site Name */}
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
            Site Label
          </label>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="e.g. Amazon Parcel Sector B"
            className="w-full px-3.5 py-2 rounded-xl bg-[#0a110e] border border-[#1f352b] text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* File Upload Drop Area */}
        <div className="border-2 border-dashed border-[#1f352b] hover:border-emerald-500/50 rounded-2xl p-6 text-center transition-colors bg-[#080d0b]">
          <input
            type="file"
            id="geojson-file-input"
            accept=".geojson,.json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="geojson-file-input" className="cursor-pointer block">
            <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80 hover:opacity-100 transition-opacity" />
            <span className="text-sm font-semibold text-white">
              {fileName ? fileName : 'Upload .geojson or .json file'}
            </span>
            <span className="block text-xs text-gray-500 mt-1">
              Supports WGS84 GeoJSON Polygons and MultiPolygons
            </span>
          </label>
        </div>

        {/* Or Paste Raw JSON */}
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
            Or Paste Raw GeoJSON
          </label>
          <textarea
            value={rawGeoJSON}
            onChange={(e) => {
              setRawGeoJSON(e.target.value);
              validateAndParse(e.target.value);
            }}
            rows={4}
            placeholder='{"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [...]}}'
            className="w-full px-3.5 py-2 font-mono text-xs rounded-xl bg-[#0a110e] border border-[#1f352b] text-emerald-300 focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        {/* Validation Feedback */}
        {validationError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {parsedFeature && !validationError && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Valid GeoJSON {parsedFeature.geometry?.type || 'Geometry'} detected!</span>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#1f352b]">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isLoading}
            disabled={!parsedFeature || !!validationError}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Import to PostGIS
          </Button>
        </div>
      </form>
    </Modal>
  );
};
