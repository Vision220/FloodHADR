import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Activity,
  Layers,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Droplets,
  Wind,
  Clock,
  Maximize2,
  AlertOctagon
} from 'lucide-react';

interface ScenarioDefinition {
  id: string;
  code: string;
  envelope: string;
  name: string;
  description: string;
  rainfall_mm: number;
  scs_cn: number;
  reservoir_level_m: number;
  dam_breach: boolean;
  tributary_regime: string;
  landslide_blockage: string;
  climate_scaling: number;
  risk_color: string;
}

interface AffectedAsset {
  asset_id: string;
  asset_name: string;
  asset_type: string;
  criticality: string;
  status: string;
  inundation_depth_m: number;
  velocity_ms: number;
}

interface EnsembleScenarioResult {
  scenario: ScenarioDefinition;
  calculated_hydraulics: {
    peak_discharge_m3s: number;
    max_water_depth_m: number;
    max_velocity_ms: number;
    flood_inundation_area_km2: number;
    peak_arrival_time_min: number;
    flood_duration_hr: number;
    runoff_depth_mm: number;
    tributary_surge_m3s: number;
    landslide_surge_m3s: number;
  };
  uncertainty_ranges: {
    peak_discharge_range_m3s: string;
    max_water_depth_range_m: string;
    max_velocity_range_ms: string;
    flood_inundation_area_range_km2: string;
  };
  affected_assets_count: number;
  affected_assets: AffectedAsset[];
  statistical_rigor_notice: string;
}

interface FullEnsembleResponse {
  status: string;
  engine_metadata: {
    engine_name: string;
    version: string;
    scenario_count: number;
  };
  ensemble_matrix: EnsembleScenarioResult[];
  statistical_rigor_notice: string;
}

