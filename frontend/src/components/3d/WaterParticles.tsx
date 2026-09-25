import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SimulationStage } from '../../types/3dTypes';

interface WaterParticlesProps {
  breachWidthM: number;
  stage: SimulationStage;
}

const PARTICLE_COUNT = 280;

export const WaterParticles: React.FC<WaterParticlesProps> = ({ breachWidthM, stage }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const isBreached = stage !== 'STAGE_1_INTACT';

  // Random initial particle states [x, y, z, vx, vy, vz, scale]
  const particles = useMemo(() => {
    const data = [];
    const breachWidth = Math.max(10, breachWidthM);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      data.push({
        x: (Math.random() - 0.5) * (breachWidth / 10),
        y: 10 + Math.random() * 8,
        z: -30 + Math.random() * 2,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 0.8,
        vz: 2.5 + Math.random() * 3.5,
        scale: 0.35 + Math.random() * 0.6,
      });
    }
    return data;
  }, [breachWidthM]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!meshRef.current || !isBreached) return;

    const clampedDelta = Math.min(0.05, delta);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];

      // Update particle positions with physics
      p.x += p.vx * clampedDelta * 22;
      p.y += p.vy * clampedDelta * 22;
      p.z += p.vz * clampedDelta * 28;

      // Gravity acceleration
      p.vy -= 0.25 * clampedDelta * 20;

      // Reset particle when it travels past downstream threshold or hits ground splash
      if (p.z > 110 || p.y < 2) {
        p.x = (Math.random() - 0.5) * (Math.max(10, breachWidthM) / 9);
        p.y = 10 + Math.random() * 6;
        p.z = -30;
        p.vx = (Math.random() - 0.5) * 1.6;
        p.vy = -Math.random() * 0.5;
        p.vz = 2.8 + Math.random() * 4.2;
      }

      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!isBreached) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, PARTICLE_COUNT]}
      castShadow
    >
      <sphereGeometry args={[0.55, 8, 8]} />
      <meshStandardMaterial
        color="#bae6fd"
        roughness={0.05}
        metalness={0.7}
        transparent
        opacity={0.85}
      />
    </instancedMesh>
  );
};
