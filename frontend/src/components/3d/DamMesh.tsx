import React, { useMemo } from 'react';
import type { SimulationStage } from '../../types/3dTypes';

interface DamMeshProps {
  breachWidthM: number;
  stage: SimulationStage;
}

export const DamMesh: React.FC<DamMeshProps> = ({ breachWidthM, stage }) => {
  const isBreached = stage !== 'STAGE_1_INTACT';
  const visualBreachWidth = isBreached ? Math.max(6, (breachWidthM / 150) * 18) : 0;

  // Dam geometry positions: Dam is centered at X = 0, Z = -30
  const leftWingWidth = useMemo(() => Math.max(2, 45 - visualBreachWidth / 2), [visualBreachWidth]);
  const rightWingWidth = useMemo(() => Math.max(2, 45 - visualBreachWidth / 2), [visualBreachWidth]);

  return (
    <group position={[0, 0, -30]}>
      {/* Left Concrete Dam Wing */}
      <mesh
        position={[-visualBreachWidth / 2 - leftWingWidth / 2, 12, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[leftWingWidth, 24, 12]} />
        <meshStandardMaterial color="#475569" roughness={0.65} metalness={0.25} />
      </mesh>

      {/* Right Concrete Dam Wing */}
      <mesh
        position={[visualBreachWidth / 2 + rightWingWidth / 2, 12, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[rightWingWidth, 24, 12]} />
        <meshStandardMaterial color="#475569" roughness={0.65} metalness={0.25} />
      </mesh>

      {/* Dam Crest Roadway Deck & Parapet Railings */}
      <mesh position={[-visualBreachWidth / 2 - leftWingWidth / 2, 24.3, 0]}>
        <boxGeometry args={[leftWingWidth, 0.6, 14]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      <mesh position={[visualBreachWidth / 2 + rightWingWidth / 2, 24.3, 0]}>
        <boxGeometry args={[rightWingWidth, 0.6, 14]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Dam Abutment Towers */}
      <mesh position={[-visualBreachWidth / 2 - leftWingWidth, 15, 0]} castShadow>
        <boxGeometry args={[6, 30, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.3} />
      </mesh>
      <mesh position={[visualBreachWidth / 2 + rightWingWidth, 15, 0]} castShadow>
        <boxGeometry args={[6, 30, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.3} />
      </mesh>

      {/* Red Warning Beacon Lights on Dam Abutment Towers */}
      <mesh position={[-visualBreachWidth / 2 - leftWingWidth, 30.5, 0]}>
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[visualBreachWidth / 2 + rightWingWidth, 30.5, 0]}>
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Dam Breach Invert Wall (Foundation under breach orifice) */}
      {isBreached && (
        <group>
          <mesh position={[0, 3, 0]} castShadow receiveShadow>
            <boxGeometry args={[visualBreachWidth, 6, 12]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>

          {/* Jagged Rupture Concrete Debris Blocks */}
          <mesh position={[-visualBreachWidth / 2 + 1, 5, 2]} rotation={[0.2, 0.4, -0.1]}>
            <boxGeometry args={[3, 4, 5]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[visualBreachWidth / 2 - 1, 5, -2]} rotation={[-0.3, -0.2, 0.1]}>
            <boxGeometry args={[3, 4, 5]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        </group>
      )}

      {/* Intact Center Section & Spillway Pillars (Rendered when intact) */}
      {!isBreached && (
        <group>
          <mesh position={[0, 12, 0]} castShadow receiveShadow>
            <boxGeometry args={[20, 24, 12]} />
            <meshStandardMaterial color="#475569" roughness={0.65} metalness={0.25} />
          </mesh>

          {/* Radial Spillway Gates */}
          <mesh position={[-5, 14, 6.1]}>
            <boxGeometry args={[4, 8, 0.8]} />
            <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[5, 14, 6.1]}>
            <boxGeometry args={[4, 8, 0.8]} />
            <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      )}
    </group>
  );
};
