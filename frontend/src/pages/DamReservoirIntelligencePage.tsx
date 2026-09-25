import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  CheckCircle2,
  Info,
  Sliders,
  ArrowRight,
  Gauge,
  Flame
} from 'lucide-react';

interface DamParams {
  id: string;
  name: string;
  river: string;
  dam_type: string;
  material: string;
  height_m: number;
  crest_elevation_m: number;
  foundation_elevation_m: number;
  crest_length_m: number;
  crest_width_m: number;
  base_width_m: number;
  upstream_slope: string;
  downstream_slope: string;
  construction_year: number;
  spillway_capacity_m3s: number;
}

interface ReservoirParams {
  id: string;
  name: string;
  area_km2: number;
  storage_capacity_mm3: number;
  live_storage_mm3: number;
  dead_storage_mm3: number;
  current_storage_mm3: number;
  current_water_level_m: number;
  minimum_operating_level_m: number;
  normal_reservoir_level_m: number;
  maximum_reservoir_level_m: number;
  spillway_level_m: number;
  inflow_m3s: number;
  outflow_m3s: number;
}

interface HydrostaticProfileStep {
  depth_m: number;
  elevation_m: number;
  pressure_kpa: number;
}

interface HydrostaticData {
  hydraulic_head_m: number;
  hydrostatic_pressure_kpa: number;
  hydrostatic_pressure_mpa: number;
  force_per_meter_kn_m: number;
  total_hydrostatic_force_mn: number;
  spillway_head_m: number;
  freeboard_m: number;
  calculated_storage_mm3: number;
  pressure_distribution_profile: HydrostaticProfileStep[];
  disclaimer_notice: string;
}

interface ReservoirPreset {
  id: string;
  name: string;
  code: string;
  description: string;
  water_level_m: number;
  storage_mm3: number;
  reservoir_percentage: number;
  breach_risk_tier: string;
  color: string;
}

