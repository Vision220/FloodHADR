import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  ScaleControl,
  Popup,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { Feature } from 'geojson';
import { useApp } from '../../context/AppContext';
import type { MapStyleMode } from '../../types/digitalTwin3dTypes';
import { getMapProvider } from '../../config/mapProviders';
import {
  sampleStudyAreaGeoJSON,
  sampleRiverGeoJSON,
  sampleDamGeoJSON,
  sampleFloodDepthGeoJSON,
  sampleVelocityVectorsGeoJSON,
  sampleArrivalIsochronesGeoJSON,
  sampleInfrastructureGeoJSON,
  sampleRoadsGeoJSON,
} from '../../data/gisSampleData';
import {
  Search,
  Compass,
  Layers,
  Sliders,
  RotateCcw,
} from 'lucide-react';

export type LayerMode = 'inundation' | 'depth' | 'velocity' | 'arrival';

// Custom Dam Icon
const createDamIcon = () => {
  return L.divIcon({
    className: 'custom-dam-marker-gis',
    html: `<div style="background-color: #0f172a; color: #38bdf8; border: 2.5px solid #38bdf8; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.4);">
      🌊
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

// Custom Location Inspector Pin Icon
const createInspectIcon = () => {
  return L.divIcon({
    className: 'custom-inspect-marker-gis',
    html: `<div style="background-color: #dc2626; color: #ffffff; border: 2px solid #ffffff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; box-shadow: 0 2px 10px rgba(220, 38, 38, 0.6); animation: pulse 1.5s infinite;">
      📍
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// Coordinate Tracker Helper Component
const CoordinateTracker: React.FC<{ onMouseMove: (lat: number, lng: number) => void }> = ({ onMouseMove }) => {
  useMapEvents({
    mousemove(e) {
      onMouseMove(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Map Click Inspector Handler Component
interface InspectionData {
  lat: number;
  lng: number;
  depthM: number;
  velocityMs: number;
  arrivalTimeHr: number;
  elevationM: number;
}

const MapClickInspector: React.FC<{ onInspect: (data: InspectionData) => void }> = ({ onInspect }) => {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      
      // Calculate distance in km from Tehri Dam origin (30.3781, 78.4802)
      const damLat = 30.3781;
      const damLng = 78.4802;
      const dLat = (lat - damLat) * 111.0;
      const dLng = (lng - damLng) * 111.0 * Math.cos((damLat * Math.PI) / 180);
      const distKm = Math.sqrt(dLat * dLat + dLng * dLng);

      // Hydrodynamic spatial estimates based on distance from dam
      const depthM = Math.max(0.1, Number((14.6 * Math.exp(-distKm / 20.0)).toFixed(1)));
      const velocityMs = Math.max(0.2, Number((8.4 * Math.exp(-distKm / 25.0)).toFixed(1)));
      const arrivalTimeHr = Number((0.2 + distKm * 0.12).toFixed(1));
      const elevationM = Math.round(420.0 - distKm * 3.5 + (Math.sin(lat * 100) * 15.0));

      onInspect({
        lat,
        lng,
        depthM,
        velocityMs,
        arrivalTimeHr,
        elevationM,
      });
    },
  });
  return null;
};

// Programmatic Map Controller for FlyTo / Reset View
const MapController: React.FC<{ center: [number, number]; zoom: number; resetToken: number }> = ({ center, zoom, resetToken }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, resetToken, map]);
  return null;
};

interface GISMapModuleProps {
  height?: string;
  showControls?: boolean;
  activeDemId?: string;
}

export const GISMapModule: React.FC<GISMapModuleProps> = ({
  height = '100%',
  showControls = true,
  activeDemId = 'dem-tehri-default',
}) => {
  const { selectedStudyArea, currentTimeStep, setCurrentTimeStep, isSimulating } = useApp();
  
  // Interactive state
  const [basemapMode, setBasemapMode] = useState<MapStyleMode>('HYBRID');
  const [activeLayer, setActiveLayer] = useState<LayerMode>('depth');
  const [opacity, setOpacity] = useState<number>(0.75);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: selectedStudyArea.lat, lng: selectedStudyArea.lng });
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const mapProvider = getMapProvider(basemapMode);
  
  const [mapCenter, setMapCenter] = useState<[number, number]>([selectedStudyArea.lat, selectedStudyArea.lng]);
  const [mapZoom, setMapZoom] = useState<number>(10);
  const [resetToken, setResetToken] = useState<number>(0);
  
  // Clicked Location Inspection State
  const [clickedLocation, setClickedLocation] = useState<InspectionData | null>(null);

  useEffect(() => {
    // Active DEM selection
    if (activeDemId) {
      console.log("Using active DEM ID:", activeDemId);
    }
  }, [activeDemId]);

  // Timestep animation loop
  useEffect(() => {
    let interval: any = null;
    if (isSimulating) {
      interval = setInterval(() => {
        setCurrentTimeStep(currentTimeStep >= 72 ? 0 : currentTimeStep + 1);
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating, currentTimeStep, setCurrentTimeStep]);

  // Reset View Handler
  const handleResetView = () => {
    setMapCenter([selectedStudyArea.lat, selectedStudyArea.lng]);
    setMapZoom(10);
    setResetToken((prev) => prev + 1);
  };

  // Search locations dictionary
  const locations: Record<string, [number, number]> = {
    tehri: [30.3781, 78.4802],
    devprayag: [30.1458, 78.5986],
    rishikesh: [30.0869, 78.2676],
    koteshwar: [30.2780, 78.4980],
    shivpuri: [30.1380, 78.3880],
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const key = searchQuery.trim().toLowerCase();
    if (locations[key]) {
      setMapCenter(locations[key]);
      setMapZoom(12);
      setResetToken((prev) => prev + 1);
    } else if (key.includes('dam') || key.includes('tehri')) {
      setMapCenter([30.3781, 78.4802]);
      setMapZoom(12);
      setResetToken((prev) => prev + 1);
    } else if (key.includes('rishikesh')) {
      setMapCenter([30.0869, 78.2676]);
      setMapZoom(13);
      setResetToken((prev) => prev + 1);
    }
  };

  const styleInundationMask = () => ({
    fillColor: '#0284c7',
    weight: 2,
    opacity: opacity,
    color: '#0369a1',
    fillOpacity: opacity * 0.6,
  });

  const styleFloodDepth = (feature: Feature | undefined) => {
    if (!feature || !feature.properties) return {};
    const color = feature.properties.color || '#38bdf8';
    return {
      fillColor: color,
      weight: 2,
      opacity: opacity,
      color: color,
      fillOpacity: opacity * 0.7,
    };
  };

  const styleVelocityVectors = (feature: Feature | undefined) => {
    const v = feature?.properties?.velocityMs || 5.0;
    const color = v > 7.0 ? '#0f766e' : v > 4.0 ? '#0d9488' : '#06b6d4';
    return {
      color: color,
      weight: Math.max(2, Math.min(6, Math.round(v / 1.5))),
      dashArray: '5, 5',
      opacity: opacity * 0.9,
    };
  };

  const styleArrivalIsochrones = (feature: Feature | undefined) => {
    const t = feature?.properties?.arrivalTimeHr || 1.0;
    const color = t < 1.0 ? '#ef4444' : t < 2.5 ? '#f97316' : t < 4.0 ? '#eab308' : '#10b981';
    return {
      color: color,
      weight: 2,
      dashArray: '3, 3',
      fillColor: color,
      fillOpacity: opacity * 0.5,
    };
  };

  const styleRiver = () => ({
    color: '#0284c7',
    weight: 4,
    opacity: 0.9,
  });

  const styleStudyArea = () => ({
    color: '#0f172a',
    weight: 2,
    dashArray: '6, 6',
    fillColor: '#94a3b8',
    fillOpacity: 0.08,
  });

  const styleRoads = (feature: Feature | undefined) => {
    const isBlocked = feature?.properties?.status?.includes('Blocked');
    return {
      color: isBlocked ? '#dc2626' : '#475569',
      weight: 3,
      dashArray: isBlocked ? '5, 5' : undefined,
      opacity: 0.8,
    };
  };

  const onEachFloodDepthFeature = (feature: Feature, layer: L.Layer) => {
    const props = feature.properties;
    if (props) {
      const popupContent = `
        <div style="font-family: Inter, sans-serif; padding: 4px; min-width: 195px;">
          <div style="font-weight: 800; color: #0f172a; font-size: 13px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
            ${props.zoneName || 'Hydrodynamic Zone'}
          </div>
          <div style="font-size: 11px; color: #334155; line-height: 1.6;">
            <div><strong>Flood Depth:</strong> <span style="font-weight: 700; color: #dc2626;">${props.depthM} m</span></div>
            <div><strong>Flow Velocity:</strong> <span style="font-weight: 700; color: #0284c7;">${props.velocityMs} m/s</span></div>
            <div><strong>Arrival Time:</strong> <span style="font-weight: 700; color: #0d9488;">${props.arrivalTimeHr} hours</span></div>
            <div><strong>Terrain Elevation:</strong> <span style="font-weight: 700; color: #475569;">420 m MSL</span></div>
            <div style="margin-top: 6px;">
              <span style="background-color: ${props.color}; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 10px;">
                ${props.riskLevel}
              </span>
            </div>
          </div>
        </div>
      `;
      layer.bindPopup(popupContent);
    }
  };

  const onEachDamFeature = (feature: Feature, layer: L.Layer) => {
    const props = feature.properties;
    if (props) {
      const popupContent = `
        <div style="font-family: Inter, sans-serif; padding: 4px; min-width: 210px;">
          <div style="font-weight: 800; color: #0369a1; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
            🌊 ${props.name}
          </div>
          <div style="font-size: 11px; color: #334155; line-height: 1.6;">
            <div><strong>River Basin:</strong> ${props.river}</div>
            <div><strong>Reservoir Water Level:</strong> ${props.reservoirLevel}</div>
            <div><strong>Dam Crest Height:</strong> ${props.height}</div>
            <div><strong>Breach Width:</strong> ${props.breachWidth}</div>
            <div><strong>Active Scenario:</strong> ${props.currentScenario}</div>
            <div style="margin-top: 6px; padding: 4px; background: #f0f9ff; border-radius: 4px; border: 1px solid #bae6fd; font-weight: 600; color: #0369a1;">
              Spillway Rating: ${props.spillwayCapacity}
            </div>
          </div>
        </div>
      `;
      layer.bindPopup(popupContent);
    }
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-slate-300 shadow-panel bg-slate-100" style={{ height }}>
      {/* Top Toolbar */}
      {showControls && (
        <div className="absolute top-3 left-14 z-[1000] flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="bg-white/95 backdrop-blur border border-slate-300 rounded-md p-1.5 shadow-md flex items-center space-x-1.5 text-xs">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search Tehri, Rishikesh, Devprayag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded font-medium text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 w-48"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded font-bold text-xs shadow-sm transition-all"
            >
              Locate
            </button>
          </form>

          {/* Map Style Provider Switcher Buttons */}
          <div className="bg-slate-900/90 text-white backdrop-blur border border-slate-700 rounded-md p-1 shadow-md flex items-center space-x-1 text-xs font-mono font-bold">
            <span className="text-slate-400 px-1 text-[10px]">BASE MAP:</span>
            {(['HYBRID', 'SATELLITE', 'ROADMAP', 'TERRAIN'] as MapStyleMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setBasemapMode(mode)}
                className={`px-2 py-0.5 rounded text-[10px] transition-all cursor-pointer ${
                  basemapMode === mode
                    ? 'bg-sky-500 text-slate-950 font-extrabold shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Reset View Button */}
          <button
            onClick={handleResetView}
            className="bg-white/95 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-md px-3 py-2 shadow-md text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Reset Map Bounds to Dam Breach Origin"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
            <span>Reset View</span>
          </button>
        </div>
      )}

      {/* Layer Switcher & Opacity Controls Floating Panel */}
      <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 text-slate-100 backdrop-blur border border-slate-800 rounded-lg p-3 shadow-xl max-w-xs space-y-2.5 text-xs">
        {/* Missing API Key Warning Notification */}
        {mapProvider.requiresApiKey && !import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
          <div className="p-1.5 bg-amber-950/80 border border-amber-600/60 text-amber-300 rounded text-[10px] font-mono">
            Google Satellite unavailable — configure API key (ESRI Hybrid active)
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <div className="flex items-center space-x-1.5 font-bold text-sky-400">
            <Layers className="w-4 h-4" />
            <span>Flood Results Layers</span>
          </div>
          <span className="text-[10px] font-mono bg-sky-950 text-sky-300 px-1.5 py-0.5 rounded border border-sky-800">
            INTERACTIVE
          </span>
        </div>

        {/* 4 Layer Radio Selector Buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setActiveLayer('inundation')}
            className={`px-2.5 py-1.5 rounded text-[11px] font-bold transition-all text-left flex items-center space-x-1 ${
              activeLayer === 'inundation'
                ? 'bg-sky-600 text-white shadow'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-300"></span>
            <span>1. Inundation</span>
          </button>

          <button
            onClick={() => setActiveLayer('depth')}
            className={`px-2.5 py-1.5 rounded text-[11px] font-bold transition-all text-left flex items-center space-x-1 ${
              activeLayer === 'depth'
                ? 'bg-red-600 text-white shadow'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <span>2. Depth</span>
          </button>

          <button
            onClick={() => setActiveLayer('velocity')}
            className={`px-2.5 py-1.5 rounded text-[11px] font-bold transition-all text-left flex items-center space-x-1 ${
              activeLayer === 'velocity'
                ? 'bg-teal-600 text-white shadow'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            <span>3. Velocity</span>
          </button>

          <button
            onClick={() => setActiveLayer('arrival')}
            className={`px-2.5 py-1.5 rounded text-[11px] font-bold transition-all text-left flex items-center space-x-1 ${
              activeLayer === 'arrival'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>4. Arrival Time</span>
          </button>
        </div>

        {/* Opacity Slider */}
        <div className="space-y-1 pt-1 border-t border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span className="flex items-center space-x-1">
              <Sliders className="w-3 h-3 text-sky-400" />
              <span>Layer Opacity</span>
            </span>
            <span className="font-mono font-bold text-sky-400">{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
        </div>
      </div>

      {/* Dynamic Layer Legend */}
      <div className="absolute bottom-16 right-3 z-[1000] bg-white/95 backdrop-blur border border-slate-300 rounded-lg p-3 shadow-lg text-xs space-y-2 min-w-[210px]">
        <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center justify-between">
          <span>Legend: {activeLayer.toUpperCase()}</span>
          <span className="text-[10px] font-mono text-sky-700">T + {((currentTimeStep * 600) / 3600).toFixed(1)}h</span>
        </div>

        {activeLayer === 'inundation' && (
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="w-4 h-3 rounded bg-sky-600 border border-sky-800 opacity-80"></span>
              <span className="text-slate-700 font-bold">Submergence Inundation Footprint</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-3 rounded bg-slate-200 border border-slate-400"></span>
              <span className="text-slate-600 font-medium">Dry High-Ground Elevation</span>
            </div>
          </div>
        )}

        {activeLayer === 'depth' && (
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded bg-red-600 border border-red-800"></span>
              <span className="text-slate-700 font-semibold">&gt; 3.0 m (Severe Flood)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded bg-orange-500 border border-orange-700"></span>
              <span className="text-slate-700 font-medium">1.5 - 3.0 m (High Risk)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded bg-amber-400 border border-amber-600"></span>
              <span className="text-slate-700 font-medium">0.5 - 1.5 m (Moderate Depth)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-700"></span>
              <span className="text-slate-700 font-medium">&lt; 0.5 m (Low Risk Fringe)</span>
            </div>
          </div>
        )}

        {activeLayer === 'velocity' && (
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded bg-teal-900 border border-teal-950"></span>
              <span className="text-slate-700 font-semibold">&gt; 6.0 m/s (Extreme Velocity)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded bg-teal-600 border border-teal-800"></span>
              <span className="text-slate-700 font-medium">4.0 - 6.0 m/s (High Velocity)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded bg-cyan-500 border border-cyan-700"></span>
              <span className="text-slate-700 font-medium">2.0 - 4.0 m/s (Moderate Speed)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded bg-sky-400 border border-sky-600"></span>
              <span className="text-slate-700 font-medium">&lt; 2.0 m/s (Slow Flow)</span>
            </div>
          </div>
        )}

        {activeLayer === 'arrival' && (
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded bg-red-500 border border-red-700"></span>
              <span className="text-slate-700 font-semibold">&lt; 0.5 Hours (Immediate Wave)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded bg-orange-500 border border-orange-700"></span>
              <span className="text-slate-700 font-medium">0.5 - 1.5 Hours (Rapid Wave)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded bg-amber-400 border border-amber-600"></span>
              <span className="text-slate-700 font-medium">1.5 - 3.0 Hours (Moderate)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-700"></span>
              <span className="text-slate-700 font-medium">&gt; 3.0 Hours (Late Surge)</span>
            </div>
          </div>
        )}
      </div>

      {/* Coordinate Tracker Bar */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-slate-900/90 text-slate-200 backdrop-blur border border-slate-800 rounded-md px-3 py-1 shadow-md text-[11px] font-mono flex items-center space-x-3">
        <div className="flex items-center space-x-1 text-sky-300">
          <Compass className="w-3.5 h-3.5" />
          <span>Lat: {coords.lat.toFixed(4)}° N</span>
        </div>
        <div className="text-slate-500">|</div>
        <div className="text-sky-300">
          <span>Lng: {coords.lng.toFixed(4)}° E</span>
        </div>
        <div className="text-slate-500">|</div>
        <div className="text-teal-400 font-semibold">
          <span>Elev: 420m MSL</span>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapController center={mapCenter} zoom={mapZoom} resetToken={resetToken} />
        <CoordinateTracker onMouseMove={(lat, lng) => setCoords({ lat, lng })} />
        <MapClickInspector onInspect={(info) => setClickedLocation(info)} />
        <ScaleControl position="bottomleft" metric={true} imperial={false} />

        <TileLayer
          key={basemapMode}
          attribution={mapProvider.attribution}
          url={
            basemapMode === 'HYBRID' || basemapMode === 'SATELLITE' || basemapMode === 'PHOTOREALISTIC_3D'
              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              : basemapMode === 'TERRAIN'
              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
              : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          }
        />

        {/* Base GeoJSON Layers */}
        <GeoJSON data={sampleStudyAreaGeoJSON as any} style={styleStudyArea} />
        <GeoJSON data={sampleRiverGeoJSON as any} style={styleRiver} />
        <GeoJSON
          data={sampleDamGeoJSON as any}
          onEachFeature={onEachDamFeature}
          pointToLayer={(_, latlng) => L.marker(latlng, { icon: createDamIcon() })}
        />

        {/* Active Hydrodynamic Layer Render */}
        {activeLayer === 'inundation' && (
          <GeoJSON
            key={`inundation-step-${currentTimeStep}`}
            data={{
              ...sampleFloodDepthGeoJSON,
              features: sampleFloodDepthGeoJSON.features.filter(
                (f) => (f.properties?.arrivalTimeHr || 0) <= ((currentTimeStep * 600) / 3600) + 0.5
              ),
            } as any}
            style={styleInundationMask}
            onEachFeature={onEachFloodDepthFeature}
          />
        )}

        {activeLayer === 'depth' && (
          <GeoJSON
            key={`depth-step-${currentTimeStep}`}
            data={{
              ...sampleFloodDepthGeoJSON,
              features: sampleFloodDepthGeoJSON.features.filter(
                (f) => (f.properties?.arrivalTimeHr || 0) <= ((currentTimeStep * 600) / 3600) + 0.5
              ),
            } as any}
            style={styleFloodDepth}
            onEachFeature={onEachFloodDepthFeature}
          />
        )}

        {activeLayer === 'velocity' && (
          <GeoJSON
            key={`velocity-step-${currentTimeStep}`}
            data={{
              ...sampleVelocityVectorsGeoJSON,
              features: sampleVelocityVectorsGeoJSON.features.filter(
                (_, idx) => idx <= Math.floor((currentTimeStep / 72) * sampleVelocityVectorsGeoJSON.features.length)
              ),
            } as any}
            style={styleVelocityVectors}
          />
        )}

        {activeLayer === 'arrival' && (
          <GeoJSON
            key={`arrival-step-${currentTimeStep}`}
            data={{
              ...sampleArrivalIsochronesGeoJSON,
              features: sampleArrivalIsochronesGeoJSON.features.filter(
                (f) => (f.properties?.arrivalTimeHr || 0) <= ((currentTimeStep * 600) / 3600) + 0.5
              ),
            } as any}
            style={styleArrivalIsochrones}
          />
        )}

        {/* Infrastructure & Road Vectors */}
        <GeoJSON data={sampleRoadsGeoJSON as any} style={styleRoads} />
        <GeoJSON
          data={sampleInfrastructureGeoJSON as any}
          pointToLayer={(feature, latlng) => {
            const props = feature.properties;
            const isSubmerged = props?.status?.includes('Submerged') || props?.status === 'Inundated';
            const color = isSubmerged ? '#dc2626' : props?.status === 'Warning' ? '#f59e0b' : '#059669';

            return L.circleMarker(latlng, {
              radius: 8,
              fillColor: color,
              color: '#ffffff',
              weight: 2,
              fillOpacity: 0.95,
            });
          }}
          onEachFeature={(feature, layer) => {
            const props = feature.properties;
            if (props) {
              layer.bindPopup(`
                <div style="font-family: Inter, sans-serif; padding: 4px; min-width: 185px;">
                  <div style="font-weight: 700; color: #0f172a; font-size: 12px; margin-bottom: 4px;">${props.name}</div>
                  <div style="font-size: 11px; color: #475569; line-height: 1.5;">
                    <div><strong>Type:</strong> ${props.type}</div>
                    <div><strong>Submergence Depth:</strong> ${props.floodDepthM} m</div>
                    <div><strong>Distance from Dam:</strong> ${props.distanceKm} km</div>
                    <div style="margin-top: 4px;">
                      <span style="background-color: ${props.status.includes('Submerged') ? '#dc2626' : '#059669'}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px;">
                        ${props.status}
                      </span>
                    </div>
                  </div>
                </div>
              `);
            }
          }}
        />

        {/* Dynamic Location Inspection Popup on Click */}
        {clickedLocation && (
          <Marker position={[clickedLocation.lat, clickedLocation.lng]} icon={createInspectIcon()}>
            <Popup eventHandlers={{ remove: () => setClickedLocation(null) }}>
            <div style={{ fontFamily: 'Inter, sans-serif', padding: '4px', minWidth: '200px' }}>
              <div style={{ fontWeight: 800, color: '#0369a1', fontSize: '13px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                📍 Flooded Location Inspection
              </div>
              <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.7' }}>
                <div><strong>Depth:</strong> <span style={{ fontWeight: 800, color: '#dc2626' }}>{clickedLocation.depthM} m</span></div>
                <div><strong>Velocity:</strong> <span style={{ fontWeight: 800, color: '#0284c7' }}>{clickedLocation.velocityMs} m/s</span></div>
                <div><strong>Arrival Time:</strong> <span style={{ fontWeight: 800, color: '#d97706' }}>{clickedLocation.arrivalTimeHr} hours</span></div>
                <div><strong>Terrain Elevation:</strong> <span style={{ fontWeight: 800, color: '#15803d' }}>{clickedLocation.elevationM} m MSL</span></div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                  Coordinates: {clickedLocation.lat.toFixed(4)}° N, {clickedLocation.lng.toFixed(4)}° E
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
        )}
      </MapContainer>
    </div>
  );
};
