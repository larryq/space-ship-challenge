/* eslint-disable prefer-const */
/* eslint-disable react-hooks/purity */
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useGLTF, shaderMaterial, Points, Point } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useGame } from "./store/GameStore";
import stargate from "./assets/stargate1.glb";

// 1. Enhanced Shader with a "Radial Pulse"
const ShimmerMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color("#8800ff") },
  // Vertex Shader
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader
  `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    // Distance from center for radial effects
    vec2 center = vUv - 0.5;
    float dist = length(center);
    
    // Create a pulse that moves outward
    float pulse = sin(dist * 20.0 - uTime * 4.0);
    
    // Mix textures/colors based on the pulse
    float brightness = smoothstep(0.45, 0.5, 1.0 - dist); // Soft edge
    vec3 finalColor = uColor + (pulse * 0.15);
    
    gl_FragColor = vec4(finalColor, brightness * (0.6 + pulse * 0.2));
  }
  `,
);

extend({ ShimmerMaterial });

export function Stargate({
  position,
  scale,
  rotation,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}) {
  const { scene } = useGLTF(stargate); // Swap with your path
  const enterGate = useGame((state) => state.enterGate);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shimmerRef = useRef<any>(null!);
  const particlesRef = useRef<THREE.Points>(null!);
  const gateRef = useRef<THREE.Group>(null!);

  // Extract the WarpPlane data for the sensor
  const sensorData = useMemo(() => {
    let size = new THREE.Vector3(1, 1, 1);
    let offset = new THREE.Vector3(0, 0, 0);
    let quaternion = new THREE.Quaternion();

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === "WarpPlane") {
        // 1. Get the local dimensions
        child.geometry.computeBoundingBox();
        child.geometry.boundingBox!.getSize(size);

        // 2. Get the position and rotation relative to the gate's center
        offset.copy(child.position);
        quaternion.copy(child.quaternion);

        // Swap the material for the shader
        child.material = new ShimmerMaterial();
        child.material.transparent = true;
        child.material.side = THREE.DoubleSide;
        shimmerRef.current = child.material;
      }
    });

    return {
      args: [size.x / 2, size.y / 2, size.z / 2] as [number, number, number],
      position: [offset.x, offset.y, offset.z] as [number, number, number],
      rotation: new THREE.Euler().setFromQuaternion(quaternion),
    };
  }, [scene]);

  // Create 100 random particle positions
  const particles = useMemo(() => {
    return Array.from({ length: 100 }).map(() => ({
      position: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        Math.random() * 20,
      ],
      speed: 0.1 + Math.random() * 0.2,
    }));
  }, []);

  useFrame((state, delta) => {
    // 1. Animate the gate shimmer
    if (shimmerRef.current) {
      shimmerRef.current.uTime = state.clock.getElapsedTime();
    }
    //gateRef.current.rotation.y += delta * 1.1; // Slow rotation for effect

    // 2. Animate particles being "sucked in"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    particlesRef.current.children.forEach((p: any, i) => {
      p.position.z -= particles[i].speed;
      if (p.position.z < 0) p.position.z = 20; // Reset behind the gate
    });
  });

  const colliderArgs = useMemo(() => {
    // eslint-disable-next-line prefer-const
    let size = new THREE.Vector3(0, 0, 0); // Fallback

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name === "WarpPlane") {
        // Force calculation of the bounding box
        child.geometry.computeBoundingBox();
        const box = child.geometry.boundingBox;

        if (box) {
          box.getSize(size);
        }
      }
    });

    // Rapier Cuboid takes "half-extents" (distance from center to edge)
    // So we divide the total size by 2
    return [size.x / 2, size.y / 2, size.z / 2] as [number, number, number];
  }, [scene]);

  return (
    <group ref={gateRef} position={position} scale={scale} rotation={rotation}>
      {/* 1. SOLID FRAME: 'trimesh' is best for complex hollow shapes like a gate */}
      <RigidBody type="fixed" colliders="trimesh">
        <primitive object={scene} />

        {/* 2. THE SENSOR: Nested inside the same RigidBody but marked as 'sensor' */}
        <CuboidCollider
          sensor
          args={sensorData.args}
          position={sensorData.position}
          rotation={[
            sensorData.rotation.x,
            sensorData.rotation.y,
            sensorData.rotation.z,
          ]}
          onIntersectionEnter={({ other }) => {
            if (other.rigidBodyObject?.name === "ship") enterGate();
          }}
        />
      </RigidBody>

      {/* Particle "Pull" Effect */}
      <Points ref={particlesRef}>
        <pointsMaterial size={0.05} color="#8800ff" transparent opacity={0.6} />
        {particles.map((p, i) => (
          <Point key={i} position={p.position as [number, number, number]} />
        ))}
      </Points>
    </group>
  );
}
