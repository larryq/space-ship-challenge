import { Float } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import Asteroid from "./Asteroid";
import { Stargate } from "./Stargate";

export default function SectorBeta() {
  console.log("Rendering Sector Beta");
  return (
    <group>
      {/* 1. Point Lights to create "Space Contrast" */}
      <pointLight position={[20, 20, 20]} intensity={2} color="red" />
      <pointLight position={[-20, -10, -50]} intensity={1} color="orange" />

      {/* 2. Obstacle Course: Scattered Asteroids */}
      {/* Positioned along the Z-axis (the flight path) */}
      <Asteroid key="asteroid1" position={[10, 5, -30]} scale={1} />
      <Asteroid key="asteroid2" position={[-12, -2, -50]} scale={1} />
      <Asteroid key="asteroid3" position={[5, -8, -80]} scale={0.5} />
      <Asteroid key="asteroid4" position={[-5, 10, -120]} scale={2} />

      {/* 3. The Goal: Stargate at the end of the run */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <Stargate position={[0, 0, -100]} />
      </Float>

      {/* Optional: Add a subtle fog to make the distance feel vast */}
      <color attach="background" args={["#020205"]} />
    </group>
  );
}
