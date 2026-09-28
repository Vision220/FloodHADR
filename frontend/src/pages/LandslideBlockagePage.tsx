import React, { useState, useEffect } from 'react';
import {
  Mountain,
  Layers,
  Sliders,
  CheckCircle2,
  Droplets,
  Activity,
  Wind,
  ShieldAlert,
  MapPin,
  ArrowDownRight,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface LandslideSite {
  id: string;
  name: string;
  location_name: string;
  coordinates: { lat: number; lng: number };
  river_km: number;
  slope_deg: number;
  elevation_m: number;
  geology: string;
  soil_type: string;
  land_cover: string;
  estimated_volume_m3: number;
  susceptibility_class: string;
  blockage_potential: string;
  quality_status: string;
}

interface BlockageSimulationResult {
  status: string;
  scenario: string;
  landslide_site: LandslideSite;
  blockage_geometry: {
    blockage_percentage: number;
    landslide_volume_m3: number;
    landslide_dam_height_m: number;
    river_km: number;
    coordinates: { lat: number; lng: number };
  };
  upstream_ponding: {
    water_level_increase_m: number;
    ponding_volume_million_m3: number;
    ponded_surface_area_km2: number;
    time_to_overtop_hr: number;
  };
  breach_hydrograph: {
    peak_breach_outflow_m3s: number;
    breach_failure_time_min: number;
    total_downstream_peak_q_m3s: number;
    downstream_surge_depth_m: number;
    downstream_wave_velocity_ms: number;
  };
  susceptibility_analysis: {
    susceptibility_index: number;
    susceptibility_category: string;
    risk_color: string;
    factor_breakdown: {
      slope_score: number;
      elevation_score: number;
      trigger_rainfall_score: number;
      geology_soil_score: number;
      land_cover_score: number;
    };
    geotechnical_notice: string;
  };
  geotechnical_notice: string;
}

// Initial Geotech Sites Inventory
const DEFAULT_INVENTORY: LandslideSite[] = [
  {
    id: 'ls-koti-nala',
    name: 'Koti Nala Slope Failure Site',
    location_name: 'Bhagirathi Valley - River Km 14.2 (Tehri Reach)',
    coordinates: { lat: 30.3542, lng: 78.4621 },
    river_km: 14.2,
    slope_deg: 42.5,
    elevation_m: 1480,
    geology: 'Highly fractured Quartzite & Phyllite Gneiss',
    soil_type: 'Colluvial Debris Deposits',
    land_cover: 'Sparse Alpine Vegetation',
    estimated_volume_m3: 3800000,
    susceptibility_class: 'VERY HIGH',
    blockage_potential: 'HIGH RISK OF FULL DAMMING',
    quality_status: 'VERIFIED_GEOTECH'
  },
  {
    id: 'ls-helang',
    name: 'Helang Rockslide Zone',
    location_name: 'Alaknanda Gorge - River Km 28.6 (Chamoli Reach)',
    coordinates: { lat: 30.5210, lng: 79.4820 },
    river_km: 28.6,
    slope_deg: 48.0,
    elevation_m: 1820,
    geology: 'Schistose Gneiss & Faulted Limestone',
    soil_type: 'Rock Avalanche Talus',
    land_cover: 'Degraded Forest',
    estimated_volume_m3: 5200000,
    susceptibility_class: 'EXTREME',
    blockage_potential: 'CATASTROPHIC DAMS',
    quality_status: 'VERIFIED_GEOTECH'
  },
  {
    id: 'ls-malepa',
    name: 'Malepa Debris Flow Channel',
    location_name: 'Upper Kali River Gorge - River Km 42.0',
    coordinates: { lat: 29.8450, lng: 80.6210 },
    river_km: 42.0,
    slope_deg: 38.0,
    elevation_m: 2150,
    geology: 'Mica Schist & Glacial Till',
    soil_type: 'Saturated Debris Matrix',
    land_cover: 'Bare Rock Slopes',
    estimated_volume_m3: 2400000,
    susceptibility_class: 'HIGH',
    blockage_potential: 'PARTIAL CONSTRICTION',
    quality_status: 'VERIFIED_GEOTECH'
  }
];

// Robust Initial Simulation Result
const DEFAULT_RESULT: BlockageSimulationResult = {
  status: 'success',
  scenario: 'MAJOR_BLOCKAGE',
  landslide_site: DEFAULT_INVENTORY[0],
  blockage_geometry: {
    blockage_percentage: 85,
    landslide_volume_m3: 3800000,
    landslide_dam_height_m: 45.0,
    river_km: 14.2,
    coordinates: { lat: 30.3542, lng: 78.4621 }
  },
  upstream_ponding: {
    water_level_increase_m: 28.4,
    ponding_volume_million_m3: 42.5,
    ponded_surface_area_km2: 14.2,
    time_to_overtop_hr: 3.5
  },
  breach_hydrograph: {
    peak_breach_outflow_m3s: 18400,
    breach_failure_time_min: 45,
    total_downstream_peak_q_m3s: 19650,
    downstream_surge_depth_m: 11.4,
    downstream_wave_velocity_ms: 9.2
  },
  susceptibility_analysis: {
    susceptibility_index: 0.84,
    susceptibility_category: 'VERY HIGH RISK',
    risk_color: '#ef4444',
    factor_breakdown: {
      slope_score: 0.92,
      elevation_score: 0.78,
      trigger_rainfall_score: 0.88,
      geology_soil_score: 0.85,
      land_cover_score: 0.75
    },
    geotechnical_notice: 'Empirical hydrodynamics: Landslide blockage dam formation & overtopping breach hydrograph.'
  },
  geotechnical_notice: 'SIMPLIFIED GEOTECHNICAL SCENARIO — HYDRODYNAMIC EMPIRICAL RUNOFF MAPPING'
};

// Hydrograph Chart Data
const HYDROGRAPH_SERIES = [
  { hour: '0h', ponding_m: 5.0, breach_q: 1250 },
  { hour: '1h', ponding_m: 12.0, breach_q: 1250 },
  { hour: '2h', ponding_m: 20.4, breach_q: 1400 },
  { hour: '3h', ponding_m: 28.4, breach_q: 3800 },
  { hour: '3.5h', ponding_m: 32.0, breach_q: 18400 },
  { hour: '4h', ponding_m: 24.5, breach_q: 14200 },
  { hour: '6h', ponding_m: 16.2, breach_q: 8500 },
  { hour: '9h', ponding_m: 9.8, breach_q: 4600 },
  { hour: '12h', ponding_m: 6.4, breach_q: 2800 },
  { hour: '18h', ponding_m: 4.2, breach_q: 1650 },
  { hour: '24h', ponding_m: 3.1, breach_q: 1350 }
];

export const LandslideBlockagePage: React.FC = () => {
  const [inventory, setInventory] = useState<LandslideSite[]>(DEFAULT_INVENTORY);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('ls-koti-nala');
  const [blockageScenario, setBlockageScenario] = useState<string>('MAJOR_BLOCKAGE');
  const [rainfallMm, setRainfallMm] = useState<number>(180);
  const [riverInflow, setRiverInflow] = useState<number>(1250);
  const [result, setResult] = useState<BlockageSimulationResult>(DEFAULT_RESULT);

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    runSimulation();
  }, [selectedSiteId, blockageScenario, rainfallMm, riverInflow]);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/landslides/inventory');
      if (res.ok) {
        const data: LandslideSite[] = await res.json();
        if (data && data.length > 0) {
          setInventory(data);
        }
      }
    } catch (err) {
      console.warn('Inventory fetch warning; using default geotech inventory:', err);
    }
  };

  const runSimulation = async () => {
    let data: BlockageSimulationResult | null = null;
    try {
      const res = await fetch('/api/landslides/blockage-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockage_scenario: blockageScenario,
          landslide_id: selectedSiteId,
          river_inflow_m3s: riverInflow,
          trigger_rainfall_mm: rainfallMm
        })
      });
      if (res.ok) {
        data = await res.json();
      }
    } catch (err) {
      console.warn('Simulation execution API warning; using dynamic client fallback:', err);
    }

    if (data) {
      setResult(data);
    } else {
      // Recalculate dynamic fallback based on sliders
      const mult = blockageScenario === 'NONE' ? 0 : blockageScenario === 'PARTIAL_BLOCKAGE' ? 0.45 : 0.85;
      const constrPct = Math.round(mult * 100);
      const damH = Math.round(30 * mult);
      const pondingMm3 = parseFloat((riverInflow * mult * 0.04).toFixed(1));
      const peakBreach = Math.round(riverInflow + (15000 * mult * (rainfallMm / 180)));
      const siteMatch = inventory.find((s) => s.id === selectedSiteId) || DEFAULT_INVENTORY[0];

      setResult({
        ...DEFAULT_RESULT,
        scenario: blockageScenario,
        landslide_site: siteMatch,
        blockage_geometry: {
          ...DEFAULT_RESULT.blockage_geometry,
          blockage_percentage: constrPct,
          landslide_dam_height_m: damH
        },
        upstream_ponding: {
          ...DEFAULT_RESULT.upstream_ponding,
          ponding_volume_million_m3: pondingMm3,
          water_level_increase_m: Math.round(damH * 0.7)
        },
        breach_hydrograph: {
          ...DEFAULT_RESULT.breach_hydrograph,
          peak_breach_outflow_m3s: peakBreach,
          total_downstream_peak_q_m3s: peakBreach + 1250,
          downstream_wave_velocity_ms: parseFloat((6.0 + 4.0 * mult).toFixed(1)),
          downstream_surge_depth_m: parseFloat((4.0 + 8.0 * mult).toFixed(1))
        }
      });
    }
  };

  const scenarios = [
    {
      id: 'NONE',
      name: 'NONE',
      code: 'CLEAR_CHANNEL',
      desc: 'No river damming, unconstricted natural channel flow',
      color: '#38bdf8'
    },
    {
      id: 'PARTIAL_BLOCKAGE',
      name: 'PARTIAL BLOCKAGE',
      code: 'SLOPE_CONSTRICTION',
      desc: '30%-50% channel constriction & moderate ponding',
      color: '#eab308'
    },
    {
      id: 'MAJOR_BLOCKAGE',
      name: 'MAJOR BLOCKAGE',
      code: 'FULL_LANDSLIDE_DAM',
      desc: '70%-90% full damming, massive ponding & breach surge',
      color: '#ef4444'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Mountain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                Landslide & River Blockage Module
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  PHASE 7 GEOTECH GIS
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Cascading dynamic: Slope failure → Channel blockage → Upstream ponding → Dam breach surge wave
              </p>
            </div>
          </div>
        </div>

        {/* Rigor Notice Badge */}
        <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <div className="text-xs font-bold text-amber-300 tracking-wide uppercase">
              METHODOLOGY NOTICE
            </div>
            <div className="text-xs font-semibold text-amber-200">
              {result.geotechnical_notice || 'SIMPLIFIED GEOTECHNICAL SCENARIO — NOT GEOLOGICAL PREDICTION'}
            </div>
          </div>
        </div>
      </div>

      {/* Blockage Scenario Range Buttons */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          Select River Blockage Scenario
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {scenarios.map((sc) => {
            const isSelected = sc.id === blockageScenario;
            return (
              <button
                key={sc.id}
                onClick={() => setBlockageScenario(sc.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-amber-500/60 ring-2 ring-amber-500/30 shadow-lg shadow-amber-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded text-white"
                    style={{ backgroundColor: sc.color }}
                  >
                    {sc.name}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-200">{sc.code}</div>
                <div className="text-[11px] text-slate-400 mt-1">{sc.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid Controls & Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-amber-400" />
            Site & Geotech Parameters
          </h2>

          {/* Select Known Landslide Site */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Known Landslide Site Integration
            </label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              {inventory.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} ({site.susceptibility_class})
                </option>
              ))}
            </select>
          </div>

          {/* Trigger Rainfall */}
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Trigger Rainfall</span>
              <span className="text-amber-400 font-mono">{rainfallMm} mm</span>
            </div>
            <input
              type="range"
              min="20"
              max="400"
              step="10"
              value={rainfallMm}
              onChange={(e) => setRainfallMm(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Main River Inflow */}
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
              <span>Main River Inflow Rate</span>
              <span className="text-cyan-400 font-mono">{riverInflow} m³/s</span>
            </div>
            <input
              type="range"
              min="200"
              max="5000"
              step="100"
              value={riverInflow}
              onChange={(e) => setRiverInflow(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Selected Site Details Card */}
          {result && result.landslide_site && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {result.landslide_site.name}
              </div>
              <div className="text-[11px] text-slate-400">{result.landslide_site.location_name}</div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                <div>Slope: <span className="font-mono">{result.landslide_site.slope_deg}°</span></div>
                <div>Elev: <span className="font-mono">{result.landslide_site.elevation_m}m</span></div>
                <div className="col-span-2 text-slate-400">{result.landslide_site.geology}</div>
              </div>
            </div>
          )}
        </div>

        {/* Results Dashboard & GIS View */}
        <div className="lg:col-span-3 space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4">
              <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Mountain className="w-4 h-4 text-amber-400" />
                Blockage Constriction
              </div>
              <div className="text-2xl font-black text-amber-400 mt-2 font-mono">
                {result.blockage_geometry.blockage_percentage}
                <span className="text-sm font-normal text-slate-400 ml-1">%</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Landslide dam height: {result.blockage_geometry.landslide_dam_height_m} m
              </div>
            </div>

            <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-4">
              <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-cyan-400" />
                Upstream Ponding Storage
              </div>
              <div className="text-2xl font-black text-cyan-400 mt-2 font-mono">
                {result.upstream_ponding.ponding_volume_million_m3}
                <span className="text-sm font-normal text-slate-400 ml-1">Mm³</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Stage rise: +{result.upstream_ponding.water_level_increase_m} m
              </div>
            </div>

            <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-4">
              <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-rose-400" />
                Peak Breach Outflow
              </div>
              <div className="text-2xl font-black text-rose-400 mt-2 font-mono">
                {result.breach_hydrograph.peak_breach_outflow_m3s.toLocaleString()}
                <span className="text-sm font-normal text-slate-400 ml-1">m³/s</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Total Q: {result.breach_hydrograph.total_downstream_peak_q_m3s.toLocaleString()} m³/s
              </div>
            </div>

            <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-4">
              <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-purple-400" />
                Downstream Wave Speed
              </div>
              <div className="text-2xl font-black text-purple-400 mt-2 font-mono">
                {result.breach_hydrograph.downstream_wave_velocity_ms}
                <span className="text-sm font-normal text-slate-400 ml-1">m/s</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Surge depth: {result.breach_hydrograph.downstream_surge_depth_m} m
              </div>
            </div>
          </div>

          {/* Detailed Analysis Recharts Hydrograph & Ponding Chart */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Landslide Dam Ponding Evolution & Breach Hydrograph
              </h3>
              <span className="text-xs text-amber-300 font-mono">Time to Overtop Dam: {result.upstream_ponding.time_to_overtop_hr} hrs</span>
            </div>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={HYDROGRAPH_SERIES} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="hour" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" stroke="#38bdf8" tick={{ fontSize: 11 }} unit=" m" domain={[0, 40]} />
                  <YAxis yAxisId="right" orientation="right" stroke="#ef4444" tick={{ fontSize: 11 }} unit=" m³/s" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area yAxisId="left" type="monotone" dataKey="ponding_m" name="Upstream Lake Water Stage (m)" fill="#0284c7" stroke="#38bdf8" opacity={0.3} />
                  <Line yAxisId="right" type="monotone" dataKey="breach_q" name="Downstream Breach Outflow Q (m³/s)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GIS Visualization Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                Landslide & River Blockage Spatial GIS Map
              </h3>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-amber-300">
                {result.landslide_site.location_name}
              </span>
            </div>

            {/* GIS Canvas Schematic */}
            <div className="w-full h-64 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex flex-col justify-between p-4">
              {/* GIS Grid Background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30" />

              {/* Map Layer Legend overlay */}
              <div className="relative z-10 flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-2 flex gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Slide Debris</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Ponded Lake</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Breach Surge</span>
                </div>
                <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg px-2.5 py-1 text-amber-300 font-mono text-[11px]">
                  LSI: {result.susceptibility_analysis.susceptibility_index} ({result.susceptibility_analysis.susceptibility_category})
                </div>
              </div>

              {/* River Channel Dynamic Graphic */}
              <div className="relative z-10 my-auto flex items-center justify-between px-4 sm:px-8">
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">Upstream Inflow</div>
                  <div className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-300 font-mono text-xs font-bold">
                    {riverInflow} m³/s
                  </div>
                </div>

                <ArrowDownRight className="w-6 h-6 text-slate-600 animate-pulse" />

                {/* Blockage Junction Point */}
                <div className="text-center relative">
                  <div className="text-xs text-amber-300 font-semibold mb-1">Landslide Dam</div>
                  <div className="px-4 py-2 bg-rose-600/30 border border-rose-500/60 rounded-xl text-rose-200 font-mono text-xs font-bold shadow-lg shadow-rose-950">
                    Constriction: {result.blockage_geometry.blockage_percentage}%
                    <div className="text-[10px] font-normal text-rose-300">Dam H: {result.blockage_geometry.landslide_dam_height_m}m</div>
                  </div>
                </div>

                <ArrowDownRight className="w-6 h-6 text-slate-600 animate-pulse" />

                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">Downstream Breach Wave</div>
                  <div className="px-3 py-1.5 bg-rose-500/20 border border-rose-500/40 rounded-lg text-rose-300 font-mono text-xs font-bold">
                    {result.breach_hydrograph.total_downstream_peak_q_m3s.toLocaleString()} m³/s
                  </div>
                </div>
              </div>

              {/* Bottom Info bar */}
              <div className="relative z-10 flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex-wrap gap-2">
                <span>Ponding Storage: {result.upstream_ponding.ponding_volume_million_m3} Mm³</span>
                <span>Time to Overtop: {result.upstream_ponding.time_to_overtop_hr} hrs</span>
                <span>Wave Speed: {result.breach_hydrograph.downstream_wave_velocity_ms} m/s</span>
              </div>
            </div>
          </div>

          {/* Susceptibility Breakdown */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Landslide Susceptibility Factor Breakdown
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400">Slope Factor</div>
                <div className="text-base font-bold text-slate-200 mt-1 font-mono">
                  {result.susceptibility_analysis.factor_breakdown.slope_score}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400">Elevation Factor</div>
                <div className="text-base font-bold text-slate-200 mt-1 font-mono">
                  {result.susceptibility_analysis.factor_breakdown.elevation_score}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400">Trigger Rain</div>
                <div className="text-base font-bold text-amber-400 mt-1 font-mono">
                  {result.susceptibility_analysis.factor_breakdown.trigger_rainfall_score}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400">Geology / Soil</div>
                <div className="text-base font-bold text-slate-200 mt-1 font-mono">
                  {result.susceptibility_analysis.factor_breakdown.geology_soil_score}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400">Land Cover</div>
                <div className="text-base font-bold text-slate-200 mt-1 font-mono">
                  {result.susceptibility_analysis.factor_breakdown.land_cover_score}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
