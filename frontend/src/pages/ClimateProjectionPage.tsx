import React, { useState, useEffect } from 'react';
import {
  Thermometer,
  CloudRain,
  Activity,
  Sliders,
  TrendingUp,
  ShieldAlert,
  Calendar,
  Layers,
  CheckCircle2,
  Maximize2,
  Droplets,
  Wind
} from 'lucide-react';

interface ClimateProviderMetadata {
  provider_id: string;
  provider_name: string;
  dataset_name: string;
  connected: boolean;
  quality_status: string;
  notice: string;
}

interface MetricComparison {
  rainfall_mm: number;
  runoff_depth_mm: number;
  runoff_volume_million_m3: number;
  peak_discharge_m3s: number;
  flood_area_km2: number;
  max_water_depth_m: number;
  max_velocity_ms: number;
}

interface ClimateAnalysisResult {
  status: string;
  provider_metadata: ClimateProviderMetadata;
  scenario_horizon: {
    horizon_year: string;
    ssp_scenario: string;
    temperature_anomaly_c: number;
  };
  sensitivity_factors: {
    rainfall_intensity_multiplier: number;
    extreme_precipitation_multiplier: number;
    runoff_response_factor: number;
    reservoir_inflow_multiplier: number;
    glacier_melt_surge_m3s: number;
  };
  current_climate: MetricComparison;
  future_climate: MetricComparison;
  delta_comparison: {
    rainfall_pct_change: number;
    runoff_depth_pct_change: number;
    runoff_volume_pct_change: number;
    peak_discharge_pct_change: number;
    flood_area_pct_change: number;
    max_depth_pct_change: number;
    max_velocity_pct_change: number;
  };
  data_rigor_notice: string;
}