export const DamReservoirIntelligencePage: React.FC = () => {
  const { setActivePage, selectedScenario, setSelectedScenario } = useApp();
  const [selectedCondition, setSelectedCondition] = useState<string>('cond-normal');
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);

  const [dam, setDam] = useState<DamParams>({
    id: "dam-tehri-demo",
    name: "Tehri Earth and Rockfill Dam",
    river: "Bhagirathi River",
    dam_type: "Rockfill",
    material: "Earth-fill with Central Impervious Clay Core & Shell Rockfill",
    height_m: 260.5,
    crest_elevation_m: 839.5,
    foundation_elevation_m: 579.0,
    crest_length_m: 575.0,
    crest_width_m: 20.0,
    base_width_m: 1125.0,
    upstream_slope: "1.15 H : 1 V",
    downstream_slope: "2.0 H : 1 V",
    construction_year: 2006,
    spillway_capacity_m3s: 15540.0
  });

  const [reservoir, setReservoir] = useState<ReservoirParams>({
    id: "res-tehri-001",
    name: "Tehri Hydroelectric Reservoir Pool",
    area_km2: 42.0,
    storage_capacity_mm3: 3540.0,
    live_storage_mm3: 2615.0,
    dead_storage_mm3: 925.0,
    current_storage_mm3: 3200.0,
    current_water_level_m: 822.4,
    minimum_operating_level_m: 740.0,
    normal_reservoir_level_m: 830.0,
    maximum_reservoir_level_m: 835.0,
    spillway_level_m: 815.0,
    inflow_m3s: 1250.0,
    outflow_m3s: 450.0
  });

  const [presets, setPresets] = useState<ReservoirPreset[]>([
    {
      id: "cond-minimum",
      name: "Minimum",
      code: "MOL",
      description: "Minimum Operating Level (Dead Storage Level)",
      water_level_m: 740.0,
      storage_mm3: 925.0,
      reservoir_percentage: 26.1,
      breach_risk_tier: "LOW",
      color: "#38bdf8"
    },
    {
      id: "cond-normal",
      name: "Normal",
      code: "FRL",
      description: "Full Reservoir Level (Normal Design Pool)",
      water_level_m: 830.0,
      storage_mm3: 3540.0,
      reservoir_percentage: 100.0,
      breach_risk_tier: "MODERATE",
      color: "#3b82f6"
    },
    {
      id: "cond-high",
      name: "High",
      code: "HIGH_MONSOON",
      description: "High Monsoon Storage (Surcharge Storage Active)",
      water_level_m: 832.5,
      storage_mm3: 3720.0,
      reservoir_percentage: 105.1,
      breach_risk_tier: "ELEVATED",
      color: "#eab308"
    },
    {
      id: "cond-maximum",
      name: "Maximum",
      code: "MWL",
      description: "Maximum Water Level (Design Flood Spillway Capacity)",
      water_level_m: 835.0,
      storage_mm3: 3910.0,
      reservoir_percentage: 110.5,
      breach_risk_tier: "HIGH",
      color: "#f97316"
    },
    {
      id: "cond-extreme",
      name: "Extreme Scenario",
      code: "PMF_OVERTOPPING",
      description: "PMF Cloudburst Overtopping at Dam Crest Level",
      water_level_m: 839.5,
      storage_mm3: 4250.0,
      reservoir_percentage: 120.0,
      breach_risk_tier: "CRITICAL",
      color: "#ef4444"
    }
  ]);

  const [hydrostatics, setHydrostatics] = useState<HydrostaticData>({
    hydraulic_head_m: 243.4,
    hydrostatic_pressure_kpa: 2387.8,
    hydrostatic_pressure_mpa: 2.388,
    force_per_meter_kn_m: 2907.3,
    total_hydrostatic_force_mn: 1671.7,
    spillway_head_m: 7.4,
    freeboard_m: 17.1,
    calculated_storage_mm3: 3200.0,
    pressure_distribution_profile: [
      { depth_m: 0.0, elevation_m: 822.4, pressure_kpa: 0.0 },
      { depth_m: 24.3, elevation_m: 798.1, pressure_kpa: 238.8 },
      { depth_m: 48.7, elevation_m: 773.7, pressure_kpa: 477.6 },
      { depth_m: 73.0, elevation_m: 749.4, pressure_kpa: 716.3 },
      { depth_m: 97.4, elevation_m: 725.0, pressure_kpa: 955.1 },
      { depth_m: 121.7, elevation_m: 700.7, pressure_kpa: 1193.9 },
      { depth_m: 146.0, elevation_m: 676.4, pressure_kpa: 1432.7 },
      { depth_m: 170.4, elevation_m: 652.0, pressure_kpa: 1671.4 },
      { depth_m: 194.7, elevation_m: 627.7, pressure_kpa: 1910.2 },
      { depth_m: 219.1, elevation_m: 603.3, pressure_kpa: 2149.0 },
      { depth_m: 243.4, elevation_m: 579.0, pressure_kpa: 2387.8 }
    ],
    disclaimer_notice: "Simplified hydrostatic calculations for hydrological simulation context only — not a structural safety evaluation or geotechnical dam stability audit."
  });

  // Fetch live dam and reservoir data on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/dams/dam-tehri-demo')
      .then(res => res.json())
      .then(data => {
        if (data && data.name) setDam(data);
      })
      .catch(() => {});

    fetch('http://localhost:8000/api/reservoirs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data[0]) setReservoir(data[0]);
      })
      .catch(() => {});

    fetch('http://localhost:8000/api/reservoirs/conditions/presets')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setPresets(data);
      })
      .catch(() => {});

    fetch('http://localhost:8000/api/dams/dam-tehri-demo/hydrostatics')
      .then(res => res.json())
      .then(data => {
        if (data && data.hydraulic_head_m) setHydrostatics(data);
      })
      .catch(() => {});
  }, []);

  // Update hydrostatic calculations dynamically when condition preset changes
  const handleSelectCondition = (cond: ReservoirPreset) => {
    setSelectedCondition(cond.id);
    setReservoir(prev => ({
      ...prev,
      current_water_level_m: cond.water_level_m,
      current_storage_mm3: cond.storage_mm3
    }));

    fetch('http://localhost:8000/api/dams/calculate-hydrostatics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        water_level_m: cond.water_level_m,
        foundation_elevation_m: dam.foundation_elevation_m,
        crest_elevation_m: dam.crest_elevation_m,
        spillway_level_m: reservoir.spillway_level_m,
        crest_length_m: dam.crest_length_m,
        storage_capacity_mm3: reservoir.storage_capacity_mm3,
        normal_level_m: reservoir.normal_reservoir_level_m
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.hydrostatics) setHydrostatics(data.hydrostatics);
      })
      .catch(() => {});
  };

  const handleConnectToScenario = async () => {
    const activePreset = presets.find(p => p.id === selectedCondition) || presets[1];
    try {
      const res = await fetch('http://localhost:8000/api/dams/connect-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition_id: selectedCondition })
      });
      const data = await res.json();
      
      setSelectedScenario({
        ...selectedScenario,
        reservoirWaterLevelPercent: activePreset.reservoir_percentage,
        formState: selectedScenario.formState ? {
          ...selectedScenario.formState,
          reservoirElevationM: activePreset.water_level_m,
          storageVolumeMm3: activePreset.storage_mm3
        } : undefined
      });
      
      setConnectionNotice(`Connected '${activePreset.name}' (${activePreset.water_level_m}m RL) to Dam-Break Scenario Engine. Est. Peak Breach Q: ${data.connected_scenario_params?.calculated_peak_discharge_m3s || 64200} m³/s.`);
    } catch {
      setSelectedScenario({
        ...selectedScenario,
        reservoirWaterLevelPercent: activePreset.reservoir_percentage
      });
      setConnectionNotice(`Preset '${activePreset.name}' (${activePreset.water_level_m}m RL) applied to local scenario context.`);
    }
  };

  return (
    <div className="space-y-6 select-none font-sans">
      
      {/* Top Banner & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-white uppercase tracking-wide">
                Dam & Reservoir Engineering Intelligence
              </h1>
              <span className="bg-indigo-950 text-indigo-400 border border-indigo-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                HYDROSTATICS CORE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Engineering Parameters, Hydrostatic Thrust Analysis, Hypsometric Storage & Reservoir Condition Presets
            </p>
          </div>
        </div>

        {/* Connect Action Button */}
        <button
          onClick={handleConnectToScenario}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-all flex items-center space-x-2"
        >
          <Flame className="w-4 h-4 fill-current text-slate-950" />
          <span>Apply to Dam-Break Scenario</span>
        </button>
      </div>

      {connectionNotice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{connectionNotice}</span>
          </div>
          <button
            onClick={() => setActivePage('dam-break')}
            className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold rounded-md hover:bg-emerald-400 text-[11px] flex items-center space-x-1"
          >
            <span>Open Dam-Break Page</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Mandatory Hydrostatic Scope Disclaimer Notice */}
      <div className="p-3 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl text-xs flex items-start space-x-2">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-snug">
          <strong className="text-slate-200">Engineering Scope Disclaimer:</strong> {hydrostatics.disclaimer_notice}
        </p>
      </div>

      {/* Reservoir Condition Presets Selector (5 Options) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              Reservoir Condition Presets
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Active Pool: <strong className="text-white">{reservoir.current_water_level_m} m RL</strong> ({reservoir.current_storage_mm3} Mm³)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {presets.map((p) => {
            const isSelected = selectedCondition === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handleSelectCondition(p)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-850 border-amber-400 shadow-xl ring-2 ring-amber-400/40'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded text-slate-950" style={{ backgroundColor: p.color }}>
                    {p.code}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-slate-400">
                    {p.reservoir_percentage}% FRL
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-white">{p.name}</h4>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{p.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-400 text-[10px]">Level:</span>
                  <strong className="text-white font-bold">{p.water_level_m} m</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Dam & Reservoir Parameters + Hydrostatics Calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (2 Cols): Dam & Reservoir Engineering Parameters */}
        <div className="lg:col-span-2 space-y-6">

          {/* Dam Parameters Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
                  STRUCTURE CLASSIFICATION
                </span>
                <h3 className="text-base font-black text-white">{dam.name}</h3>
              </div>
              <span className="px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-lg text-xs font-mono font-bold">
                {dam.dam_type} Dam
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase">Dam Height</span>
                <div className="text-base font-extrabold text-sky-400">{dam.height_m} m</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase">Crest Elevation</span>
                <div className="text-base font-extrabold text-emerald-400">{dam.crest_elevation_m} m</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase">Foundation Elev</span>
                <div className="text-base font-extrabold text-amber-400">{dam.foundation_elevation_m} m</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase">Crest Length</span>
                <div className="text-base font-extrabold text-indigo-400">{dam.crest_length_m} m</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase">Dam Width (Top/Base)</span>
                <div className="text-base font-extrabold text-purple-400">{dam.crest_width_m}m / {dam.base_width_m}m</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase">Slopes (U/S & D/S)</span>
                <div className="text-xs font-extrabold text-slate-200">{dam.upstream_slope} | {dam.downstream_slope}</div>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono flex items-center justify-between text-slate-300">
              <span>Construction Material: <strong className="text-white">{dam.material}</strong></span>
              <span className="text-[10px] text-slate-400">Commissioned: {dam.construction_year}</span>
            </div>
          </div>

          {/* Reservoir Parameters Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  HYDROMETRIC POOL
                </span>
                <h3 className="text-base font-black text-white">{reservoir.name}</h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-mono font-bold">
                Area: {reservoir.area_km2} km²
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase">Gross Capacity</span>
                <div className="text-base font-extrabold text-sky-400">{reservoir.storage_capacity_mm3} Mm³</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase">Live Storage</span>
                <div className="text-base font-extrabold text-emerald-400">{reservoir.live_storage_mm3} Mm³</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase">Dead Storage</span>
                <div className="text-base font-extrabold text-amber-400">{reservoir.dead_storage_mm3} Mm³</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase">Current Storage</span>
                <div className="text-base font-extrabold text-indigo-400">{reservoir.current_storage_mm3} Mm³</div>
              </div>
            </div>

            {/* Elevation Pools Spectrum */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Reservoir Pool Levels Spectrum (RL m)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[9px] text-sky-400 uppercase block">Min Operating (MOL)</span>
                  <strong className="text-white">{reservoir.minimum_operating_level_m} m</strong>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[9px] text-blue-400 uppercase block">Normal Pool (FRL)</span>
                  <strong className="text-white">{reservoir.normal_reservoir_level_m} m</strong>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[9px] text-amber-400 uppercase block">Max Flood (MWL)</span>
                  <strong className="text-white">{reservoir.maximum_reservoir_level_m} m</strong>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-[9px] text-purple-400 uppercase block">Spillway Crest</span>
                  <strong className="text-white">{reservoir.spillway_level_m} m</strong>
                </div>
              </div>
            </div>

            {/* Inflow vs Outflow Balance */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase">Reservoir Inflow</span>
                <strong className="text-emerald-400 text-sm">{reservoir.inflow_m3s} m³/s</strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase">Reservoir Outflow</span>
                <strong className="text-amber-400 text-sm">{reservoir.outflow_m3s} m³/s</strong>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (1 Col): Hydrostatic Calculations & Pressure Profile */}
        <div className="space-y-6">

          {/* Hydrostatic Pressure & Thrust Calculations Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Gauge className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-black text-white uppercase tracking-wide">
                  Hydrostatic Calculations
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-800">
                P = ρgh
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Hydraulic Head (h)</span>
                <div className="text-xl font-black text-sky-400">{hydrostatics.hydraulic_head_m} <span className="text-xs text-slate-400">m</span></div>
                <p className="text-[10px] text-slate-500">Water Depth above Foundation (z_w - z_f)</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Max Base Hydrostatic Pressure (P)</span>
                <div className="text-xl font-black text-emerald-400">{hydrostatics.hydrostatic_pressure_mpa} <span className="text-xs text-slate-400">MPa</span> ({hydrostatics.hydrostatic_pressure_kpa} kPa)</div>
                <p className="text-[10px] text-slate-500">Formula: P = 1000 kg/m³ * 9.81 m/s² * {hydrostatics.hydraulic_head_m}m</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Total Hydrostatic Force (F_total)</span>
                <div className="text-xl font-black text-amber-400">{hydrostatics.total_hydrostatic_force_mn} <span className="text-xs text-slate-400">MN</span></div>
                <p className="text-[10px] text-slate-500">Thrust per meter width: {hydrostatics.force_per_meter_kn_m} kN/m</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Spillway Head</span>
                  <div className="text-sm font-extrabold text-indigo-400">{hydrostatics.spillway_head_m} m</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Freeboard</span>
                  <div className="text-sm font-extrabold text-purple-400">{hydrostatics.freeboard_m} m</div>
                </div>
              </div>
            </div>

            {/* Triangular Pressure Profile Distribution Steps */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Triangular Pressure Distribution (Surface to Base)
              </span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                {hydrostatics.pressure_distribution_profile.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-300 py-0.5 border-b border-slate-850 last:border-0">
                    <span className="text-slate-400">Depth {p.depth_m}m (Elev {p.elevation_m}m)</span>
                    <strong className="text-emerald-400">{p.pressure_kpa} kPa</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default DamReservoirIntelligencePage;
