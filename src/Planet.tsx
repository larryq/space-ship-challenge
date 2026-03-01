/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { extend } from "@react-three/fiber";
import gasGiant from "./shaders/gasGiant.frag";
import earth from "./shaders/earthFragment.frag";
import lavaPlanet from "./shaders/lavaPlanet.frag";
import bioLuminence from "./shaders/bioLuminence.frag";
import marsPlanet from "./shaders/marsFragment.frag";
import icePlanet from "./shaders/icePlanet.frag";
import vertexShader from "./shaders/planet.vert";
import * as THREE from "three";

// eslint-disable-next-line react-refresh/only-export-components
export const PlanetShaders = {
  earth,
  gasGiant,
  lavaPlanet,
  bioLuminence,
  marsPlanet,
  icePlanet,
};

// const PlanetMaterial = shaderMaterial(
//   { uTime: 0, uMode: 0 },
//   vertexShader,
//   earth,
// );

// extend({ PlanetMaterial });

export default function Planet({
  position,
  mode = 0,
  fragmentShader = earth,
  size = 1,
  rings = false,
  shadowStrength = 0.5,
}: {
  position: [number, number, number];
  mode: number;
  fragmentShader?: string;
  size: number;
  rings?: boolean;
  shadowStrength?: number;
}) {
  const matRef = useRef<any>(null!);

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMode: { value: 0 },
        uShadowStrength: { value: shadowStrength },
      },
    });
    return mat;
  }, [fragmentShader, shadowStrength]);

  useFrame(({ clock }) => {
    // eslint-disable-next-line react-hooks/immutability
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uShadowStrength.value = shadowStrength;
  });

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={position}>
        <sphereGeometry args={[size, 32, 32]} />

        <primitive object={material} attach="material" />
      </mesh>
    </RigidBody>
  );
}
