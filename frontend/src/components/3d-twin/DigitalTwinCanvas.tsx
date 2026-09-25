import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import type {
  Flood3DState,
  LocationInspectionData,
  TwinAsset3D,
  CameraPresetTarget
} from '../../types/digitalTwin3dTypes';
import { geoRefService } from '../../services/georeference/GeoReferenceService';

interface DigitalTwinCanvasProps {
  state: Flood3DState;
  elevationMatrix: number[][];
  assets: TwinAsset3D[];
  cameraPreset: CameraPresetTarget;
  comparisonMode?: 'SIMULATED' | 'OBSERVED' | 'COMPARISON';
  debugMode?: boolean;
  onSelectLocation: (data: LocationInspectionData) => void;
  onSelectAsset: (asset: TwinAsset3D) => void;
}

// ----------------------------------------------------
// 1. GEOREFERENCED DEM TERRAIN 3D MESH WITH REAL SATELLITE EXTENT
// ----------------------------------------------------
const Terrain3DMesh: React.FC<{
  elevationMatrix: number[][];
  exaggeration: number;
  debugMode?: boolean;
  onPointerDown: (e: any) => void;
}> = ({ elevationMatrix, exaggeration, debugMode, onPointerDown }) => {
  const rows = elevationMatrix.length;
  const cols = elevationMatrix[0].length;

  const { geometry, wireframeGeometry } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(160, 160, cols - 1, rows - 1);
    geo.rotateX(-Math.PI / 2); // Lay flat on XZ plane

    const posAttr = geo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const index = r * cols + c;
        const elev = elevationMatrix[r][c];

        // Convert elevation to 3D vertical displacement
        const scaledY = ((elev - 400) / 10) * (exaggeration / 2.0);
        posAttr.setY(index, scaledY);

        // Compute vertex colors based on height & river channel position
        const x = posAttr.getX(index);
        const z = posAttr.getZ(index);
        const isRiverBed = Math.abs(x - (z * 0.2)) < 12;

        let color = new THREE.Color('#15803d'); // Tehri Valley Forest Green

        if (isRiverBed && elev < 520) {
          color = new THREE.Color('#1e293b'); // Dark Riverbed Gravel
        } else if (elev < 550) {
          color = new THREE.Color('#166534'); // Lowland Riparian Vegetation
        } else if (elev < 750) {
          color = new THREE.Color('#475569'); // Himalayan Mountain Slate
        } else if (elev < 1000) {
          color = new THREE.Color('#334155'); // Rocky Canyon Cliff
        } else {
          color = new THREE.Color('#e2e8f0'); // High Altitude Ridge
        }

        colors[index * 3] = color.r;
        colors[index * 3 + 1] = color.g;
        colors[index * 3 + 2] = color.b;
      }
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const wireGeo = new THREE.WireframeGeometry(geo);

    return { geometry: geo, wireframeGeometry: wireGeo };
  }, [elevationMatrix, exaggeration, rows, cols]);

  return (
    <group>
      <mesh
        geometry={geometry}
        onPointerDown={onPointerDown}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          vertexColors={true}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Subtle GIS Contour Grid Overlay */}
      <lineSegments geometry={wireframeGeometry}>
        <lineBasicMaterial color="#38bdf8" transparent opacity={debugMode ? 0.25 : 0.08} />
      </lineSegments>
    </group>
  );
};

