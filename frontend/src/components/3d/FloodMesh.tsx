import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MapVisualizationMode, SimulationStage } from '../../types/3dTypes';

interface FloodMeshProps {
  waterFrontDistanceM: number;
  maxDepthM: number;
  mode: MapVisualizationMode;
  stage: SimulationStage;
}

export const FloodMesh: React.FC<FloodMeshProps> = ({
  waterFrontDistanceM,
  maxDepthM,
  mode,
  stage
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create dynamic downstream flood inundation surface mesh with color attribute
  const geometry = useMemo(() => {
    const width = 120;
    const depth = 210;
    const segX = 60;
    const segZ = 90;

    const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
    geo.rotateX(-Math.PI / 2);

    const colors = new Float32Array(geo.attributes.position.count * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return geo;
  }, []);

  // Animate dynamic vertex height and vertex colors based on depth/velocity
  useFrame((state) => {
    if (!meshRef.current) return;

    // If dam is intact (Stage 1), hide flood mesh
    if (stage === 'STAGE_1_INTACT' || waterFrontDistanceM <= 0) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    const posAttr = meshRef.current.geometry.attributes.position;
    const colorAttr = meshRef.current.geometry.attributes.color;
    const colors = colorAttr.array as Float32Array;

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      const distFromDam = z - (-30);

      if (distFromDam > 0 && distFromDam <= waterFrontDistanceM) {
        const riverX = Math.sin(z * 0.03) * 14;
        const distFromCenter = Math.abs(x - riverX);
        const spreadWidth = 14 + (distFromDam * 0.22);

        if (distFromCenter <= spreadWidth) {
          const centerFactor = 1.0 - (distFromCenter / spreadWidth);
          const frontFactor = Math.max(0.1, 1.0 - (distFromDam / (waterFrontDistanceM + 1)));

          const localDepth = maxDepthM * centerFactor * frontFactor;
          const terrainY = 12 - distFromDam * 0.05 - (Math.max(0, 8 - distFromCenter * 0.8));

          // Animate water surface ripple
          const ripple = Math.sin(x * 0.4 + state.clock.elapsedTime * 3) * 0.15;
          const waterY = terrainY + Math.max(0.2, localDepth * 0.8) + ripple;

          posAttr.setY(i, waterY);

          // Apply color visualization mode ([Depth], [Velocity], [Inundation])
          if (mode === 'depth') {
            // Depth Color Spectrum (0-0.5m: Cyan, 0.5-2m: Blue, 2-5m: Dark Blue, >5m: Red/Purple)
            if (localDepth > 5.0) {
              colors[i * 3 + 0] = 0.85; colors[i * 3 + 1] = 0.15; colors[i * 3 + 2] = 0.25; // Red (Critical)
            } else if (localDepth > 2.0) {
              colors[i * 3 + 0] = 0.15; colors[i * 3 + 1] = 0.35; colors[i * 3 + 2] = 0.85; // Deep Blue
            } else if (localDepth > 0.5) {
              colors[i * 3 + 0] = 0.10; colors[i * 3 + 1] = 0.65; colors[i * 3 + 2] = 0.90; // Mid Blue
            } else {
              colors[i * 3 + 0] = 0.20; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 0.95; // Light Cyan
            }
          } else if (mode === 'velocity') {
            // Velocity Color Spectrum (Low: Green, Mid: Amber, High: Bright Red)
            const velocity = localDepth * 0.6;
            if (velocity > 6.0) {
              colors[i * 3 + 0] = 0.95; colors[i * 3 + 1] = 0.20; colors[i * 3 + 2] = 0.10; // Red
            } else if (velocity > 3.0) {
              colors[i * 3 + 0] = 0.95; colors[i * 3 + 1] = 0.70; colors[i * 3 + 2] = 0.10; // Amber
            } else {
              colors[i * 3 + 0] = 0.10; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 0.40; // Green
            }
          } else {
            // Inundation Mode (Uniform transparent blue envelope)
            colors[i * 3 + 0] = 0.05; colors[i * 3 + 1] = 0.55; colors[i * 3 + 2] = 0.90;
          }

          continue;
        }
      }

      // Hide vertices outside flood boundary
      posAttr.setY(i, -10);
      colors[i * 3 + 0] = 0; colors[i * 3 + 1] = 0; colors[i * 3 + 2] = 0;
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, 0, 75]} receiveShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.12}
        metalness={0.4}
        transparent
        opacity={0.88}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
