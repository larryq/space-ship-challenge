import { useGame } from "./store/GameStore";

export const WaypointArrow = ({ position, rotation }) => {
  // Logic for "Collected" state
  // We can change the color or hide the arrow when hit
  const isCollected = false; //useGame((state) => state.checkIfCollected(position));

  return (
    <group position={position} rotation={rotation}>
      {/* Your high-quality arrow model here */}
      <mesh>
        <coneGeometry args={[0.5, 2, 8]} />
        <meshStandardMaterial
          color={isCollected ? "#00ff00" : "#ff0099"}
          emissive={isCollected ? "#00ff00" : "#ff0099"}
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
};
