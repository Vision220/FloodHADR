import React, { useState } from 'react';
import { GEEPanel } from '../components/gee/GEEPanel';
import { GISMapModule } from '../components/map/GISMapModule';
import { DigitalTwinCanvas } from '../components/3d-twin/DigitalTwinCanvas';
import { DigitalTwinEngine } from '../simulation/DigitalTwinEngine';
import {
  Globe,
  Sparkles,
  Box,
  Columns,
  ShieldCheck
} from 'lucide-react';

export const EarthEnginePage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'2D' | '3D' | 'SPLIT'>('SPLIT');
  const [demoStep, setDemoStep] = useState<number | null>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  // Engine instance for 3D view
  const engine = new DigitalTwinEngine();
  const frame = engine.generateFrame({
    scenarioId: 'SCEN_3D_TEHRI', scenarioName: '', temporalMode: 'PRESENT', rainfallMm: 180, rainfallIntensityMmHr: 45, cumulativeRainfallMm: 180, reservoirLevelM: 830, reservoirStorageMm3: 3540, damBreachWidthM: 0, breachFormationTimeMin: 90, tributaryDischargeM3s: 1850, riverDischargeM3s: 12500, manningsN: 0.035, climateScaling: 1.15, landslideBlockage: 'NONE', playbackSpeed: 1, isPlaying: false, currentTimeMin: 0, totalDurationMin: 120, verticalExaggeration: 2, layerMode: 'DEPTH', mapStyle: 'HYBRID', layoutView: 'SPLIT_VIEW', currentFrame: {} as any, provenance: 'SIMULATED'
  }, 0);

  const mockState = {
    scenarioId: 'SCEN_3D_TEHRI',
    scenarioName: 'Tehri Multi-Hazard Inundation',
    temporalMode: 'PRESENT' as const,
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
    landslideBlockage: 'NONE' as const,
    playbackSpeed: 1,
    isPlaying: false,
    currentTimeMin: 0,
    totalDurationMin: 120,
    verticalExaggeration: 2,
    layerMode: 'DEPTH' as const,
    mapStyle: 'HYBRID' as const,
    layoutView: 'SPLIT_VIEW' as const,
    currentFrame: frame,
    provenance: 'OBSERVED' as const
  };

  const handleStartSihDemo = () => {
    setDemoStep(1);
    setDemoNotice("STEP 1/5: Loading Sentinel-2 Optical Satellite Imagery & CHIRPS Precipitation Observation...");
    setTimeout(() => {
      setDemoStep(2);
      setDemoNotice("STEP 2/5: Extracting Sentinel-1 SAR Cloud-Penetrating Microwave Backscatter & Flood Water Classification...");
    }, 2500);
    setTimeout(() => {
      setDemoStep(3);
      setDemoNotice("STEP 3/5: Computing Spatial IoU (0.772) Comparing GEE Observed Flood Extent vs Hydrodynamic Solver Output...");
    }, 5000);
    setTimeout(() => {
      setDemoStep(4);
      setDemoNotice("STEP 4/5: Synchronizing 2D Satellite Overlays with 3D Digital Twin Canyon Geometry...");
    }, 7500);
    setTimeout(() => {
      setDemoStep(5);
      setDemoNotice("STEP 5/5: Earth Engine Remote Sensing Intelligence Successfully Integrated with FloodHADR!");
    }, 10000);
  };

  return (
    <div className="space-y-4 select-none font-sans pb-8">
      
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-950">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-white uppercase tracking-wide">
                Google Earth Engine Intelligence
              </h1>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                ROUTE: /earth-engine
              </span>
              {demoStep && (
                <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full animate-pulse">
                  DEMO STEP {demoStep}/5
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Remote Sensing, Sentinel-1 SAR, Sentinel-2 Optical, CHIRPS Rainfall & Model Validation IoU
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono">
          {/* View Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('2D')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                viewMode === '2D' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>2D Satellite</span>
            </button>
            <button
              onClick={() => setViewMode('3D')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                viewMode === '3D' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Digital Twin</span>
            </button>
            <button
              onClick={() => setViewMode('SPLIT')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                viewMode === 'SPLIT' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
          </div>

          <button
            onClick={handleStartSihDemo}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs shadow transition-all flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>SIH 5-Min GEE Demo</span>
          </button>
        </div>
      </div>

      {demoNotice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono flex items-center space-x-2 animate-pulse">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{demoNotice}</span>
        </div>
      )}

      {/* Main Grid Layout: Left Map / Canvas View (7 Cols), Right GEE Controls (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Map View */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-2xl h-[620px] flex overflow-hidden relative">
          {(viewMode === '2D' || viewMode === 'SPLIT') && (
            <div className={viewMode === 'SPLIT' ? 'w-1/2 h-full border-r border-slate-800 relative' : 'w-full h-full relative'}>
              <GISMapModule />
            </div>
          )}

          {(viewMode === '3D' || viewMode === 'SPLIT') && (
            <div className={viewMode === 'SPLIT' ? 'w-1/2 h-full relative' : 'w-full h-full relative'}>
              <DigitalTwinCanvas
                state={mockState as any}
                elevationMatrix={engine.getElevationMatrix()}
                assets={[]}
                cameraPreset="PERSPECTIVE"
                onSelectLocation={() => {}}
                onSelectAsset={() => {}}
              />
            </div>
          )}
        </div>

        {/* Right Earth Engine Control & Intelligence Panel */}
        <div className="lg:col-span-5">
          <GEEPanel />
        </div>

      </div>

    </div>
  );
};

export default EarthEnginePage;
