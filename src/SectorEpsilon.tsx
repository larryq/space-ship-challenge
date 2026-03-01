import { Float, Plane } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import Asteroid from "./Asteroid";
import { Stargate } from "./Stargate2";
import Planet, { PlanetShaders } from "./Planet";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import generateAsteroidField from "./generateAsteroidField";
import { Courseway } from "./Courseway";
// @ts-expect-error use instead of ignore so it doesn't hide other potential issues
import courseModel from "./assets/space_course_6.glb";
// @ts-expect-error use instead of ignore so it doesn't hide other potential issues
import asteroidModel2 from "./assets/asteroid1.glb";
import ringPath from "./assets/green_rings1.png";
import ringPath2 from "./assets/saturn-cassini2.jpg";
import ringPath3 from "./assets/blue_rings2.png";
import ringPath4 from "./assets/red_rings1.png";

const PROTECTED_POINTS: [number, number, number][] = [
  [15, 75, -475], // stargate
  [-5, -10, -170], // courseway
];

const ASTEROID_CONFIG = {
  count: 400,
  minScale: 0.5,
  maxScale: 2.5,
  maxRadius: 750, // max distance from origin
  minRadius: 30, // don't spawn too close to origin either
  minClearance: 6, // minimum distance from protected points
  ringPercent: 0.75, // 1% get rings
  modelWeights: [0.6, 0.4],
};

export default function SectorEpsilon({
  shipRef,
  courseRef,
}: {
  shipRef: React.RefObject<THREE.Mesh>;
  courseRef: React.RefObject<THREE.Mesh>;
}) {
  const asteroids = useMemo(
    () => generateAsteroidField(ASTEROID_CONFIG, PROTECTED_POINTS),
    [],
  );
  return (
    <group>
      {/* 1. Point Lights to create "Space Contrast" */}
      <pointLight position={[20, 20, 20]} intensity={2} color="red" />
      <pointLight position={[-20, -10, -50]} intensity={1} color="orange" />

      {asteroids.map((a) => (
        <Asteroid
          key={`ast-${a.id}`}
          position={a.position}
          scale={a.scale}
          model={a.model}
          hasRings={a.hasRings}
          ringTexturePath={a.ringTexturePath}
        />
      ))}

      {/* 3. The Goal: Stargate at the end of the run */}

      <Stargate
        position={[15, 75, -475]}
        scale={[8, 8, 8]}
        rotation={[0, -Math.PI / 2, 0]}
        color="#edcf0e"
      />
      <Courseway
        shipRef={shipRef}
        scale={28}
        model={courseModel}
        courseRef={courseRef}
        position={[-5, -10, -170]}
        rotation={[0, -Math.PI / 2, 0]}
        useShader={true}
        uEmberColorA={new THREE.Color(1.0, 0.0, 0.0)}
        uEmberColorB={new THREE.Color(0.0, 1.0, 0.0)}
        uBgColor={new THREE.Color(0.0, 0.0, 0.0)}
      />

      <Planet
        position={[-2188, 144, -3600]}
        mode={1}
        size={677}
        fragmentShader={PlanetShaders.earth}
      />
      <Planet
        position={[1888, -444, -3600]}
        mode={1}
        size={277}
        fragmentShader={PlanetShaders.icePlanet}
        shadowStrength={0.1}
      />

      <Asteroid
        position={[-3, 600, 2500]}
        scale={277}
        model={asteroidModel2}
        hasRings={true}
        ringTexturePath={ringPath4}
      />

      {/* Optional: Add a subtle fog to make the distance feel vast */}
      <color attach="background" args={["#020205"]} />
    </group>
  );
}
