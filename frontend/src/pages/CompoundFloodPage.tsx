import React, { useState, useEffect } from 'react';
import {
  Zap,
  Activity,
  Layers,
  AlertTriangle,
  GitMerge,
  Droplets,
  Wind,
  Clock,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  ArrowDownRight
} from 'lucide-react';

interface ScenarioPreset {
  id: string;
  name: string;
  code: string;
  description: string;
  dam_breach: boolean;
  main_river_flow_m3s: number;
  reservoir_water_level_m: number;
  tributary_regime: string;
  rainfall_mm: number;
  classification_label: string;
  risk_color: string;
}

interface ConfluenceJunction {
  junction_name: string;
  tributary_name: string;
  tributary_discharge_m3s: number;
  contribution_percentage: number;
  arrival_time_min: number;
  backwater_stage_increase_m: number;
  coordinates: [number, number];
}

interface CompoundSimulationResult {
  status: string;
  scenario_preset: ScenarioPreset;
  hazard_components: {
    main_river_flow_m3s: number;
    reservoir_spillway_release_m3s: number;
    dam_breach_outflow_m3s: number;
    total_tributaries_discharge_m3s: number;
    dam_breach_active: boolean;
  };
  combined_downstream_hydraulics: {
    combined_peak_discharge_m3s: number;
    combined_water_depth_m: number;
    combined_velocity_ms: number;
    downstream_peak_arrival_time_hr: number;
  };
  confluence_junctions: ConfluenceJunction[];
  statistical_classification: {
    label: string;
    probability_statement: string;
    statistical_notice: string;
  };
}