export const ClimateProjectionPage: React.FC = () => {
  const [horizonYear, setHorizonYear] = useState<string>('2050');
  const [sspScenario, setSspScenario] = useState<string>('SSP3-7.0');
  const [providerId, setProviderId] = useState<string>('demo-sensitivity-climate');
  const [baselineRainfall, setBaselineRainfall] = useState<number>(180);
  const [rainfallMult, setRainfallMult] = useState<number>(1.18);
  const [runoffMult, setRunoffMult] = useState<number>(1.24);
  const [inflowMult, setInflowMult] = useState<number>(1.22);
  const [providers, setProviders] = useState<ClimateProviderMetadata[]>([]);
  const [result, setResult] = useState<ClimateAnalysisResult | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    runAnalysis();
  }, [horizonYear, sspScenario, providerId, baselineRainfall, rainfallMult, runoffMult, inflowMult]);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/climate/providers');
      if (res.ok) {
        const data: ClimateProviderMetadata[] = await res.json();
        setProviders(data);
      }
    } catch (err) {
      console.error('Failed to fetch climate providers:', err);
    }
  };

  const runAnalysis = async () => {
    try {
      const res = await fetch('/api/climate/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          horizon_year: horizonYear,
          ssp_scenario: sspScenario,
          provider_id: providerId,
          baseline_rainfall_mm: baselineRainfall,
          custom_rainfall_mult: rainfallMult,
          custom_runoff_mult: runoffMult,
          custom_inflow_mult: inflowMult
        })
      });
      if (res.ok) {
        const data: ClimateAnalysisResult = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Climate analysis error:', err);
    }
  };

  const horizons = [
    { year: 'Current', label: 'Current Baseline', icon: Calendar },
    { year: '2030', label: 'Near-Term 2030', icon: Calendar },
    { year: '2050', label: 'Mid-Century 2050', icon: Calendar },
    { year: '2070', label: 'Late-Century 2070', icon: Calendar },
    { year: '2100', label: 'End-Century 2100', icon: Calendar }
  ];

  const ssps = [
    { code: 'SSP1-2.6', label: 'SSP1-2.6 (Sustainability)', desc: 'Low emissions target (+1.5°C)' },
    { code: 'SSP2-4.5', label: 'SSP2-4.5 (Middle Road)', desc: 'Intermediate emissions (+2.7°C)' },
    { code: 'SSP3-7.0', label: 'SSP3-7.0 (High Rivalry)', desc: 'High regional emissions (+3.6°C)' },
    { code: 'SSP5-8.5', label: 'SSP5-8.5 (Fossil-Fueled)', desc: 'Extreme emissions (+4.4°C)' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <Thermometer className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                Climate Risk & Future Hazard Scenario Engine
                <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                  PHASE 6 IPCC AR6
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Sensitivity analysis & future climate change projections for regional precipitation and flood surge
              </p>
            </div>
          </div>
        </div>

        {/* Dataset Connection Status Banner */}
        <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <div className="text-xs font-bold text-amber-300 tracking-wide uppercase">
              DATASET RIGOR NOTICE
            </div>
            <div className="text-xs font-semibold text-amber-200">
              {result?.data_rigor_notice || 'Climate dataset not connected — sensitivity/demo mode.'}
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Horizons Selector */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          Select Projection Time Horizon
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {horizons.map((h) => {
            const isSelected = h.year === horizonYear;
            return (
              <button
                key={h.year}
                onClick={() => setHorizonYear(h.year)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500/60 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 font-mono">{h.year}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <div className="text-sm font-semibold text-white mt-1">{h.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Control Panel & Comparison Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Sensitivity Controls
          </h2>

          {/* SSP Scenario Selector */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              IPCC SSP Emission Path
            </label>
            <select
              value={sspScenario}
              onChange={(e) => setSspScenario(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {ssps.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Provider Selector */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Climate Data Provider
            </label>
            <select
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {providers.length > 0 ? (
                providers.map((p) => (
                  <option key={p.provider_id} value={p.provider_id}>
                    {p.provider_name} ({p.connected ? 'CONNECTED' : 'DISCONNECTED'})
                  </option>
                ))
              ) : (
                <>
                  <option value="demo-sensitivity-climate">Synthetic Sensitivity Engine (Demo)</option>
                  <option value="cmip6-wcrp">CMIP6 HighResMIP (Disconnected)</option>
                  <option value="cordex-south-asia">CORDEX South Asia RegCM4 (Disconnected)</option>
                </>
              )}
            </select>
          </div>

          {/* Sliders */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Baseline Design Storm</span>
                <span className="text-blue-400 font-mono">{baselineRainfall} mm</span>
              </div>
              <input
                type="range"
                min="50"
                max="350"
                step="5"
                value={baselineRainfall}
                onChange={(e) => setBaselineRainfall(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Rainfall Intensity Multiplier</span>
                <span className="text-cyan-400 font-mono">{(rainfallMult * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.0"
                step="0.02"
                value={rainfallMult}
                onChange={(e) => setRainfallMult(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Runoff Response Factor</span>
                <span className="text-amber-400 font-mono">{(runoffMult * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.0"
                step="0.02"
                value={runoffMult}
                onChange={(e) => setRunoffMult(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Reservoir Inflow Surge</span>
                <span className="text-rose-400 font-mono">{(inflowMult * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.0"
                step="0.02"
                value={inflowMult}
                onChange={(e) => setInflowMult(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Current vs Future Comparison Dashboard */}
        <div className="lg:col-span-3 space-y-6">
          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Rainfall */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4 text-cyan-400" /> Rainfall Intensity
                </span>
                <span className="text-cyan-400 font-mono">
                  +{result?.delta_comparison.rainfall_pct_change}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-[11px] text-slate-400">Current</div>
                  <div className="text-lg font-bold text-slate-300 font-mono">
                    {result?.current_climate.rainfall_mm} mm
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Future ({horizonYear})</div>
                  <div className="text-xl font-black text-cyan-400 font-mono">
                    {result?.future_climate.rainfall_mm} mm
                  </div>
                </div>
              </div>
            </div>

            {/* Runoff Volume */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-blue-400" /> Runoff Volume
                </span>
                <span className="text-blue-400 font-mono">
                  +{result?.delta_comparison.runoff_volume_pct_change}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-[11px] text-slate-400">Current</div>
                  <div className="text-lg font-bold text-slate-300 font-mono">
                    {result?.current_climate.runoff_volume_million_m3} Mm³
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Future ({horizonYear})</div>
                  <div className="text-xl font-black text-blue-400 font-mono">
                    {result?.future_climate.runoff_volume_million_m3} Mm³
                  </div>
                </div>
              </div>
            </div>

            {/* Peak Discharge */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-rose-400" /> Peak Discharge
                </span>
                <span className="text-rose-400 font-mono">
                  +{result?.delta_comparison.peak_discharge_pct_change}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-[11px] text-slate-400">Current</div>
                  <div className="text-lg font-bold text-slate-300 font-mono">
                    {result?.current_climate.peak_discharge_m3s.toLocaleString()} m³/s
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Future ({horizonYear})</div>
                  <div className="text-xl font-black text-rose-400 font-mono">
                    {result?.future_climate.peak_discharge_m3s.toLocaleString()} m³/s
                  </div>
                </div>
              </div>
            </div>

            {/* Flood Area */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Maximize2 className="w-4 h-4 text-purple-400" /> Inundation Area
                </span>
                <span className="text-purple-400 font-mono">
                  +{result?.delta_comparison.flood_area_pct_change}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-[11px] text-slate-400">Current</div>
                  <div className="text-lg font-bold text-slate-300 font-mono">
                    {result?.current_climate.flood_area_km2} km²
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Future ({horizonYear})</div>
                  <div className="text-xl font-black text-purple-400 font-mono">
                    {result?.future_climate.flood_area_km2} km²
                  </div>
                </div>
              </div>
            </div>

            {/* Max Depth */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-400" /> Max Water Depth
                </span>
                <span className="text-amber-400 font-mono">
                  +{result?.delta_comparison.max_depth_pct_change}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-[11px] text-slate-400">Current</div>
                  <div className="text-lg font-bold text-slate-300 font-mono">
                    {result?.current_climate.max_water_depth_m} m
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Future ({horizonYear})</div>
                  <div className="text-xl font-black text-amber-400 font-mono">
                    {result?.future_climate.max_water_depth_m} m
                  </div>
                </div>
              </div>
            </div>

            {/* Max Velocity */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-emerald-400" /> Max Velocity
                </span>
                <span className="text-emerald-400 font-mono">
                  +{result?.delta_comparison.max_velocity_pct_change}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-[11px] text-slate-400">Current</div>
                  <div className="text-lg font-bold text-slate-300 font-mono">
                    {result?.current_climate.max_velocity_ms} m/s
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Future ({horizonYear})</div>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {result?.future_climate.max_velocity_ms} m/s
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Metric Comparison Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Current Climate vs Future Climate Scenario Matrix ({horizonYear} / {sspScenario})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
                    <th className="p-3">Hydrologic Metric</th>
                    <th className="p-3">Current Climate Baseline</th>
                    <th className="p-3">Future Climate Scenario ({horizonYear})</th>
                    <th className="p-3">Absolute Change</th>
                    <th className="p-3">% Surge Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
                  <tr>
                    <td className="p-3 font-sans font-medium text-slate-300">Rainfall Depth (24h)</td>
                    <td className="p-3">{result?.current_climate.rainfall_mm} mm</td>
                    <td className="p-3 text-cyan-400 font-bold">{result?.future_climate.rainfall_mm} mm</td>
                    <td className="p-3 text-slate-400">
                      +{((result?.future_climate.rainfall_mm || 0) - (result?.current_climate.rainfall_mm || 0)).toFixed(1)} mm
                    </td>
                    <td className="p-3 text-cyan-300 font-bold">+{result?.delta_comparison.rainfall_pct_change}%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-medium text-slate-300">Runoff Volume</td>
                    <td className="p-3">{result?.current_climate.runoff_volume_million_m3} Mm³</td>
                    <td className="p-3 text-blue-400 font-bold">{result?.future_climate.runoff_volume_million_m3} Mm³</td>
                    <td className="p-3 text-slate-400">
                      +{((result?.future_climate.runoff_volume_million_m3 || 0) - (result?.current_climate.runoff_volume_million_m3 || 0)).toFixed(2)} Mm³
                    </td>
                    <td className="p-3 text-blue-300 font-bold">+{result?.delta_comparison.runoff_volume_pct_change}%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-medium text-slate-300">Peak Discharge (Q)</td>
                    <td className="p-3">{result?.current_climate.peak_discharge_m3s.toLocaleString()} m³/s</td>
                    <td className="p-3 text-rose-400 font-bold">{result?.future_climate.peak_discharge_m3s.toLocaleString()} m³/s</td>
                    <td className="p-3 text-slate-400">
                      +{((result?.future_climate.peak_discharge_m3s || 0) - (result?.current_climate.peak_discharge_m3s || 0)).toLocaleString()} m³/s
                    </td>
                    <td className="p-3 text-rose-300 font-bold">+{result?.delta_comparison.peak_discharge_pct_change}%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-medium text-slate-300">Inundation Surface Area</td>
                    <td className="p-3">{result?.current_climate.flood_area_km2} km²</td>
                    <td className="p-3 text-purple-400 font-bold">{result?.future_climate.flood_area_km2} km²</td>
                    <td className="p-3 text-slate-400">
                      +{((result?.future_climate.flood_area_km2 || 0) - (result?.current_climate.flood_area_km2 || 0)).toFixed(2)} km²
                    </td>
                    <td className="p-3 text-purple-300 font-bold">+{result?.delta_comparison.flood_area_pct_change}%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-medium text-slate-300">Maximum Reach Depth</td>
                    <td className="p-3">{result?.current_climate.max_water_depth_m} m</td>
                    <td className="p-3 text-amber-400 font-bold">{result?.future_climate.max_water_depth_m} m</td>
                    <td className="p-3 text-slate-400">
                      +{((result?.future_climate.max_water_depth_m || 0) - (result?.current_climate.max_water_depth_m || 0)).toFixed(2)} m
                    </td>
                    <td className="p-3 text-amber-300 font-bold">+{result?.delta_comparison.max_depth_pct_change}%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-medium text-slate-300">Peak Flow Velocity</td>
                    <td className="p-3">{result?.current_climate.max_velocity_ms} m/s</td>
                    <td className="p-3 text-emerald-400 font-bold">{result?.future_climate.max_velocity_ms} m/s</td>
                    <td className="p-3 text-slate-400">
                      +{((result?.future_climate.max_velocity_ms || 0) - (result?.current_climate.max_velocity_ms || 0)).toFixed(2)} m/s
                    </td>
                    <td className="p-3 text-emerald-300 font-bold">+{result?.delta_comparison.max_velocity_pct_change}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
