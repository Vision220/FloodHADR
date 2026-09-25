import React, { useMemo } from 'react';
import * as THREE from 'three';

interface TerrainMeshProps {
  terrainScale?: number;
}

export const TerrainMesh: React.FC<TerrainMeshProps> = ({ terrainScale = 1.0 }) => {
  // Generate procedural river valley terrain mesh and tree positions
  const { geometry, wireframeGeometry, treePositions } = useMemo(() => {
    const width = 160;
    const depth = 240;
    const segX = 120;
    const segZ = 160;

    const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
    geo.rotateX(-Math.PI / 2); // Rotate to horizontal XZ plane

    const posAttr = geo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    const trees: Array<[number, number, number, number]> = [];

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      // Winding river centerline equation
      const riverX = Math.sin(z * 0.03) * 14;
      const distFromRiver = Math.abs(x - riverX);

      // Elevation calculation
      let y = 0;

      if (z < -30) {
        // Reservoir Basin (Depressed floor behind dam)
        y = Math.min(8, 2.0 + Math.pow(distFromRiver / 15, 1.8));
      } else {
        // Downstream Valley
        const valleySlope = 12 - (z - (-30)) * 0.05; // Gentle downstream slope
        const hillProfile = Math.pow(Math.max(0, distFromRiver - 12) / 14, 1.6) * 16; // Side hills
        const channelDepression = Math.max(0, 8 - (distFromRiver * 0.8)); // Carved riverbed

        y = valleySlope + hillProfile - channelDepression;
      }

      // Add subtle terrain noise
      y += (Math.sin(x * 0.15) * Math.cos(z * 0.12) * 1.5);

      posAttr.setY(i, y * terrainScale);

      // Color terrain based on elevation and river proximity
      if (distFromRiver < 10 && z > -30) {
        // Riverbed / Gravel
        colors[i * 3 + 0] = 0.20; // R
        colors[i * 3 + 1] = 0.24; // G
        colors[i * 3 + 2] = 0.22; // B
      } else if (y > 18) {
        // High Hills / Ridge Rock
        colors[i * 3 + 0] = 0.38;
        colors[i * 3 + 1] = 0.40;
        colors[i * 3 + 2] = 0.42;
      } else {
        // Valley Vegetation / Dense Forest Grass
        colors[i * 3 + 0] = 0.12;
        colors[i * 3 + 1] = 0.26;
        colors[i * 3 + 2] = 0.16;
      }

      // Scatter 3D Pine Trees on slopes (away from river, above water)
      if (i % 23 === 0 && distFromRiver > 18 && z > -25 && y > 6 && y < 24) {
        const scale = 0.7 + (Math.sin(i * 99) * 0.3 + 0.3);
        trees.push([x, y * terrainScale, z, scale]);
      }
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const wireframe = new THREE.WireframeGeometry(geo);

    return { geometry: geo, wireframeGeometry: wireframe, treePositions: trees };
  }, [terrainScale]);

  return (
    <group>
      {/* Solid Terrain Mesh */}
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.85}
          metalness={0.1}
          flatShading={false}
        />
      </mesh>

      {/* Subtle Contour Wireframe Overlay */}
      <lineSegments geometry={wireframeGeometry}>
        <lineBasicMaterial color="#0f291e" opacity={0.12} transparent />
      </lineSegments>

      {/* 3D Pine Tree Forest Clusters on Hill Slopes */}
      <group>
        {treePositions.map(([tx, ty, tz, scale], idx) => (
          <group key={idx} position={[tx, ty, tz]} scale={[scale, scale, scale]}>
            {/* Trunk */}
            <mesh position={[0, 1.2, 0]} castShadow>
              <cylinderGeometry args={[0.25, 0.4, 2.4, 6]} />
              <meshStandardMaterial color="#422006" roughness={0.9} />
            </mesh>
            {/* Lower Foliage Cone */}
            <mesh position={[0, 3.2, 0]} castShadow>
              <coneGeometry args={[1.8, 3.0, 6]} />
              <meshStandardMaterial color="#064e3b" roughness={0.7} />
            </mesh>
            {/* Upper Foliage Cone */}
            <mesh position={[0, 4.8, 0]} castShadow>
              <coneGeometry args={[1.3, 2.4, 6]} />
              <meshStandardMaterial color="#047857" roughness={0.7} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};
