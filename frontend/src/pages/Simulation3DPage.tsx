import React, { useState, useEffect, useRef } from 'react';
import { SceneContainer } from '../components/3d/SceneContainer';
import { ScenarioControlsPanel } from '../components/Controls/ScenarioControlsPanel';
import { CameraControlsBar } from '../components/Controls/CameraControlsBar';
import { DEMLoaderModal } from '../components/Controls/DEMLoaderModal';
import { StatsPanel } from '../components/Statistics/StatsPanel';
import { ComparisonModal } from '../components/Statistics/ComparisonModal';
import { TimelineScrubber } from '../components/Timeline/TimelineScrubber';

import { DEFAULT_3D_SCENARIO, PRESET_SCENARIOS, INITIAL_DEMO_INFRASTRUCTURE } from '../data/demo3dData';
import { PrototypeFloodModel } from '../simulation/PrototypeFloodModel';
import type {
  ScenarioParams,
  HydroSimulationState,
  InfrastructureBuilding,
  MapVisualizationMode,
  CameraPreset
} from '../types/3dTypes';

import { Waves } from 'lucide-react';

export const Simulation3DPage: React.FC = () => {
  // Scenario & Simulation Engine Instance
  const [params, setParams] = useState<ScenarioParams>(DEFAULT_3D_SCENARIO);
  const floodModelRef = useRef<PrototypeFloodModel>(new PrototypeFloodModel(DEFAULT_3D_SCENARIO));
  const [simState, setSimState] = useState<HydroSimulationState>(floodModelRef.current.getState());

  // Visual Controls State
  const [visualizationMode, setVisualizationMode] = useState<MapVisualizationMode>('depth');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('3D');
  const [showDepthLegend, setShowDepthLegend] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // Modals
  const [isDEMModalOpen, setIsDEMModalOpen] = useState<boolean>(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);

  // Infrastructure State
  const [buildings, setBuildings] = useState<InfrastructureBuilding[]>(INITIAL_DEMO_INFRASTRUCTURE);

  // Synchronized state refs for high performance 60 FPS animation loop
  const isSimulatingRef = useRef(false);
  const currentTimeRef = useRef(simState.currentTimeMin);
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    isSimulatingRef.current = simState.status === 'Simulating';
    currentTimeRef.current = simState.currentTimeMin;
  }, [simState.status, simState.currentTimeMin]);

  // Re-initialize model when params change
  useEffect(() => {
    floodModelRef.current.initialize(params);
    setSimState(floodModelRef.current.getState());
  }, [params]);

  // Main 60 FPS Smooth Playback Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const deltaSec = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (isSimulatingRef.current) {
        const speedMult = paramsRef.current.floodSpeedMultiplier || 1.0;
        const duration = paramsRef.current.simulationDurationMin || 120;
        const nextTime = currentTimeRef.current + deltaSec * 8.0 * speedMult;

        if (nextTime <= duration) {
          currentTimeRef.current = nextTime;
          floodModelRef.current.scrubToTime(nextTime);
          const newState = floodModelRef.current.getState();
          setSimState(newState);

          // Update infrastructure statuses based on water front distance
          setBuildings((prev) =>
            prev.map((bldg) => {
              const distFromDam = bldg.position[2] - (-30);
              const isFlooded = newState.waterFrontDistanceM >= distFromDam;
              return {
                ...bldg,
                status: isFlooded ? (bldg.type === 'Bridge' ? 'FLOOD IMPACT' : 'FLOOD AFFECTED') : 'NORMAL',
                currentDepthM: isFlooded ? Math.min(bldg.elevation, newState.maxDepthM * 0.7) : 0,
              };
            })
          );
        } else {
          // Reached end of simulation duration
          isSimulatingRef.current = false;
          floodModelRef.current.pause();
          setSimState(floodModelRef.current.getState());
        }
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Handlers
  const handleSelectPreset = (key: 'scenario-a' | 'scenario-b' | 'scenario-c') => {
    const preset = PRESET_SCENARIOS[key];
    setParams(preset);
  };

  const handleRun = () => {
    // If timeline is at or near the end, auto-reset to 0 before running
    if (currentTimeRef.current >= params.simulationDurationMin - 0.5) {
      floodModelRef.current.reset();
      currentTimeRef.current = 0;
    }
    floodModelRef.current.run();
    isSimulatingRef.current = true;
    setSimState(floodModelRef.current.getState());
  };

  const handlePause = () => {
    floodModelRef.current.pause();
    isSimulatingRef.current = false;
    setSimState(floodModelRef.current.getState());
  };

  const handleTogglePlay = () => {
    if (simState.status === 'Simulating') {
      handlePause();
    } else {
      handleRun();
    }
  };

  const handleReset = () => {
    floodModelRef.current.reset();
    isSimulatingRef.current = false;
    currentTimeRef.current = 0;
    setSimState(floodModelRef.current.getState());
    setBuildings(INITIAL_DEMO_INFRASTRUCTURE);
  };

  const handleScrub = (timeMin: number) => {
    currentTimeRef.current = timeMin;
    floodModelRef.current.scrubToTime(timeMin);
    const newState = floodModelRef.current.getState();
    setSimState(newState);

    setBuildings((prev) =>
      prev.map((bldg) => {
        const distFromDam = bldg.position[2] - (-30);
        const isFlooded = newState.waterFrontDistanceM >= distFromDam;
        return {
          ...bldg,
          status: isFlooded ? (bldg.type === 'Bridge' ? 'FLOOD IMPACT' : 'FLOOD AFFECTED') : 'NORMAL',
          currentDepthM: isFlooded ? Math.min(bldg.elevation, newState.maxDepthM * 0.7) : 0,
        };
      })
    );
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none font-sans">
      
      {/* Top Controls Bar */}
      <CameraControlsBar
        cameraPreset={cameraPreset}
        onSelectCameraPreset={setCameraPreset}
        visualizationMode={visualizationMode}
        onChangeVisualizationMode={setVisualizationMode}
        showDepthLegend={showDepthLegend}
        onToggleDepthLegend={() => setShowDepthLegend(!showDepthLegend)}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels(!showLabels)}
      />

      {/* Main 3D Canvas Viewport */}
      <div className="flex-1 relative w-full h-full">
        <SceneContainer
          params={params}
          simState={simState}
          buildings={buildings}
          mode={visualizationMode}
          cameraPreset={cameraPreset}
          showLabels={showLabels}
        />

        {/* Floating Scenario Controls (Left Side) */}
        <ScenarioControlsPanel
          params={params}
          onChangeParams={setParams}
          onSelectPreset={handleSelectPreset}
          simState={simState}
          onRun={handleRun}
          onPause={handlePause}
          onReset={handleReset}
          onOpenDEMLoader={() => setIsDEMModalOpen(true)}
          onOpenComparison={() => setIsComparisonOpen(true)}
        />

        {/* Floating Live Telemetry & Stats (Right Side) */}
        <StatsPanel
          simState={simState}
          buildings={buildings}
          visualizationMode={visualizationMode}
          showDepthLegend={showDepthLegend}
        />

        {/* Top Header Floating Badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 px-4 py-1.5 rounded-full shadow-2xl flex items-center space-x-2 text-xs z-10 pointer-events-none">
          <Waves className="w-4 h-4 text-sky-400 animate-pulse" />
          <span className="font-black tracking-wide text-white uppercase text-[11px]">FloodHADR 3D</span>
          <span className="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border border-sky-500/30">
            3D HYDRODYNAMIC DIGITAL TWIN
          </span>
        </div>
      </div>

      {/* Bottom Interactive Simulation Timeline Scrubber */}
      <TimelineScrubber
        simState={simState}
        params={params}
        onScrub={handleScrub}
        onTogglePlay={handleTogglePlay}
        onReset={handleReset}
      />

      {/* GeoTIFF DEM Loader Modal */}
      <DEMLoaderModal
        isOpen={isDEMModalOpen}
        onClose={() => setIsDEMModalOpen(false)}
        onLoadSyntheticDEM={() => {
          setIsDEMModalOpen(false);
          handleReset();
        }}
      />

      {/* Multi-Scenario Comparison Matrix Modal */}
      <ComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        onSelectScenario={handleSelectPreset}
      />
    </div>
  );
};

export default Simulation3DPage;