// ----------------------------------------------------
// 2. HYDRODYNAMIC SIMULATED FLOOD WATER MESH
// ----------------------------------------------------
const HydrodynamicFloodWater3DMesh: React.FC<{
  state: Flood3DState;
  elevationMatrix: number[][];
  comparisonMode?: 'SIMULATED' | 'OBSERVED' | 'COMPARISON';
}> = ({ state, elevationMatrix, comparisonMode }) => {
  const rows = elevationMatrix.length;
  const cols = elevationMatrix[0].length;
  const frame = state.currentFrame;
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(160, 160, cols - 1, rows - 1);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [rows, cols]);

  useFrame(({ clock }) => {
    if (!geometry) return;
    const posAttr = geometry.attributes.position;
    const time = clock.getElapsedTime();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const index = r * cols + c;
        const depth = frame.waterDepthMatrix[r]?.[c] || 0;
        const elev = elevationMatrix[r][c];

        if (depth > 0.05 && comparisonMode !== 'OBSERVED') {
          const vel = frame.velocityMatrix[r]?.[c] || 0;
          const wave = Math.sin(time * 3.5 + r * 0.4 + c * 0.3) * 0.2 * Math.min(1.8, vel * 0.4);
          const waterY = (((elev - 400) + depth * 3.5 + wave) / 10) * (state.verticalExaggeration / 2.0);
          posAttr.setY(index, waterY);
        } else {
          posAttr.setY(index, -10); // Hide beneath terrain
        }
      }
    }
    posAttr.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  const waterMaterial = useMemo(() => {
    let baseColor = '#0284c7';
    if (comparisonMode === 'COMPARISON') {
      baseColor = '#3b82f6'; // Hydrodynamic Simulated Blue
    } else if (state.layerMode === 'DEPTH') {
      baseColor = state.currentFrame.maxDepthM > 15 ? '#1e3a8a' : state.currentFrame.maxDepthM > 8 ? '#0369a1' : '#06b6d4';
    } else if (state.layerMode === 'VELOCITY') {
      baseColor = state.currentFrame.maxVelocityMs > 6 ? '#e11d48' : state.currentFrame.maxVelocityMs > 3 ? '#d97706' : '#10b981';
    } else if (state.layerMode === 'ARRIVAL_TIME') {
      baseColor = '#7c3aed';
    }

    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(baseColor),
      transparent: true,
      opacity: comparisonMode === 'COMPARISON' ? 0.65 : 0.82,
      roughness: 0.15,
      metalness: 0.7,
    });
  }, [state.layerMode, state.currentFrame.maxDepthM, state.currentFrame.maxVelocityMs, comparisonMode]);

  return <mesh ref={meshRef} geometry={geometry} material={waterMaterial} receiveShadow />;
};

// ----------------------------------------------------
// 3. GEE SATELLITE OBSERVED FLOOD EXTENT MESH (Sentinel-1 SAR)
// ----------------------------------------------------
const GEESatelliteObservedFlood3DMesh: React.FC<{
  elevationMatrix: number[][];
  exaggeration: number;
  comparisonMode?: 'SIMULATED' | 'OBSERVED' | 'COMPARISON';
}> = ({ elevationMatrix, exaggeration, comparisonMode }) => {
  const rows = elevationMatrix.length;
  const cols = elevationMatrix[0].length;
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(160, 160, cols - 1, rows - 1);
    geo.rotateX(-Math.PI / 2);
    const posAttr = geo.attributes.position;

    // GEE Sentinel-1 SAR Observed Water Mask Extent
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const index = r * cols + c;
        const elev = elevationMatrix[r][c];
        const distFromCenter = Math.abs(c - (cols / 2));

        // Observed SAR flood boundary extent
        const isObservedWater = r <= 22 && distFromCenter <= 7;

        if (isObservedWater && comparisonMode !== 'SIMULATED') {
          const waterY = (((elev - 400) + 4.5 * 3.5) / 10) * (exaggeration / 2.0) + 0.15;
          posAttr.setY(index, waterY);
        } else {
          posAttr.setY(index, -12);
        }
      }
    }
    geo.computeVertexNormals();
    return geo;
  }, [rows, cols, elevationMatrix, exaggeration, comparisonMode]);

  if (comparisonMode === 'SIMULATED') return null;

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color={comparisonMode === 'COMPARISON' ? '#a855f7' : '#9333ea'} // Purple for GEE SAR Observed
        transparent={true}
        opacity={0.75}
        roughness={0.2}
        metalness={0.6}
        wireframe={comparisonMode === 'COMPARISON'}
      />
    </mesh>
  );
};

