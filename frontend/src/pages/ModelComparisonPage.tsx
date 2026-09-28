import React, { useState, useEffect } from 'react';
import {
  Cpu,
  ShieldAlert,
  Waves,
  Droplets,
  Zap,
  Clock,
  Mountain,
  TrendingUp,
  Map as MapIcon,
  BarChart3,
  AlertTriangle
} from 'lucide-react';

interface PairComparisonResponse {
  status: string;
  model_a: string;
  model_b: string;
  scenario_a_id: string;
  scenario_b_id: string;
  scenario_mismatch: boolean;
  scenario_mismatch_warning: string | null;
  common_spatial_domain: {
    dem_source: string;
    grid_rows: number;
    grid_cols: number;
    resolution_m: number;
    crs: string;
    map_extent_wgs84: number[][];
    time_min: number;
  };
  views_data: {
    flood_extent: {
      model_a_extent_km2: number;
      model_b_extent_km2: number;
      intersection_area_km2: number;
      union_area_km2: number;
      area_difference_km2: number;
      iou: number;
      precision: number;
      recall: number;
      f1_score: number;
      extent_mask_a: number[][];
      extent_mask_b: number[][];
    };
    depth: {
      max_depth_a_m: number;
      max_depth_b_m: number;
      depth_rmse_m: number;
      depth_mae_m: number;
      depth_grid_a: number[][];
      depth_grid_b: number[][];
    };
    velocity: {
      max_velocity_a_ms: number;
      max_velocity_b_ms: number;
      velocity_rmse_ms: number;
      velocity_mae_ms: number;
      velocity_grid_a: number[][];
      velocity_grid_b: number[][];
    };
    arrival_time: {
      mean_arrival_a_min: number;
      mean_arrival_b_min: number;
      arrival_delay_min: number;
      arrival_grid_a: number[][];
      arrival_grid_b: number[][];
    };
    water_surface: {
      max_wse_a_m: number;
      max_wse_b_m: number;
      wse_grid_a: number[][];
      wse_grid_b: number[][];
      wse_diff_grid: number[][];
    };
    hydrograph: {
      time_series_hr: number[];
      hydrograph_a_m3s: number[];
      hydrograph_b_m3s: number[];
      peak_discharge_a_m3s: number;
      peak_discharge_b_m3s: number;
      peak_discharge_diff_m3s: number;
      peak_timing_diff_min: number;
      hydrograph_rmse: number;
      hydrograph_mae: number;
      nse: number;
      kge: number;
    };
    difference_map: {
      abs_depth_diff_grid: number[][];
      rel_depth_diff_pct_grid: number[][];
      abs_vel_diff_grid: number[][];
      rel_vel_diff_pct_grid: number[][];
      extent_disagreement_categorical_grid: number[][];
    };
    statistics: {
      summary_metrics: Record<string, number>;
      non_declaration_notice: string;
    };
  };
}

const AVAILABLE_MODELS = [
  'FloodHADR SWE',
  'FloodHADR DWE',
  'HEC-RAS SWE',
  'HEC-RAS DWE'
];

const AVAILABLE_SCENARIOS = [
  { id: 'TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO', label: 'PMF Overtopping Failure' },
  { id: 'TEHRI_FRL_BREACH', label: 'FRL Piping Breach' },
  { id: 'TEHRI_MDDL_BREACH', label: 'MDDL Low-Storage Breach' },
  { id: 'TEHRI_PMF_NO_FAILURE', label: 'PMF Routing No Failure' }
];

const VIEWS = [
  { id: 'flood_extent', name: 'Flood Extent', icon: Waves },
  { id: 'depth', name: 'Water Depth', icon: Droplets },
  { id: 'velocity', name: 'Flow Velocity', icon: Zap },
  { id: 'arrival_time', name: 'Arrival Time', icon: Clock },
  { id: 'water_surface', name: 'Water Surface', icon: Mountain },
  { id: 'hydrograph', name: 'Hydrograph', icon: TrendingUp },
  { id: 'difference_map', name: 'Difference Map', icon: MapIcon },
  { id: 'statistics', name: 'Statistics', icon: BarChart3 }
];

