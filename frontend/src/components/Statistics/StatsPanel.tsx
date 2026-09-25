import React from 'react';
import type { HydroSimulationState, InfrastructureBuilding, MapVisualizationMode } from '../../types/3dTypes';
import { Activity, ShieldAlert, Building, Navigation, Clock, Maximize2, TrendingUp, Wind, CheckCircle2 } from 'lucide-react';

interface StatsPanelProps {
  simState: HydroSimulationState;
  buildings: InfrastructureBuilding[];
  visualizationMode: MapVisualizationMode;
  showDepthLegend: boolean;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  simState,
  buildings,
  visualizationMode,
  showDepthLegend
}) => {
  return (
    <div className="w-80 bg-slate-900/95 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl p-4 flex flex-col space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto select-none backdrop-blur-md">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/40">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Simulation Statistics</h3>
            <span className="text-[10px] text-slate-400 font-mono">Live Telemetry & Impact</span>
          </div>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
          simState.status === 'Simulating' ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
        }`}>
          {simState.status}
        </span>
      </div>

      {/* Stage Badge */}
      <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Current Simulation Stage</div>
        <div className="font-bold text-sky-300 text-[11px] font-mono leading-tight">
          {simState.stageName}
        </div>
      </div>

      {/* Primary Hydrodynamic Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        
        {/* Elapsed Time */}
        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
          <div className="flex items-center space-x-1 text-[9px] font-bold text-slate-400 uppercase">
            <Clock className="w-3 h-3 text-sky-400" />
            <span>Elapsed Time</span>
          </div>
          <div className="text-base font-extrabold text-white font-mono mt-0.5">
            {simState.currentTimeMin} <span className="text-xs text-slate-400 font-normal">min</span>
          </div>
        </div>

        {/* Flooded Area */}
        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
          <div className="flex items-center space-x-1 text-[9px] font-bold text-slate-400 uppercase">
            <Maximize2 className="w-3 h-3 text-teal-400" />
            <span>Flooded Area</span>
          </div>
          <div className="text-base font-extrabold text-teal-300 font-mono mt-0.5">
            {simState.floodedAreaKm2} <span className="text-xs text-slate-400 font-normal">km²</span>
          </div>
        </div>

        {/* Max Depth */}
        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
          <div className="flex items-center space-x-1 text-[9px] font-bold text-slate-400 uppercase">
            <TrendingUp className="w-3 h-3 text-red-400" />
            <span>Max Depth</span>
          </div>
          <div className="text-base font-extrabold text-red-400 font-mono mt-0.5">
            {simState.maxDepthM} <span className="text-xs text-slate-400 font-normal">m</span>
          </div>
        </div>

        {/* Max Velocity */}
        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
          <div className="flex items-center space-x-1 text-[9px] font-bold text-slate-400 uppercase">
            <Wind className="w-3 h-3 text-indigo-400" />
            <span>Max Velocity</span>
          </div>
          <div className="text-base font-extrabold text-indigo-300 font-mono mt-0.5">
            {simState.maxVelocityMs} <span className="text-xs text-slate-400 font-normal">m/s</span>
          </div>
        </div>

      </div>

      {/* HADR Affected Infrastructure Impact Summary */}
      <div className="space-y-2 pt-1 border-t border-slate-800">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Affected Infrastructure Impact</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
          <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
            <Building className="w-3.5 h-3.5 text-amber-400 mx-auto mb-0.5" />
            <div className="text-[9px] text-slate-400 font-semibold">Buildings</div>
            <div className="font-extrabold text-amber-300 font-mono text-sm">{simState.affectedBuildingsCount}</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
            <Navigation className="w-3.5 h-3.5 text-sky-400 mx-auto mb-0.5" />
            <div className="text-[9px] text-slate-400 font-semibold">Roads</div>
            <div className="font-extrabold text-sky-300 font-mono text-sm">{simState.affectedRoadsKm} km</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400 mx-auto mb-0.5" />
            <div className="text-[9px] text-slate-400 font-semibold">Critical Assets</div>
            <div className="font-extrabold text-red-400 font-mono text-sm">{simState.affectedCriticalInfraCount}</div>
          </div>
        </div>

        {/* Individual Infrastructure Status List */}
        <div className="space-y-1.5 pt-1">
          {buildings.map((bldg) => {
            const distFromDam = bldg.position[2] - (-30);
            const isFlooded = simState.waterFrontDistanceM >= distFromDam;

            return (
              <div
                key={bldg.id}
                className={`p-2 rounded-lg border text-[11px] flex items-center justify-between transition-all ${
                  isFlooded
                    ? 'bg-red-950/40 border-red-800/80 text-red-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <div className="truncate max-w-[170px]">
                  <div className="font-bold text-white text-[11px] truncate">{bldg.name}</div>
                  <div className="text-[9px] text-slate-400 truncate">{bldg.subtext}</div>
                </div>

                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isFlooded
                    ? 'bg-red-900 text-red-200 border border-red-700'
                    : 'bg-slate-800 text-emerald-400'
                }`}>
                  {isFlooded ? (bldg.type === 'Bridge' ? 'FLOOD IMPACT' : 'FLOOD AFFECTED') : 'NORMAL'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Depth Spectrum Legend Component */}
      {showDepthLegend && (
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs pt-2 border-t border-slate-800">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{visualizationMode.toUpperCase()} Spectrum Legend</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          </div>

          {visualizationMode === 'depth' ? (
            <div className="space-y-1 text-[10px] font-mono">
              <div className="flex items-center justify-between"><div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded bg-cyan-300"></span><span>0 – 0.5 m</span></div><span className="text-slate-400">Low Depth</span></div>
              <div className="flex items-center justify-between"><div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded bg-sky-500"></span><span>0.5 – 1.0 m</span></div><span className="text-slate-400">Moderate</span></div>
              <div className="flex items-center justify-between"><div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded bg-blue-600"></span><span>1.0 – 2.0 m</span></div><span className="text-slate-400">High Depth</span></div>
              <div className="flex items-center justify-between"><div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded bg-indigo-700"></span><span>2.0 – 5.0 m</span></div><span className="text-slate-400">Severe</span></div>
              <div className="flex items-center justify-between"><div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded bg-red-600"></span><span>&gt; 5.0 m</span></div><span className="text-red-400 font-bold">Critical</span></div>
            </div>
          ) : visualizationMode === 'velocity' ? (
            <div className="space-y-1 text-[10px] font-mono">
              <div className="flex items-center justify-between"><div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded bg-emerald-500"></span><span>&lt; 3.0 m/s</span></div><span className="text-slate-400">Subcritical</span></div>
              <div className="flex items-center justify-between"><div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded bg-amber-500"></span><span>3.0 – 6.0 m/s</span></div><span className="text-slate-400">Transitional</span></div>
              <div className="flex items-center justify-between"><div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded bg-red-500"></span><span>&gt; 6.0 m/s</span></div><span className="text-red-400 font-bold">Supercritical Surge</span></div>
            </div>
          ) : (
            <div className="text-[10px] text-slate-300 font-mono">
              Uniform spatial flood inundation polygon footprint envelope.
            </div>
          )}
        </div>
      )}

    </div>
  );
};