// ----------------------------------------------------
// 4. VELOCITY VECTOR FIELD STREAMLINES
// ----------------------------------------------------
const VelocityVectorField3D: React.FC<{
  state: Flood3DState;
  elevationMatrix: number[][];
}> = ({ state, elevationMatrix }) => {
  const frame = state.currentFrame;

  const arrows = useMemo(() => {
    const list: { pos: [number, number, number]; len: number; color: string }[] = [];
    const step = 4;

    for (let r = 2; r < 28; r += step) {
      for (let c = 2; c < 28; c += step) {
        const depth = frame.waterDepthMatrix[r]?.[c] || 0;
        const vel = frame.velocityMatrix[r]?.[c] || 0;

        if (depth > 0.3 && vel > 0.5) {
          const x = (c / 30) * 160 - 80;
          const z = (r / 30) * 160 - 80;
          const elev = elevationMatrix[r]?.[c] || 500;
          const waterY = (((elev - 400) + depth * 3.5) / 10) * (state.verticalExaggeration / 2.0) + 0.5;

          const color = vel > 6 ? '#ef4444' : vel > 3 ? '#f59e0b' : '#10b981';
          list.push({
            pos: [x, waterY, z],
            len: Math.min(6, 1.5 + vel * 0.6),
            color
          });
        }
      }
    }
    return list;
  }, [frame.waterDepthMatrix, frame.velocityMatrix, elevationMatrix, state.verticalExaggeration]);

  if (state.layerMode !== 'VELOCITY' && state.currentFrame.maxVelocityMs < 2) return null;

  return (
    <group>
      {arrows.map((arr, i) => (
        <group key={i} position={arr.pos}>
          <mesh rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, arr.len, 8]} />
            <meshStandardMaterial color={arr.color} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, arr.len / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.5, 1.2, 8]} />
            <meshStandardMaterial color={arr.color} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// ----------------------------------------------------
// 5. GEOREFERENCED TEHRI DAM 3D STRUCTURE AT EXACT COORDINATES (30.3781°N, 78.4802°E)
// ----------------------------------------------------
const TehriDamStructuralMesh: React.FC<{
  breachProgressPercent: number;
  exaggeration: number;
  reservoirLevelM: number;
}> = ({ breachProgressPercent, exaggeration, reservoirLevelM }) => {
  // Convert real dam lat/lng (30.3781°N, 78.4802°E) to 3D world coords
  const damWorldPos = useMemo(() => {
    return geoRefService.geoToWorld(30.3781, 78.4802, 830, exaggeration);
  }, [exaggeration]);

  const damHeight = 26 * (exaggeration / 2.0);
  const isBreaching = breachProgressPercent > 0;
  const reservoirWaterY = ((reservoirLevelM - 400) / 10) * (exaggeration / 2.0);

  return (
    <group position={[damWorldPos.x, 0, damWorldPos.z - 20]}>
      {/* Upstream Tehri Reservoir Water Body */}
      <mesh position={[0, reservoirWaterY - 2, -30]} receiveShadow>
        <boxGeometry args={[140, 4, 60]} />
        <meshStandardMaterial color="#0284c7" transparent opacity={0.9} roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Main Embankment Dam Body (Trapezoidal Rockfill Structure) */}
      <mesh position={[0, damHeight / 2 - 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[52, damHeight, 14]} />
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Concrete Spillway Gate Towers */}
      <mesh position={[-18, damHeight + 0.5, 0]} castShadow>
        <boxGeometry args={[10, 3, 10]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} />
      </mesh>
      <mesh position={[18, damHeight + 0.5, 0]} castShadow>
        <boxGeometry args={[10, 3, 10]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} />
      </mesh>

      {/* Dynamic Breach Opening */}
      {isBreaching && (
        <group position={[0, damHeight / 2 - 2, 0]}>
          <mesh>
            <boxGeometry args={[14 * (breachProgressPercent / 100), damHeight + 2, 16]} />
            <meshStandardMaterial color="#ef4444" transparent opacity={0.65} wireframe />
          </mesh>
          <mesh position={[0, -damHeight / 4, 15]} rotation={[Math.PI / 4, 0, 0]}>
            <cylinderGeometry args={[2 + breachProgressPercent * 0.05, 5 + breachProgressPercent * 0.1, 24, 16]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.85} roughness={0.1} />
          </mesh>
        </group>
      )}

      {/* Dam 3D Floating Georeferenced Badge */}
      <Html position={[0, damHeight + 6, 0]} center>
        <div className="bg-slate-950/90 border border-cyan-500/50 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-cyan-300 shadow-xl flex items-center space-x-1.5 backdrop-blur">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>Tehri Dam (30.3781°N, 78.4802°E) | H=260.5m</span>
        </div>
      </Html>
    </group>
  );
};

