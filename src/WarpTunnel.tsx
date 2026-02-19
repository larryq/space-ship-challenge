/* eslint-disable react-hooks/immutability */
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Mesh, DoubleSide, RepeatWrapping } from "three";
import { useTexture } from "@react-three/drei";
import { useGame } from "./store/GameStore";
import warpURL from "./assets/warp_stars.jpg";

export function WarpTunnel({ shipBodyRef: shipRef }) {
  // Pass the ship ref here
  const tunnel = useRef<Mesh>(null!);
  const phase = useGame((state) => state.phase);
  const texture = useTexture(warpURL);

  texture.wrapS = texture.wrapT = RepeatWrapping;
  // Repeat the texture many times along the length to make stars smaller/denser
  texture.repeat.set(1, 4);

  useFrame((_state, delta) => {
    if (phase !== "warping" || !shipRef.current || !tunnel.current) return;

    // 2. Grab the mesh from the custom handle
    const shipMesh = shipRef.current.mesh;
    if (!shipMesh) return;

    // 3. THE FIX: Get the mesh's world position.
    // This is a pure Three.js call. No WASM, no physics, no crashing.
    shipMesh.getWorldPosition(tunnel.current.position);

    // 1. Keep the tunnel centered on the ship
    try {
      // 2. Speed up the scrolling
      texture.offset.y += delta * 5; // Increased speed

      // 3. Subtle "shake" or "pulse" for effect
      tunnel.current.rotation.y += delta * 0.2;
      tunnel.current.visible = true;
    } catch (e) {
      tunnel.current.visible = false;
    }
  });

  return (
    <mesh ref={tunnel} rotation={[Math.PI / 2, 0, 0]}>
      {/* Make it MUCH longer so you don't see the ends */}
      <cylinderGeometry args={[8, 8, 400, 32, 1, true]} />
      <meshBasicMaterial
        map={texture}
        side={DoubleSide}
        transparent={false}
        opacity={1}
      />
    </mesh>
  );
}
