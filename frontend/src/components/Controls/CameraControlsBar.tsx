import React from 'react';
import type { CameraPreset, MapVisualizationMode } from '../../types/3dTypes';
import { Camera, Eye, Layers } from 'lucide-react';

interface CameraControlsBarProps {
  cameraPreset: CameraPreset;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  visualizationMode: MapVisualizationMode;
  onChangeVisualizationMode: (mode: MapVisualizationMode) => void;
  showDepthLegend: boolean;
  onToggleDepthLegend: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
}

export const CameraControlsBar: React.FC<CameraControlsBarProps> = ({
  cameraPreset,
  onSelectCameraPreset,
  visualizationMode,
  onChangeVisualizationMode,
  showDepthLegend,
  onToggleDepthLegend,
  showLabels,
  onToggleLabels
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 border border-slate-800 backdrop-blur-md px-3 py-2 rounded-2xl shadow-xl text-xs select-none">
      
      {/* Camera View Presets */}
      <div className="flex items-center space-x-1.5 border-r border-slate-800 pr-2">
        <Camera className="w-4 h-4 text-sky-400 shrink-0" />
        <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">Camera:</span>

        <button
          onClick={() => onSelectCameraPreset('3D')}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
            cameraPreset === '3D' ? 'bg-sky-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
          }`}
        >
          [3D VIEW]
        </button>

        <button
          onClick={() => onSelectCameraPreset('TOP')}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
            cameraPreset === 'TOP' ? 'bg-sky-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
          }`}
        >
          [TOP VIEW]
        </button>

        <button
          onClick={() => onSelectCameraPreset('DAM')}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
            cameraPreset === 'DAM' ? 'bg-sky-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
          }`}
        >
          [DAM VIEW]
        </button>

        <button
          onClick={() => onSelectCameraPreset('RESET')}
          className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 rounded-lg text-[10px] font-mono font-semibold"
        >
          [RESET VIEW]
        </button>
      </div>

      {/* Visualization Spectrum Mode Buttons ([Depth], [Velocity], [Inundation]) */}
      <div className="flex items-center space-x-1.5 border-r border-slate-800 pr-2">
        <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">Mode:</span>

        <button
          onClick={() => onChangeVisualizationMode('depth')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
            visualizationMode === 'depth'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-950 text-slate-400 hover:text-white'
          }`}
        >
          [Depth]
        </button>

        <button
          onClick={() => onChangeVisualizationMode('velocity')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
            visualizationMode === 'velocity'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-slate-950 text-slate-400 hover:text-white'
          }`}
        >
          [Velocity]
        </button>

        <button
          onClick={() => onChangeVisualizationMode('inundation')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
            visualizationMode === 'inundation'
              ? 'bg-sky-600 text-white shadow'
              : 'bg-slate-950 text-slate-400 hover:text-white'
          }`}
        >
          [Inundation]
        </button>
      </div>

      {/* Toggles: Legend & 3D Labels */}
      <div className="flex items-center space-x-1.5">
        <button
          onClick={onToggleDepthLegend}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
            showDepthLegend ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400'
          }`}
        >
          Legend {showDepthLegend ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={onToggleLabels}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center space-x-1 ${
            showLabels ? 'bg-slate-800 text-slate-200' : 'bg-slate-950 text-slate-500'
          }`}
        >
          <Eye className="w-3 h-3 text-sky-400" />
          <span>3D Labels</span>
        </button>
      </div>

    </div>
  );
};
