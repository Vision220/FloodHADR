import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const RiverMesh: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate winding river channel ribbon mesh
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let z = -30; z <= 180; z += 2) {
      const x = Math.sin(z * 0.03) * 14;
      const y = 12 - (z - (-30)) * 0.05 - 6.5; // Slightly above riverbed floor
      points.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 100, 3.8, 8, false);
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      // Flow animation pulse
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.roughness = 0.2 + Math.sin(state.clock.elapsedTime * 2.0) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color="#0369a1"
        roughness={0.2}
        metalness={0.5}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};
