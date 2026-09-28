import React from 'react';
import { Database, ShieldCheck, Activity, Layers, Clock, Cpu } from 'lucide-react';

export interface ProvenanceHeaderProps {
  scenarioTitle?: string;
  modelName?: string;
  runId?: string;
  simulationTime?: string;
  demSource?: string;
  status?: string;
  provenance?: string;
  isLive?: boolean;
}

export const ProvenanceHeader: React.FC<ProvenanceHeaderProps> = ({
  scenarioTitle = "Tehri FRL Breach (PMF Overtopping)",
  modelName = "FloodHADR SWE",
  runId = "run-golden-60m-1759045934",
  simulationTime = "T + 4.8 hr",
  demSource = "Bhuvan / NRSC ALOS PALSAR 12.5m DEM",
  status = "SIMULATION RESULT",
  provenance = "DERIVED FROM HYDRODYNAMIC MODEL",
  isLive = true
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-xs font-mono select-none my-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Scenario & Model */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-sky-500/20 to-blue-500/20 text-sky-400 rounded-xl border border-sky-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
              ACTIVE SCENARIO
            </div>
            <div className="text-sm font-extrabold text-white tracking-tight">
              {scenarioTitle}
            </div>
          </div>
        </div>

        {/* Dynamic Metadata Badge Strip */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-950/80 border border-slate-800/80 rounded-xl px-3.5 py-2">
          
          {/* MODEL */}
          <div className="flex items-center space-x-1.5 border-r border-slate-800 pr-3">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <div>
              <span className="text-[9px] text-slate-500 uppercase block">MODEL</span>
              <span className="font-bold text-slate-200 text-[11px]">{modelName}</span>
            </div>
          </div>

          {/* RUN ID */}
          <div className="flex items-center space-x-1.5 border-r border-slate-800 pr-3">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <div>
              <span className="text-[9px] text-slate-500 uppercase block">RUN ID</span>
              <span className="font-bold text-slate-300 text-[11px]">{runId}</span>
            </div>
          </div>

          {/* TIME */}
          <div className="flex items-center space-x-1.5 border-r border-slate-800 pr-3">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <div>
              <span className="text-[9px] text-slate-500 uppercase block">TIME</span>
              <span className="font-bold text-amber-300 text-[11px]">{simulationTime}</span>
            </div>
          </div>

          {/* DEM */}
          <div className="flex items-center space-x-1.5 border-r border-slate-800 pr-3">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <div>
              <span className="text-[9px] text-slate-500 uppercase block">DEM / DATA SOURCE</span>
              <span className="font-bold text-emerald-300 text-[11px]">{demSource}</span>
            </div>
          </div>

          {/* STATUS */}
          <div className="flex items-center space-x-1.5 border-r border-slate-800 pr-3">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <div>
              <span className="text-[9px] text-slate-500 uppercase block">STATUS</span>
              <span className="font-bold text-cyan-300 text-[11px]">{status}</span>
            </div>
          </div>

          {/* PROVENANCE */}
          <div className="flex items-center space-x-1.5">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <div>
              <span className="text-[9px] text-slate-500 uppercase block">PROVENANCE</span>
              <span className="font-extrabold text-white text-[10px] tracking-wide">{provenance}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
