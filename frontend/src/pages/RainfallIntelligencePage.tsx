import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Layers,
  Activity,
  AlertCircle,
  BarChart3,
  LineChart
} from 'lucide-react';

interface RainfallStep {
  time_hr: number;
  timestamp: string;
  intensity_mm_hr: number;
  incremental_mm: number;
  cumulative_mm: number;
}

interface HydrographStep {
  time_hr: number;
  timestamp: string;
  rainfall_incremental_mm: number;
  rainfall_cumulative_mm: number;
  runoff_incremental_mm: number;
  runoff_cumulative_mm: number;
  discharge_m3s: number;
}

interface ProviderMetadata {
  provider_id: string;
  provider_name: string;
  quality_status: string; // OBSERVED | FORECAST | DEMO | SYNTHETIC
  source_type: string;
  confidence_score: number;
  notice: string;
}

interface SCSResults {
  base_cn: number;
  amc: string;
  effective_cn: number;
  rainfall_p_mm: number;
  retention_s_mm: number;
  initial_abstraction_ia_mm: number;
  lambda_ratio: number;
  runoff_depth_q_mm: number;
  runoff_volume_m3: number;
  runoff_volume_mm3: number;
  runoff_coefficient: number;
  catchment_area_km2: number;
  calibration_notice: string;
}

