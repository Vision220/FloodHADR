import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ReservoirMeshProps {
  waterLevelM: number;
}

export const ReservoirMesh: React.FC<ReservoirMeshProps> = ({ waterLevelM }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geoRef = useRef<THREE.PlaneGeometry>(null);

  // Visual reservoir surface height (12m to 22m)
  const surfaceY = Math.max(12, (waterLevelM / 240) * 22);

  // Initial vertex positions for ripple math
  const initialZPositions = useMemo(() => {
    const geo = new THREE.PlaneGeometry(140, 120, 32, 32);
    const pos = geo.attributes.position;
    const array = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      array[i] = pos.getZ(i);
    }
    return array;
  }, []);

  // Smooth realistic water ripple animation
  useFrame((state) => {
    if (meshRef.current && geoRef.current) {
      meshRef.current.position.y = surfaceY;

      const t = state.clock.elapsedTime * 2.2;
      const pos = geoRef.current.attributes.position;

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);

        // Sine wave superposition for realistic surface ripples
        const wave = Math.sin(x * 0.12 + t) * 0.25 + Math.cos(y * 0.15 + t * 1.3) * 0.2;
        pos.setZ(i, initialZPositions[i] + wave);
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Impounded Reservoir Surface (Z = -30 to Z = -150) */}
      <mesh
        ref={meshRef}
        position={[0, surfaceY, -90]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry ref={geoRef} args={[140, 120, 32, 32]} />
        <meshStandardMaterial
          color="#0369a1"
          roughness={0.08}
          metalness={0.5}
          transparent
          opacity={0.88}
        />
      </mesh>
    </group>
  );
};
