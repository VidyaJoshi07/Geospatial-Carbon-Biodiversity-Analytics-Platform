import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import {
  Maximize2,
  Edit3,
  Check,
  RotateCcw,
  BarChart2,
  Globe2,
} from 'lucide-react';
import { GeoJSONFeatureCollection } from '../../types';
import { calculatePolygonAreaHectares, computeBoundsFromCoordinates } from '../../utils/geo';
import { formatHectares, formatCarbon } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface MapViewProps {
  geojsonData: GeoJSONFeatureCollection | null;
  selectedSiteId?: number | null;
  onSelectSite?: (siteId: number | null) => void;
  onPolygonDrawn?: (geometry: any, calculatedAreaHa: number) => void;
  isAdmin?: boolean;
}

// 100% Free, Public, Zero-API-Key Basemaps with NO watermarks
const BASEMAP_STYLES: Record<'dark' | 'satellite' | 'street', maplibregl.StyleSpecification> = {
  dark: {
    version: 8,
    sources: {
      'esri-dark-base': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: 'Tiles &copy; Esri &mdash; Sources: Esri, Garmin, &copy; OpenStreetMap',
        maxzoom: 16,
      },
      'esri-dark-labels': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 16,
      },
    },
    layers: [
      {
        id: 'esri-dark-base-layer',
        type: 'raster',
        source: 'esri-dark-base',
        minzoom: 0,
        maxzoom: 16,
      },
      {
        id: 'esri-dark-labels-layer',
        type: 'raster',
        source: 'esri-dark-labels',
        minzoom: 0,
        maxzoom: 16,
      },
    ],
  },
  satellite: {
    version: 8,
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
        maxzoom: 19,
      },
      'esri-boundaries': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: 'esri-satellite-layer',
        type: 'raster',
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 19,
      },
      {
        id: 'esri-boundaries-layer',
        type: 'raster',
        source: 'esri-boundaries',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  },
  street: {
    version: 8,
    sources: {
      'esri-street': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: 'Tiles &copy; Esri &mdash; Sources: Esri, HERE, Garmin, USGS',
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: 'esri-street-layer',
        type: 'raster',
        source: 'esri-street',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  },
};

