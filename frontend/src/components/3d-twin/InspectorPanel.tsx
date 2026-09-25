import React from 'react';
import type { LocationInspectionData, TwinAsset3D } from '../../types/digitalTwin3dTypes';
import { MapPin, Navigation, Droplets, Gauge, Clock, Building } from 'lucide-react';

interface InspectorPanelProps {
  locationData: LocationInspectionData | null;
  selectedAsset: TwinAsset3D | null;
  onClose: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  locationData,
  selectedAsset,
  onClose
}) => {
  if (!locationData && !selectedAsset) return null;

  return (
    <div className="absolute top-16 right-4 z-20 w-80 bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-3 font-sans text-xs text-slate-200 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2 font-mono font-bold text-cyan-300 uppercase">
          {selectedAsset ? <Building className="w-4 h-4 text-cyan-400" /> : <MapPin className="w-4 h-4 text-cyan-400" />}
          <span>{selectedAsset ? 'Asset Inspector' : 'Location Data Inspector'}</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 font-mono text-[10px]"
        >
          ✕
        </button>
      </div>

      {/* Selected Asset Mode */}
      {selectedAsset && (
        <div className="space-y-2 font-mono">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-sm">{selectedAsset.name}</span>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${
                selectedAsset.status === 'SAFE' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                selectedAsset.status === 'AT_RISK' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
              }`}>
                {selectedAsset.status}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Type: {selectedAsset.type}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px]">Elevation</span>
              <div className="font-bold text-white">{selectedAsset.elevationM} m</div>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px]">Current Depth</span>
              <div className="font-bold text-cyan-300">{selectedAsset.currentDepthM} m</div>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px]">Arrival Time</span>
              <div className="font-bold text-amber-300">{selectedAsset.arrivalTimeMin} min</div>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px]">Critical Tier</span>
              <div className="font-bold text-indigo-300">{selectedAsset.isCritical ? 'TIER 1' : 'TIER 2'}</div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-cyan-950/40 border border-cyan-800/60 p-2 rounded-lg text-[10px]">
            <span className="text-slate-300">Data Provenance:</span>
            <span className="font-bold text-cyan-300 px-1.5 py-0.5 rounded bg-slate-900 border border-cyan-500/30">
              SOURCE: {selectedAsset.provenance}
            </span>
          </div>
        </div>
      )}

      {/* Clicked Location Coordinates Mode */}
      {locationData && !selectedAsset && (
        <div className="space-y-2 font-mono">
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex justify-between text-[11px]">
            <div>
              <span className="text-slate-500 text-[10px]">Coordinates</span>
              <div className="font-bold text-slate-200">{locationData.lat.toFixed(4)}°N, {locationData.lng.toFixed(4)}°E</div>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[10px]">Nearest Channel</span>
              <div className="font-bold text-cyan-400">{locationData.nearestRiver}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-0.5">
              <span className="text-slate-400 text-[10px] flex items-center space-x-1">
                <Navigation className="w-3 h-3 text-emerald-400" />
                <span>Elevation</span>
              </span>
              <div className="font-bold text-white">{locationData.elevationM} m</div>
            </div>

            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-0.5">
              <span className="text-slate-400 text-[10px] flex items-center space-x-1">
                <Droplets className="w-3 h-3 text-cyan-400" />
                <span>Water Depth</span>
              </span>
              <div className="font-bold text-cyan-300">{locationData.waterDepthM} m</div>
            </div>

            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-0.5">
              <span className="text-slate-400 text-[10px] flex items-center space-x-1">
                <Gauge className="w-3 h-3 text-amber-400" />
                <span>Velocity</span>
              </span>
              <div className="font-bold text-amber-300">{locationData.velocityMs} m/s</div>
            </div>

            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-0.5">
              <span className="text-slate-400 text-[10px] flex items-center space-x-1">
                <Clock className="w-3 h-3 text-purple-400" />
                <span>Arrival Time</span>
              </span>
              <div className="font-bold text-purple-300">{locationData.arrivalTimeMin < 900 ? `${locationData.arrivalTimeMin} min` : 'Unflooded'}</div>
            </div>
          </div>

          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-between items-center text-[10px]">
            <span className="text-slate-400">Water Surface Elevation:</span>
            <span className="font-bold text-cyan-300">{locationData.waterSurfaceM.toFixed(1)} m</span>
          </div>

          <div className="flex items-center justify-between bg-indigo-950/40 border border-indigo-800/60 p-2 rounded-lg text-[10px]">
            <span className="text-slate-300">Scientific Provenance:</span>
            <span className="font-bold text-indigo-300 px-1.5 py-0.5 rounded bg-slate-900 border border-indigo-500/30">
              SOURCE: {locationData.provenance}
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
