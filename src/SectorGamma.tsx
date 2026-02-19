import { Float } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import Asteroid from "./Asteroid";
import { Stargate } from "./Stargate2";

export default function SectorBeta() {
  console.log("Rendering Sector Gamma");
  return (
    <group>
      {/* 1. Point Lights to create "Space Contrast" */}
      <pointLight position={[20, 20, 20]} intensity={2} color="green" />
      <pointLight position={[-20, -10, -50]} intensity={1} color="blue" />

      {/* 2. Obstacle Course: Scattered Asteroids */}
      {/* Positioned along the Z-axis (the flight path) */}
      <Asteroid position={[10, 5, -30]} scale={1} />
      <Asteroid position={[-12, -2, -50]} scale={1} />
      <Asteroid position={[5, -8, -80]} scale={1} />
      <Asteroid position={[-5, 10, -120]} scale={1} />
      <Asteroid position={[-7, 10, -110]} scale={1} />
      {/* 3. The Goal: Stargate at the end of the run */}

      <Stargate
        position={[0, 0, -180]}
        scale={[5, 5, 5]}
        rotation={[0, -Math.PI / 2, 0]}
        color="#ff00f7"
      />

      {/* Optional: Add a subtle fog to make the distance feel vast */}
      <color attach="background" args={["#020205"]} />
    </group>
  );
}