export const ModelComparisonPage: React.FC = () => {
  const [modelA, setModelA] = useState<string>('FloodHADR SWE');
  const [modelB, setModelB] = useState<string>('HEC-RAS SWE');
  const [scenarioA, setScenarioA] = useState<string>('TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO');
  const [scenarioB, setScenarioB] = useState<string>('TEHRI_PMF_OVERTOPPING_FAILURE_SCENARIO');
  const [activeView, setActiveView] = useState<string>('flood_extent');
  const [diffSubMode, setDiffSubMode] = useState<'abs_depth' | 'rel_depth' | 'abs_vel' | 'categorical'>('abs_depth');

  const [comparisonData, setComparisonData] = useState<PairComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchPairComparison();
  }, [modelA, modelB, scenarioA, scenarioB]);

  const fetchPairComparison = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/multi-model/comparison-studio/compare-pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_a: modelA,
          model_b: modelB,
          scenario_a_id: scenarioA,
          scenario_b_id: scenarioB,
          time_min: 60.0
        })
      });
      if (res.ok) {
        const data: PairComparisonResponse = await res.json();
        setComparisonData(data);
      }
    } catch (err) {
      console.error('Pair comparison fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const vd = comparisonData?.views_data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              Professional Model Comparison Studio
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                PHASE 38 EVALUATION
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Comparative Hydraulic Evaluation Engine across FloodHADR SWE/DWE & HEC-RAS 2D SWE/DWE
            </p>
          </div>
        </div>

        {/* Spatial Domain Badge */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-4 text-xs font-mono text-slate-300">
          <div><span className="text-slate-500">DEM:</span> ALOS PALSAR 12.5m</div>
          <div><span className="text-slate-500">CRS:</span> EPSG:32644</div>
          <div><span className="text-slate-500">GRID:</span> 30x30 @ 25m</div>
        </div>
      </div>

      {/* Scenario Mismatch Warning Banner */}
      {comparisonData?.scenario_mismatch && (
        <div className="bg-amber-950/80 border-2 border-amber-500/60 rounded-2xl p-4 flex items-center gap-4 text-amber-200 shadow-lg shadow-amber-950/40 animate-pulse">
          <AlertTriangle className="w-7 h-7 text-amber-400 flex-shrink-0" />
          <div>
            <div className="font-bold text-sm tracking-wide text-amber-300 uppercase">
              SCENARIO MISMATCH WARNING
            </div>
            <div className="text-xs mt-0.5 text-amber-200">
              {comparisonData.scenario_mismatch_warning}
            </div>
          </div>
        </div>
      )}

      {/* Model & Scenario Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        {/* Model A Box */}
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Model A (Primary Target)</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 font-mono">SELECTED</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Model Solver</label>
              <select
                value={modelA}
                onChange={(e) => setModelA(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg p-2 font-semibold focus:border-indigo-500 focus:outline-none"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Scenario Boundary</label>
              <select
                value={scenarioA}
                onChange={(e) => setScenarioA(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg p-2 font-medium focus:border-indigo-500 focus:outline-none"
              >
                {AVAILABLE_SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Model B Box */}
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Model B (Reference Baseline)</span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 font-mono">SELECTED</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Model Solver</label>
              <select
                value={modelB}
                onChange={(e) => setModelB(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg p-2 font-semibold focus:border-cyan-500 focus:outline-none"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Scenario Boundary</label>
              <select
                value={scenarioB}
                onChange={(e) => setScenarioB(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg p-2 font-medium focus:border-cyan-500 focus:outline-none"
              >
                {AVAILABLE_SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Views Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {VIEWS.map((v) => {
          const Icon = v.icon;
          const active = activeView === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {v.name}
            </button>
          );
        })}
      </div>

      {/* View Content Panels */}
      {loading ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          Loading Model Comparison Studio Data...
        </div>
      ) : vd ? (
        <div className="space-y-6">
          {/* VIEW 1: FLOOD EXTENT */}
          {activeView === 'flood_extent' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Model A Inundation Area</div>
                  <div className="text-xl font-bold text-indigo-400 font-mono mt-1">
                    {vd.flood_extent.model_a_extent_km2} km²
                  </div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Model B Inundation Area</div>
                  <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
                    {vd.flood_extent.model_b_extent_km2} km²
                  </div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Intersection Area (TP)</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                    {vd.flood_extent.intersection_area_km2} km²
                  </div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Spatial IoU Overlap</div>
                  <div className="text-xl font-bold text-purple-400 font-mono mt-1">
                    {(vd.flood_extent.iou * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Spatial Metrics Detailed Cards */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Waves className="w-4 h-4 text-indigo-400" />
                  Spatial Extent Overlap & Fit Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                  <div className="p-3 bg-slate-950 rounded-lg">
                    <span className="text-slate-400 font-sans block text-[10px]">Precision</span>
                    <span className="text-indigo-300 font-bold text-base">{vd.flood_extent.precision}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg">
                    <span className="text-slate-400 font-sans block text-[10px]">Recall</span>
                    <span className="text-cyan-300 font-bold text-base">{vd.flood_extent.recall}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg">
                    <span className="text-slate-400 font-sans block text-[10px]">F1 Score</span>
                    <span className="text-emerald-300 font-bold text-base">{vd.flood_extent.f1_score}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg">
                    <span className="text-slate-400 font-sans block text-[10px]">Delta Area</span>
                    <span className="text-amber-300 font-bold text-base">{vd.flood_extent.area_difference_km2} km²</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: WATER DEPTH */}
          {activeView === 'depth' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Max Depth (Model A)</div>
                  <div className="text-xl font-bold text-indigo-400 font-mono mt-1">
                    {vd.depth.max_depth_a_m} m
                  </div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Max Depth (Model B)</div>
                  <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
                    {vd.depth.max_depth_b_m} m
                  </div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Depth RMSE</div>
                  <div className="text-xl font-bold text-amber-400 font-mono mt-1">
                    {vd.depth.depth_rmse_m} m
                  </div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Depth MAE</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                    {vd.depth.depth_mae_m} m
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: FLOW VELOCITY */}
          {activeView === 'velocity' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Max Velocity (Model A)</div>
                  <div className="text-xl font-bold text-indigo-400 font-mono mt-1">
                    {vd.velocity.max_velocity_a_ms} m/s
                  </div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Max Velocity (Model B)</div>
                  <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
                    {vd.velocity.max_velocity_b_ms} m/s
                  </div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Velocity RMSE</div>
                  <div className="text-xl font-bold text-amber-400 font-mono mt-1">
                    {vd.velocity.velocity_rmse_ms} m/s
                  </div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Velocity MAE</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                    {vd.velocity.velocity_mae_ms} m/s
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: ARRIVAL TIME */}
          {activeView === 'arrival_time' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Mean Arrival Time (Model A)</div>
                  <div className="text-xl font-bold text-indigo-400 font-mono mt-1">
                    {vd.arrival_time.mean_arrival_a_min} min
                  </div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Mean Arrival Time (Model B)</div>
                  <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
                    {vd.arrival_time.mean_arrival_b_min} min
                  </div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Arrival Lag / Delay</div>
                  <div className="text-xl font-bold text-amber-400 font-mono mt-1">
                    {vd.arrival_time.arrival_delay_min} min
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: WATER SURFACE ELEVATION */}
          {activeView === 'water_surface' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Max WSE Stage (Model A)</div>
                  <div className="text-xl font-bold text-indigo-400 font-mono mt-1">
                    {vd.water_surface.max_wse_a_m} m MSL
                  </div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Max WSE Stage (Model B)</div>
                  <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
                    {vd.water_surface.max_wse_b_m} m MSL
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 6: HYDROGRAPH */}
          {activeView === 'hydrograph' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Peak Discharge (Model A)</div>
                  <div className="text-xl font-bold text-indigo-400 font-mono mt-1">
                    {vd.hydrograph.peak_discharge_a_m3s.toLocaleString()} m³/s
                  </div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">Peak Discharge (Model B)</div>
                  <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
                    {vd.hydrograph.peak_discharge_b_m3s.toLocaleString()} m³/s
                  </div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">NSE Efficiency</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                    {vd.hydrograph.nse}
                  </div>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400">KGE Efficiency</div>
                  <div className="text-xl font-bold text-purple-400 font-mono mt-1">
                    {vd.hydrograph.kge}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 7: DIFFERENCE MAP */}
          {activeView === 'difference_map' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 w-fit text-xs font-semibold">
                <button
                  onClick={() => setDiffSubMode('abs_depth')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    diffSubMode === 'abs_depth' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Absolute Depth Diff (|h_A - h_B|)
                </button>
                <button
                  onClick={() => setDiffSubMode('rel_depth')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    diffSubMode === 'rel_depth' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Relative Depth Diff (%)
                </button>
                <button
                  onClick={() => setDiffSubMode('abs_vel')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    diffSubMode === 'abs_vel' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Velocity Diff (|v_A - v_B|)
                </button>
                <button
                  onClick={() => setDiffSubMode('categorical')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    diffSubMode === 'categorical' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Categorical Extent (TP/FP/FN)
                </button>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-xs font-mono">
                <div className="text-slate-400 mb-2">Displaying mode: <span className="text-indigo-400 font-bold">{diffSubMode.toUpperCase()}</span></div>
                <div className="p-4 bg-slate-950 rounded-xl text-slate-300">
                  Spatial difference grid computed across 30x30 DEM domain. Residual boundaries reflect physical solver formulation differences.
                </div>
              </div>
            </div>
          )}

          {/* VIEW 8: STATISTICS */}
          {activeView === 'statistics' && (
            <div className="space-y-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  Full Comparative Evaluation Matrix
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60 font-sans">
                        <th className="p-3">Evaluation Metric</th>
                        <th className="p-3">Value</th>
                        <th className="p-3">Interpretation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      <tr>
                        <td className="p-3 font-sans font-medium text-white">Spatial Extent IoU</td>
                        <td className="p-3 text-indigo-300 font-bold">{vd.statistics.summary_metrics.extent_iou}</td>
                        <td className="p-3 text-slate-400 font-sans">Intersection over Union overlap across 12.5m grid</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-sans font-medium text-white">Depth RMSE / MAE</td>
                        <td className="p-3 text-cyan-300 font-bold">{vd.statistics.summary_metrics.depth_rmse_m} m / {vd.statistics.summary_metrics.depth_mae_m} m</td>
                        <td className="p-3 text-slate-400 font-sans">Root Mean Square & Mean Absolute depth residuals</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-sans font-medium text-white">Velocity RMSE / MAE</td>
                        <td className="p-3 text-amber-300 font-bold">{vd.statistics.summary_metrics.velocity_rmse_ms} m/s / {vd.statistics.summary_metrics.velocity_mae_ms} m/s</td>
                        <td className="p-3 text-slate-400 font-sans">Flow velocity vector magnitude error</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-sans font-medium text-white">Hydrograph NSE / KGE</td>
                        <td className="p-3 text-emerald-300 font-bold">{vd.statistics.summary_metrics.hydrograph_nse} / {vd.statistics.summary_metrics.hydrograph_kge}</td>
                        <td className="p-3 text-slate-400 font-sans">Nash-Sutcliffe & Kling-Gupta hydrograph efficiency</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-xs text-slate-300 flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <div>{vd.statistics.non_declaration_notice}</div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
