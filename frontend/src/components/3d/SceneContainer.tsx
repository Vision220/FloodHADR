import React, { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TerrainMesh } from './TerrainMesh';
import { DamMesh } from './DamMesh';
import { ReservoirMesh } from './ReservoirMesh';
import { RiverMesh } from './RiverMesh';
import { FloodMesh } from './FloodMesh';
import { WaterParticles } from './WaterParticles';
import { InfrastructureMesh } from './InfrastructureMesh';
import { Labels3D } from './Labels3D';

import type {
  ScenarioParams,
  HydroSimulationState,
  InfrastructureBuilding,
  MapVisualizationMode,
  CameraPreset
} from '../../types/3dTypes';

interface SceneContainerProps {
  params: ScenarioParams;
  simState: HydroSimulationState;
  buildings: InfrastructureBuilding[];
  mode: MapVisualizationMode;
  cameraPreset: CameraPreset;
  showLabels?: boolean;
}

// Controller component to smoothly move camera when cameraPreset changes
const CameraController: React.FC<{ cameraPreset: CameraPreset }> = ({ cameraPreset }) => {
  const { camera } = useThree();

  useEffect(() => {
    if (cameraPreset === 'TOP') {
      camera.position.set(0, 180, 50);
      camera.lookAt(0, 0, 50);
    } else if (cameraPreset === 'DAM') {
      camera.position.set(-45, 30, -10);
      camera.lookAt(0, 10, -30);
    } else if (cameraPreset === 'DOWNSTREAM') {
      camera.position.set(0, 40, 150);
      camera.lookAt(0, 5, 60);
    } else if (cameraPreset === '3D' || cameraPreset === 'RESET') {
      camera.position.set(-75, 65, 85);
      camera.lookAt(0, 10, 30);
    }
  }, [cameraPreset, camera]);

  return null;
};

export const SceneContainer: React.FC<SceneContainerProps> = ({
  params,
  simState,
  buildings,
  mode,
  cameraPreset,
  showLabels = true
}) => {
  return (
    <div className="w-full h-full relative bg-slate-950 select-none overflow-hidden">
      
      {/* Disclaimer Overlay as requested by prompt */}
      <div className="absolute top-3 left-4 z-10 bg-slate-900/80 border border-slate-700/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-slate-200 text-xs font-mono shadow-md flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
        <span className="font-bold text-amber-300">Prototype Hydrodynamic Visualization</span>
        <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2">SIH 2026 Demonstrator</span>
      </div>

      <Canvas
        shadows
        camera={{ position: [-75, 65, 85], fov: 45, near: 1, far: 1000 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#020617' }}
      >
        <CameraController cameraPreset={cameraPreset} />

        {/* Lighting & Fog */}
        <ambientLight intensity={0.65} />
        <directionalLight
          position={[60, 100, 40]}
          intensity={1.3}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={150}
          shadow-camera-bottom={-150}
        />
        <fog attach="fog" args={['#020617', 150, 450]} />

        {/* Orbit Controls */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.02} // Prevent camera from going under ground
          minDistance={15}
          maxDistance={350}
          target={[0, 10, 30]}
        />

        {/* 3D Scene Elements */}
        <group>
          {/* 1. Procedural Terrain */}
          <TerrainMesh terrainScale={params.terrainScale} />

          {/* 2. Impounded Reservoir */}
          <ReservoirMesh waterLevelM={params.reservoirWaterLevelM} />

          {/* 3. 3D Dam */}
          <DamMesh breachWidthM={params.breachWidthM} stage={simState.stage} />

          {/* 4. Downstream River Channel */}
          <RiverMesh />

          {/* 5. 3D Flood Inundation Volume & Depth Surface */}
          <FloodMesh
            waterFrontDistanceM={simState.waterFrontDistanceM}
            maxDepthM={simState.maxDepthM}
            mode={mode}
            stage={simState.stage}
          />

          {/* 6. Dynamic Water Discharge Particles */}
          <WaterParticles breachWidthM={params.breachWidthM} stage={simState.stage} />

          {/* 7. Downstream Infrastructure Objects */}
          <InfrastructureMesh
            buildings={buildings}
            waterFrontDistanceM={simState.waterFrontDistanceM}
          />

          {/* 8. Floating 3D Billboard Labels */}
          <Labels3D
            params={params}
            stage={simState.stage}
            waterFrontDistanceM={simState.waterFrontDistanceM}
            buildings={buildings}
            showLabels={showLabels}
          />
        </group>
      </Canvas>
    </div>
  );
};
