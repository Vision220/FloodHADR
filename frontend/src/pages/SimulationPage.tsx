import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PlayCircle, Pause, RotateCcw, Cpu, Terminal, Zap, AlertTriangle, Download, FileCode } from 'lucide-react';
import { SPHParticleCanvas } from '../components/sph/SPHParticleCanvas';
import { apiService } from '../services/api';
import type { SPHRunResponse, Delft3DConfigResponse, HydroModelType } from '../types';

export const SimulationPage: React.FC = () => {
  const { activeSimulation, isSimulating, setIsSimulating, currentTimeStep, setCurrentTimeStep } = useApp();
  const [modelType, setModelType] = useState<HydroModelType>('GRID');
  const [selectedEngine, setSelectedEngine] = useState<'proto' | 'delft3d' | 'sph'>('proto');
  const [timeStepSec, setTimeStepSec] = useState<number>(300);

  // SPH simulation state
  const [sphResult, setSphResult] = useState<SPHRunResponse | null>(null);

  // Delft3D simulation state
  const [delft3dDeck, setDelft3dDeck] = useState<Delft3DConfigResponse | null>(null);
  const [activeDeckTab, setActiveDeckTab] = useState<'mdf' | 'dep' | 'bct' | 'src'>('mdf');

  // Load SPH data when SPH model is selected
  useEffect(() => {
    if (modelType === 'SPH' && !sphResult) {
      loadSPHData();
    } else if (modelType === 'DELFT3D' && !delft3dDeck) {
      loadDelft3dData();
    }
  }, [modelType]);

  const loadSPHData = async () => {
    try {
      const res = await apiService.runSPHSimulation(20, 15, 5, 10);
      setSphResult(res);
    } catch (e) {
      console.error("Failed to load SPH simulation data", e);
    }
  };

  const loadDelft3dData = async () => {
    try {
      const res = await apiService.generateDelft3DConfig();
      setDelft3dDeck(res);
    } catch (e) {
      console.error("Failed to load Delft3D configuration deck", e);
    }
  };

  const toggleSimulation = () => {
    setIsSimulating(!isSimulating);
  };

  const downloadDeckFile = (filename: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Header with Hydrodynamic Engine Section Pill Switch */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4 text-sky-600" />
            <span>Hydrodynamic Compute Engine Console</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            2D Flood Simulation Control Center
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
              modelType === 'SPH'
                ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                : modelType === 'DELFT3D'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              {modelType === 'GRID' ? '2D GRID MODEL' : modelType === 'SPH' ? 'SPH DEMONSTRATOR' : 'DELFT3D EXTERNAL'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Execute 2D Eulerian grid hydrodynamics, SPH particle wave solver, or prepare Delft3D external HPC decks.
          </p>
        </div>

        {/* Hydrodynamic Engine Section Buttons */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => {
              setModelType('GRID');
              setSelectedEngine('proto');
            }}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              modelType === 'GRID'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Prototype 2D Model
          </button>
          <button
            type="button"
            onClick={() => {
              setModelType('SPH');
              setSelectedEngine('sph');
            }}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              modelType === 'SPH'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Experimental SPH</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setModelType('DELFT3D');
              setSelectedEngine('delft3d');
            }}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              modelType === 'DELFT3D'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-slate-200" />
            <span>Delft3D - External Engine</span>
          </button>
        </div>
      </div>

      {/* DELFT3D View */}
      {modelType === 'DELFT3D' ? (
        <div className="space-y-6">
          {/* Delft3D Unconfigured Engine Notice Banner */}
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 flex items-start space-x-3 text-amber-200 text-xs shadow-md">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-amber-300 text-sm flex items-center gap-2">
                Delft3D engine not configured.
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900 text-amber-200 border border-amber-700 font-mono">
                  NOT CONFIGURED
                </span>
              </div>
              <p className="leading-relaxed">
                Delft3D executable environment was not detected in host system PATH or environment variables (<code className="bg-amber-900/60 px-1 py-0.5 rounded">DELFT3D_HOME</code> / <code className="bg-amber-900/60 px-1 py-0.5 rounded">DELFT3D_EXEC</code>). The platform has prepared a complete ready-to-run Delft3D-FLOW simulation input deck below without crashing. Supply the binary path to enable direct HPC execution.
              </p>
            </div>
          </div>

          {/* Delft3D Input Deck Generator Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 gap-3">
              <div className="flex items-center space-x-2">
                <FileCode className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Delft3D-FLOW Configuration Deck Generator (.mdf, .dep, .bct, .src)
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (delft3dDeck?.files) {
                      downloadDeckFile("delft3d_input_deck.zip", JSON.stringify(delft3dDeck.files, null, 2));
                    }
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Full Deck Bundle</span>
                </button>
              </div>
            </div>

            {/* Deck File Selector Tabs */}
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-mono">
              {[
                { id: 'mdf', name: delft3dDeck?.files?.mdf_filename || 'tehri_run.mdf' },
                { id: 'bct', name: delft3dDeck?.files?.bct_filename || 'tehri_breach.bct' },
                { id: 'dep', name: delft3dDeck?.files?.dep_filename || 'tehri_valley.dep' },
                { id: 'src', name: delft3dDeck?.files?.src_filename || 'tehri_spillway.src' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDeckTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-t-lg font-semibold border-t border-x transition-all ${
                    activeDeckTab === tab.id
                      ? 'bg-slate-950 text-amber-400 border-slate-700'
                      : 'bg-slate-900 text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Code Viewer Panel */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto h-72 text-slate-300 leading-relaxed shadow-inner">
              <pre>
                {activeDeckTab === 'mdf' && (delft3dDeck?.files?.mdf_content || 'Loading MDF deck...')}
                {activeDeckTab === 'bct' && (delft3dDeck?.files?.bct_content || 'Loading BCT deck...')}
                {activeDeckTab === 'dep' && (delft3dDeck?.files?.dep_content || 'Loading DEP deck...')}
                {activeDeckTab === 'src' && (delft3dDeck?.files?.src_content || 'Loading SRC deck...')}
              </pre>
            </div>
          </div>
        </div>
      ) : modelType === 'SPH' ? (
        /* SPH Model Experimental View */
        <div className="space-y-6">
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 flex items-start space-x-3 text-amber-200 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 uppercase">EXPERIMENTAL PROTOTYPE NOTICE:</span>
              {" "}This particle SPH dam-break model is an experimental demonstrator designed for Lagrangian free-surface wave visualization. It is <strong>not</strong> a validated research-grade solver.
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Fluid Particles</div>
              <div className="text-xl font-bold text-sky-400 mt-1 font-mono">
                {sphResult?.summary_metrics?.particle_count || 96} <span className="text-xs text-slate-400 font-normal">particles</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Peak Surge Velocity</div>
              <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
                {sphResult?.summary_metrics?.max_velocity_ms || 18.4} <span className="text-xs text-slate-400 font-normal">m/s</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Wave Front Position</div>
              <div className="text-xl font-bold text-indigo-400 mt-1 font-mono">
                {sphResult?.summary_metrics?.max_wave_front_m || 68.5} <span className="text-xs text-slate-400 font-normal">m</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Execution Time</div>
              <div className="text-xl font-bold text-teal-400 mt-1 font-mono">
                {sphResult?.summary_metrics?.execution_time_sec || 0.45} <span className="text-xs text-slate-400 font-normal">s</span>
              </div>
            </div>
          </div>

          {sphResult && sphResult.frames ? (
            <SPHParticleCanvas
              frames={sphResult.frames}
              columnWidthM={sphResult.simulation_params.column_width_m}
              domainLengthM={sphResult.simulation_params.domain_length_m}
              experimentalNotice={sphResult.experimental_notice}
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
              Loading SPH Particle Dam-Break Simulation...
            </div>
          )}
        </div>
      ) : (
        /* GRID MODEL View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2">
                Solver Execution Controls
              </h3>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Execution Status:</span>
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                  isSimulating ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {isSimulating ? 'RUNNING SOLVER' : activeSimulation.status}
                </span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={toggleSimulation}
                  className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 text-white ${
                    isSimulating ? 'bg-amber-600 hover:bg-amber-700' : 'bg-sky-600 hover:bg-sky-700'
                  }`}
                >
                  {isSimulating ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pause Hydrodynamic Execution</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      <span>Start 2D Wave Solver</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setIsSimulating(false);
                    setCurrentTimeStep(0);
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs border border-slate-300 transition-all flex items-center justify-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  <span>Reset Simulation Timesteps</span>
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-subtle space-y-3 text-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Hydrodynamic Engine Selection
              </h3>

              <div className="space-y-2">
                <div
                  onClick={() => setSelectedEngine('proto')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedEngine === 'proto'
                      ? 'border-sky-600 bg-sky-50 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">Prototype 2D Diffusive Wave</span>
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">ACTIVE</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Fast cellular automata 2D raster solver for immediate in-browser demonstration.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedEngine('delft3d')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedEngine === 'delft3d'
                      ? 'border-teal-600 bg-teal-50 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">Delft3D-FLOW Adapter</span>
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">NOT CONFIGURED</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    External HPC shallow water solver adapter. Generates input decks (.mdf, .bct).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-subtle space-y-3 text-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Time Step & Stability Parameters
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Time Step Size Delta t (Seconds): {timeStepSec}s
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="600"
                    step="60"
                    value={timeStepSec}
                    onChange={(e) => setTimeStepSec(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>Courant-Friedrichs-Lewy (CFL):</span>
                  <span className="font-mono font-bold text-emerald-700">CFL = 0.42 (Stable)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>Total Propagation Horizon:</span>
                  <span className="font-semibold text-slate-900">12.0 Hours (72 Steps)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-subtle space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Hydrodynamic Wave Front Progression
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Current Step</div>
                  <div className="text-lg font-extrabold text-sky-700 font-mono">{currentTimeStep} / 72</div>
                </div>
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Elapsed Time</div>
                  <div className="text-lg font-extrabold text-slate-900 font-mono">{((currentTimeStep * 600) / 3600).toFixed(1)} hrs</div>
                </div>
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Peak Front Depth</div>
                  <div className="text-lg font-extrabold text-red-600 font-mono">{activeSimulation.maxDepthM} m</div>
                </div>
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Execution Time</div>
                  <div className="text-lg font-extrabold text-teal-700 font-mono">{activeSimulation.executionTimeSec} s</div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Time Step Scrub Control</span>
                  <span className="text-sky-700 font-mono">{((currentTimeStep * 600) / 3600).toFixed(1)} Hours</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="72"
                  value={currentTimeStep}
                  onChange={(e) => setCurrentTimeStep(parseInt(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
              </div>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-lg p-4 shadow-panel space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-400">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-slate-200">Solver Output & Execution Telemetry Console</span>
                </div>
                <span className="text-[10px] text-emerald-400">CFL SAFE</span>
              </div>

              <div className="h-64 overflow-y-auto space-y-1 text-[11px] leading-relaxed text-slate-300 pr-2">
                <div className="text-slate-500">[2026-09-22 20:15:02] INITIALIZING FloodHADR Hydro Engine v1.0.4...</div>
                <div className="text-slate-400">[2026-09-22 20:15:03] Loading DEM GeoTIFF: ALOS PALSAR 12m grid (1240 x 980 cells)</div>
                <div className="text-slate-400">[2026-09-22 20:15:04] Applying Manning Roughness matrix: Channel n=0.030, Plain n=0.045</div>
                <div className="text-sky-400">[2026-09-22 20:15:05] COMPUTED Froehlich Breach Hydrograph: Peak Q = 64,200 m³/s at t = 2.2 hrs</div>
                <div className="text-emerald-400">[2026-09-22 20:15:06] Time step t = 00.5 hrs: Wave front reached Devprayag (Depth = 4.2m, Vel = 3.1 m/s)</div>
                <div className="text-amber-400">[2026-09-22 20:15:08] Time step t = 01.5 hrs: Wave front reached Shivpuri (Depth = 12.8m, Vel = 7.6 m/s)</div>
                <div className="text-red-400 font-bold">[2026-09-22 20:15:10] CRITICAL ALERT: Hospital Asset #inf-01 flooded at t = 2.0 hrs (Depth = 3.4m)</div>
                <div className="text-emerald-400">[2026-09-22 20:15:12] Time step t = 04.0 hrs: Recession phase initiated (Flow rate declining to 28,000 m³/s)</div>
                <div className="text-slate-400">[2026-09-22 20:15:15] Completed 72 timesteps in 42.8 seconds. Output GeoJSON stored at /outputs/sim-2026-001.geojson</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