export const PredictiveEnsemblePage: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('SCEN_E');
  const [ensembleData, setEnsembleData] = useState<FullEnsembleResponse | null>(null);
  const [selectedResult, setSelectedResult] = useState<EnsembleScenarioResult | null>(null);

  useEffect(() => {
    fetchEnsemble();
  }, []);

  useEffect(() => {
    if (ensembleData && ensembleData.ensemble_matrix) {
      const match = ensembleData.ensemble_matrix.find((x) => x.scenario.id === selectedScenarioId);
      if (match) {
        setSelectedResult(match);
      }
    }
  }, [selectedScenarioId, ensembleData]);

  const fetchEnsemble = async () => {
    try {
      const res = await fetch('/api/predictive/ensemble-matrix');
      if (res.ok) {
        const data: FullEnsembleResponse = await res.json();
        setEnsembleData(data);
        if (data.ensemble_matrix.length > 0) {
          setScenarios(data.ensemble_matrix.map((x) => x.scenario));
          const match = data.ensemble_matrix.find((x) => x.scenario.id === 'SCEN_E') || data.ensemble_matrix[4];
          setSelectedResult(match);
        }
      }
    } catch (err) {
      console.error('Failed to fetch predictive ensemble:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                Predictive Flood Intelligence & Ensemble Scenarios
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                  PHASE 11 ENSEMBLE AI
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Master pipeline: Rain + SCS-CN + Tributaries + Dam Breach + Climate + Landslide + Real-Time Telemetry
              </p>
            </div>
          </div>
        </div>

        {/* Statistical Rigor Notice Badge */}
        <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <div className="text-xs font-bold text-amber-300 tracking-wide uppercase">
              STATISTICAL CALIBRATION DIRECTIVE
            </div>
            <div className="text-xs font-semibold text-amber-200">
              {selectedResult?.statistical_rigor_notice || 'Scenario envelope — probability not statistically calibrated.'}
            </div>
          </div>
        </div>
      </div>

      {/* Ensemble Scenarios Selector Cards (Scenarios A through F) */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-400" />
          Select Ensemble Scenario (Scenarios A through F)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {scenarios.map((sc) => {
            const isSelected = sc.id === selectedScenarioId;
            return (
              <button
                key={sc.id}
                onClick={() => setSelectedScenarioId(sc.id)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-purple-500/60 ring-2 ring-purple-500/30 shadow-lg shadow-purple-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded text-white"
                    style={{ backgroundColor: sc.risk_color }}
                  >
                    {sc.code}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                </div>
                <div className="mt-2 text-xs font-bold text-slate-200">{sc.envelope}</div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{sc.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Scenario Hydraulic & Uncertainty Results */}
      {selectedResult && (
        <div className="space-y-6">
          {/* Active Scenario Banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-3 py-1 rounded text-white" style={{ backgroundColor: selectedResult.scenario.risk_color }}>
                {selectedResult.scenario.code} — {selectedResult.scenario.envelope}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Rainfall: {selectedResult.scenario.rainfall_mm}mm | CN: {selectedResult.scenario.scs_cn} | Dam: {selectedResult.scenario.dam_breach ? 'BREACH' : 'INTACT'}
              </span>
            </div>
            <div className="text-lg font-bold text-white">{selectedResult.scenario.name}</div>
            <div className="text-xs text-slate-400">{selectedResult.scenario.description}</div>
          </div>

          {/* Key Metrics with Explicit Uncertainty Ranges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-4">
              <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-rose-400" />
                Peak Discharge Q
              </div>
              <div className="text-2xl font-black text-rose-400 mt-2 font-mono">
                {selectedResult.calculated_hydraulics.peak_discharge_m3s.toLocaleString()}
                <span className="text-sm font-normal text-slate-400 ml-1">m³/s</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Range: {selectedResult.uncertainty_ranges.peak_discharge_range_m3s}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-4">
              <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-cyan-400" />
                Max Water Depth
              </div>
              <div className="text-2xl font-black text-cyan-400 mt-2 font-mono">
                {selectedResult.calculated_hydraulics.max_water_depth_m}
                <span className="text-sm font-normal text-slate-400 ml-1">m</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Range: {selectedResult.uncertainty_ranges.max_water_depth_range_m}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4">
              <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-amber-400" />
                Max Velocity
              </div>
              <div className="text-2xl font-black text-amber-400 mt-2 font-mono">
                {selectedResult.calculated_hydraulics.max_velocity_ms}
                <span className="text-sm font-normal text-slate-400 ml-1">m/s</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Range: {selectedResult.uncertainty_ranges.max_velocity_range_ms}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-4">
              <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-purple-400" />
                Inundation Area
              </div>
              <div className="text-2xl font-black text-purple-400 mt-2 font-mono">
                {selectedResult.calculated_hydraulics.flood_inundation_area_km2}
                <span className="text-sm font-normal text-slate-400 ml-1">km²</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Range: {selectedResult.uncertainty_ranges.flood_inundation_area_range_km2}
              </div>
            </div>
          </div>

          {/* Affected Assets & Timing Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Impacted Critical Assets List */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                  Impacted Critical Assets ({selectedResult.affected_assets_count} Assets)
                </h3>
              </div>

              <div className="space-y-2">
                {selectedResult.affected_assets.map((asset) => (
                  <div key={asset.asset_id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{asset.asset_name}</div>
                      <div className="text-[11px] text-slate-400">{asset.asset_type}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-rose-400 font-bold">{asset.inundation_depth_m}m depth</div>
                      <div className="text-[11px] text-amber-300">{asset.velocity_ms} m/s</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scenario Timing & Superposition Breakdown */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Timing & Pipeline Hydraulics Breakdown
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Peak Arrival Time</div>
                  <div className="text-lg font-bold text-cyan-400 mt-1 font-mono">
                    {selectedResult.calculated_hydraulics.peak_arrival_time_min} mins
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Flood Duration</div>
                  <div className="text-lg font-bold text-purple-400 mt-1 font-mono">
                    {selectedResult.calculated_hydraulics.flood_duration_hr} hrs
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Tributaries Surge Q</div>
                  <div className="text-base font-bold text-amber-400 mt-1 font-mono">
                    {selectedResult.calculated_hydraulics.tributary_surge_m3s.toLocaleString()} m³/s
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Landslide Dam Surge Q</div>
                  <div className="text-base font-bold text-rose-400 mt-1 font-mono">
                    {selectedResult.calculated_hydraulics.landslide_surge_m3s.toLocaleString()} m³/s
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Ensemble Comparison Matrix Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          Full Ensemble Scenario Matrix (Scenarios A through F)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
                <th className="p-3">Scenario</th>
                <th className="p-3">Envelope Range</th>
                <th className="p-3">Peak Q Range (Uncertainty Bounds)</th>
                <th className="p-3">Max Depth Range</th>
                <th className="p-3">Max Velocity Range</th>
                <th className="p-3">Inundation Area Range</th>
                <th className="p-3">Assets Impacted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
              {ensembleData?.ensemble_matrix.map((item) => (
                <tr key={item.scenario.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-sans font-bold text-white">
                    <span className="px-2 py-0.5 rounded text-[11px] text-white" style={{ backgroundColor: item.scenario.risk_color }}>
                      {item.scenario.code}
                    </span>
                  </td>
                  <td className="p-3 font-sans font-semibold text-slate-300">{item.scenario.envelope}</td>
                  <td className="p-3 text-rose-400 font-bold">{item.uncertainty_ranges.peak_discharge_range_m3s}</td>
                  <td className="p-3 text-cyan-400 font-bold">{item.uncertainty_ranges.max_water_depth_range_m}</td>
                  <td className="p-3 text-amber-400 font-bold">{item.uncertainty_ranges.max_velocity_range_ms}</td>
                  <td className="p-3 text-purple-400 font-bold">{item.uncertainty_ranges.flood_inundation_area_range_km2}</td>
                  <td className="p-3 font-sans font-semibold text-rose-300">{item.affected_assets_count} Assets</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
