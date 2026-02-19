import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export const WorldBoundary = () => {
  // You can use a simple grid image or a procedural shader
  return (
    <mesh scale={[800, 800, 800]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        side={THREE.BackSide}
        transparent
        opacity={0.2}
        color="#0066ff"
        wireframe // The easiest way to get a "Radar" look immediately
      />
    </mesh>
  );
};
