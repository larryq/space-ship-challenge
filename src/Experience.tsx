import { Environment, Html, Stars, useTexture } from "@react-three/drei";
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
import SectorDelta from "./SectorDelta";
import * as THREE from "three";
import { WorldBoundary } from "./WorldBoundary";
import { SpaceDust } from "./SpaceDust";
import { SpaceShell } from "./SpaceShell";
import { LevelIndicator } from "./LevelIndicator";
import { NavigationHUD } from "./NavigationHUD";
import warpURL from "./assets/warp_stars.jpg";
import warpURL2 from "./assets/warp_stars2.jpg";
import warpURL3 from "./assets/warp_stars3.jpg";
import warpURL4 from "./assets/warp_stars4.jpg";
import warpURL5 from "./assets/warp_stars5.jpg";
import warpURL6 from "./assets/warp_stars6.jpg";
import warpURL7 from "./assets/warp_stars7.jpg";
import warpURL8 from "./assets/warp_stars8.jpg";
import warpURL9 from "./assets/warp_stars9.jpg";
import SectorEpsilon from "./SectorEpsilon";
useTexture.preload(warpURL);
useTexture.preload(warpURL2);
useTexture.preload(warpURL3);
useTexture.preload(warpURL4);
useTexture.preload(warpURL5);
useTexture.preload(warpURL6);
useTexture.preload(warpURL7);
useTexture.preload(warpURL8);
useTexture.preload(warpURL9);

const warpTextures = [
  warpURL,
  warpURL2,
  warpURL3,
  warpURL4,
  warpURL5,
  warpURL6,
  warpURL7,
  warpURL8,
  warpURL9,
];

export default function Experience() {
  const phase = useGame((state) => state.phase);
  const currentSector = useGame((state) => state.currentSector);
  const warpTextureIndex = useGame((state) => state.warpTextureIndex);

  // Define the interface that matches your useImperativeHandle
  interface ShipHandle {
    body: RapierRigidBody;
    mesh: THREE.Group;
  }

  const shipRef = useRef<THREE.Mesh>(null!);
  const courseRef = useRef<THREE.Mesh>(null!);

  console.log("Experience Rendered - Phase:", phase, "Sector:", currentSector);
  return (
    <>
      <Physics debug={false}>
        {/* <WorldBoundary /> */}
        <SpaceShell />
        <SpaceShip ref={shipRef} courseRef={courseRef} />
        {/* Render content based on sector */}
        {currentSector === 0 && <SectorZero />}
        {phase === "playing" && currentSector === 1 && (
          <SectorAlpha shipRef={shipRef} courseRef={courseRef} />
        )}
        {phase === "playing" && currentSector === 2 && (
          <SectorBeta shipRef={shipRef} courseRef={courseRef} />
        )}
        {phase === "playing" && currentSector === 3 && (
          <SectorGamma shipRef={shipRef} courseRef={courseRef} />
        )}
        {phase === "playing" && currentSector === 4 && (
          <SectorDelta shipRef={shipRef} courseRef={courseRef} />
        )}
        {phase === "playing" && currentSector === 5 && (
          <SectorEpsilon shipRef={shipRef} courseRef={courseRef} />
        )}
        {phase === "playing" && currentSector > 5 && (
          <SectorAlpha shipRef={shipRef} courseRef={courseRef} />
        )}

        <SpaceDust count={60000} />
        <LevelIndicator />
        {phase !== "warping" && <NavigationHUD shipRef={shipRef} />}
        <ambientLight intensity={0.6} />
        <Environment
          preset="city" // 'city', 'night', 'warehouse', or 'sunset'
          blur={0.5}
        />
      </Physics>

      {/* Warp Overlay: CSS effect that shows up when warping */}
      {phase === "warping" && (
        <WarpTunnel
          shipBodyRef={shipRef}
          textureURL={warpTextures[warpTextureIndex]}
        />
      )}
    </>
  );
}
