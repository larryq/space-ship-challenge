import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useGame } from "./store/GameStore";

export function Stargate({ position }: { position: [number, number, number] }) {
  const enterGate = useGame((state) => state.enterGate);

  return (
    <group position={position}>
      <mesh>
        <torusGeometry args={[5, 0.4, 16, 100]} />
        <meshStandardMaterial
          color="#8800ff"
          emissive="#8800ff"
          emissiveIntensity={2}
        />
      </mesh>

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[5, 5, 1]}
          sensor
          onIntersectionEnter={({ other }) => {
            // We check if it's the player before warping.
            if (other.rigidBodyObject?.name === "ship") {
              enterGate();
            }
          }}
        />
      </RigidBody>
    </group>
  );
}
