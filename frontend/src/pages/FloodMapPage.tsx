import React from 'react';
import { useApp } from '../context/AppContext';
import { GISMapModule } from '../components/map/GISMapModule';
import {
  Map,
  Play,
  Pause,
  RotateCcw,
  Activity,
  Layers,
  Clock,
  Gauge,
  AlertTriangle,
} from 'lucide-react';

export const FloodMapPage: React.FC = () => {
  const {
    activeSimulation,
    currentTimeStep,
    setCurrentTimeStep,
    isSimulating,
    setIsSimulating,
  } = useApp();

  // Dynamic calculation for 6 Required Statistics Metrics Cards based on currentTimeStep
  const dynamicArea = Math.round(((currentTimeStep / 72) * (activeSimulation.maxFloodAreaKm2 || 184.2) + 12.4) * 10) / 10;
  const dynamicAvgDepth = (Math.min(3.8, 1.2 + (currentTimeStep / 72) * 2.6)).toFixed(1);

  const stats = [
    {
      label: 'Flooded Area',
      value: `${dynamicArea} km²`,
      subtext: 'Union of Inundated Cells',
      color: 'border-l-sky-600 bg-sky-50/50 text-sky-900',
      icon: Map,
    },
    {
      label: 'Maximum Depth',
      value: `${activeSimulation.maxDepthM || 14.6} m`,
      subtext: 'Peak Wave Height at Dam',
      color: 'border-l-red-600 bg-red-50/50 text-red-900',
      icon: Activity,
    },
    {
      label: 'Maximum Velocity',
      value: `${activeSimulation.maxVelocityMs || 8.4} m/s`,
      subtext: 'Peak Wave Kinetic Speed',
      color: 'border-l-teal-600 bg-teal-50/50 text-teal-900',
      icon: Gauge,
    },
    {
      label: 'Average Depth',
      value: `${dynamicAvgDepth} m`,
      subtext: 'Mean Submergence Depth',
      color: 'border-l-indigo-600 bg-indigo-50/50 text-indigo-900',
      icon: Layers,
    },
    {
      label: 'First Arrival',
      value: '0.2 hrs (12 min)',
      subtext: 'Wave Arrival at Devprayag',
      color: 'border-l-amber-600 bg-amber-50/50 text-amber-900',
      icon: Clock,
    },
    {
      label: 'Max Arrival Time',
      value: '8.5 hrs',
      subtext: 'Fringe Inundation Horizon',
      color: 'border-l-emerald-600 bg-emerald-50/50 text-emerald-900',
      icon: AlertTriangle,
    },
  ];

  const presetTimesteps = [
    { label: 't = 0h', step: 0 },
    { label: 't = 2h', step: 12 },
    { label: 't = 4h', step: 24 },
    { label: 't = 6h', step: 36 },
    { label: 't = 8h', step: 48 },
    { label: 't = 10h', step: 60 },
    { label: 't = 12h', step: 72 },
  ];

  return (
    <div className="space-y-4">
      {/* 6 Statistics Cards Header Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div
              key={`stat-card-${idx}`}
              className={`border border-slate-200 rounded-lg p-3 border-l-4 shadow-subtle transition-all hover:shadow-panel ${item.color}`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                <span>{item.label}</span>
                <IconComp className="w-3.5 h-3.5 opacity-70" />
              </div>
              <div className="text-lg font-extrabold tracking-tight font-mono">
                {item.value}
              </div>
              <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                {item.subtext}
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Toolbar & Quick Timestep Preset Selector */}
      <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-extrabold text-slate-900">
            <Map className="w-4 h-4 text-sky-600" />
            <span>2D Hydrodynamic Flood Results Studio</span>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <span className="text-slate-500 font-medium">
            Active Scenario: <strong className="text-slate-800">{activeSimulation.scenarioTitle}</strong>
          </span>
        </div>

        {/* Timestep Quick Selector Presets */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
            Timesteps:
          </span>
          {presetTimesteps.map((p) => (
            <button
              key={`preset-${p.step}`}
              onClick={() => setCurrentTimeStep(p.step)}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                currentTimeStep === p.step
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Leaflet Map Canvas Container */}
      <div className="h-[calc(100vh-16rem)] min-h-[500px] relative rounded-lg overflow-hidden border border-slate-300 shadow-panel">
        <GISMapModule height="100%" showControls={true} />

        {/* Floating Time-Slider & Animation Scrub Control Bar (Bottom) */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] w-11/12 max-w-3xl bg-slate-900/95 text-slate-100 backdrop-blur border border-slate-800 rounded-xl p-3.5 shadow-2xl flex items-center space-x-4">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white shadow-lg transition-all ${
              isSimulating ? 'bg-amber-600 hover:bg-amber-700' : 'bg-sky-600 hover:bg-sky-700'
            }`}
            title={isSimulating ? 'Pause Temporal Animation' : 'Play Temporal Flood Wave Animation'}
          >
            {isSimulating ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="flex items-center space-x-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Temporal Hydrodynamic Flood Wave Scrubber</span>
              </span>
              <span className="text-sky-300 font-mono bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                Step {currentTimeStep} / 72 &bull; T + {((currentTimeStep * 600) / 3600).toFixed(1)} hrs
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="72"
              value={currentTimeStep}
              onChange={(e) => setCurrentTimeStep(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          <button
            onClick={() => setCurrentTimeStep(0)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
            title="Reset Timestep to t=0 (Dam Breach Origin)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
