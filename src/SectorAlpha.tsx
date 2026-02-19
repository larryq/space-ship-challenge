import { Float } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import Asteroid from "./Asteroid";
import { Stargate } from "./Stargate2";
import { Courseway } from "./Courseway";

export default function SectorAlpha({ shipRef }) {
  console.log("Rendering Sector Alpha");
  return (
    <group>
      {/* 1. Point Lights to create "Space Contrast" */}
      <pointLight position={[20, 20, 20]} intensity={2} color="lightblue" />
      <pointLight position={[-20, -10, -50]} intensity={1} color="purple" />

      {/* 2. Obstacle Course: Scattered Asteroids */}
      {/* Positioned along the Z-axis (the flight path) */}
      <Asteroid key="asteroid1" position={[10, 5, -30]} scale={2} />
      <Asteroid key="asteroid2" position={[-12, -2, -50]} scale={3} />
      <Asteroid key="asteroid3" position={[5, -8, -80]} scale={1.5} />
      <Asteroid key="asteroid4" position={[-5, 10, -120]} scale={4} />
      <Courseway
        shipRef={shipRef}
        scale={13}
        position={[-125, 0, -150.0]}
        rotation={[0, -Math.PI / 2, 0]}
      />

      <Stargate
        position={[0, 0, -100]}
        scale={[5, 5, 5]}
        rotation={[0, -Math.PI / 2, 0]}
        color="#00ff62"
      />

      {/* Optional: Add a subtle fog to make the distance feel vast */}
      <color attach="background" args={["#020205"]} />
    </group>
  );
}
