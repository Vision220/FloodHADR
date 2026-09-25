import React from 'react';
import { PRESET_SCENARIOS } from '../../data/demo3dData';
import { X, Layers, CheckCircle2, BarChart2 } from 'lucide-react';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (key: 'scenario-a' | 'scenario-b' | 'scenario-c') => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario
}) => {
  if (!isOpen) return null;

  const scenarios = [
    { key: 'scenario-a' as const, ...PRESET_SCENARIOS['scenario-a'], area: 18.4, depth: 8.4, vel: 5.2, bldgs: 35 },
    { key: 'scenario-b' as const, ...PRESET_SCENARIOS['scenario-b'], area: 28.6, depth: 14.8, vel: 7.4, bldgs: 110 },
    { key: 'scenario-c' as const, ...PRESET_SCENARIOS['scenario-c'], area: 42.5, depth: 21.2, vel: 11.6, bldgs: 240 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-4xl w-full text-slate-100 p-6 space-y-5 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Scenario Comparison Matrix</h3>
              <p className="text-xs text-slate-400">Side-by-side comparative parameterization & hydrodynamic outcomes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparative Cards Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {scenarios.map((scen) => (
            <div
              key={scen.key}
              className="bg-slate-950 border border-slate-800 hover:border-sky-500/60 rounded-xl p-4 space-y-3 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-extrabold text-white text-sm">{scen.name}</span>
                  <span className="text-[10px] font-mono bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-800">
                    {scen.breachWidthM}m Breach
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug">{scen.description}</p>

                <div className="space-y-1 pt-1 font-mono text-[11px] text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Water Level:</span>
                    <span className="font-bold text-sky-400">{scen.reservoirWaterLevelM} m</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Breach Formation:</span>
                    <span className="font-bold text-emerald-400">{scen.breachFormationTimeMin} min</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Peak Flood Area:</span>
                    <span className="font-bold text-teal-300">{scen.area} km²</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Max Depth:</span>
                    <span className="font-bold text-red-400">{scen.depth} m</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Max Velocity:</span>
                    <span className="font-bold text-indigo-300">{scen.vel} m/s</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-500">Affected Buildings:</span>
                    <span className="font-bold text-amber-300">{scen.bldgs} units</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectScenario(scen.key);
                  onClose();
                }}
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-1 shadow"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Load {scen.key.toUpperCase()}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Disclaimer as required by prompt */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center space-x-2 font-mono">
          <BarChart2 className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Note: Comparative results represent relative parameter sensitivities. No scenario is designated as "best" or "worst".</span>
        </div>

      </div>
    </div>
  );
};
