/* eslint-disable react-hooks/immutability */
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Mesh, DoubleSide, RepeatWrapping } from "three";
import { useTexture } from "@react-three/drei";
import { useGame } from "./store/GameStore";
import warpURL from "./assets/warp_stars7.jpg";

export function WarpTunnel({
  shipBodyRef: shipRef,
  textureURL = warpURL,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shipBodyRef: any;
  textureURL?: string;
}) {
  // Pass the ship ref here
  const tunnel = useRef<Mesh>(null!);
  const phase = useGame((state) => state.phase);
  const texture = useTexture(textureURL);

  texture.wrapS = texture.wrapT = RepeatWrapping;
  // Repeat the texture many times along the length to make stars smaller/denser
  texture.repeat.set(1, 4);

  useFrame((_state, delta) => {
    if (phase !== "warping" || !shipRef.current || !tunnel.current) return;

    // 2. Grab the mesh from the custom handle
    const shipMesh = shipRef.current.mesh;
    if (!shipMesh) return;

    // This is a pure Three.js call. No WASM, no physics, no crashing.  Doing this with Rapier was causing some weird issues where the ship would get "stuck" in the tunnel or the tunnel would disappear. By directly manipulating the Three.js mesh, we avoid those issues entirely.
    shipMesh.getWorldPosition(tunnel.current.position);

    try {
      texture.offset.y -= delta * 3.5; //increase for faster effect

      // 3. Subtle "shake" or "pulse" for effect
      tunnel.current.rotation.y += delta * 2.79;
      tunnel.current.visible = true;
    } catch (e) {
      tunnel.current.visible = false;
    }
  });

  return (
    <mesh ref={tunnel} rotation={[Math.PI / 2, 0, 0]}>
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
