import React from 'react';
import { Html } from '@react-three/drei';
import type { ScenarioParams, SimulationStage, InfrastructureBuilding } from '../../types/3dTypes';

interface Labels3DProps {
  params: ScenarioParams;
  stage: SimulationStage;
  waterFrontDistanceM: number;
  buildings: InfrastructureBuilding[];
  showLabels?: boolean;
}

export const Labels3D: React.FC<Labels3DProps> = ({
  params,
  stage,
  waterFrontDistanceM,
  buildings,
  showLabels = true
}) => {
  if (!showLabels) return null;

  const isBreached = stage !== 'STAGE_1_INTACT';

  return (
    <group>
      {/* 1. RESERVOIR LABEL */}
      <Html position={[0, 26, -90]} center distanceFactor={120}>
        <div className="bg-slate-900/90 text-slate-100 border border-sky-500/80 px-3 py-1.5 rounded-lg shadow-xl text-[11px] font-sans pointer-events-none select-none min-w-[140px]">
          <div className="flex items-center space-x-1.5 border-b border-slate-700/80 pb-1 mb-1">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            <span className="font-extrabold text-sky-300 font-mono text-xs">RESERVOIR</span>
            <span className="text-[9px] bg-sky-950 text-sky-300 px-1 rounded border border-sky-800">DEMO</span>
          </div>
          <div className="space-y-0.5 text-[10px] text-slate-300">
            <div>Water Level: <strong className="text-sky-300 font-mono">{params.reservoirWaterLevelM} m</strong></div>
            <div>Storage: <strong className="text-slate-100 font-mono">{params.reservoirStorageMm3} MMm³</strong></div>
            <div>Area: <strong className="text-slate-100 font-mono">{params.reservoirAreaKm2} km²</strong></div>
          </div>
        </div>
      </Html>

      {/* 2. DAM LABEL */}
      <Html position={[-35, 26, -30]} center distanceFactor={120}>
        <div className="bg-slate-900/90 text-slate-100 border border-slate-600 px-3 py-1.5 rounded-lg shadow-xl text-[11px] font-sans pointer-events-none select-none min-w-[140px]">
          <div className="flex items-center space-x-1.5 border-b border-slate-700 pb-1 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="font-extrabold text-amber-300 font-mono text-xs">DAM</span>
            <span className="text-[9px] bg-slate-800 text-slate-300 px-1 rounded">CONCRETE</span>
          </div>
          <div className="space-y-0.5 text-[10px] text-slate-300">
            <div>Dam Height: <strong className="text-slate-100 font-mono">{params.damHeightM} m</strong></div>
            <div>Crest Length: <strong className="text-slate-100 font-mono">{params.damLengthM} m</strong></div>
            <div>Breach Width: <strong className="text-amber-300 font-mono">{params.breachWidthM} m</strong></div>
          </div>
        </div>
      </Html>

      {/* 3. BREACH LABEL (Only when breaching) */}
      {isBreached && (
        <Html position={[0, 16, -30]} center distanceFactor={100}>
          <div className="bg-red-950/90 text-red-200 border border-red-500/80 px-2.5 py-1 rounded-md shadow-lg text-[10px] font-mono font-bold animate-pulse pointer-events-none select-none">
            ⚡ BREACH OPENING ({params.breachWidthM}m)
          </div>
        </Html>
      )}

      {/* 4. RIVER LABEL */}
      <Html position={[18, 5, 10]} center distanceFactor={120}>
        <div className="bg-slate-900/80 text-teal-300 border border-teal-500/60 px-2 py-0.5 rounded text-[10px] font-mono font-bold pointer-events-none select-none">
          🌊 RIVER CHANNEL
        </div>
      </Html>

      {/* 5. FLOOD FRONT LABEL (When propagating downstream) */}
      {isBreached && waterFrontDistanceM > 10 && (
        <Html position={[0, 10, -30 + waterFrontDistanceM]} center distanceFactor={110}>
          <div className="bg-amber-500 text-slate-950 px-2.5 py-1 rounded-md shadow-xl text-[10px] font-black uppercase font-mono tracking-wider animate-bounce pointer-events-none select-none flex items-center space-x-1">
            <span>⚡ FLOOD FRONT (+{waterFrontDistanceM}m)</span>
          </div>
        </Html>
      )}

      {/* 6. INFRASTRUCTURE LABELS */}
      {buildings.map((bldg) => {
        const [x, y, z] = bldg.position;
        const distFromDam = z - (-30);
        const isFlooded = waterFrontDistanceM >= distFromDam;

        return (
          <Html key={bldg.id} position={[x, y + 6, z]} center distanceFactor={120}>
            <div className={`px-2 py-1 rounded border text-[9px] font-bold font-sans shadow-md pointer-events-none select-none transition-all ${
              isFlooded
                ? 'bg-red-950/90 border-red-500 text-red-200 animate-pulse'
                : 'bg-slate-900/80 border-slate-700 text-slate-200'
            }`}>
              <div className="flex items-center space-x-1 font-mono">
                <span>{bldg.name}</span>
              </div>
              <div className="text-[8px] opacity-80 font-normal">
                {isFlooded ? `[STATUS: ${bldg.type === 'Bridge' ? 'FLOOD IMPACT' : 'FLOOD AFFECTED'}]` : '[STATUS: NORMAL]'}
              </div>
            </div>
          </Html>
        );
      })}
    </group>
  );
};
