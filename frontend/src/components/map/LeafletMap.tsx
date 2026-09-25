import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { mockInfrastructure } from '../../data/mockData';
import { Layers, Flame } from 'lucide-react';

// Fix Leaflet default marker icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Dam Marker Icon
const createDamIcon = () => {
  return L.divIcon({
    className: 'custom-dam-marker',
    html: `<div style="background-color: #0f172a; color: #38bdf8; border: 2px solid #38bdf8; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
      🌊
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

interface LeafletMapProps {
  height?: string;
  showControls?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({ height = '100%', showControls = true }) => {
  const { selectedStudyArea, selectedDam, currentTimeStep, mapLayerMode, setMapLayerMode } = useApp();

  const center: [number, number] = [selectedStudyArea.lat, selectedStudyArea.lng];

  // Dynamic simulated flood wave polygon calculation based on time step
  const timeFactor = (currentTimeStep / 72); // 0.0 to 1.0
  const damLat = selectedStudyArea.lat;
  const damLng = selectedStudyArea.lng;

  // Downstream flood wave extent points
  const innerFloodZone: [number, number][] = [
    [damLat + 0.002, damLng - 0.005],
    [damLat - 0.010 * (1 + timeFactor), damLng - 0.040 * (1 + timeFactor)],
    [damLat - 0.050 * (1 + timeFactor * 1.5), damLng - 0.120 * (1 + timeFactor * 1.5)],
    [damLat - 0.120 * (1 + timeFactor * 2), damLng - 0.180 * (1 + timeFactor * 2)],
    [damLat - 0.150 * (1 + timeFactor * 2), damLng - 0.160 * (1 + timeFactor * 2)],
    [damLat - 0.080 * (1 + timeFactor * 1.2), damLng - 0.080 * (1 + timeFactor)],
    [damLat - 0.015, damLng + 0.010],
  ];

  const severeFloodZone: [number, number][] = [
    [damLat, damLng - 0.002],
    [damLat - 0.008 * (1 + timeFactor), damLng - 0.030 * (1 + timeFactor)],
    [damLat - 0.035 * (1 + timeFactor), damLng - 0.090 * (1 + timeFactor)],
    [damLat - 0.075 * (1 + timeFactor), damLng - 0.130 * (1 + timeFactor)],
    [damLat - 0.090 * (1 + timeFactor), damLng - 0.110 * (1 + timeFactor)],
    [damLat - 0.050 * (1 + timeFactor), damLng - 0.060 * (1 + timeFactor)],
    [damLat - 0.010, damLng + 0.005],
  ];

  // Evacuation Polyline sample points
  const evacPolylineAlpha: [number, number][] = [
    [30.1458, 78.5986], // Devprayag
    [30.2000, 78.5200],
    [30.2780, 78.4980],
    [30.3700, 78.4750]  // Tehri High Ground
  ];

  const evacPolylineBravo: [number, number][] = [
    [30.1380, 78.3880], // Shivpuri
    [30.1050, 78.2950], // Rishikesh
  ];

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-slate-300 shadow-card bg-slate-100" style={{ height }}>
      {/* Map Control Bar Overlay */}
      {showControls && (
        <div className="absolute top-3 left-14 z-[1000] bg-white/95 backdrop-blur border border-slate-300 rounded-md p-1.5 shadow-md flex items-center space-x-1 text-xs">
          <span className="text-slate-500 font-semibold px-2 flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-slate-700" />
            <span>Layer:</span>
          </span>
          <button
            onClick={() => setMapLayerMode('depth')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              mapLayerMode === 'depth'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Inundation Depth
          </button>
          <button
            onClick={() => setMapLayerMode('velocity')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              mapLayerMode === 'velocity'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Velocity Vectors
          </button>
          <button
            onClick={() => setMapLayerMode('infrastructure')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              mapLayerMode === 'infrastructure'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Infrastructure & Routes
          </button>
        </div>
      )}

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur border border-slate-300 rounded-md p-3 shadow-md text-xs space-y-1.5 min-w-[170px]">
        <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-1">
          Inundation Hazard Depth
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-3.5 rounded bg-red-600/80 border border-red-800"></span>
          <span className="text-slate-700 font-medium">&gt; 3.0 m (Severe Flood)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-3.5 rounded bg-amber-500/80 border border-amber-700"></span>
          <span className="text-slate-700 font-medium">1.5 - 3.0 m (High Risk)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-3.5 rounded bg-sky-400/80 border border-sky-600"></span>
          <span className="text-slate-700 font-medium">0.5 - 1.5 m (Moderate)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-3.5 rounded bg-emerald-400/80 border border-emerald-600"></span>
          <span className="text-slate-700 font-medium">&lt; 0.5 m (Low / Safe)</span>
        </div>
      </div>

      {/* Leaflet Core Map */}
      <MapContainer center={center} zoom={10} scrollWheelZoom={true} className="w-full h-full">
        <TileLayer
          attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        {/* Dam Location Marker */}
        <Marker position={center} icon={createDamIcon()}>
          <Popup className="font-sans">
            <div className="p-1 min-w-[180px]">
              <div className="flex items-center space-x-1.5 text-sky-800 font-bold text-sm mb-1">
                <Flame className="w-4 h-4 text-red-600" />
                <span>{selectedDam.name}</span>
              </div>
              <div className="text-xs text-slate-600 space-y-0.5">
                <div><strong>River:</strong> {selectedDam.river}</div>
                <div><strong>Crest Height:</strong> {selectedDam.heightM} m</div>
                <div><strong>Reservoir:</strong> {selectedDam.reservoirVolumeMm3} M m³</div>
                <div><strong>Status:</strong> Active Breach Site</div>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Outer Inundation Depth Polygon (Moderate to High Flood Depth) */}
        <Polygon
          positions={innerFloodZone}
          pathOptions={{
            color: mapLayerMode === 'velocity' ? '#0d9488' : '#0284c7',
            fillColor: mapLayerMode === 'velocity' ? '#14b8a6' : '#38bdf8',
            fillOpacity: 0.35,
            weight: 2,
            dashArray: '4, 4',
          }}
        >
          <Popup>
            <div className="text-xs font-sans">
              <strong>Flood Inundation Extent (Step {currentTimeStep})</strong>
              <br />
              Water Depth: 1.5 - 3.5 m
              <br />
              Wave Velocity: 3.8 m/s
            </div>
          </Popup>
        </Polygon>

        {/* Inner Severe Inundation Polygon (Critical Depth > 3m) */}
        <Polygon
          positions={severeFloodZone}
          pathOptions={{
            color: '#dc2626',
            fillColor: '#ef4444',
            fillOpacity: 0.55,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-xs font-sans text-red-900">
              <strong>CRITICAL SUBMERGENCE ZONE</strong>
              <br />
              Water Depth: &gt; 5.0 m
              <br />
              Extreme Flash Flood Risk
            </div>
          </Popup>
        </Polygon>

        {/* Infrastructure Asset Markers */}
        {(mapLayerMode === 'infrastructure' || mapLayerMode === 'depth') &&
          mockInfrastructure.map((asset) => {
            const isSubmerged = asset.status.includes('Submerged') || asset.status === 'Inundated';
            const markerColor = isSubmerged ? '#dc2626' : asset.status === 'Warning' ? '#f59e0b' : '#059669';

            return (
              <CircleMarker
                key={asset.id}
                center={[asset.lat, asset.lng]}
                radius={8}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: markerColor,
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="p-1 text-xs font-sans">
                    <div className="font-bold text-slate-900 mb-1">{asset.name}</div>
                    <div><strong>Type:</strong> {asset.type}</div>
                    <div><strong>Flood Depth:</strong> {asset.floodDepthM} m</div>
                    <div><strong>Distance from Dam:</strong> {asset.distanceFromDamKm} km</div>
                    <div className="mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                        isSubmerged ? 'bg-red-600' : asset.status === 'Warning' ? 'bg-amber-600' : 'bg-emerald-600'
                      }`}>
                        {asset.status}
                      </span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* Evacuation Route Polylines */}
        {mapLayerMode === 'infrastructure' && (
          <>
            <Polyline
              positions={evacPolylineAlpha}
              pathOptions={{ color: '#059669', weight: 4, opacity: 0.8 }}
            >
              <Popup>
                <div className="text-xs font-sans">
                  <strong>Route Alpha (Clear & Open)</strong>
                  <br />
                  Evacuation Capacity: 12,500 Evacuees
                </div>
              </Popup>
            </Polyline>
            <Polyline
              positions={evacPolylineBravo}
              pathOptions={{ color: '#f59e0b', weight: 4, dashArray: '6,6', opacity: 0.8 }}
            >
              <Popup>
                <div className="text-xs font-sans">
                  <strong>Route Bravo (Moderate Water Caution)</strong>
                </div>
              </Popup>
            </Polyline>
          </>
        )}
      </MapContainer>
    </div>
  );
};
