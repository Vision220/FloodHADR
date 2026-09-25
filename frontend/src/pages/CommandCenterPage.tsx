import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { PageId } from '../types';
import {
  Sparkles,
  Activity,
  Layers,
  ShieldAlert,
  Sliders,
  Droplets,
  Clock,
  AlertOctagon,
  Globe,
  Radio,
  Cpu,
  Flame,
  FileText,
  GitBranch,
  Thermometer,
  Mountain,
  Zap,
  LayoutDashboard,
  TrendingUp,
  MapPin,
  Play,
  ShieldCheck,
  ChevronRight,
  Box
} from 'lucide-react';
import { GISMapModule } from '../components/map/GISMapModule';
import { HydrographChart } from '../components/analytics/HydrographChart';

type TemporalMode = 'PAST' | 'PRESENT' | 'NEXT' | 'FUTURE' | 'EXTREME';
type PipelineStep = 'DATA' | 'HYDROLOGY' | 'SCENARIO' | 'SIMULATION' | 'PREDICTION' | 'IMPACT' | 'HADR';

interface HazardInputsState {
  catchmentAreaKm2: number;
  scsCn: number;
  rainfallMm: number;
  reservoirLevelM: number;
  tributaryRegime: 'NORMAL' | 'HIGH' | 'FLASH_FLOOD' | 'COINCIDENT_PEAK';
  climateScaling: number;
  landslideBlockage: 'NONE' | 'PARTIAL' | 'MAJOR_BLOCKAGE';
  damBreach: boolean;
}

