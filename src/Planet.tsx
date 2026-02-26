/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import gasGiant from "./shaders/gasGiant.frag";
import earth from "./shaders/earthFragment.frag";
import lavaPlanet from "./shaders/lavaPlanet.frag";
import bioLuminence from "./shaders/bioLuminence.frag";
import marsPlanet from "./shaders/marsFragment.frag";
import icePlanet from "./shaders/icePlanet.frag";
import vertexShader from "./shaders/planet.vert";
import * as THREE from "three";

const PlanetMaterial = shaderMaterial(
  { uTime: 0, uMode: 0 },
  vertexShader,
  earth,
);

extend({ PlanetMaterial });

export default function Planet({
  position,
  mode = 0,
  size = 1,
  rings = false,
}: {
  position: [number, number, number];
  mode: number;
  size: number;
  rings?: boolean;
}) {
  const matRef = useRef<any>(null!);

  useFrame(({ clock }) => {
    matRef.current.uTime = clock.getElapsedTime();
  });

  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 32, 32]} />
      {/* @ts-expect-error don't feel like making JSX attributes for this bit*/}
      <planetMaterial ref={matRef} uMode={mode} />
    </mesh>
  );
}
