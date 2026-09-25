import React from 'react';
import type { ScenarioParams, HydroSimulationState } from '../../types/3dTypes';
import { PRESET_SCENARIOS } from '../../data/demo3dData';
import { Sliders, Play, Pause, RotateCcw, Layers, Upload } from 'lucide-react';

interface ScenarioControlsPanelProps {
  params: ScenarioParams;
  onChangeParams: (newParams: ScenarioParams) => void;
  onSelectPreset: (presetId: 'scenario-a' | 'scenario-b' | 'scenario-c') => void;
  simState: HydroSimulationState;
  onRun: () => void;
  onPause: () => void;
  onReset: () => void;
  onOpenDEMLoader: () => void;
  onOpenComparison: () => void;
}

export const ScenarioControlsPanel: React.FC<ScenarioControlsPanelProps> = ({
  params,
  onChangeParams,
  onSelectPreset,
  simState,
  onRun,
  onPause,
  onReset,
  onOpenDEMLoader,
  onOpenComparison
}) => {
  const isRunning = simState.status === 'Simulating';

  return (
    <div className="w-80 bg-slate-900/95 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl p-4 flex flex-col space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto select-none backdrop-blur-md">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg border border-sky-500/40">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Scenario Controls</h3>
            <span className="text-[10px] text-slate-400 font-mono">Dam-Break Parameters</span>
          </div>
        </div>
        <span className="text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded">
          DEMO
        </span>
      </div>

      {/* Preset Scenario Selector Buttons */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Preset Scenario Templates:
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['scenario-a', 'scenario-b', 'scenario-c'] as const).map((key) => {
            const preset = PRESET_SCENARIOS[key];
            const isSelected = params.id === key;
            return (
              <button
                key={key}
                onClick={() => onSelectPreset(key)}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold font-mono transition-all text-center border ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title={preset.description}
              >
                {key === 'scenario-a' ? 'Scenario A' : key === 'scenario-b' ? 'Scenario B' : 'Scenario C'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Range Sliders */}
      <div className="space-y-3 pt-1 border-t border-slate-800 text-xs">
        
        {/* Reservoir Water Level */}
        <div>
          <div className="flex justify-between font-semibold text-slate-300 mb-1 text-[11px]">
            <span>Reservoir Water Level:</span>
            <span className="font-mono text-sky-400 font-bold">{params.reservoirWaterLevelM} m</span>
          </div>
          <input
            type="range"
            min="150"
            max="260"
            step="5"
            value={params.reservoirWaterLevelM}
            onChange={(e) => onChangeParams({ ...params, id: 'custom', reservoirWaterLevelM: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
        </div>

        {/* Breach Width */}
        <div>
          <div className="flex justify-between font-semibold text-slate-300 mb-1 text-[11px]">
            <span>Breach Width:</span>
            <span className="font-mono text-amber-400 font-bold">{params.breachWidthM} m</span>
          </div>
          <input
            type="range"
            min="20"
            max="250"
            step="10"
            value={params.breachWidthM}
            onChange={(e) => onChangeParams({ ...params, id: 'custom', breachWidthM: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Breach Formation Time */}
        <div>
          <div className="flex justify-between font-semibold text-slate-300 mb-1 text-[11px]">
            <span>Breach Formation Time:</span>
            <span className="font-mono text-emerald-400 font-bold">{params.breachFormationTimeMin} min</span>
          </div>
          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={params.breachFormationTimeMin}
            onChange={(e) => onChangeParams({ ...params, id: 'custom', breachFormationTimeMin: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Simulation Duration */}
        <div>
          <div className="flex justify-between font-semibold text-slate-300 mb-1 text-[11px]">
            <span>Simulation Horizon:</span>
            <span className="font-mono text-slate-300 font-bold">{params.simulationDurationMin} min</span>
          </div>
          <input
            type="range"
            min="30"
            max="240"
            step="30"
            value={params.simulationDurationMin}
            onChange={(e) => onChangeParams({ ...params, id: 'custom', simulationDurationMin: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
          />
        </div>

        {/* Flood Speed Multiplier */}
        <div>
          <div className="flex justify-between font-semibold text-slate-300 mb-1 text-[11px]">
            <span>Animation Propagation Speed:</span>
            <span className="font-mono text-indigo-400 font-bold">{params.floodSpeedMultiplier}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.5"
            value={params.floodSpeedMultiplier}
            onChange={(e) => onChangeParams({ ...params, floodSpeedMultiplier: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

      </div>

      {/* Action Execution Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="grid grid-cols-2 gap-2">
          {isRunning ? (
            <button
              onClick={onPause}
              className="py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-extrabold text-xs shadow-lg transition-all flex items-center justify-center space-x-1.5"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>PAUSE</span>
            </button>
          ) : (
            <button
              onClick={onRun}
              className="py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 rounded-xl font-black text-xs shadow-lg transition-all flex items-center justify-center space-x-1.5"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>RUN SIMULATION</span>
            </button>
          )}

          <button
            onClick={onReset}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs border border-slate-700 transition-all flex items-center justify-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>RESET</span>
          </button>
        </div>

        {/* DEM Loader Placeholder & Scenario Comparison Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenDEMLoader}
            className="py-2 bg-slate-950 hover:bg-slate-800 text-sky-400 border border-sky-800/80 rounded-lg font-bold text-[10px] transition-all flex items-center justify-center space-x-1"
          >
            <Upload className="w-3 h-3 text-sky-400" />
            <span>UPLOAD DEM</span>
          </button>

          <button
            onClick={onOpenComparison}
            className="py-2 bg-slate-950 hover:bg-slate-800 text-indigo-300 border border-indigo-800/80 rounded-lg font-bold text-[10px] transition-all flex items-center justify-center space-x-1"
          >
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>COMPARE A/B/C</span>
          </button>
        </div>
      </div>

    </div>
  );
};
