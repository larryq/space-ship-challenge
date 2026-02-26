import { Environment, Html, Stars } from "@react-three/drei";
import { Physics, RapierRigidBody } from "@react-three/rapier";
import { useGame } from "./store/GameStore";
import { SpaceShip } from "./SpaceShip";
import SectorAlpha from "./SectorAlpha";
import SectorBeta from "./SectorBeta";
import { WarpTunnel } from "./WarpTunnel";
import { useRef } from "react";
import { CameraRig } from "./CameraRig";
import SectorZero from "./SectorZero";
import SectorGamma from "./SectorGamma";
import * as THREE from "three";
import { WorldBoundary } from "./WorldBoundary";
import { SpaceDust } from "./SpaceDust";
import { SpaceShell } from "./SpaceShell";
import { LevelIndicator } from "./LevelIndicator";
import { NavigationHUD } from "./NavigationHUD";

export default function Experience() {
  const phase = useGame((state) => state.phase);
  const currentSector = useGame((state) => state.currentSector);
  // Define the interface that matches your useImperativeHandle
  interface ShipHandle {
    body: RapierRigidBody;
    mesh: THREE.Group;
  }

  const shipRef = useRef<ShipHandle>(null!);

  return (
    <>
      <Physics debug={false}>
        {/* <WorldBoundary /> */}
        <SpaceShell />
        <SpaceShip ref={shipRef} />
        {/* Render content based on sector */}
        {currentSector === 0 && <SectorZero />}
        {phase === "playing" && currentSector === 1 && (
          <SectorAlpha shipRef={shipRef} />
        )}
        {phase === "playing" && currentSector === 2 && <SectorBeta />}
        {phase === "playing" && currentSector === 3 && <SectorGamma />}

        {/* <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        /> */}
        <SpaceDust count={60000} />
        <LevelIndicator />
        <NavigationHUD shipRef={shipRef} />
        <ambientLight intensity={0.6} />
        <Environment
          preset="city" // 'city', 'night', 'warehouse', or 'sunset'
          blur={0.5}
        />
      </Physics>

      {/* Warp Overlay: CSS effect that shows up when warping */}
      {phase === "warping" && <WarpTunnel shipBodyRef={shipRef} />}
    </>
  );
}
