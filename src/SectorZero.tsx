import { Float } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import Asteroid from "./Asteroid";
import { Stargate } from "./Stargate";

export default function SectorAlpha() {
  return (
    <group>
      {/* 1. Point Lights to create "Space Contrast" */}
      <pointLight position={[20, 20, 20]} intensity={2} color="lightblue" />
      <pointLight position={[-20, -10, -50]} intensity={1} color="purple" />

      <color attach="background" args={["#020205"]} />
    </group>
  );
}