export const MapView: React.FC<MapViewProps> = ({
  geojsonData,
  selectedSiteId,
  onSelectSite,
  onPolygonDrawn,
  isAdmin = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const initialFitDoneRef = useRef(false);
  const navigate = useNavigate();

  const [basemap, setBasemap] = useState<'dark' | 'satellite' | 'street'>('dark');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnFeature, setDrawnFeature] = useState<any | null>(null);
  const [drawnArea, setDrawnArea] = useState<number | null>(null);
  const [activePopupSite, setActivePopupSite] = useState<any | null>(null);

  // Filter features based on filterType (Carbon, Biodiversity, Mixed, ALL)
  const filteredGeoJSON = React.useMemo(() => {
    if (!geojsonData) return null;
    if (filterType === 'ALL') return geojsonData;
    return {
      type: 'FeatureCollection' as const,
      features: geojsonData.features.filter(
        (f) => f.properties.project_type?.toUpperCase() === filterType.toUpperCase()
      ),
    };
  }, [geojsonData, filterType]);

  // Helper to attach or update layers to a loaded map style
  const setupLayers = useCallback((map: maplibregl.Map, data: GeoJSONFeatureCollection | null) => {
    const sourceData: any = data || { type: 'FeatureCollection', features: [] };

    if (!map.getSource('sites-source')) {
      map.addSource('sites-source', {
        type: 'geojson',
        data: sourceData,
      });
    } else {
      (map.getSource('sites-source') as maplibregl.GeoJSONSource).setData(sourceData);
    }

    // Reference layer to insert polygon layers under (if available, so labels stay visible)
    const labelLayerId = map.getLayer('esri-dark-labels-layer')
      ? 'esri-dark-labels-layer'
      : map.getLayer('esri-boundaries-layer')
      ? 'esri-boundaries-layer'
      : undefined;

    // Polygon Fill Layer (color-coded by project type)
    if (!map.getLayer('sites-fill')) {
      map.addLayer(
        {
          id: 'sites-fill',
          type: 'fill',
          source: 'sites-source',
          paint: {
            'fill-color': [
              'match',
              ['get', 'project_type'],
              'Carbon',
              '#10b981',
              'Biodiversity',
              '#06b6d4',
              '#3b82f6',
            ],
            'fill-opacity': 0.45,
          },
        },
        labelLayerId
      );
    }

    // Polygon Stroke Layer
    if (!map.getLayer('sites-stroke')) {
      map.addLayer(
        {
          id: 'sites-stroke',
          type: 'line',
          source: 'sites-source',
          paint: {
            'line-color': [
              'match',
              ['get', 'project_type'],
              'Carbon',
              '#34d399',
              'Biodiversity',
              '#22d3ee',
              '#60a5fa',
            ],
            'line-width': 2.5,
          },
        },
        labelLayerId
      );
    }

    // Selected Site Highlight Layer
    if (!map.getLayer('sites-highlight')) {
      map.addLayer(
        {
          id: 'sites-highlight',
          type: 'line',
          source: 'sites-source',
          filter: ['==', ['id'], selectedSiteId ?? -1],
          paint: {
            'line-color': '#f59e0b',
            'line-width': 4.5,
          },
        },
        labelLayerId
      );
    }
  }, [selectedSiteId]);

  // Fit bounds helper
  const fitAllSites = useCallback(() => {
    const map = mapRef.current;
    if (!map || !filteredGeoJSON || filteredGeoJSON.features.length === 0) return;

    // If specific site selected, zoom directly to it
    if (selectedSiteId) {
      const selectedFeat = filteredGeoJSON.features.find((f) => f.id === selectedSiteId);
      if (selectedFeat && selectedFeat.geometry?.type === 'Polygon') {
        const coords = (selectedFeat.geometry as any).coordinates[0];
        const bounds = computeBoundsFromCoordinates(coords);
        if (bounds) {
          map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 1200 });
          return;
        }
      }
    }

    const allCoords: number[][] = [];
    for (const f of filteredGeoJSON.features) {
      if (f.geometry?.type === 'Polygon') {
        allCoords.push(...(f.geometry as any).coordinates[0]);
      }
    }

    const bounds = computeBoundsFromCoordinates(allCoords);
    if (!bounds) return;

    map.fitBounds(bounds, { padding: 70, maxZoom: 10, duration: 1500 });
  }, [filteredGeoJSON, selectedSiteId]);

  /* =========================================================================
   * MAPLIBRE GL INITIALIZATION
   * ========================================================================= */
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLES[basemap],
      center: [0.0, 20.0],
      zoom: 2,
    });

    mapRef.current = map;

    // Navigation Controls (Zoom & Compass)
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');

    // Setup Mapbox Draw for polygon boundary demarcation
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: false,
        trash: false,
      },
      defaultMode: 'simple_select',
    });
    map.addControl(draw as any, 'top-left');
    drawRef.current = draw;

    const handleDrawChange = () => {
      const data = draw.getAll();
      if (data && data.features && data.features.length > 0) {
        const feat = data.features[data.features.length - 1];
        if (feat.geometry.type === 'Polygon') {
          const coords = (feat.geometry as any).coordinates[0];
          if (coords && coords.length >= 4) {
            const areaHa = calculatePolygonAreaHectares(coords);
            setDrawnArea(areaHa);
            setDrawnFeature(feat);
          }
        }
      }
    };

    (map as any).on('draw.create', handleDrawChange);
    (map as any).on('draw.update', handleDrawChange);
    (map as any).on('draw.delete', () => {
      setDrawnArea(null);
      setDrawnFeature(null);
    });

    map.on('load', () => {
      map.resize();
      setupLayers(map, filteredGeoJSON);

      // Auto-fit bounds on initial load if sites exist
      if (!initialFitDoneRef.current && filteredGeoJSON && filteredGeoJSON.features.length > 0) {
        initialFitDoneRef.current = true;
        setTimeout(() => fitAllSites(), 300);
      }
    });

    // Resilient global click handler for sites polygon features
    map.on('click', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['sites-fill'] });
      if (!features || features.length === 0) return;

      const feat = features[0];
      const props = feat.properties as any;
      const siteId = (feat.id as number) || props?.id;

      if (map.getLayer('sites-highlight')) {
        map.setFilter('sites-highlight', ['==', ['id'], siteId]);
      }

      if (onSelectSite) onSelectSite(siteId);

      setActivePopupSite({
        id: siteId,
        name: props.name,
        description: props.description,
        project_id: props.project_id,
        project_name: props.project_name,
        project_type: props.project_type,
        area_hectares: Number(props.area_hectares),
        carbon_value: Number(props.carbon_value),
        biodiversity_value: Number(props.biodiversity_value),
        status: props.status,
      });
    });

    // Hover pointer cursor over polygons
    map.on('mousemove', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['sites-fill'] });
      map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : '';
    });

    const handleWindowResize = () => {
      map.resize();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
    };
  }, []);

  // Update GeoJSON source data when filteredGeoJSON changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.isStyleLoaded()) {
      const source = map.getSource('sites-source') as maplibregl.GeoJSONSource;
      if (source) {
        source.setData((filteredGeoJSON as any) || { type: 'FeatureCollection', features: [] });
      } else {
        setupLayers(map, filteredGeoJSON);
      }
    } else {
      map.once('style.load', () => {
        setupLayers(map, filteredGeoJSON);
      });
    }

    // Fit bounds when data arrives
    if (filteredGeoJSON && filteredGeoJSON.features.length > 0 && !initialFitDoneRef.current) {
      initialFitDoneRef.current = true;
      setTimeout(() => fitAllSites(), 200);
    }
  }, [filteredGeoJSON, setupLayers, fitAllSites]);

  // Update highlight layer when selectedSiteId changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.isStyleLoaded() && map.getLayer('sites-highlight')) {
      map.setFilter('sites-highlight', ['==', ['id'], selectedSiteId ?? -1]);
    }

    // Auto-center on selected site if provided
    if (selectedSiteId && filteredGeoJSON) {
      const selectedFeat = filteredGeoJSON.features.find((f) => f.id === selectedSiteId);
      if (selectedFeat && selectedFeat.geometry?.type === 'Polygon') {
        const coords = (selectedFeat.geometry as any).coordinates[0];
        const bounds = computeBoundsFromCoordinates(coords);
        if (bounds) {
          map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 1000 });
        }
      }
    }
  }, [selectedSiteId, filteredGeoJSON]);

  // Handle Basemap Switcher (Dark / Satellite / Street)
  const handleBasemapChange = (mode: 'dark' | 'satellite' | 'street') => {
    setBasemap(mode);
    const map = mapRef.current;
    if (!map) return;

    map.setStyle(BASEMAP_STYLES[mode]);
    map.once('style.load', () => {
      setupLayers(map, filteredGeoJSON);
    });
  };

  // Drawing Controls
  const startDraw = () => {
    setIsDrawing(true);
    setDrawnArea(null);
    setDrawnFeature(null);

    if (drawRef.current) {
      drawRef.current.deleteAll();
      drawRef.current.changeMode('draw_polygon');
    }
  };

  const finishDraw = () => {
    if (!drawnFeature) return;
    const coords = (drawnFeature.geometry as any).coordinates[0];
    const ha = calculatePolygonAreaHectares(coords);

    const geojsonPolygon = {
      type: 'Polygon',
      coordinates: (drawnFeature.geometry as any).coordinates,
    };

    if (onPolygonDrawn) {
      onPolygonDrawn(geojsonPolygon, ha);
    }

    if (drawRef.current) {
      drawRef.current.deleteAll();
      drawRef.current.changeMode('simple_select');
    }
    setIsDrawing(false);
    setDrawnFeature(null);
    setDrawnArea(null);
  };

  const cancelDraw = () => {
    if (drawRef.current) {
      drawRef.current.deleteAll();
      drawRef.current.changeMode('simple_select');
    }
    setIsDrawing(false);
    setDrawnFeature(null);
    setDrawnArea(null);
  };

  return (
    <div className="relative w-full h-[650px] lg:h-[750px] rounded-3xl overflow-hidden border border-[#1f352b] bg-[#0a110e] shadow-2xl">
      {/* Map Target Canvas Container */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Top Filter & Control Bar */}
      <div className="absolute top-4 right-4 z-20 flex flex-wrap items-center gap-2 bg-[#0b1410]/95 backdrop-blur-md p-2 rounded-2xl border border-[#1f352b] shadow-xl">
        {/* Filter Pills */}
        <div className="flex items-center space-x-1">
          {['ALL', 'Carbon', 'Biodiversity', 'Mixed'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterType === type
                  ? 'bg-emerald-500 text-black font-semibold shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-white/10 mx-1" />

        {/* Basemap Switcher (Dark / Satellite / Street) */}
        <div className="flex items-center space-x-1 bg-[#070e0a] p-0.5 rounded-xl border border-white/5">
          <button
            onClick={() => handleBasemapChange('dark')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              basemap === 'dark'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
            title="ESRI Dark Canvas"
          >
            Dark
          </button>
          <button
            onClick={() => handleBasemapChange('satellite')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              basemap === 'satellite'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
            title="ESRI World Imagery"
          >
            Satellite
          </button>
          <button
            onClick={() => handleBasemapChange('street')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              basemap === 'street'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
            title="ESRI Streets"
          >
            Street
          </button>
        </div>

        {/* Fit Bounds Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={fitAllSites}
          leftIcon={<Maximize2 className="w-3.5 h-3.5" />}
        >
          Fit Sites
        </Button>

        {/* Draw Polygon Action */}
        {isAdmin && !isDrawing && (
          <Button
            variant="primary"
            size="sm"
            onClick={startDraw}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
          >
            Draw Site Polygon
          </Button>
        )}
      </div>

      {/* Subtle Basemap Status Badge */}
      <div className="absolute top-4 left-4 z-20 hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0b1410]/90 backdrop-blur-md border border-[#1f352b] text-[11px] text-gray-400 shadow-md">
        <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>
          {basemap === 'satellite'
            ? 'ESRI World Imagery (Satellite)'
            : basemap === 'street'
            ? 'ESRI Street Map'
            : 'ESRI Dark Gray Canvas'}
        </span>
      </div>

      {/* Active Drawing Banner */}
      {isDrawing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-3 bg-[#0a1510]/95 backdrop-blur-lg px-5 py-3 rounded-2xl border border-emerald-500/40 shadow-2xl shadow-emerald-950/60">
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>
              {drawnFeature
                ? 'Polygon closed! Adjust vertices or click Save Site.'
                : 'Click on map to place polygon corners. Click first point to close.'}
            </span>
          </div>

          {drawnArea !== null && drawnArea > 0 && (
            <div className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-white">
              Area: {formatHectares(drawnArea)}
            </div>
          )}

          <div className="flex items-center space-x-2 pl-2 border-l border-white/10">
            <Button
              variant="primary"
              size="sm"
              onClick={finishDraw}
              disabled={!drawnFeature || drawnArea === null}
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              Save Site
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelDraw}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Selected Site Details Popup Card */}
      {activePopupSite && (
        <div className="absolute bottom-6 left-6 z-20 w-80 sm:w-96 bg-[#0c1612]/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-5 shadow-2xl shadow-black/80 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                {activePopupSite.project_name || 'Conservation Site'}
              </span>
              <h4 className="text-base font-bold text-white mt-0.5">{activePopupSite.name}</h4>
            </div>
            <button
              onClick={() => setActivePopupSite(null)}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
            >
              &times;
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-[#070e0a] border border-[#192b23]">
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-medium">Area</div>
              <div className="text-xs font-bold text-white mt-0.5">
                {formatHectares(activePopupSite.area_hectares)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-medium">Carbon</div>
              <div className="text-xs font-bold text-emerald-400 mt-0.5">
                {formatCarbon(activePopupSite.carbon_value)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-medium">Biodiversity</div>
              <div className="text-xs font-bold text-cyan-400 mt-0.5">
                {activePopupSite.biodiversity_value} / 100
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/10">
            <Badge variant="emerald" size="sm">
              {activePopupSite.status}
            </Badge>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/sites/${activePopupSite.id}/analytics`)}
              rightIcon={<BarChart2 className="w-3.5 h-3.5" />}
            >
              View Analytics
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