export const RainfallIntelligencePage: React.FC = () => {
  const [providerType, setProviderType] = useState<'DEMO' | 'HISTORICAL' | 'FORECAST'>('DEMO');
  const [baseCN, setBaseCN] = useState<number>(78);
  const [amcMode, setAMCMode] = useState<'AMC_I' | 'AMC_II' | 'AMC_III'>('AMC_II');
  const [hsgType, setHSGType] = useState<string>('HSG_C');
  const [landUseType, setLandUseType] = useState<string>('Agricultural Terraces');
  const [lambdaVal, setLambdaVal] = useState<number>(0.20);

  const [providerMeta, setProviderMeta] = useState<ProviderMetadata>({
    provider_id: "demo-rainfall",
    provider_name: "FloodHADR Synthetic Design Storm Engine",
    quality_status: "DEMO",
    source_type: "SYNTHETIC",
    confidence_score: 0.90,
    notice: "DEMO/SYNTHETIC design storm profile generated for Tehri basin cloudburst demonstration."
  });

  const [rainfallSeries, setRainfallSeries] = useState<RainfallStep[]>([]);
  const [scsResults, setScsResults] = useState<SCSResults>({
    base_cn: 78,
    amc: "AMC_II",
    effective_cn: 78.0,
    rainfall_p_mm: 180.0,
    retention_s_mm: 71.64,
    initial_abstraction_ia_mm: 14.33,
    lambda_ratio: 0.20,
    runoff_depth_q_mm: 117.47,
    runoff_volume_m3: 145662800.0,
    runoff_volume_mm3: 145.663,
    runoff_coefficient: 0.653,
    catchment_area_km2: 1240.0,
    calibration_notice: "Hydrological model results are uncalibrated estimates without local stream gauge validation data."
  });

  const [hydrographSeries, setHydrographSeries] = useState<HydrographStep[]>([]);

  // Fetch API data when provider, CN, AMC, or lambda changes
  useEffect(() => {
    fetch(`http://localhost:8000/api/scs-cn/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider_type: providerType,
        cn_value: baseCN,
        amc: amcMode,
        lambda_val: lambdaVal,
        catchment_area_km2: 1240.0,
        time_of_concentration_hr: 6.4
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.scs_cn_results) {
          setScsResults(data.scs_cn_results);
          if (data.provider_metadata) setProviderMeta(data.provider_metadata);
          if (data.hydrograph_data?.hydrograph_series) {
            setHydrographSeries(data.hydrograph_data.hydrograph_series);
            setRainfallSeries(data.hydrograph_data.hydrograph_series.map((h: any) => ({
              time_hr: h.time_hr,
              timestamp: h.timestamp,
              intensity_mm_hr: h.rainfall_incremental_mm,
              incremental_mm: h.rainfall_incremental_mm,
              cumulative_mm: h.rainfall_cumulative_mm
            })));
          }
        }
      })
      .catch(() => {});
  }, [providerType, baseCN, amcMode, lambdaVal]);

  const getQualityBadgeColor = (status: string) => {
    switch (status) {
      case 'OBSERVED': return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'FORECAST': return 'bg-sky-950 text-sky-300 border-sky-800';
      case 'DEMO': return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'SYNTHETIC': return 'bg-purple-950 text-purple-300 border-purple-800';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const maxIntensity = Math.max(...rainfallSeries.map(s => s.intensity_mm_hr), 1);
  const maxCumRainfall = scsResults.rainfall_p_mm || 1;
  const maxDischarge = Math.max(...hydrographSeries.map(h => h.discharge_m3s), 1);

  return (
    <div className="space-y-6 select-none font-sans">
      
      {/* Top Banner & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
            <CloudRain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-white uppercase tracking-wide">
                Rainfall Intelligence & SCS-CN Runoff Model
              </h1>
              <span className="bg-sky-950 text-sky-400 border border-sky-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                SCS-CN RUNOFF CORE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Hyetograph Processing, SCS Curve Number Transformation, AMC Adjustment & Direct Runoff Hydrograph
            </p>
          </div>
        </div>

        {/* Quality Status Badge */}
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 ${getQualityBadgeColor(providerMeta.quality_status)}`}>
            <Activity className="w-3.5 h-3.5" />
            <span>PROVENANCE: {providerMeta.quality_status} ({providerMeta.source_type})</span>
          </span>
        </div>
      </div>

      {/* Mandatory Uncalibrated Model Scope Disclaimer Notice */}
      <div className="p-3 bg-amber-950/60 border border-amber-500/40 text-amber-200 rounded-xl text-xs flex items-start space-x-2">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-snug">
          <strong className="text-amber-300">Uncalibrated Model Disclaimer:</strong> {scsResults.calibration_notice}
        </p>
      </div>

      {/* Provider & SCS-CN Controls Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (1 Col): Rainfall Data Provider & Soil/Land Use Selection */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wide">
                Rainfall Data Provider
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Confidence: {Math.round(providerMeta.confidence_score * 100)}%
            </span>
          </div>

          {/* Provider Selection Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setProviderType('DEMO')}
              className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all text-center ${
                providerType === 'DEMO'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className="block text-[10px] text-slate-500 uppercase">SYNTHETIC</span>
              <span>DEMO Storm</span>
            </button>

            <button
              onClick={() => setProviderType('HISTORICAL')}
              className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all text-center ${
                providerType === 'HISTORICAL'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className="block text-[10px] text-slate-500 uppercase">OBSERVED</span>
              <span>2021 Gauge</span>
            </button>

            <button
              onClick={() => setProviderType('FORECAST')}
              className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all text-center ${
                providerType === 'FORECAST'
                  ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className="block text-[10px] text-slate-500 uppercase">FORECAST</span>
              <span>GFS NWP</span>
            </button>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
            <div className="text-slate-300 font-bold">{providerMeta.provider_name}</div>
            <p className="text-[10px] text-slate-400">{providerMeta.notice}</p>
          </div>

          {/* SCS-CN Soil & AMC Selectors */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                SCS Curve Number Inputs
              </span>
              <span className="text-[10px] bg-slate-800 text-sky-400 px-2 py-0.5 rounded font-mono font-bold">
                CN Effective: {scsResults.effective_cn}
              </span>
            </div>

            {/* Hydrologic Soil Group Selector */}
            <div className="space-y-1 text-xs font-mono">
              <label className="text-[10px] text-slate-400 uppercase block">Hydrologic Soil Group (HSG)</label>
              <select
                value={hsgType}
                onChange={(e) => {
                  const hsg = e.target.value;
                  setHSGType(hsg);
                  // Update baseCN lookup
                  const matrix: Record<string, number> = {
                    'HSG_A': 62, 'HSG_B': 71, 'HSG_C': 78, 'HSG_D': 81
                  };
                  setBaseCN(matrix[hsg] || 78);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500 font-mono text-xs"
              >
                <option value="HSG_A">HSG A - Sand / Deep Gravel (High Infiltration)</option>
                <option value="HSG_B">HSG B - Sandy Loam (Moderate Infiltration)</option>
                <option value="HSG_C">HSG C - Clay Loam / Shallow Soil (Low Infiltration)</option>
                <option value="HSG_D">HSG D - Heavy Clay / Bare Rock (Very Low Infiltration)</option>
              </select>
            </div>

            {/* Land Use / Cover Selector */}
            <div className="space-y-1 text-xs font-mono">
              <label className="text-[10px] text-slate-400 uppercase block">Land Use / Cover Type</label>
              <select
                value={landUseType}
                onChange={(e) => {
                  const lu = e.target.value;
                  setLandUseType(lu);
                  const matrix: Record<string, Record<string, number>> = {
                    'Dense Himalayan Forest': { 'HSG_A': 36, 'HSG_B': 60, 'HSG_C': 73, 'HSG_D': 79 },
                    'Agricultural Terraces': { 'HSG_A': 62, 'HSG_B': 71, 'HSG_C': 78, 'HSG_D': 81 },
                    'Sparse Scrub / Grassland': { 'HSG_A': 49, 'HSG_B': 69, 'HSG_C': 79, 'HSG_D': 84 },
                    'Urban Impervious': { 'HSG_A': 77, 'HSG_B': 85, 'HSG_C': 90, 'HSG_D': 92 },
                    'Bare Rock / Glacier': { 'HSG_A': 77, 'HSG_B': 86, 'HSG_C': 91, 'HSG_D': 94 }
                  };
                  if (matrix[lu] && matrix[lu][hsgType]) {
                    setBaseCN(matrix[lu][hsgType]);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500 font-mono text-xs"
              >
                <option value="Dense Himalayan Forest">Dense Himalayan Forest</option>
                <option value="Agricultural Terraces">Agricultural Terraces</option>
                <option value="Sparse Scrub / Grassland">Sparse Scrub / Grassland</option>
                <option value="Urban Impervious">Urban Impervious</option>
                <option value="Bare Rock / Glacier">Bare Rock / Glacier</option>
              </select>
            </div>

            {/* Base CN Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Base CN_II (Normal Moisture):</span>
                <strong className="text-sky-400">{baseCN}</strong>
              </div>
              <input
                type="range"
                min="40"
                max="98"
                value={baseCN}
                onChange={(e) => setBaseCN(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* AMC Selection */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Antecedent Moisture (AMC)</span>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                <button
                  onClick={() => setAMCMode('AMC_I')}
                  className={`py-1.5 rounded-lg border text-center font-bold ${
                    amcMode === 'AMC_I' ? 'bg-sky-600 text-white border-sky-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  AMC I (Dry)
                </button>
                <button
                  onClick={() => setAMCMode('AMC_II')}
                  className={`py-1.5 rounded-lg border text-center font-bold ${
                    amcMode === 'AMC_II' ? 'bg-sky-600 text-white border-sky-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  AMC II (Normal)
                </button>
                <button
                  onClick={() => setAMCMode('AMC_III')}
                  className={`py-1.5 rounded-lg border text-center font-bold ${
                    amcMode === 'AMC_III' ? 'bg-sky-600 text-white border-sky-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  AMC III (Wet)
                </button>
              </div>
            </div>

            {/* Initial Abstraction Ratio lambda */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>Initial Abstraction Ratio (λ):</span>
                <strong className="text-amber-400">{lambdaVal}</strong>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.20"
                step="0.05"
                value={lambdaVal}
                onChange={(e) => setLambdaVal(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column (2 Cols): Calculated SCS-CN Metrics + Formulas */}
        <div className="lg:col-span-2 space-y-6">

          {/* SCS-CN Calculated Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Potential Max Retention (S)</span>
              <div className="text-lg font-black text-sky-400 font-mono">{scsResults.retention_s_mm} <span className="text-xs text-slate-400">mm</span></div>
              <p className="text-[10px] text-slate-500 font-mono">S = 25400/CN - 254</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Initial Abstraction (Ia)</span>
              <div className="text-lg font-black text-amber-400 font-mono">{scsResults.initial_abstraction_ia_mm} <span className="text-xs text-slate-400">mm</span></div>
              <p className="text-[10px] text-slate-500 font-mono">Ia = {scsResults.lambda_ratio} * S</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Direct Runoff Depth (Q)</span>
              <div className="text-lg font-black text-emerald-400 font-mono">{scsResults.runoff_depth_q_mm} <span className="text-xs text-slate-400">mm</span></div>
              <p className="text-[10px] text-slate-500 font-mono">Coeff C: {scsResults.runoff_coefficient}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Runoff Volume (V_R)</span>
              <div className="text-lg font-black text-indigo-400 font-mono">{scsResults.runoff_volume_mm3} <span className="text-xs text-slate-400">Mm³</span></div>
              <p className="text-[10px] text-slate-500 font-mono">Basin: {scsResults.catchment_area_km2} km²</p>
            </div>
          </div>

          {/* Chart Grid (4 Charts) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Chart 1: Rainfall Hyetograph (Rainfall vs Time) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wide font-mono flex items-center space-x-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>1. Rainfall Hyetograph (mm/hr)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono font-bold">{providerMeta.quality_status}</span>
              </div>
              <div className="h-44 bg-slate-950 rounded-xl p-3 border border-slate-800 flex items-end justify-between gap-1 overflow-x-auto">
                {rainfallSeries.map((s, i) => {
                  const barHeightPercent = Math.max(4, Math.round((s.intensity_mm_hr / maxIntensity) * 100));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                      <div
                        className="w-full bg-sky-500 hover:bg-sky-400 rounded-t transition-all"
                        style={{ height: `${barHeightPercent}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-mono text-[9px] px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap z-10 pointer-events-none">
                          {s.intensity_mm_hr} mm/hr
                        </div>
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 mt-1 truncate">{s.time_hr}h</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Cumulative Rainfall vs Runoff Depth */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide font-mono flex items-center space-x-1.5">
                  <LineChart className="w-3.5 h-3.5" />
                  <span>2. Cumulative P vs Direct Runoff Q (mm)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Ia: {scsResults.initial_abstraction_ia_mm}mm</span>
              </div>
              <div className="h-44 bg-slate-950 rounded-xl p-3 border border-slate-800 flex items-end justify-between gap-1">
                {hydrographSeries.map((h, i) => {
                  const pHeight = Math.round((h.rainfall_cumulative_mm / maxCumRainfall) * 100);
                  const qHeight = Math.round((h.runoff_cumulative_mm / maxCumRainfall) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end space-y-0.5">
                      <div className="w-full flex items-end justify-center space-x-0.5 h-full">
                        <div className="w-1/2 bg-sky-500/80 rounded-t" style={{ height: `${pHeight}%` }} title={`Rainfall: ${h.rainfall_cumulative_mm}mm`} />
                        <div className="w-1/2 bg-emerald-400 rounded-t" style={{ height: `${qHeight}%` }} title={`Runoff Q: ${h.runoff_cumulative_mm}mm`} />
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 truncate">{h.time_hr}h</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 3: Incremental Runoff Hydrograph (m³/s) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide font-mono flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>3. Direct Runoff Hydrograph Discharge Q(t) (m³/s)</span>
                </span>
                <span className="text-[10px] text-amber-300 font-mono font-bold">Peak Q: {scsResults.runoff_volume_mm3} Mm³</span>
              </div>
              <div className="h-48 bg-slate-950 rounded-xl p-4 border border-slate-800 flex items-end justify-between gap-1 relative">
                {hydrographSeries.map((h, i) => {
                  const qPercent = Math.max(2, Math.round((h.discharge_m3s / maxDischarge) * 100));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                      <div
                        className="w-full bg-amber-500 hover:bg-amber-400 rounded-t transition-all"
                        style={{ height: `${qPercent}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-amber-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap z-10 pointer-events-none">
                          {h.discharge_m3s} m³/s
                        </div>
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 mt-1 truncate">{h.time_hr}h</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default RainfallIntelligencePage;