export const CommandCenterPage: React.FC = () => {
  const { setActivePage } = useApp();

  // Mode & Stepper State
  const [temporalMode, setTemporalMode] = useState<TemporalMode>('PRESENT');
  const [activeStep, setActiveStep] = useState<PipelineStep>('PREDICTION');
  const [is3DView, setIs3DView] = useState<boolean>(false);
  const [showModuleGrid, setShowModuleGrid] = useState<boolean>(false);

  // Live Interactive Hazard Inputs
  const [inputs, setInputs] = useState<HazardInputsState>({
    catchmentAreaKm2: 7500,
    scsCn: 78,
    rainfallMm: 220,
    reservoirLevelM: 830,
    tributaryRegime: 'FLASH_FLOOD',
    climateScaling: 1.15,
    landslideBlockage: 'NONE',
    damBreach: false
  });

  // Calculate dynamic outputs based on inputs
  const [calculatedOutputs, setCalculatedOutputs] = useState({
    peakDischargeM3s: 48200,
    floodAreaKm2: 24.6,
    maxDepthM: 24.5,
    maxVelocityMs: 8.4,
    arrivalTimeMin: 18.5,
    floodDurationHr: 36.0,
    affectedAssetsCount: 4,
    statisticalNotice: "Scenario envelope — probability not statistically calibrated.",
    uncertaintyRanges: {
      depth: "20.8 – 30.6 m",
      velocity: "7.4 – 9.9 m/s",
      discharge: "40,970 – 58,800 m³/s",
      area: "20.9 – 30.0 km²"
    }
  });

  // Recalculate outputs whenever inputs or temporalMode change
  useEffect(() => {
    let baseQ = 5000 + inputs.rainfallMm * 65.0 * (inputs.scsCn / 70.0);
    
    if (inputs.tributaryRegime === 'HIGH') baseQ *= 1.35;
    if (inputs.tributaryRegime === 'FLASH_FLOOD') baseQ *= 1.85;
    if (inputs.tributaryRegime === 'COINCIDENT_PEAK') baseQ *= 2.4;

    baseQ *= inputs.climateScaling;

    if (inputs.landslideBlockage === 'PARTIAL') baseQ += 1200;
    if (inputs.landslideBlockage === 'MAJOR_BLOCKAGE') baseQ += 3600;

    if (inputs.damBreach) {
      baseQ += 420000;
    } else if (inputs.reservoirLevelM > 835) {
      baseQ += 15000;
    }

    if (temporalMode === 'PAST') baseQ *= 0.45;
    if (temporalMode === 'EXTREME') baseQ *= 1.4;

    const q = Math.round(baseQ);
    const depth = Math.round((Math.pow(q, 0.38) * 0.42) * 10) / 10;
    const vel = Math.round((Math.pow(q, 0.22) * 0.85) * 10) / 10;
    const area = Math.round((Math.pow(q, 0.32) * 0.75) * 10) / 10;
    const arrival = inputs.damBreach ? 0.1 : Math.round((1200 / (vel * 60)) * 10) / 10;
    const duration = Math.round((18 + (q / 20000) * 12) * 10) / 10;
    const assets = depth > 30 ? 6 : depth > 15 ? 4 : depth > 5 ? 2 : 1;

    setCalculatedOutputs({
      peakDischargeM3s: q,
      floodAreaKm2: area,
      maxDepthM: depth,
      maxVelocityMs: vel,
      arrivalTimeMin: arrival,
      floodDurationHr: duration,
      affectedAssetsCount: assets,
      statisticalNotice: "Scenario envelope — probability not statistically calibrated.",
      uncertaintyRanges: {
        depth: `${Math.round(depth * 0.85 * 10) / 10} – ${Math.round(depth * 1.25 * 10) / 10} m`,
        velocity: `${Math.round(vel * 0.88 * 10) / 10} – ${Math.round(vel * 1.18 * 10) / 10} m/s`,
        discharge: `${Math.round(q * 0.82).toLocaleString()} – ${Math.round(q * 1.22).toLocaleString()} m³/s`,
        area: `${Math.round(area * 0.85 * 10) / 10} – ${Math.round(area * 1.22 * 10) / 10} km²`
      }
    });
  }, [inputs, temporalMode]);

  // Dedicated 14 Scientific Sections Quick-Launch Mapping
  const dedicatedModules: { id: PageId; name: string; icon: any; category: string; desc: string }[] = [
    { id: 'basin-intelligence', name: '1. Basin Intelligence', icon: GitBranch, category: 'HYDROLOGY', desc: 'Bhagirathi & Tehri catchment parameters' },
    { id: 'study-area', name: '2. River Network', icon: MapPin, category: 'HYDROLOGY', desc: 'Main river channel & elevation profiles' },
    { id: 'dam-reservoir', name: '3. Dam & Reservoir', icon: ShieldCheck, category: 'STRUCTURE', desc: 'Tehri Dam pool, spillways & breach parameters' },
    { id: 'rainfall', name: '4. Rainfall & SCS-CN', icon: Droplets, category: 'HYDROLOGY', desc: 'Hyetograph & soil curve number runoff' },
    { id: 'compound-flood', name: '5. Tributary Flash Flood', icon: Zap, category: 'HAZARD', desc: 'Multi-tributary coincidence & surge timing' },
    { id: 'climate', name: '6. Climate Risk', icon: Thermometer, category: 'FUTURE', desc: 'IPCC AR6 CMIP6 precipitation scaling' },
    { id: 'landslide', name: '7. Landslide Blockage', icon: Mountain, category: 'HAZARD', desc: 'Koti Nala blockage & dam failure wave' },
    { id: 'simulation', name: '8. Hydrodynamic Simulation', icon: Play, category: 'SOLVER', desc: '2D Shallow water & diffusive wave solver' },
    { id: 'multi-model', name: '9. AI / ANN Engine', icon: Cpu, category: 'AI', desc: 'Deep learning surrogate flood predictor' },
    { id: 'multi-model', name: '10. Model Comparison', icon: Layers, category: 'SOLVER', desc: 'HEC-RAS, Delft3D & SPH benchmark' },
    { id: 'realtime-sensors', name: '11. Real-Time Telemetry', icon: Radio, category: 'PRESENT', desc: 'CWC gauges & AWS sensor streams' },
    { id: 'predictive-ensemble', name: '12. Predictive Hazard', icon: Sparkles, category: 'ENSEMBLE', desc: 'Scenarios A-F multi-hazard ensemble' },
    { id: 'impact-analysis', name: '13. HADR Impact', icon: ShieldAlert, category: 'RESPONSE', desc: 'Downstream asset damage & shelter allocation' },
    { id: 'reports', name: '14. Scientific Reports', icon: FileText, category: 'EXPORT', desc: 'NTRO decision support dossier & GIS layers' }
  ];

  const temporalModeConfig: Record<TemporalMode, { title: string; color: string; desc: string; badge: string }> = {
    PAST: { title: 'PAST HISTORICAL', color: 'border-cyan-500 text-cyan-400 bg-cyan-950/40', desc: 'Historical Hydrology Baseline & 20-Year Return Periods', badge: 'REANALYSIS' },
    PRESENT: { title: 'PRESENT REAL-TIME', color: 'border-emerald-500 text-emerald-400 bg-emerald-950/40', desc: 'Live Telemetry & IoT Sensor Stream (CWC & AWS)', badge: 'LIVE IoT' },
    NEXT: { title: 'NEXT FORECAST', color: 'border-blue-500 text-blue-400 bg-blue-950/40', desc: 'Short-Term 24-72h Hydrodynamic Forecast Wave', badge: '24-72H RUN' },
    FUTURE: { title: 'FUTURE CLIMATE', color: 'border-purple-500 text-purple-400 bg-purple-950/40', desc: 'IPCC AR6 CMIP6 2030-2100 Projection Envelopes', badge: 'SSP3-7.0' },
    EXTREME: { title: 'EXTREME COMPOUND', color: 'border-rose-500 text-rose-400 bg-rose-950/40', desc: 'Multi-Hazard Stress Simulation (PMF + Breach + Landslide)', badge: 'STRESS TEST' }
  };

  const pipelineSteps: { id: PipelineStep; label: string }[] = [
    { id: 'DATA', label: 'DATA' },
    { id: 'HYDROLOGY', label: 'HYDROLOGY' },
    { id: 'SCENARIO', label: 'SCENARIO' },
    { id: 'SIMULATION', label: 'SIMULATION' },
    { id: 'PREDICTION', label: 'PREDICTION' },
    { id: 'IMPACT', label: 'IMPACT' },
    { id: 'HADR', label: 'HADR' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans space-y-4 pb-12">

      {/* TOP COMMAND CENTER HEADER BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Title & Badge */}
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <Activity className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white uppercase font-mono">
                Flood Intelligence Command Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                NTRO v3.0 INTELLIGENCE
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
              <span>Bhagirathi-Tehri Hydrodynamic Decision Support Platform</span>
              <span>•</span>
              <span className="text-emerald-400 font-mono flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>SOLVER ACTIVE</span>
              </span>
            </p>
          </div>
        </div>

        {/* TEMPORAL MODES TOGGLE (PAST | PRESENT | NEXT | FUTURE | EXTREME) */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800 space-x-1 overflow-x-auto">
          {(['PAST', 'PRESENT', 'NEXT', 'FUTURE', 'EXTREME'] as TemporalMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setTemporalMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                temporalMode === mode
                  ? temporalModeConfig[mode].color + ' shadow-md border ring-1 ring-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>{mode}</span>
              {temporalMode === mode && (
                <span className="text-[9px] px-1 rounded bg-black/40 border border-current">
                  {temporalModeConfig[mode].badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* QUICK NAVIGATION & LEGACY DASHBOARD BUTTON */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActivePage('3d-flood-twin')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-purple-950/70 hover:bg-purple-900/70 text-purple-300 border border-purple-700/50 transition-all flex items-center space-x-2 shadow-lg"
          >
            <Box className="w-4 h-4 text-purple-400" />
            <span>3D Flood Digital Twin</span>
          </button>

          <button
            onClick={() => setShowModuleGrid(!showModuleGrid)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center space-x-2"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>14 Scientific Modules</span>
          </button>

          <button
            onClick={() => setActivePage('dashboard')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 transition-all flex items-center space-x-2 shadow-lg"
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            <span>Legacy / Demo Dashboard</span>
          </button>
        </div>
      </div>

      {/* PIPELINE STEPPER BAR (DATA -> HYDROLOGY -> SCENARIO -> SIMULATION -> PREDICTION -> IMPACT -> HADR) */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between overflow-x-auto gap-2">
          {pipelineSteps.map((step, idx) => {
            const isActive = activeStep === step.id;
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setActiveStep(step.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center space-x-2 border min-w-[100px] ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600/30 via-blue-600/30 to-indigo-600/30 border-cyan-500 text-cyan-200 shadow-md ring-1 ring-cyan-400/30'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold font-mono ${
                    isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <span>{step.label}</span>
                </button>
                {idx < pipelineSteps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-700 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 14 DEDICATED SCIENTIFIC MODULES DRAWER (COLLAPSIBLE QUICK-LAUNCH GRID) */}
      {showModuleGrid && (
        <div className="bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-extrabold uppercase font-mono tracking-wider text-slate-100">
                Scientific Module Navigation Grid (14 Dedicated Engines)
              </h2>
            </div>
            <button
              onClick={() => setShowModuleGrid(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 font-mono"
            >
              Close Drawer ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {dedicatedModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.name}
                  onClick={() => {
                    setActivePage(mod.id);
                    setShowModuleGrid(false);
                  }}
                  className="p-3 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl cursor-pointer transition-all space-y-2 group shadow hover:shadow-cyan-500/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-slate-900 group-hover:bg-cyan-950/60 rounded-lg text-cyan-400 border border-slate-800 group-hover:border-cyan-500/30">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 group-hover:border-cyan-500/30">
                      {mod.category}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 font-mono">
                      {mod.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {mod.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN COMMAND CENTER 3-COLUMN LAYOUT: LEFT (INPUTS) | CENTER (MAP) | RIGHT (PREDICTION) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        
        {/* LEFT COLUMN: HAZARD INPUTS PANEL (3 COLUMNS) */}
        <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-4 shadow-xl backdrop-blur-md">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-200">
                Hazard Inputs
              </h2>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800">
              LIVE PARAMETERS
            </span>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[620px] pr-1 text-xs font-mono space-y-3">
            
            {/* Catchment & SCS-CN */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-semibold text-slate-300 flex items-center space-x-1">
                  <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                  <span>Catchment CN</span>
                </span>
                <span className="text-cyan-400 font-bold">{inputs.scsCn}</span>
              </div>
              <input
                type="range"
                min="55"
                max="95"
                value={inputs.scsCn}
                onChange={(e) => setInputs({ ...inputs, scsCn: Number(e.target.value) })}
                className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>55 (Permeable)</span>
                <span>95 (Saturated)</span>
              </div>
            </div>

            {/* Rainfall Intensity */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-semibold text-slate-300 flex items-center space-x-1">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Rainfall Intensity</span>
                </span>
                <span className="text-cyan-400 font-bold">{inputs.rainfallMm} mm</span>
              </div>
              <input
                type="range"
                min="30"
                max="450"
                step="10"
                value={inputs.rainfallMm}
                onChange={(e) => setInputs({ ...inputs, rainfallMm: Number(e.target.value) })}
                className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>30 mm (Moderate)</span>
                <span>450 mm (PMF Cloudburst)</span>
              </div>
            </div>

            {/* Reservoir Water Level */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-semibold text-slate-300 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tehri Reservoir Level</span>
                </span>
                <span className="text-indigo-400 font-bold">{inputs.reservoirLevelM} m</span>
              </div>
              <input
                type="range"
                min="740"
                max="840"
                step="0.5"
                value={inputs.reservoirLevelM}
                onChange={(e) => setInputs({ ...inputs, reservoirLevelM: Number(e.target.value) })}
                className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>740 m (MDDL)</span>
                <span>835 m (FRL)</span>
              </div>
            </div>

            {/* Tributaries Regime */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-300 flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Tributary Inflow Regime</span>
              </span>
              <select
                value={inputs.tributaryRegime}
                onChange={(e) => setInputs({ ...inputs, tributaryRegime: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 text-xs font-mono focus:border-cyan-500 focus:outline-none"
              >
                <option value="NORMAL">NORMAL (Bhilangana Ambient)</option>
                <option value="HIGH">HIGH (Monsoon Elevated)</option>
                <option value="FLASH_FLOOD">FLASH FLOOD (Bal Ganga Surge)</option>
                <option value="COINCIDENT_PEAK">COINCIDENT PEAK (All Tributaries)</option>
              </select>
            </div>

            {/* Climate Projections Scaling */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-semibold text-slate-300 flex items-center space-x-1">
                  <Thermometer className="w-3.5 h-3.5 text-purple-400" />
                  <span>Climate Scaling</span>
                </span>
                <span className="text-purple-400 font-bold">{inputs.climateScaling.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="1.35"
                step="0.05"
                value={inputs.climateScaling}
                onChange={(e) => setInputs({ ...inputs, climateScaling: Number(e.target.value) })}
                className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1.0x (Baseline)</span>
                <span>1.35x (2070 SSP5-8.5)</span>
              </div>
            </div>

            {/* Landslide Blockage */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-300 flex items-center space-x-1">
                <Mountain className="w-3.5 h-3.5 text-rose-400" />
                <span>Landslide River Blockage</span>
              </span>
              <select
                value={inputs.landslideBlockage}
                onChange={(e) => setInputs({ ...inputs, landslideBlockage: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 text-xs font-mono focus:border-cyan-500 focus:outline-none"
              >
                <option value="NONE">NONE (Clear Channel)</option>
                <option value="PARTIAL">PARTIAL BLOCKAGE (35% Ponding)</option>
                <option value="MAJOR_BLOCKAGE">MAJOR BLOCKAGE (85% Koti Nala Break)</option>
              </select>
            </div>

            {/* Main Dam Breach Trigger Toggle */}
            <div className="bg-rose-950/30 p-3 rounded-xl border border-rose-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-rose-300 flex items-center space-x-1 text-xs">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>Dam Breach Scenario</span>
                </span>
                <button
                  onClick={() => setInputs({ ...inputs, damBreach: !inputs.damBreach })}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    inputs.damBreach
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {inputs.damBreach ? 'BREACH ACTIVE' : 'NO BREACH'}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* CENTER COLUMN: LARGE INTERACTIVE GIS / 3D BASIN MAP (6 COLUMNS) */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3 shadow-xl backdrop-blur-md min-h-[500px]">
          
          {/* Map Controls Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-200">
                Interactive GIS & 3D Basin Canvas
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIs3DView(false)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                  !is3DView ? 'bg-cyan-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-400'
                }`}
              >
                2D GIS MAP
              </button>
              <button
                onClick={() => setIs3DView(true)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                  is3DView ? 'bg-purple-500 text-white shadow' : 'bg-slate-800 text-slate-400'
                }`}
              >
                3D TWIN MESH
              </button>
            </div>
          </div>

          {/* Interactive GIS Map Canvas Container */}
          <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950 min-h-[420px]">
            {!is3DView ? (
              <GISMapModule />
            ) : (
              <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center space-y-4 p-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-slate-950 to-cyan-950/40 opacity-70" />
                <div className="relative z-10 p-4 bg-slate-900/90 border border-indigo-500/30 rounded-2xl text-center space-y-3 max-w-md shadow-2xl backdrop-blur-xl">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center mx-auto text-indigo-400">
                    <Box className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono uppercase">
                      3D Digital Twin Mesh Rendering Active
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      High-resolution DEM elevation mesh (10m) with dynamic hydrodynamic wave propagation vectors.
                    </p>
                  </div>
                  <button
                    onClick={() => setActivePage('simulation-3d')}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold rounded-xl shadow-lg transition-all"
                  >
                    Open Full 3D Twin View ↗
                  </button>
                </div>
              </div>
            )}

            {/* Map Overlay Badge */}
            <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-mono text-cyan-300 backdrop-blur-md shadow-lg flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>TEHRI BASIN | BHAGIRATHI REACH (65.0 km)</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PREDICTION & HYDRAULICS PANEL (3 COLUMNS) */}
        <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-4 shadow-xl backdrop-blur-md">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-200">
                Prediction Outputs
              </h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800">
              HYDRODYNAMICS
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[620px] pr-1">
            
            {/* Peak Discharge */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Peak Discharge (Q_peak)</span>
                <span className="text-emerald-400 font-bold">m³/s</span>
              </div>
              <div className="text-xl font-extrabold text-white font-mono">
                {calculatedOutputs.peakDischargeM3s.toLocaleString()} <span className="text-xs text-slate-400">m³/s</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono bg-slate-900/80 p-1.5 rounded border border-slate-800">
                Uncertainty: {calculatedOutputs.uncertaintyRanges.discharge}
              </div>
            </div>

            {/* Flood Inundation Area */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Flood Area</span>
                <span className="text-blue-400 font-bold">km²</span>
              </div>
              <div className="text-lg font-extrabold text-blue-300 font-mono">
                {calculatedOutputs.floodAreaKm2} <span className="text-xs text-slate-400">km²</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono bg-slate-900/80 p-1.5 rounded border border-slate-800">
                Uncertainty: {calculatedOutputs.uncertaintyRanges.area}
              </div>
            </div>

            {/* Maximum Water Depth */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Maximum Water Depth</span>
                <span className="text-cyan-400 font-bold">m</span>
              </div>
              <div className="text-lg font-extrabold text-cyan-300 font-mono">
                {calculatedOutputs.maxDepthM} <span className="text-xs text-slate-400">m</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono bg-slate-900/80 p-1.5 rounded border border-slate-800">
                Uncertainty: {calculatedOutputs.uncertaintyRanges.depth}
              </div>
            </div>

            {/* Maximum Flow Velocity */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Maximum Velocity</span>
                <span className="text-amber-400 font-bold">m/s</span>
              </div>
              <div className="text-lg font-extrabold text-amber-300 font-mono">
                {calculatedOutputs.maxVelocityMs} <span className="text-xs text-slate-400">m/s</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono bg-slate-900/80 p-1.5 rounded border border-slate-800">
                Uncertainty: {calculatedOutputs.uncertaintyRanges.velocity}
              </div>
            </div>

            {/* Arrival Time & Duration */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono">Arrival Time</span>
                <div className="text-sm font-bold text-white font-mono mt-0.5">
                  {calculatedOutputs.arrivalTimeMin} min
                </div>
              </div>
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono">Flood Duration</span>
                <div className="text-sm font-bold text-white font-mono mt-0.5">
                  {calculatedOutputs.floodDurationHr} hr
                </div>
              </div>
            </div>

            {/* Affected Critical Infrastructure Assets */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-bold flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Affected Assets</span>
                </span>
                <span className="text-rose-400 font-bold px-2 py-0.5 rounded bg-rose-950 border border-rose-800">
                  {calculatedOutputs.affectedAssetsCount} CRITICAL
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300 font-mono">
                <div className="flex justify-between border-b border-slate-800 py-1">
                  <span>Tehri Power House Complex</span>
                  <span className="text-rose-400 font-bold">INUNDATED</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 py-1">
                  <span>Malitha Bridge & NH-34</span>
                  <span className="text-amber-400 font-bold">SUBMERGED</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>AIIMS Rishikesh Shelter</span>
                  <span className="text-emerald-400 font-bold">STANDBY</span>
                </div>
              </div>
            </div>

            {/* Mandatory Statistical Rigor Notice */}
            <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3 text-[11px] font-mono text-amber-300 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold uppercase text-amber-400">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Statistical Rigor Notice</span>
              </div>
              <p className="text-[10px] leading-relaxed text-amber-200/90">
                {calculatedOutputs.statisticalNotice}
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* BOTTOM PANEL: TIME-SERIES INTELLIGENCE DASHBOARD (HYDROGRAPH & TELEMETRY CHARTS) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-3">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-200">
              Bottom Time-Series Intelligence Dashboard (Rainfall • Runoff • Reservoir • Discharge • Velocity • Depth)
            </h2>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-2.5 py-0.5 rounded border border-cyan-800">
            24-HOUR CONTINUOUS FEED
          </span>
        </div>

        {/* Dynamic Hydrograph Chart Component */}
        <div className="h-64 bg-slate-950 rounded-xl border border-slate-800 p-2">
          <HydrographChart />
        </div>
      </div>

    </div>
  );
};

export default CommandCenterPage;