export const CompoundFloodPage: React.FC = () => {
  const [presets, setPresets] = useState<ScenarioPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('scen-extreme-stress');
  const [tributaryRegime, setTributaryRegime] = useState<string>('COINCIDENT_PEAK');
  const [damBreach, setDamBreach] = useState<boolean>(true);
  const [rainfallMm, setRainfallMm] = useState<number>(350);
  const [result, setResult] = useState<CompoundSimulationResult | null>(null);

  useEffect(() => {
    fetchPresets();
  }, []);

  useEffect(() => {
    runSimulation();
  }, [selectedPresetId, tributaryRegime, damBreach, rainfallMm]);

  const fetchPresets = async () => {
    try {
      const res = await fetch('/api/compound-flood/scenarios');
      if (res.ok) {
        const data: ScenarioPreset[] = await res.json();
        setPresets(data);
      }
    } catch (err) {
      console.error('Failed to fetch compound flood scenarios:', err);
    }
  };

  const handleSelectPreset = (p: ScenarioPreset) => {
    setSelectedPresetId(p.id);
    setTributaryRegime(p.tributary_regime);
    setDamBreach(p.dam_breach);
    setRainfallMm(p.rainfall_mm);
  };

  const runSimulation = async () => {
    try {
      const res = await fetch('/api/compound-flood/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_preset_id: selectedPresetId,
          include_dam_breach: damBreach,
          custom_rainfall_mm: rainfallMm,
          tributary_regime: tributaryRegime
        })
      });
      if (res.ok) {
        const data: CompoundSimulationResult = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Compound simulation error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                Compound Flood & Tributary Flash-Flood Engine
                <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
                  PHASE 5 MULTI-HAZARD
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Superposition Hydrodynamics: Extreme Rainfall + Tributary Surge + Reservoir Spill + Dam Break
              </p>
            </div>
          </div>
        </div>

        {/* Statistical classification badge */}
        <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <div className="text-xs font-bold text-amber-300 tracking-wide uppercase">
              CLASSIFICATION METHODOLOGY
            </div>
            <div className="text-sm font-semibold text-amber-200">
              SCENARIO-BASED EXTREME CASE
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Presets Range */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          Select Compound Scenario Range Preset
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {presets.map((p) => {
            const isSelected = p.id === selectedPresetId;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-rose-500/60 ring-2 ring-rose-500/30 shadow-lg shadow-rose-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded text-white"
                    style={{ backgroundColor: p.risk_color }}
                  >
                    {p.name}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-200">{p.code}</div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.description}</div>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>Rain: {p.rainfall_mm}mm</span>
                  <span>Dam: {p.dam_breach ? 'BREACH' : 'INTACT'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Panel & Superposition Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-rose-400" />
            Hazard Parameters
          </h2>

          {/* Tributary Regime */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Tributary Flow Regime
            </label>
            <select
              value={tributaryRegime}
              onChange={(e) => setTributaryRegime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="NORMAL">Normal Tributary Inflow</option>
              <option value="HIGH">High Tributary Surge</option>
              <option value="EXTREME">Extreme Tributary Flood</option>
              <option value="FLASH_FLOOD">Unexpected Flash Flood</option>
              <option value="COINCIDENT_PEAK">Multiple Tributaries Peaking Simultaneously</option>
            </select>
          </div>

          {/* Dam Breach Toggle */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">Dam Break Scenario</div>
              <div className="text-[11px] text-slate-400">Include catastrophic breach flow</div>
            </div>
            <button
              onClick={() => setDamBreach(!damBreach)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                damBreach ? 'bg-rose-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  damBreach ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Custom Rainfall Slider */}
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
              <span>Basin Rainfall Intensity</span>
              <span className="text-rose-400 font-mono">{rainfallMm} mm</span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="5"
              value={rainfallMm}
              onChange={(e) => setRainfallMm(Number(e.target.value))}
              className="w-full accent-rose-500"
            />
          </div>

          {/* Notice Card */}
          <div className="bg-slate-950 border border-rose-500/20 rounded-xl p-3.5 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-semibold text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Empirical Guidance
            </div>
            <div>
              Superposition model combines mainstem discharge, spillway release, dam breach hydrograph, and SCS-CN tributary runoff at confluence nodes.
            </div>
          </div>
        </div>

        {/* Combined Hydrodynamics Results */}
        <div className="lg:col-span-3 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-4 relative overflow-hidden">
              <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-rose-400" />
                Combined Peak Discharge
              </div>
              <div className="text-2xl font-black text-rose-400 mt-2 font-mono">
                {result ? result.combined_downstream_hydraulics.combined_peak_discharge_m3s.toLocaleString() : '...'}
                <span className="text-sm font-normal text-slate-400 ml-1">m³/s</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Total downstream flow rate</div>
            </div>

            <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-4">
              <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-cyan-400" />
                Max Water Depth
              </div>
              <div className="text-2xl font-black text-cyan-400 mt-2 font-mono">
                {result ? result.combined_downstream_hydraulics.combined_water_depth_m : '...'}
                <span className="text-sm font-normal text-slate-400 ml-1">m</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Downstream reach depth</div>
            </div>

            <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4">
              <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-amber-400" />
                Flow Velocity
              </div>
              <div className="text-2xl font-black text-amber-400 mt-2 font-mono">
                {result ? result.combined_downstream_hydraulics.combined_velocity_ms : '...'}
                <span className="text-sm font-normal text-slate-400 ml-1">m/s</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Peak wave velocity</div>
            </div>

            <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-4">
              <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-400" />
                Peak Arrival Time
              </div>
              <div className="text-2xl font-black text-purple-400 mt-2 font-mono">
                {result ? result.combined_downstream_hydraulics.downstream_peak_arrival_time_hr : '...'}
                <span className="text-sm font-normal text-slate-400 ml-1">hrs</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">First tributary surge arrival</div>
            </div>
          </div>

          {/* Hazard Components Breakdown */}
          {result && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-400" />
                Hazard Superposition Flow Components
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Main River Baseline Flow</div>
                  <div className="text-base font-bold text-slate-200 mt-1 font-mono">
                    {result.hazard_components.main_river_flow_m3s.toLocaleString()} m³/s
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Spillway Outflow</div>
                  <div className="text-base font-bold text-cyan-400 mt-1 font-mono">
                    {result.hazard_components.reservoir_spillway_release_m3s.toLocaleString()} m³/s
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Dam Breach Outflow</div>
                  <div className="text-base font-bold text-rose-400 mt-1 font-mono">
                    {result.hazard_components.dam_breach_outflow_m3s.toLocaleString()} m³/s
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400">Sum of Tributary Inflows</div>
                  <div className="text-base font-bold text-amber-400 mt-1 font-mono">
                    {result.hazard_components.total_tributaries_discharge_m3s.toLocaleString()} m³/s
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confluence Junctions & Tributaries Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-cyan-400" />
              Confluence Locations & Tributary Peak Contributions
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
                    <th className="p-3">Confluence Junction</th>
                    <th className="p-3">Tributary Name</th>
                    <th className="p-3">Peak Discharge</th>
                    <th className="p-3">Contribution %</th>
                    <th className="p-3">Arrival Time</th>
                    <th className="p-3">Backwater Stage Δh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {result?.confluence_junctions.map((j, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-cyan-300 flex items-center gap-1.5">
                        <ArrowDownRight className="w-3.5 h-3.5 text-slate-500" />
                        {j.junction_name}
                      </td>
                      <td className="p-3 font-medium">{j.tributary_name}</td>
                      <td className="p-3 font-mono font-bold text-rose-400">
                        {j.tributary_discharge_m3s.toLocaleString()} m³/s
                      </td>
                      <td className="p-3 font-mono font-semibold text-amber-300">
                        {j.contribution_percentage}%
                      </td>
                      <td className="p-3 text-slate-300 font-mono">
                        {j.arrival_time_min} mins
                      </td>
                      <td className="p-3 font-mono text-cyan-400">
                        +{j.backwater_stage_increase_m} m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statistical Classification Notice Box */}
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-amber-300 uppercase tracking-wide">
                STATISTICAL CLASSIFICATION & RIGOR DIRECTIVE
              </div>
              <div className="text-slate-300">
                {result?.statistical_classification.statistical_notice ||
                  "Do NOT fabricate probabilities. If statistical data is unavailable, label the result: SCENARIO-BASED EXTREME CASE, not 'probability = X%'."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
