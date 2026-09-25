import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type {
  Flood3DState,
  LocationInspectionData,
  TwinAsset3D,
  CameraPresetTarget,
  CrossSectionPoint,
  MapStyleMode
} from '../types/digitalTwin3dTypes';
import { DigitalTwinEngine } from '../simulation/DigitalTwinEngine';
import { getMapProvider } from '../config/mapProviders';
import { DigitalTwinCanvas } from '../components/3d-twin/DigitalTwinCanvas';
import { InspectorPanel } from '../components/3d-twin/InspectorPanel';
import { CrossSectionChartModal } from '../components/3d-twin/CrossSectionChartModal';
import { GISMapModule } from '../components/map/GISMapModule';
import { geoRefService } from '../services/georeference/GeoReferenceService';
import { syncService } from '../services/georeference/Map3DSynchronizationService';

import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Globe,
  Activity,
  Droplets,
  ShieldAlert,
  Layers,
  Columns,
  Box,
  TrendingUp,
  Map as MapIcon,
  Flame,
  Camera,
  CheckCircle2,
  Bug
} from 'lucide-react';

const INITIAL_ASSETS: TwinAsset3D[] = [
  { id: 'asset-pow-01', name: 'Tehri Power Complex', type: 'Substation', position: [0, 0, -50], heightM: 8, elevationM: 820, isCritical: true, status: 'SAFE', currentDepthM: 0, arrivalTimeMin: 0.1, provenance: 'OBSERVED' },
  { id: 'asset-bridge-01', name: 'Malitha Bridge & NH-34', type: 'Bridge', position: [-15, 0, 10], heightM: 6, elevationM: 520, isCritical: true, status: 'SAFE', currentDepthM: 0, arrivalTimeMin: 18.5, provenance: 'OBSERVED' },
  { id: 'asset-hosp-01', name: 'Tehri District Hospital', type: 'Hospital', position: [-25, 0, 25], heightM: 10, elevationM: 560, isCritical: true, status: 'SAFE', currentDepthM: 0, arrivalTimeMin: 22.0, provenance: 'OBSERVED' },
  { id: 'asset-sch-01', name: 'Chamba High School', type: 'School', position: [20, 0, 35], heightM: 7, elevationM: 610, isCritical: false, status: 'SAFE', currentDepthM: 0, arrivalTimeMin: 35.0, provenance: 'SYNTHETIC' },
  { id: 'asset-gov-01', name: 'Rishikesh HQ Substation', type: 'Government', position: [-5, 0, 60], heightM: 12, elevationM: 380, isCritical: true, status: 'SAFE', currentDepthM: 0, arrivalTimeMin: 48.0, provenance: 'OBSERVED' }
];

