import React from 'react';
import type { InfrastructureBuilding } from '../../types/3dTypes';

interface InfrastructureMeshProps {
  buildings: InfrastructureBuilding[];
  waterFrontDistanceM: number;
}

export const InfrastructureMesh: React.FC<InfrastructureMeshProps> = ({
  buildings,
  waterFrontDistanceM
}) => {
  return (
    <group>
      {/* 1. Primary Downstream Highway Corridor Asphalt Surface (NH-58) */}
      <mesh position={[0, 4.2, 75]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6.5, 200]} />
        <meshStandardMaterial
          color={waterFrontDistanceM > 105 ? "#791e1e" : "#1e293b"} // Submerged red asphalt
          roughness={0.7}
        />
      </mesh>

      {/* Road Center Line Yellow Markings */}
      <mesh position={[0, 4.25, 75]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.35, 200]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>

      {/* Highway Guardrails & Streetlight Posts */}
      {[-70, -30, 10, 50, 90, 130, 160].map((zPos, idx) => (
        <group key={idx} position={[-4, 4.2, zPos]}>
          <mesh position={[0, 2.5, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 5, 6]} />
            <meshStandardMaterial color="#64748b" metalness={0.7} />
          </mesh>
          <mesh position={[0.6, 5.0, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <cylinderGeometry args={[0.08, 0.08, 1.5, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.7} />
          </mesh>
          {/* LED Lamp Bulb */}
          <mesh position={[1.1, 5.3, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.4]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>
      ))}

      {/* 2. Infrastructure Buildings / Bridges / Critical Facilities */}
      {buildings.map((bldg) => {
        const [x, y, z] = bldg.position;
        const distFromDam = z - (-30);
        const isFlooded = waterFrontDistanceM >= distFromDam;

        // Visual color based on status
        let bldgColor = "#64748b"; // Neutral slate for Normal
        if (isFlooded) {
          if (bldg.type === 'Hospital' || bldg.type === 'Substation') bldgColor = "#ef4444"; // Red Critical Impact
          else if (bldg.type === 'Bridge') bldgColor = "#f59e0b"; // Amber Bridge Impact
          else bldgColor = "#eab308"; // Yellow Affected
        }

        return (
          <group key={bldg.id} position={[x, y, z]}>
            {bldg.type === 'Residential' ? (
              /* Detailed Residential Cluster with Roofs & Chimneys */
              <group>
                {/* House 1 */}
                <mesh position={[-3, 1.6, 0]} castShadow receiveShadow>
                  <boxGeometry args={[4, 3.2, 4]} />
                  <meshStandardMaterial color={bldgColor} roughness={0.6} />
                </mesh>
                <mesh position={[-3, 3.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                  <coneGeometry args={[3.2, 2.0, 4]} />
                  <meshStandardMaterial color="#991b1b" roughness={0.5} />
                </mesh>

                {/* House 2 */}
                <mesh position={[3, 1.6, -1]} castShadow receiveShadow>
                  <boxGeometry args={[4.2, 3.2, 4.2]} />
                  <meshStandardMaterial color={bldgColor} roughness={0.6} />
                </mesh>
                <mesh position={[3, 3.8, -1]} rotation={[0, Math.PI / 4, 0]} castShadow>
                  <coneGeometry args={[3.3, 2.0, 4]} />
                  <meshStandardMaterial color="#7f1d1d" roughness={0.5} />
                </mesh>

                {/* Submergence Water Ripple Ring */}
                {isFlooded && (
                  <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[4, 7, 24]} />
                    <meshBasicMaterial color="#ef4444" opacity={0.6} transparent />
                  </mesh>
                )}
              </group>
            ) : bldg.type === 'Bridge' ? (
              /* Reinforced Concrete Highway River Bridge */
              <group>
                {/* Bridge Deck */}
                <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
                  <boxGeometry args={[42, 1.8, 8]} />
                  <meshStandardMaterial color={bldgColor} metalness={0.5} roughness={0.4} />
                </mesh>
                {/* Bridge Guardrails */}
                <mesh position={[0, 3.8, 3.8]}>
                  <boxGeometry args={[42, 0.8, 0.3]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.6} />
                </mesh>
                <mesh position={[0, 3.8, -3.8]}>
                  <boxGeometry args={[42, 0.8, 0.3]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.6} />
                </mesh>

                {/* Bridge Structural Arches & Pillars */}
                <mesh position={[-14, -2.5, 0]} castShadow>
                  <cylinderGeometry args={[2.0, 2.5, 10, 12]} />
                  <meshStandardMaterial color="#334155" roughness={0.8} />
                </mesh>
                <mesh position={[14, -2.5, 0]} castShadow>
                  <cylinderGeometry args={[2.0, 2.5, 10, 12]} />
                  <meshStandardMaterial color="#334155" roughness={0.8} />
                </mesh>

                {/* Flood Warning Beacon */}
                {isFlooded && (
                  <mesh position={[0, 5, 0]}>
                    <sphereGeometry args={[1.0, 12, 12]} />
                    <meshBasicMaterial color="#f59e0b" />
                  </mesh>
                )}
              </group>
            ) : bldg.type === 'School' ? (
              /* Educational Campus Complex */
              <group>
                <mesh position={[0, 3.0, 0]} castShadow receiveShadow>
                  <boxGeometry args={[14, 6, 8]} />
                  <meshStandardMaterial color={bldgColor} roughness={0.5} />
                </mesh>
                <mesh position={[0, 6.3, 0]}>
                  <boxGeometry args={[15, 0.6, 9]} />
                  <meshStandardMaterial color="#1e293b" />
                </mesh>
                {/* Entrance Pillars */}
                <mesh position={[-4, 1.5, 4.3]} castShadow>
                  <cylinderGeometry args={[0.3, 0.3, 3]} />
                  <meshStandardMaterial color="#e2e8f0" />
                </mesh>
                <mesh position={[4, 1.5, 4.3]} castShadow>
                  <cylinderGeometry args={[0.3, 0.3, 3]} />
                  <meshStandardMaterial color="#e2e8f0" />
                </mesh>
              </group>
            ) : bldg.type === 'Substation' ? (
              /* Power Grid Substation & High-Voltage Transmission Towers */
              <group>
                {/* Control Building */}
                <mesh position={[0, 2.0, 0]} castShadow receiveShadow>
                  <boxGeometry args={[10, 4, 10]} />
                  <meshStandardMaterial color={bldgColor} roughness={0.7} />
                </mesh>
                {/* Transformer Oil Tanks */}
                <mesh position={[-3, 4.5, 0]} castShadow>
                  <cylinderGeometry args={[0.8, 0.8, 5]} />
                  <meshStandardMaterial color="#0284c7" metalness={0.7} />
                </mesh>
                <mesh position={[3, 4.5, 0]} castShadow>
                  <cylinderGeometry args={[0.8, 0.8, 5]} />
                  <meshStandardMaterial color="#0284c7" metalness={0.7} />
                </mesh>
                {/* High Voltage Pylon Structure */}
                <mesh position={[0, 8.0, 0]}>
                  <cylinderGeometry args={[0.1, 0.6, 12, 4]} />
                  <meshStandardMaterial color="#64748b" metalness={0.8} />
                </mesh>
              </group>
            ) : (
              /* District Emergency Hospital & Emergency Helipad */
              <group>
                {/* Main Hospital Block */}
                <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
                  <boxGeometry args={[16, 9, 10]} />
                  <meshStandardMaterial color={bldgColor} roughness={0.4} />
                </mesh>
                {/* Roof Helipad Circle */}
                <mesh position={[0, 9.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[2.5, 3.2, 24]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                {/* Red Cross Emblem */}
                <mesh position={[0, 7.0, 5.1]}>
                  <boxGeometry args={[3.2, 1.0, 0.2]} />
                  <meshStandardMaterial color="#dc2626" />
                </mesh>
                <mesh position={[0, 7.0, 5.1]}>
                  <boxGeometry args={[1.0, 3.2, 0.2]} />
                  <meshStandardMaterial color="#dc2626" />
                </mesh>
                {/* Emergency Siren Light */}
                {isFlooded && (
                  <mesh position={[0, 10.5, 0]}>
                    <sphereGeometry args={[1.2, 12, 12]} />
                    <meshBasicMaterial color="#ef4444" />
                  </mesh>
                )}
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};