// ----------------------------------------------------
// 6. GEOREFERENCED GIS INFRASTRUCTURE ASSETS
// ----------------------------------------------------
const AssetInfrastructure3DMeshes: React.FC<{
  assets: TwinAsset3D[];
  exaggeration: number;
  onSelectAsset: (asset: TwinAsset3D) => void;
}> = ({ assets, exaggeration, onSelectAsset }) => {
  return (
    <group>
      {assets.map((asset) => {
        const [x, , z] = asset.position;
        const scaledY = ((asset.elevationM - 400) / 10) * (exaggeration / 2.0);
        const isFlooded = asset.status !== 'SAFE';

        let baseColor = '#3b82f6';
        if (asset.type === 'Hospital') baseColor = '#ef4444';
        if (asset.type === 'School') baseColor = '#f59e0b';
        if (asset.type === 'Bridge') baseColor = '#10b981';
        if (asset.type === 'Substation') baseColor = '#8b5cf6';
        if (isFlooded) baseColor = '#dc2626';

        if (asset.type === 'Bridge') {
          return (
            <group key={asset.id} position={[x, scaledY + 3, z]}>
              <mesh onClick={(e) => { e.stopPropagation(); onSelectAsset(asset); }} castShadow>
                <boxGeometry args={[24, 1.2, 4]} />
                <meshStandardMaterial color="#64748b" roughness={0.4} />
              </mesh>
              <mesh position={[-8, -3, 0]} castShadow>
                <cylinderGeometry args={[0.8, 1.0, 6, 8]} />
                <meshStandardMaterial color="#475569" />
              </mesh>
              <mesh position={[8, -3, 0]} castShadow>
                <cylinderGeometry args={[0.8, 1.0, 6, 8]} />
                <meshStandardMaterial color="#475569" />
              </mesh>
              <Html position={[0, 4, 0]} center>
                <div
                  onClick={(e) => { e.stopPropagation(); onSelectAsset(asset); }}
                  className={`cursor-pointer px-2 py-0.5 rounded text-[9px] font-mono font-bold border shadow backdrop-blur whitespace-nowrap ${
                    isFlooded ? 'bg-rose-950 text-rose-300 border-rose-500 animate-bounce' : 'bg-slate-900/90 text-emerald-300 border-slate-700'
                  }`}
                >
                  🌉 {asset.name} {isFlooded ? `(${asset.currentDepthM}m Flooded)` : ''}
                </div>
              </Html>
            </group>
          );
        }

        return (
          <group key={asset.id} position={[x, scaledY + asset.heightM / 2, z]}>
            <mesh onClick={(e) => { e.stopPropagation(); onSelectAsset(asset); }} castShadow receiveShadow>
              <boxGeometry args={[5, asset.heightM, 5]} />
              <meshStandardMaterial color={baseColor} roughness={0.5} metalness={0.2} />
            </mesh>
            <mesh position={[0, asset.heightM / 2 + 0.5, 0]} castShadow>
              <boxGeometry args={[5.4, 0.8, 5.4]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <Html position={[0, asset.heightM / 2 + 3, 0]} center>
              <div
                onClick={(e) => { e.stopPropagation(); onSelectAsset(asset); }}
                className={`cursor-pointer px-2 py-0.5 rounded text-[9px] font-mono font-bold border shadow backdrop-blur whitespace-nowrap ${
                  isFlooded ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse' : 'bg-slate-900/90 text-slate-200 border-slate-700'
                }`}
              >
                {asset.name} {isFlooded ? `[${asset.currentDepthM}m]` : ''}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

// ----------------------------------------------------
// 7. CAMERA PRESET TARGET CONTROLLER
// ----------------------------------------------------
const CameraPresetController: React.FC<{ preset: CameraPresetTarget }> = ({ preset }) => {
  const { camera } = useThree();

  React.useEffect(() => {
    if (preset === 'TOP_DOWN') {
      camera.position.set(0, 160, 0);
      camera.lookAt(0, 0, 0);
    } else if (preset === 'FOCUS_DAM') {
      camera.position.set(25, 40, -40);
      camera.lookAt(0, 10, -60);
    } else if (preset === 'FOCUS_CONFLUENCE') {
      camera.position.set(0, 50, 20);
      camera.lookAt(0, 0, 0);
    } else if (preset === 'FOCUS_INFRASTRUCTURE') {
      camera.position.set(-30, 35, 30);
      camera.lookAt(-20, 0, 15);
    } else if (preset === 'FOCUS_MAX_DEPTH') {
      camera.position.set(10, 30, -20);
      camera.lookAt(0, 0, -10);
    } else if (preset === 'NORTH_ALIGN') {
      camera.position.set(0, 70, 110);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(0, 80, 110);
      camera.lookAt(0, 0, 0);
    }
  }, [preset, camera]);

  return null;
};

// ----------------------------------------------------
// MAIN 3D DIGITAL TWIN CANVAS CONTAINER
// ----------------------------------------------------
export const DigitalTwinCanvas: React.FC<DigitalTwinCanvasProps> = ({
  state,
  elevationMatrix,
  assets,
  cameraPreset,
  comparisonMode = 'SIMULATED',
  debugMode = false,
  onSelectLocation,
  onSelectAsset
}) => {
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (e.point) {
      const x = e.point.x;
      const z = e.point.z;

      // Convert 3D world coordinates directly to WGS84 Lat/Lng
      const geo = geoRefService.worldToGeo(x, e.point.y, z, state.verticalExaggeration);

      const gridR = Math.min(29, Math.max(0, Math.floor(((z + 80) / 160) * 30)));
      const gridC = Math.min(29, Math.max(0, Math.floor(((x + 80) / 160) * 30)));

      const depth = state.currentFrame.waterDepthMatrix[gridR]?.[gridC] || 0;
      const elev = elevationMatrix[gridR]?.[gridC] || 750;
      const vel = state.currentFrame.velocityMatrix[gridR]?.[gridC] || 0;
      const arrival = state.currentFrame.arrivalTimeMatrix[gridR]?.[gridC] || 999;

      onSelectLocation({
        lat: geo.lat,
        lng: geo.lng,
        worldX: Math.round(x * 10) / 10,
        worldZ: Math.round(z * 10) / 10,
        elevationM: Math.round(elev),
        slopeDeg: Math.round(12 + Math.abs(x) * 0.2),
        waterDepthM: depth,
        waterSurfaceM: Math.round((elev + depth) * 10) / 10,
        velocityMs: vel,
        flowDirectionDeg: 185,
        arrivalTimeMin: arrival,
        floodDurationHr: 36.0,
        nearestRiver: z < -20 ? 'Tehri Reservoir' : z < 30 ? 'Bhagirathi Main Reach' : 'Devprayag Confluence',
        provenance: state.provenance
      });
    }
  };

  return (
    <div className="w-full h-full relative bg-slate-950">
      <Canvas shadows>
        <fog attach="fog" args={['#090d16', 60, 240]} />

        <PerspectiveCamera makeDefault position={[0, 80, 110]} fov={50} />
        <CameraPresetController preset={cameraPreset} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2.05} />

        <ambientLight intensity={0.95} />
        <directionalLight
          position={[60, 140, 50]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-40, 80, -50]} intensity={0.6} color="#38bdf8" />
        <pointLight position={[0, 60, -40]} intensity={1.2} color="#06b6d4" />

        {/* 1. Georeferenced Vertex-Colored Mountain Terrain Mesh */}
        <Terrain3DMesh
          elevationMatrix={elevationMatrix}
          exaggeration={state.verticalExaggeration}
          debugMode={debugMode}
          onPointerDown={handlePointerDown}
        />

        {/* 2. Hydrodynamic Simulated Flood Water Mesh */}
        <HydrodynamicFloodWater3DMesh
          state={state}
          elevationMatrix={elevationMatrix}
          comparisonMode={comparisonMode}
        />

        {/* 3. GEE Satellite Observed Flood Extent Mesh (Sentinel-1 SAR) */}
        <GEESatelliteObservedFlood3DMesh
          elevationMatrix={elevationMatrix}
          exaggeration={state.verticalExaggeration}
          comparisonMode={comparisonMode}
        />

        {/* 4. 3D Flow Velocity Field Vectors */}
        <VelocityVectorField3D
          state={state}
          elevationMatrix={elevationMatrix}
        />

        {/* 5. Tehri Hydro Dam 3D Structure & Outflow Plume */}
        <TehriDamStructuralMesh
          breachProgressPercent={state.currentFrame.breachProgressPercent}
          exaggeration={state.verticalExaggeration}
          reservoirLevelM={state.reservoirLevelM}
        />

        {/* 6. Georeferenced Infrastructure Assets & Bridges */}
        <AssetInfrastructure3DMeshes
          assets={assets}
          exaggeration={state.verticalExaggeration}
          onSelectAsset={onSelectAsset}
        />
      </Canvas>
    </div>
  );
};

export default DigitalTwinCanvas;