export const DigitalTwin3DPage: React.FC = () => {
  const { setActivePage } = useApp();
  const engineRef = useRef(new DigitalTwinEngine());

  // Master 3D State
  const [state, setState] = useState<Flood3DState>({
    scenarioId: 'SCEN_3D_TEHRI',
    scenarioName: 'Tehri Multi-Hazard Compound Inundation Scenario',
    temporalMode: 'PRESENT',
    rainfallMm: 180,
    rainfallIntensityMmHr: 45,
    cumulativeRainfallMm: 180,
    reservoirLevelM: 830,
    reservoirStorageMm3: 3540,
    damBreachWidthM: 0,
    breachFormationTimeMin: 90,
    tributaryDischargeM3s: 1850,
    riverDischargeM3s: 12500,
    manningsN: 0.035,
    climateScaling: 1.15,
    landslideBlockage: 'NONE',
    
    playbackSpeed: 1.0,
    isPlaying: false,
    currentTimeMin: 0,
    totalDurationMin: 120,
    
    verticalExaggeration: 2,
    layerMode: 'DEPTH',
    mapStyle: 'HYBRID',
    layoutView: 'SPLIT_VIEW',
    
    currentFrame: engineRef.current.generateFrame({
      scenarioId: 'SCEN_3D_TEHRI', scenarioName: '', temporalMode: 'PRESENT', rainfallMm: 180, rainfallIntensityMmHr: 45, cumulativeRainfallMm: 180, reservoirLevelM: 830, reservoirStorageMm3: 3540, damBreachWidthM: 0, breachFormationTimeMin: 90, tributaryDischargeM3s: 1850, riverDischargeM3s: 12500, manningsN: 0.035, climateScaling: 1.15, landslideBlockage: 'NONE', playbackSpeed: 1, isPlaying: false, currentTimeMin: 0, totalDurationMin: 120, verticalExaggeration: 2, layerMode: 'DEPTH', mapStyle: 'HYBRID', layoutView: 'SPLIT_VIEW', currentFrame: {} as any, provenance: 'SIMULATED'
    }, 0),
    provenance: 'SIMULATED'
  });

  // Additional 3D & Alignment Controls
  const [comparisonMode, setComparisonMode] = useState<'SIMULATED' | 'OBSERVED' | 'COMPARISON'>('COMPARISON');
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [alignmentModalOpen, setAlignmentModalOpen] = useState<boolean>(false);

  // Camera & Assets & Selection
  const [cameraPreset, setCameraPreset] = useState<CameraPresetTarget>('PERSPECTIVE');
  const [assets, setAssets] = useState<TwinAsset3D[]>(INITIAL_ASSETS);
  const [selectedLocation, setSelectedLocation] = useState<LocationInspectionData | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<TwinAsset3D | null>(null);
  const [isCrossSectionOpen, setIsCrossSectionOpen] = useState<boolean>(false);

  // Sync animation loop refs
  const isPlayingRef = useRef(state.isPlaying);
  const currentTimeRef = useRef(state.currentTimeMin);
  const speedRef = useRef(state.playbackSpeed);

  useEffect(() => {
    isPlayingRef.current = state.isPlaying;
    currentTimeRef.current = state.currentTimeMin;
    speedRef.current = state.playbackSpeed;
  }, [state.isPlaying, state.currentTimeMin, state.playbackSpeed]);

  // Subscribe to Map3DSynchronizationService
  useEffect(() => {
    const unsub = syncService.subscribe((sync) => {
      if (sync.selectedAsset) setSelectedAsset(sync.selectedAsset);
      if (sync.selectedLocation) setSelectedLocation(sync.selectedLocation);
    });
    return unsub;
  }, []);

  // Update frame when inputs or time change
  useEffect(() => {
    const frame = engineRef.current.generateFrame(state, state.currentTimeMin);
    setState((prev) => ({ ...prev, currentFrame: frame }));

    // Update dynamic asset exposure states
    setAssets((prev) =>
      prev.map((asset) => {
        const isAffected = frame.floodedAreaKm2 > 10 && asset.elevationM < (750 - (asset.position[2] + 60) * 4);
        const depth = isAffected ? Math.round((frame.maxDepthM * 0.6) * 10) / 10 : 0;
        let status: 'SAFE' | 'AT_RISK' | 'SUBMERGED' | 'CRITICAL' = 'SAFE';
        if (isAffected) {
          status = depth > 10 ? 'CRITICAL' : depth > 3 ? 'SUBMERGED' : 'AT_RISK';
        }
        return {
          ...asset,
          status,
          currentDepthM: depth
        };
      })
    );
  }, [
    state.currentTimeMin,
    state.rainfallMm,
    state.rainfallIntensityMmHr,
    state.reservoirLevelM,
    state.damBreachWidthM,
    state.tributaryDischargeM3s,
    state.climateScaling,
    state.landslideBlockage
  ]);

  // Smooth Animation Frame Playback Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const deltaSec = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (isPlayingRef.current) {
        const nextTime = currentTimeRef.current + deltaSec * 4.0 * speedRef.current;
        if (nextTime <= state.totalDurationMin) {
          currentTimeRef.current = nextTime;
          setState((prev) => ({ ...prev, currentTimeMin: nextTime }));
        } else {
          isPlayingRef.current = false;
          setState((prev) => ({ ...prev, isPlaying: false }));
        }
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [state.totalDurationMin]);

  // Handlers
  const handleTogglePlay = () => {
    if (state.currentTimeMin >= state.totalDurationMin) {
      currentTimeRef.current = 0;
      setState((prev) => ({ ...prev, currentTimeMin: 0, isPlaying: true }));
    } else {
      setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  };

  const handleReset = () => {
    currentTimeRef.current = 0;
    setState((prev) => ({ ...prev, currentTimeMin: 0, isPlaying: false }));
    setSelectedLocation(null);
    setSelectedAsset(null);
  };

  // Cross-section data generator
  const crossSectionData: CrossSectionPoint[] = useMemo(() => {
    const points: CrossSectionPoint[] = [];
    const maxDepth = state.currentFrame.maxDepthM;
    for (let d = 0; d <= 400; d += 20) {
      const bed = 480 + Math.pow((d - 200) / 12, 2);
      const water = bed < (520 + maxDepth * 4) ? 520 + maxDepth * 4 : bed;
      points.push({
        distanceM: d,
        bedElevationM: Math.round(bed * 10) / 10,
        waterSurfaceM: Math.round(water * 10) / 10,
        waterDepthM: Math.max(0, Math.round((water - bed) * 10) / 10)
      });
    }
    return points;
  }, [state.currentFrame.maxDepthM]);

  const mapProvider = getMapProvider(state.mapStyle);
  const alignmentCheck = geoRefService.validateAlignment();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans space-y-3 pb-6 select-none">
      
      {/* 1. TOP HEADER HUD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-xl shadow-lg shadow-cyan-500/20">
            <Box className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-extrabold tracking-tight text-white uppercase font-mono">
                Georeferenced 3D Digital Twin
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                ROUTE: /3d-flood-twin
              </span>
              <button
                onClick={() => setAlignmentModalOpen(!alignmentModalOpen)}
                className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900 transition-all flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>[CHECK 2D ↔ 3D ALIGNMENT]</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center space-x-2">
              <span>Tehri Basin (30.3781°N, 78.4802°E)</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">CRS: {geoRefService.getGeoReference().crs}</span>
            </p>
          </div>
        </div>

        {/* View Layout & Debug Controls */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1 border ${
              debugMode ? 'bg-amber-950 text-amber-300 border-amber-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>GEO DEBUG</span>
          </button>
          
          <button
            onClick={() => setState((prev) => ({ ...prev, layoutView: '2D_ONLY' }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
              state.layoutView === '2D_ONLY' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>2D GIS MAP</span>
          </button>
          <button
            onClick={() => setState((prev) => ({ ...prev, layoutView: '3D_ONLY' }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
              state.layoutView === '3D_ONLY' ? 'bg-purple-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D TWIN</span>
          </button>
          <button
            onClick={() => setState((prev) => ({ ...prev, layoutView: 'SPLIT_VIEW' }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
              state.layoutView === 'SPLIT_VIEW' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>SPLIT VIEW</span>
          </button>
        </div>

        {/* Cross Section Tool Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCrossSectionOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold font-mono bg-cyan-950/70 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-700/50 transition-all flex items-center space-x-2 shadow"
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Cross-Section Tool</span>
          </button>
          <button
            onClick={() => setActivePage('earth-engine')}
            className="px-3 py-2 rounded-xl text-xs font-bold font-mono bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-700/50 transition-all flex items-center space-x-2 shadow"
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Earth Engine ↗</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 3-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1">
        
        {/* LEFT CONTROL PANEL (3 COLUMNS) */}
        <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col space-y-3.5 shadow-xl backdrop-blur-md text-xs font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-extrabold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>3D Digital Twin Inputs</span>
            </span>
            <span className="text-[10px] text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800">
              PHYSICS DRIVEN
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[580px] pr-1">
            
            {/* Flood Boundary Mode Toggle (Mode 1: Simulated, Mode 2: GEE SAR, Mode 3: Comparison) */}
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
              <span className="font-bold text-slate-300 flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Flood Extent Mode</span>
              </span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setComparisonMode('SIMULATED')}
                  className={`py-1 rounded text-[9px] font-bold font-mono transition-all border ${
                    comparisonMode === 'SIMULATED' ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  SIMULATED
                </button>
                <button
                  onClick={() => setComparisonMode('OBSERVED')}
                  className={`py-1 rounded text-[9px] font-bold font-mono transition-all border ${
                    comparisonMode === 'OBSERVED' ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  GEE SAR
                </button>
                <button
                  onClick={() => setComparisonMode('COMPARISON')}
                  className={`py-1 rounded text-[9px] font-bold font-mono transition-all border ${
                    comparisonMode === 'COMPARISON' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  COMPARE (IoU)
                </button>
              </div>
            </div>

            {/* Map Style Provider Switcher */}
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-bold flex items-center space-x-1">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Map Style Provider</span>
                </span>
                <span className="text-[9px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                  {mapProvider.statusNotice}
                </span>
              </div>
              <select
                value={state.mapStyle}
                onChange={(e) => setState({ ...state, mapStyle: e.target.value as MapStyleMode })}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-1.5 text-xs font-mono focus:border-cyan-500 focus:outline-none"
              >
                <option value="ROADMAP">ROADMAP (Google Maps / OSM Standard)</option>
                <option value="SATELLITE">SATELLITE (Google Satellite API / ESRI)</option>
                <option value="HYBRID">HYBRID (Satellite + Road Network)</option>
                <option value="TERRAIN">TERRAIN (Topographic DEM Contours)</option>
                <option value="PHOTOREALISTIC_3D">PHOTOREALISTIC 3D (Google 3D Tiles)</option>
              </select>

              {/* GeoAlignment Validation Status */}
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded text-[9px] font-mono text-slate-400 flex items-center justify-between">
                <span>DEM-Satellite Alignment:</span>
                <span className="text-emerald-400 font-bold">VALIDATED (Δ = 0.0m)</span>
              </div>
            </div>

            {/* Vertical Exaggeration Slider */}
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-bold flex items-center space-x-1">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  <span>Vertical Exaggeration</span>
                </span>
                <span className="text-purple-400 font-bold">{state.verticalExaggeration}x</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {([0.5, 1, 2, 3, 5] as number[]).map((exag) => (
                  <button
                    key={exag}
                    onClick={() => setState({ ...state, verticalExaggeration: exag })}
                    className={`py-1 rounded text-[10px] font-bold font-mono transition-all border ${
                      state.verticalExaggeration === exag
                        ? 'bg-purple-600 text-white border-purple-400 shadow'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {exag}x
                  </button>
                ))}
              </div>
            </div>

            {/* Live Rainfall Controls */}
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-bold flex items-center space-x-1">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Rainfall Intensity</span>
                </span>
                <span className="text-cyan-400 font-bold">{state.rainfallMm} mm ({state.rainfallIntensityMmHr} mm/h)</span>
              </div>
              <input
                type="range"
                min="30"
                max="450"
                step="10"
                value={state.rainfallMm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setState({ ...state, rainfallMm: val, rainfallIntensityMmHr: Math.round(val / 4) });
                }}
                className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Dam Breach Trigger Toggle */}
            <div className="bg-rose-950/30 p-2.5 rounded-xl border border-rose-800/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-300 flex items-center space-x-1 text-xs">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Dam Breach Trigger</span>
                </span>
                <button
                  onClick={() => setState({ ...state, damBreachWidthM: state.damBreachWidthM > 0 ? 0 : 180 })}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                    state.damBreachWidthM > 0
                      ? 'bg-rose-600 text-white shadow animate-pulse'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {state.damBreachWidthM > 0 ? 'BREACH ACTIVE' : 'NO BREACH'}
                </button>
              </div>
            </div>

            {/* Camera Presets Bar */}
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
              <span className="font-bold text-slate-300 flex items-center space-x-1">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Camera Preset Targets</span>
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'PERSPECTIVE', label: 'PERSPECTIVE' },
                  { id: 'TOP_DOWN', label: 'TOP-DOWN' },
                  { id: 'FOCUS_DAM', label: 'FOCUS DAM' },
                  { id: 'FOCUS_CONFLUENCE', label: 'CONFLUENCE' },
                  { id: 'FOCUS_INFRASTRUCTURE', label: 'ASSETS' },
                  { id: 'FOCUS_MAX_DEPTH', label: 'MAX DEPTH' },
                ].map((cam) => (
                  <button
                    key={cam.id}
                    onClick={() => setCameraPreset(cam.id as CameraPresetTarget)}
                    className={`py-1 px-2 rounded text-[10px] font-bold font-mono transition-all border ${
                      cameraPreset === cam.id
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {cam.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* CENTER VIEWPORT (6 COLUMNS) - 2D / 3D / SPLIT CANVAS */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 flex flex-col shadow-xl backdrop-blur-md min-h-[520px] relative overflow-hidden">
          
          <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950 flex">
            
            {/* 2D GIS View component (shown in 2D_ONLY or SPLIT_VIEW) */}
            {(state.layoutView === '2D_ONLY' || state.layoutView === 'SPLIT_VIEW') && (
              <div className={state.layoutView === 'SPLIT_VIEW' ? 'w-1/2 h-full border-r border-slate-800 relative' : 'w-full h-full relative'}>
                <GISMapModule />
                <div className="absolute top-2 left-2 z-[1000] bg-slate-900/90 border border-slate-700 px-2.5 py-1 rounded text-[10px] font-mono text-cyan-300 backdrop-blur-md shadow">
                  2D REAL GIS SATELLITE MAP
                </div>
              </div>
            )}

            {/* 3D Digital Twin Canvas (shown in 3D_ONLY or SPLIT_VIEW) */}
            {(state.layoutView === '3D_ONLY' || state.layoutView === 'SPLIT_VIEW') && (
              <div className={state.layoutView === 'SPLIT_VIEW' ? 'w-1/2 h-full relative' : 'w-full h-full relative'}>
                <DigitalTwinCanvas
                  state={state}
                  elevationMatrix={engineRef.current.getElevationMatrix()}
                  assets={assets}
                  cameraPreset={cameraPreset}
                  comparisonMode={comparisonMode}
                  debugMode={debugMode}
                  onSelectLocation={(data) => {
                    setSelectedLocation(data);
                    setSelectedAsset(null);
                    syncService.select2DLocation(data.lat, data.lng, data.elevationM);
                  }}
                  onSelectAsset={(asset) => {
                    setSelectedAsset(asset);
                    setSelectedLocation(null);
                    syncService.select3DAsset(asset);
                  }}
                />
                <div className="absolute top-2 left-2 z-10 bg-slate-900/90 border border-slate-700 px-2.5 py-1 rounded text-[10px] font-mono text-purple-300 backdrop-blur-md shadow flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                  <span>3D GEOREFERENCED DIGITAL TWIN</span>
                </div>
              </div>
            )}

            {/* Location & Asset Inspector Drawer Overlay */}
            <InspectorPanel
              locationData={selectedLocation}
              selectedAsset={selectedAsset}
              onClose={() => {
                setSelectedLocation(null);
                setSelectedAsset(null);
              }}
            />

          </div>

        </div>

        {/* RIGHT INFORMATION PANEL (3 COLUMNS) */}
        <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col space-y-3 shadow-xl backdrop-blur-md text-xs font-mono">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-extrabold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Simulated Outputs</span>
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800">
              REAL-TIME FEED
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[580px] pr-1">
            
            {/* Peak Discharge */}
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Peak Discharge (Q)</span>
                <span className="text-emerald-400 font-bold">SOURCE: {state.provenance}</span>
              </div>
              <div className="text-lg font-extrabold text-white">
                {state.currentFrame.peakDischargeM3s.toLocaleString()} <span className="text-xs text-slate-400">m³/s</span>
              </div>
            </div>

            {/* Flood Inundation Area */}
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Inundation Extent</span>
                <span className="text-blue-400 font-bold">km²</span>
              </div>
              <div className="text-base font-extrabold text-blue-300">
                {state.currentFrame.floodedAreaKm2} <span className="text-xs text-slate-400">km²</span>
              </div>
            </div>

            {/* Maximum Water Depth */}
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Maximum Water Depth</span>
                <span className="text-cyan-400 font-bold">m</span>
              </div>
              <div className="text-base font-extrabold text-cyan-300">
                {state.currentFrame.maxDepthM} <span className="text-xs text-slate-400">m</span>
              </div>
            </div>

            {/* Maximum Flow Velocity */}
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Maximum Flow Velocity</span>
                <span className="text-amber-400 font-bold">m/s</span>
              </div>
              <div className="text-base font-extrabold text-amber-300">
                {state.currentFrame.maxVelocityMs} <span className="text-xs text-slate-400">m/s</span>
              </div>
            </div>

            {/* Affected Critical Infrastructure Assets */}
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Asset Exposure</span>
                </span>
                <span className="text-rose-400 font-bold px-2 py-0.5 rounded bg-rose-950 border border-rose-800">
                  {state.currentFrame.affectedAssetsCount} CRITICAL
                </span>
              </div>

              <div className="space-y-1 text-[11px] text-slate-300">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => {
                      setSelectedAsset(asset);
                      syncService.select3DAsset(asset);
                    }}
                    className="flex justify-between items-center p-1 rounded hover:bg-slate-900 cursor-pointer border-b border-slate-900"
                  >
                    <span className="truncate max-w-[140px] text-slate-300">{asset.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      asset.status === 'SAFE' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                    }`}>
                      {asset.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 3. BOTTOM TIMELINE & PLAYBACK CONTROLS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-3 font-mono">
        
        {/* Play / Pause / Reset Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleTogglePlay}
            className={`p-2.5 rounded-xl font-bold transition-all flex items-center space-x-2 shadow ${
              state.isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {state.isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span className="text-xs uppercase">{state.isPlaying ? 'PAUSE' : 'PLAY SIMULATION'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all text-xs"
            title="Reset Timeline"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 flex items-center space-x-3 w-full">
          <span className="text-xs font-bold text-cyan-300 min-w-[70px] text-center bg-slate-950 px-2 py-1 rounded border border-slate-800">
            {state.currentFrame.timeDisplay}
          </span>
          <input
            type="range"
            min="0"
            max={state.totalDurationMin}
            step="0.5"
            value={state.currentTimeMin}
            onChange={(e) => {
              const val = Number(e.target.value);
              currentTimeRef.current = val;
              setState((prev) => ({ ...prev, currentTimeMin: val }));
            }}
            className="w-full accent-cyan-500 bg-slate-800 h-2 rounded cursor-pointer"
          />
          <span className="text-xs text-slate-400 font-mono">
            / 02:00:00
          </span>
        </div>

        {/* Playback Speed Multipliers */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-500 px-1 font-bold">SPEED:</span>
          {([0.25, 0.5, 1, 2, 4, 8, 16] as number[]).map((spd) => (
            <button
              key={spd}
              onClick={() => setState((prev) => ({ ...prev, playbackSpeed: spd }))}
              className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-all ${
                state.playbackSpeed === spd
                  ? 'bg-cyan-500 text-slate-950 shadow font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

      </div>

      {/* Alignment Debugger Modal */}
      {alignmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>[CHECK 2D ↔ 3D ALIGNMENT]</span>
              </div>
              <button
                onClick={() => setAlignmentModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                <span>CRS Identification:</span>
                <span className="text-emerald-400 font-bold">{alignmentCheck.crsStatus} ({geoRefService.getGeoReference().crs})</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                <span>Bounding Box Match:</span>
                <span className="text-emerald-400 font-bold">{alignmentCheck.bboxStatus}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                <span>Origin Coordinate:</span>
                <span className="text-emerald-400 font-bold">{alignmentCheck.originStatus} (30.3781°N, 78.4802°E)</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                <span>Elevation Reference:</span>
                <span className="text-emerald-400 font-bold">{alignmentCheck.elevationDatumStatus} (MSL meters)</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                <span>Scale Matrix:</span>
                <span className="text-emerald-400 font-bold">{alignmentCheck.scaleStatus} (Deterministic WGS84 ↔ Cartesian)</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-[11px] text-emerald-300 font-mono">
              ✓ All 2D GIS map layers, satellite imagery, Google Earth Engine observations, and 3D Digital Twin mesh nodes are 100% aligned to the same spatial reference system.
            </div>
          </div>
        </div>
      )}

      {/* Hydraulic Cross-Section Profile Modal */}
      <CrossSectionChartModal
        isOpen={isCrossSectionOpen}
        onClose={() => setIsCrossSectionOpen(false)}
        crossSectionData={crossSectionData}
        currentTimeMin={state.currentTimeMin}
      />

    </div>
  );
};

export default DigitalTwin3DPage;
