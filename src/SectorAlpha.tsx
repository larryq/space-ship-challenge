import { Float, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import Asteroid from "./Asteroid";
import { Stargate } from "./Stargate2";
import { Courseway } from "./Courseway";
import Planet, { PlanetShaders } from "./Planet";
// @ts-expect-error use instead of ignore so it doesn't hide other potential issues
import courseModel from "./assets/space_course_4.glb";
// @ts-expect-error use instead of ignore so it doesn't hide other potential issues
import asteroidModel from "./assets/asteroid1.glb";
// @ts-expect-error use instead of ignore so it doesn't hide other potential issues
import asteroidModel2 from "./assets/asteroid2.glb";
import ringPath from "./assets/green_rings1.png";
import ringPath2 from "./assets/magenta_rings1.png";
import ringPath3 from "./assets/blue_rings2.png";
import ringPath4 from "./assets/red_rings1.png";
import generateAsteroidField from "./generateAsteroidField";

import { useMemo, useRef } from "react";

useGLTF.preload(courseModel);

const PROTECTED_POINTS: [number, number, number][] = [
  [0, -5, -375], // stargate
  [-5, -10, -100], // courseway
];

const ASTEROID_CONFIG = {
  count: 400,
  minScale: 0.5,
  maxScale: 2.5,
  maxRadius: 1100, // max distance from origin
  minRadius: 30, // don't spawn too close to origin either
  minClearance: 6, // minimum distance from protected points
  ringPercent: 0.01, // 1% get rings
  modelWeights: [0.6, 0.4], // 60% asteroid1, 40% asteroid2
};

export default function SectorAlpha({
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
      <pointLight position={[20, 20, 20]} intensity={2} color="lightblue" />
      <pointLight position={[-20, -10, -50]} intensity={1} color="purple" />
      {asteroids.map((a) => (
        <Asteroid
          key={`ast-${a.id}`}
          position={a.position}
          scale={a.scale}
          model={a.model}
          hasRings={a.hasRings}
          ringTexturePath={a.ringTexturePath}
          spinSpeed={a.spinSpeed}
        />
      ))}

      <Courseway
        shipRef={shipRef}
        scale={20}
        model={courseModel}
        courseRef={courseRef}
        position={[-5, -10, -100]}
        rotation={[0, -Math.PI / 2, 0]}
        useShader={true}
        uEmberColorA={new THREE.Color(0.0, 0.9, 0.0)}
      />

      <Stargate
        position={[0, -5, -375]}
        scale={[5, 5, 5]}
        rotation={[0, -Math.PI / 2, 0]}
        color="#00ff62"
      />
      {/* <Planet
        position={[-2588, -1100, -4120]}
        mode={1}
        size={624}
        rings={false}
      /> */}
      <Planet
        mode={1}
        rings={false}
        size={424}
        position={[-2588, -1100, -3600]}
        fragmentShader={PlanetShaders.marsPlanet}
        shadowStrength={1.0}
      />

      <Planet
        mode={1}
        rings={false}
        size={222}
        position={[2588, -700, -3600]}
        fragmentShader={PlanetShaders.gasGiant}
        shadowStrength={1.0}
      />

      <Asteroid
        position={[-3, 600, 2500]}
        scale={277}
        model={asteroidModel2}
        hasRings={true}
        ringTexturePath={ringPath2}
        spinSpeed={0.02}
      />

      {/* Optional: Add a subtle fog to make the distance feel vast */}
      <color attach="background" args={["#020205"]} />
    </group>
  );
}
