import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Tooltip, LayersControl, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  GitBranch,
  Info,
  Layers,
  Compass,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Cpu
} from 'lucide-react';

// Custom Leaflet marker icons for Confluences & Hydro Stations
const createCustomNodeIcon = (emoji: string, borderColor: string, bgColor: string = '#0f172a') => {
  return L.divIcon({
    className: 'custom-leaflet-node-icon',
    html: `<div style="background-color: ${bgColor}; color: #ffffff; border: 2.5px solid ${borderColor}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.6);">
      ${emoji}
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const junctionNodes = [
  { id: 'node-tehri-dam', name: 'Tehri Dam Reservoir & Impoundment', type: 'Major Dam & Breach Node', lat: 30.378, lng: 78.480, emoji: '🌊', color: '#38bdf8', elevation: '830 m', Q: '450 m³/s' },
  { id: 'node-dharali', name: 'Dharali Confluence Junction', type: 'Upper Tributary Confluence', lat: 30.70, lng: 78.58, emoji: '🔀', color: '#f59e0b', elevation: '1,850 m', Q: '140 m³/s' },
  { id: 'node-old-tehri', name: 'Old Tehri Confluence Node', type: 'Bhilangna River Confluence', lat: 30.38, lng: 78.48, emoji: '🔀', color: '#a855f7', elevation: '830 m', Q: '290 m³/s' },
  { id: 'node-devprayag', name: 'Devprayag Terminal Confluence', type: 'Alaknanda Main River Confluence (Ganga Origin)', lat: 30.15, lng: 78.32, emoji: '🏁', color: '#ef4444', elevation: '280 m', Q: '48,500 m³/s' },
  { id: 'node-uttarkashi', name: 'Uttarkashi Hydro Gauging Station', type: 'CWC Real-time Telemetry Station', lat: 30.72, lng: 78.44, emoji: '📊', color: '#10b981', elevation: '1,158 m', Q: '380 m³/s' }
];

interface SubCatchment {
  id: string;
  name: string;
  area_km2: number;
  elevation_mean_m: number;
  slope_percent: number;
  impervious_percent: number;
  cn_value: number;
  quality_status: string;
  coordinates: [number, number][];
}

interface RiverBranch {
  id: string;
  river_id: string;
  branch_id: string;
  name: string;
  stream_order: number;
  length_km: number;
  upstream_area_km2: number;
  slope_m_m: number;
  elevation_min_m: number;
  elevation_max_m: number;
  elevation_range_m?: number;
  discharge_m3s: number;
  velocity_ms: number;
  depth_m: number;
  flow_direction: string;
  confluence: string;
  quality_status: string;
  coordinates: [number, number][];
}

interface CatchmentStats {
  id: string;
  name: string;
  area_km2: number;
  perimeter_km: number;
  elevation_min_m: number;
  elevation_max_m: number;
  mean_elevation_m: number;
  mean_slope_deg: number;
  max_slope_deg: number;
  drainage_density_km_km2: number;
  stream_order_max: number;
  total_river_length_km: number;
  time_of_concentration_hr: number;
  cn_curve_number: number;
  runoff_coefficient: number;
  data_source: string;
  quality_status: string;
  confidence_score: number;
}

interface RiverNetwork {
  id: string;
  name: string;
  main_river: string;
  tributaries: string[];
  branches: string[];
  sub_branches: string[];
  confluences: { name: string; type: string }[];
  upstream_downstream_relationships: { upstream: string; downstream: string }[];
}

export const BasinIntelligencePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'basin' | 'river'>('basin');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcNotice, setCalcNotice] = useState<string | null>(null);

  const [catchment, setCatchment] = useState<CatchmentStats>({
    id: "cat-bhagirathi-001",
    name: "Upper Bhagirathi River Basin",
    area_km2: 1240.0,
    perimeter_km: 180.5,
    elevation_min_m: 280.0,
    elevation_max_m: 2600.0,
    mean_elevation_m: 1440.0,
    mean_slope_deg: 14.2,
    max_slope_deg: 48.5,
    drainage_density_km_km2: 2.15,
    stream_order_max: 5,
    total_river_length_km: 266.6,
    time_of_concentration_hr: 6.4,
    cn_curve_number: 78.0,
    runoff_coefficient: 0.45,
    data_source: "ALOS PALSAR 12m DEM & CWC Hydrological Benchmark",
    quality_status: "DEMO",
    confidence_score: 0.94
  });

  const [subcatchments, setSubcatchments] = useState<SubCatchment[]>([
    {
      id: "subcat-upper-bhagirathi",
      name: "Gangotri Glacier - Dharali Reach",
      area_km2: 420.0,
      elevation_mean_m: 2100.0,
      slope_percent: 22.4,
      impervious_percent: 5.0,
      cn_value: 72.0,
      quality_status: "SYNTHETIC",
      coordinates: [[30.95, 78.85], [30.90, 78.95], [30.75, 78.75], [30.85, 78.65]]
    },
    {
      id: "subcat-bhilangna-tributary",
      name: "Bhilangna River Valley",
      area_km2: 380.0,
      elevation_mean_m: 1650.0,
      slope_percent: 18.2,
      impervious_percent: 8.0,
      cn_value: 76.0,
      quality_status: "SYNTHETIC",
      coordinates: [[30.55, 78.65], [30.65, 78.85], [30.45, 78.75], [30.38, 78.50]]
    },
    {
      id: "subcat-koti-nala",
      name: "Koti Nala Slope Sub-Catchment",
      area_km2: 240.0,
      elevation_mean_m: 1120.0,
      slope_percent: 14.5,
      impervious_percent: 12.0,
      cn_value: 80.0,
      quality_status: "SYNTHETIC",
      coordinates: [[30.42, 78.48], [30.48, 78.58], [30.35, 78.52], [30.33, 78.45]]
    },
    {
      id: "subcat-lower-valley",
      name: "Devprayag Confluence Reach",
      area_km2: 200.0,
      elevation_mean_m: 580.0,
      slope_percent: 9.8,
      impervious_percent: 18.0,
      cn_value: 82.0,
      quality_status: "SYNTHETIC",
      coordinates: [[30.33, 78.43], [30.25, 78.55], [30.15, 78.60], [30.20, 78.35]]
    }
  ]);

  const [riverNetwork, setRiverNetwork] = useState<RiverNetwork>({
    id: "riv-bhagirathi-001",
    name: "Bhagirathi River Main System",
    main_river: "Bhagirathi Main Channel",
    tributaries: ["Bhilangna River", "Koti Nala Stream", "Jadh Ganga Tributary"],
    branches: ["BRANCH_01_HEADWATERS", "BRANCH_02_MID_REACH", "BRANCH_03_BHILANGNA", "BRANCH_04_RESERVOIR", "BRANCH_05_DOWNSTREAM"],
    sub_branches: ["Koti Nala Secondary Branch", "Bhilangna East Fork"],
    confluences: [
      { name: "Dharali Junction", type: "Tributary Confluence" },
      { name: "Old Tehri Confluence Node", type: "Major River Confluence" },
      { name: "Alaknanda Confluence (Devprayag)", type: "Main River Terminal Confluence" }
    ],
    upstream_downstream_relationships: [
      { upstream: "BRANCH_01_HEADWATERS", downstream: "BRANCH_02_MID_REACH" },
      { upstream: "BRANCH_02_MID_REACH", downstream: "BRANCH_04_RESERVOIR" },
      { upstream: "BRANCH_03_BHILANGNA", downstream: "BRANCH_04_RESERVOIR" },
      { upstream: "BRANCH_04_RESERVOIR", downstream: "BRANCH_05_DOWNSTREAM" }
    ]
  });

  const [branches, setBranches] = useState<RiverBranch[]>([
    {
      id: "rb-bhagirathi-headwaters",
      river_id: "riv-bhagirathi-001",
      branch_id: "BRANCH_01_HEADWATERS",
      name: "Gangotri Glacier Main Stream",
      stream_order: 1,
      length_km: 42.5,
      upstream_area_km2: 350.0,
      slope_m_m: 0.024,
      elevation_min_m: 1850.0,
      elevation_max_m: 2600.0,
      elevation_range_m: 750.0,
      discharge_m3s: 140.0,
      velocity_ms: 2.8,
      depth_m: 2.1,
      flow_direction: "South-West",
      confluence: "Dharali Junction",
      quality_status: "OBSERVED",
      coordinates: [[30.98, 78.90], [30.85, 78.70], [30.70, 78.58]]
    },
    {
      id: "rb-bhagirathi-mid-reach",
      river_id: "riv-bhagirathi-001",
      branch_id: "BRANCH_02_MID_REACH",
      name: "Uttarkashi Main Channel",
      stream_order: 3,
      length_km: 54.0,
      upstream_area_km2: 720.0,
      slope_m_m: 0.012,
      elevation_min_m: 840.0,
      elevation_max_m: 1850.0,
      elevation_range_m: 1010.0,
      discharge_m3s: 380.0,
      velocity_ms: 2.2,
      depth_m: 3.8,
      flow_direction: "South",
      confluence: "Tehri Reservoir Inlet",
      quality_status: "OBSERVED",
      coordinates: [[30.70, 78.58], [30.55, 78.48], [30.42, 78.48]]
    },
    {
      id: "rb-bhilangna-tributary-branch",
      river_id: "riv-bhagirathi-001",
      branch_id: "BRANCH_03_BHILANGNA",
      name: "Bhilangna River Tributary Branch",
      stream_order: 3,
      length_km: 68.2,
      upstream_area_km2: 380.0,
      slope_m_m: 0.015,
      elevation_min_m: 830.0,
      elevation_max_m: 2200.0,
      elevation_range_m: 1370.0,
      discharge_m3s: 290.0,
      velocity_ms: 2.4,
      depth_m: 3.0,
      flow_direction: "West",
      confluence: "Old Tehri Confluence Node",
      quality_status: "OBSERVED",
      coordinates: [[30.55, 78.78], [30.45, 78.62], [30.38, 78.48]]
    },
    {
      id: "rb-tehri-reservoir-reach",
      river_id: "riv-bhagirathi-001",
      branch_id: "BRANCH_04_RESERVOIR",
      name: "Tehri Impounded Pool Channel",
      stream_order: 4,
      length_km: 45.0,
      upstream_area_km2: 1100.0,
      slope_m_m: 0.001,
      elevation_min_m: 822.4,
      elevation_max_m: 830.0,
      elevation_range_m: 7.6,
      discharge_m3s: 450.0,
      velocity_ms: 0.4,
      depth_m: 68.0,
      flow_direction: "South-West",
      confluence: "Tehri Dam Body (Z = -30)",
      quality_status: "REAL",
      coordinates: [[30.42, 78.48], [30.38, 78.48]]
    },
    {
      id: "rb-downstream-valley-reach",
      river_id: "riv-bhagirathi-001",
      branch_id: "BRANCH_05_DOWNSTREAM",
      name: "Downstream Bhagirathi Main River",
      stream_order: 5,
      length_km: 56.9,
      upstream_area_km2: 1240.0,
      slope_m_m: 0.005,
      elevation_min_m: 280.0,
      elevation_max_m: 820.0,
      elevation_range_m: 540.0,
      discharge_m3s: 48500.0,
      velocity_ms: 7.4,
      depth_m: 14.8,
      flow_direction: "South-West to Devprayag",
      confluence: "Alaknanda River Confluence (Ganga Origin)",
      quality_status: "DEMO",
      coordinates: [[30.38, 78.48], [30.33, 78.43], [30.25, 78.38], [30.15, 78.32]]
    }
  ]);

  const [selectedBranch, setSelectedBranch] = useState<RiverBranch | null>(branches[4]);
  const [selectedSubcatchment, setSelectedSubcatchment] = useState<SubCatchment | null>(subcatchments[1]);

  // Fetch backend data on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/catchments')
      .then(res => res.json())
      .then(data => {
        if (data && data[0]) setCatchment(data[0]);
      })
      .catch(() => {});

    fetch('http://localhost:8000/api/subcatchments')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSubcatchments(prev => prev.map((s, idx) => ({ ...s, ...data[idx] })));
        }
      })
      .catch(() => {});

    fetch('http://localhost:8000/api/rivers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data[0]) setRiverNetwork(data[0]);
      })
      .catch(() => {});

    fetch('http://localhost:8000/api/river-branches')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setBranches(prev => prev.map((b, idx) => ({ ...b, ...data[idx] })));
        }
      })
      .catch(() => {});
  }, []);

  const handleTriggerGISCalculation = async () => {
    setIsCalculating(true);
    setCalcNotice(null);
    try {
      // Send sample Tehri basin geometry polygon to backend calculate endpoint
      const res = await fetch('http://localhost:8000/api/catchments/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geometry: {
            type: 'Polygon',
            coordinates: [
              [[78.4, 30.3], [78.9, 30.3], [78.9, 30.9], [78.4, 30.9], [78.4, 30.3]]
            ]
          },
          src_crs: 'EPSG:4326',
          target_crs: 'EPSG:32644',
          slope_m_m: 0.014
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'SUCCESS') {
        setCatchment(prev => ({
          ...prev,
          area_km2: data.calculated_area_km2,
          perimeter_km: data.calculated_perimeter_km,
          time_of_concentration_hr: data.calculated_time_of_concentration_hr,
          drainage_density_km_km2: data.drainage_density_km_km2,
          quality_status: 'CALCULATED_GIS'
        }));
        setCalcNotice(`Real GIS calculation complete: Area ${data.calculated_area_km2} km², Tc ${data.calculated_time_of_concentration_hr} hrs (CRS transformed EPSG:4326 -> EPSG:32644)`);
      } else {
        setCalcNotice("Backend calculation returned fallback.");
      }
    } catch {
      setCalcNotice("Could not connect to backend calculation service.");
    } finally {
      setIsCalculating(false);
    }
  };

  const getStreamOrderColor = (order: number) => {
    switch (order) {
      case 1: return '#38bdf8'; // Light Cyan
      case 2: return '#60a5fa'; // Blue
      case 3: return '#818cf8'; // Indigo
      case 4: return '#c084fc'; // Purple
      case 5: return '#ef4444'; // Crimson Main River
      default: return '#38bdf8';
    }
  };

  return (
    <div className="space-y-6 select-none font-sans">
      
      {/* Top Banner & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-white uppercase tracking-wide">
                Basin & River Network Intelligence
              </h1>
              <span className="bg-teal-950 text-teal-400 border border-teal-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                HYDRO GIS CORE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Catchment Morphometry, Strahler Stream Order, Upstream Areas & Branch Hydraulics
            </p>
          </div>
        </div>

        {/* Action Controls & Module Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('basin')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'basin'
                  ? 'bg-sky-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Basin Intelligence</span>
            </button>
            <button
              onClick={() => setActiveTab('river')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'river'
                  ? 'bg-sky-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>River Network Intelligence</span>
            </button>
          </div>

          <button
            onClick={handleTriggerGISCalculation}
            disabled={isCalculating}
            className="px-3 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs shadow transition-all flex items-center space-x-1.5"
          >
            <Calculator className="w-4 h-4" />
            <span>{isCalculating ? "Calculating GIS..." : "Compute GIS Basin"}</span>
          </button>
        </div>
      </div>

      {calcNotice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{calcNotice}</span>
        </div>
      )}

      {/* Catchment Hydrological Parameters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Catchment Area</span>
          <div className="text-lg font-black text-sky-400 font-mono">{catchment.area_km2} <span className="text-xs text-slate-400">km²</span></div>
          <p className="text-[10px] text-slate-500">Perimeter: {catchment.perimeter_km} km</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Drainage Density</span>
          <div className="text-lg font-black text-emerald-400 font-mono">{catchment.drainage_density_km_km2} <span className="text-xs text-slate-400">km/km²</span></div>
          <p className="text-[10px] text-slate-500">Total Stream: {catchment.total_river_length_km} km</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Time of Concentration</span>
          <div className="text-lg font-black text-amber-400 font-mono">{catchment.time_of_concentration_hr} <span className="text-xs text-slate-400">hours</span></div>
          <p className="text-[10px] text-slate-500">Kirpich (1940) Equation</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Elevation Range</span>
          <div className="text-lg font-black text-indigo-400 font-mono">{catchment.elevation_min_m} - {catchment.elevation_max_m} <span className="text-xs text-slate-400">m</span></div>
          <p className="text-[10px] text-slate-500">Mean: {catchment.mean_elevation_m} m</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Curve Number (CN)</span>
          <div className="text-lg font-black text-purple-400 font-mono">{catchment.cn_curve_number} <span className="text-xs text-slate-400">CN</span></div>
          <p className="text-[10px] text-slate-500">Runoff Coeff C: {catchment.runoff_coefficient}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Max Stream Order</span>
          <div className="text-lg font-black text-rose-400 font-mono">Order {catchment.stream_order_max}</div>
          <p className="text-[10px] text-slate-500">Strahler Classification</p>
        </div>
      </div>

      {/* Module 1: Basin Intelligence Specific Summary */}
      {activeTab === 'basin' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Compass className="w-5 h-5 text-sky-400" />
              <h3 className="text-base font-black text-white uppercase tracking-wide">
                Basin Hypsometry & Sub-Catchment Delineation
              </h3>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2.5 py-1 rounded-lg border border-slate-700">
              4 Sub-Basins Identified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {subcatchments.map((sc) => (
              <div
                key={sc.id}
                onClick={() => setSelectedSubcatchment(sc)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedSubcatchment?.id === sc.id
                    ? 'bg-sky-950/80 border-sky-500 shadow-lg'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-sky-400 font-bold">{sc.id}</span>
                  <span className="text-[9px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded">
                    CN {sc.cn_value}
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm mb-2">{sc.name}</h4>
                <div className="space-y-1 font-mono text-slate-300 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Area:</span>
                    <strong className="text-white">{sc.area_km2} km²</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mean Elev:</span>
                    <strong className="text-white">{sc.elevation_mean_m} m</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Slope:</span>
                    <strong className="text-white">{sc.slope_percent}%</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module 2: River Network Intelligence Topological Representation */}
      {activeTab === 'river' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-black text-white uppercase tracking-wide">
                River Network Topology & Confluence Graph
              </h3>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
              <span>Main River: <strong className="text-sky-400">{riverNetwork.main_river}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Main River & Tributaries List */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Tributaries & Branches
              </span>
              <ul className="space-y-1.5 text-slate-200">
                {riverNetwork.tributaries.map((trib, i) => (
                  <li key={i} className="flex items-center space-x-2 bg-slate-900 p-2 rounded border border-slate-800">
                    <GitBranch className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="font-semibold">{trib}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Upstream/Downstream Relationships */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Upstream / Downstream Flow Chain
              </span>
              <div className="space-y-1.5 font-mono text-[11px]">
                {riverNetwork.upstream_downstream_relationships.map((rel, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800 text-slate-300">
                    <span className="text-sky-400 font-bold">{rel.upstream}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 mx-1" />
                    <span className="text-emerald-400 font-bold">{rel.downstream}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confluence Nodes */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Confluence Junction Nodes
              </span>
              <div className="space-y-1.5 font-mono text-[11px]">
                {riverNetwork.confluences.map((conf, i) => (
                  <div key={i} className="bg-slate-900 p-2 rounded border border-slate-800 space-y-0.5">
                    <div className="font-bold text-amber-300">{conf.name}</div>
                    <div className="text-[10px] text-slate-400">{conf.type}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Map & Side Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Interactive Leaflet GIS Map (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative h-[540px]">
          <MapContainer
            center={[30.48, 78.55]}
            zoom={10}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Dark Canvas (Esri Dark)">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                  attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="OpenStreetMap Standard">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Esri World Imagery (Satellite)">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Tiles &copy; Esri"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Esri World Topo (Terrain)">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                  attribution="Tiles &copy; Esri"
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            {/* Sub-Catchment Polygons */}
            {subcatchments.map((sc) => (
              <Polygon
                key={sc.id}
                positions={sc.coordinates}
                pathOptions={{
                  color: selectedSubcatchment?.id === sc.id ? '#10b981' : '#0284c7',
                  fillColor: selectedSubcatchment?.id === sc.id ? '#10b981' : '#0369a1',
                  fillOpacity: selectedSubcatchment?.id === sc.id ? 0.35 : 0.15,
                  weight: 2,
                  dashArray: '4, 4'
                }}
                eventHandlers={{
                  click: () => setSelectedSubcatchment(sc)
                }}
              >
                <Tooltip sticky>
                  <div className="font-sans text-xs">
                    <div className="font-bold text-slate-900">{sc.name}</div>
                    <div className="text-[10px] text-slate-600">Area: {sc.area_km2} km² | CN: {sc.cn_value}</div>
                  </div>
                </Tooltip>
              </Polygon>
            ))}

            {/* River Branches (Colored by Strahler Stream Order) */}
            {branches.map((b) => (
              <Polyline
                key={b.id}
                positions={b.coordinates}
                pathOptions={{
                  color: getStreamOrderColor(b.stream_order),
                  weight: selectedBranch?.id === b.id ? b.stream_order * 2 + 3 : b.stream_order * 1.5 + 1.5,
                  opacity: selectedBranch?.id === b.id ? 1.0 : 0.85
                }}
                eventHandlers={{
                  click: () => setSelectedBranch(b)
                }}
              >
                <Tooltip sticky>
                  <div className="font-sans text-xs">
                    <div className="font-bold text-slate-900">{b.name}</div>
                    <div className="text-[10px] text-slate-600 font-mono">
                      Order {b.stream_order} | Q: {b.discharge_m3s} m³/s | V: {b.velocity_ms} m/s
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            ))}

            {/* Confluence & Telemetry Junction Markers */}
            {junctionNodes.map((node) => (
              <Marker
                key={node.id}
                position={[node.lat, node.lng]}
                icon={createCustomNodeIcon(node.emoji, node.color)}
              >
                <Popup className="font-sans text-xs">
                  <div className="p-1 space-y-1">
                    <div className="font-extrabold text-slate-900 text-sm flex items-center justify-between gap-2">
                      <span>{node.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium">{node.type}</div>
                    <div className="text-[10px] font-mono text-slate-700 bg-slate-100 p-1.5 rounded space-y-0.5 border border-slate-200">
                      <div>Elev: <strong>{node.elevation}</strong></div>
                      <div>Base Flow (Q): <strong className="text-emerald-700">{node.Q}</strong></div>
                      <div>Coords: <strong>{node.lat.toFixed(3)}°N, {node.lng.toFixed(3)}°E</strong></div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-slate-950/90 border border-slate-800 rounded-xl p-3 backdrop-blur-md text-xs z-10 space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Strahler Stream Order</div>
            <div className="flex items-center space-x-3 text-[11px] font-mono">
              <span className="flex items-center space-x-1"><span className="w-3 h-1 bg-sky-400 rounded"></span><span>O1</span></span>
              <span className="flex items-center space-x-1"><span className="w-3 h-1 bg-blue-500 rounded"></span><span>O2</span></span>
              <span className="flex items-center space-x-1"><span className="w-3 h-1.5 bg-indigo-400 rounded"></span><span>O3</span></span>
              <span className="flex items-center space-x-1"><span className="w-3 h-1.5 bg-purple-400 rounded"></span><span>O4</span></span>
              <span className="flex items-center space-x-1"><span className="w-3 h-2 bg-red-500 rounded"></span><span>O5 Main</span></span>
            </div>
          </div>
        </div>

        {/* Right Side Inspection Panel (1 Col) */}
        <div className="space-y-4">
          
          {/* Selected River Branch Inspector */}
          {selectedBranch ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider font-mono">
                    {selectedBranch.branch_id}
                  </span>
                  <h3 className="text-base font-black text-white leading-tight">
                    {selectedBranch.name}
                  </h3>
                </div>
                <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-mono font-bold">
                  Order {selectedBranch.stream_order}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Discharge (Q)</span>
                  <div className="text-base font-extrabold text-emerald-400 font-mono">{selectedBranch.discharge_m3s} m³/s</div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Flow Velocity (V)</span>
                  <div className="text-base font-extrabold text-amber-400 font-mono">{selectedBranch.velocity_ms} m/s</div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Channel Depth (d)</span>
                  <div className="text-base font-extrabold text-sky-400 font-mono">{selectedBranch.depth_m} m</div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Branch Length</span>
                  <div className="text-base font-extrabold text-purple-400 font-mono">{selectedBranch.length_km} km</div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Upstream Area</span>
                  <div className="text-base font-extrabold text-slate-200 font-mono">{selectedBranch.upstream_area_km2} km²</div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Channel Slope</span>
                  <div className="text-base font-extrabold text-slate-200 font-mono">{selectedBranch.slope_m_m} m/m</div>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Elevation Range:</span>
                  <span className="text-white font-bold">{selectedBranch.elevation_min_m}m - {selectedBranch.elevation_max_m}m ({selectedBranch.elevation_range_m || roundVal(selectedBranch.elevation_max_m - selectedBranch.elevation_min_m)}m)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Flow Direction:</span>
                  <span className="text-white font-bold">{selectedBranch.flow_direction}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Confluence Node:</span>
                  <span className="text-sky-400 font-bold">{selectedBranch.confluence}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Manning Roughness (n):</span>
                  <span className="text-amber-300 font-bold">0.035 (Gravel/Boulder Bed)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Froude No (Fr = V/√(gd)):</span>
                  <span className="text-cyan-300 font-bold">
                    {roundVal(selectedBranch.velocity_ms / Math.sqrt(9.81 * selectedBranch.depth_m))} ({selectedBranch.velocity_ms / Math.sqrt(9.81 * selectedBranch.depth_m) > 1 ? 'Supercritical' : 'Subcritical'})
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                  <span>Quality Provenance:</span>
                  <span className="text-emerald-400 font-bold">{selectedBranch.quality_status}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs space-y-2">
              <Info className="w-8 h-8 text-sky-400 mx-auto" />
              <p>Click on any river branch on the GIS map to inspect its hydrodynamic parameters.</p>
            </div>
          )}

          {/* Subcatchment Inspector Card */}
          {selectedSubcatchment && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">Sub-Catchment Hydrologic Profile</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">CN {selectedSubcatchment.cn_value}</span>
              </div>
              <h4 className="text-sm font-black text-white">{selectedSubcatchment.name}</h4>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                <div>Area: <strong className="text-white">{selectedSubcatchment.area_km2} km²</strong></div>
                <div>Slope: <strong className="text-white">{selectedSubcatchment.slope_percent}%</strong></div>
                <div>Elevation: <strong className="text-white">{selectedSubcatchment.elevation_mean_m} m</strong></div>
                <div>Impervious: <strong className="text-white">{selectedSubcatchment.impervious_percent}%</strong></div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1 font-mono text-[10px] text-slate-400">
                <div className="flex justify-between">
                  <span>Max Retention (S):</span>
                  <strong className="text-amber-300">{roundVal((25400 / selectedSubcatchment.cn_value) - 254)} mm</strong>
                </div>
                <div className="flex justify-between">
                  <span>Initial Abstraction (Ia = 0.2S):</span>
                  <strong className="text-sky-300">{roundVal(0.2 * ((25400 / selectedSubcatchment.cn_value) - 254))} mm</strong>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

function roundVal(num: number): number {
  return Math.round(num * 10) / 10;
}

export default BasinIntelligencePage;
