/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/purity */
// import { RigidBody } from "@react-three/rapier";
// import { useGLTF, useAnimations } from "@react-three/drei";
// import { useMemo } from "react";
// import { SkeletonUtils } from "three-stdlib";
// import { useGraph } from "@react-three/fiber";
// // @ts-expect-error use instead of ignore so it doesn't hide other potential issues
// import asteroidModel from "./assets/asteroid1.glb";

// export default function Asteroid({
//   position,
//   scale = 1,
// }: {
//   position: [number, number, number];
//   scale?: number;
// }) {
//   // 1. Load the GLB
//   const { scene } = useGLTF(asteroidModel);

//   // 2. Clone the scene safely for multiple instances
//   // SkeletonUtils.clone is better than scene.clone() as it handles
//   // nested hierarchies and multiple materials correctly.
//   const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);

//   // 3. Map the nodes so they are accessible in this specific instance
//   const { nodes } = useGraph(clone);

//   return (
//     <RigidBody type="fixed" colliders="hull" position={position}>
//       {/* We wrap the clone in a primitive.
//          Because it's a clone, it carries all the child meshes
//          and their respective materials from Blender.
//       */}
//       <primitive object={clone} scale={scale} />
//     </RigidBody>
//   );
// }

// useGLTF.preload(asteroidModel);

/* eslint-disable react-hooks/purity */
import { RigidBody } from "@react-three/rapier";
import {
  useGLTF,
  useAnimations,
  useTexture,
  shaderMaterial,
} from "@react-three/drei";
import { useMemo, useRef } from "react";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";
import { extend, useFrame, useGraph } from "@react-three/fiber";
// @ts-expect-error use instead of ignore so it doesn't hide other potential issues
import asteroidModel from "./assets/asteroid1.glb";
import ringPath from "./assets/8k_saturn_ring_alpha.png";
//import ringPath from "./assets/saturn-cassini2.jpg";

const AsteroidRingMaterial = shaderMaterial(
  {
    uTexture: null,
    uOpacity: 0.8,
    uSpeed: 0.2,
    uTime: 0.0,
    uColorShift: 0, // 0 to 1 range
    uInner: 0.28,
    uOuter: 0.7,
  },
  // Vertex Shader
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader: Converts UVs to Polar
  `
  uniform sampler2D uTexture;
  uniform float uOpacity;
  uniform float uSpeed;
  uniform float uTime;
  varying vec2 vUv;
  uniform float uInner;
  uniform float uOuter;
  uniform float uColorShift;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
 }   
// Function to shift hue
  vec3 hueShift(vec3 color, float hue) {
      const vec3 k = vec3(0.57735, 0.57735, 0.57735);
      float cosAngle = cos(hue * 6.283185);
      return vec3(color * cosAngle + cross(k, color) * sin(hue * 6.283185) + k * dot(k, color) * (1.0 - cosAngle));
  }

void main() {
    // 1. Center UVs to [-0.5, 0.5]
    vec2 uv = vUv - 0.5;

    // 2. Calculate Polar Coordinates
    float angle = atan(uv.y, uv.x) / (2.0 * 3.14159265) + 0.5 + (uSpeed * uTime); // Normalize angle to [0,1] and add time-based rotation
    float radius = length(uv) * 2.0; // 0.0 at center, 1.0 at edges

    // Use 'radius' for the U (horizontal) and 'angle' for the V (vertical)
    // Or swap them depending on how your Saturn texture is oriented!
    vec2 polarUv = vec2(radius, angle); 
    
    vec4 texColor = texture2D(uTexture, polarUv);

    // We create a grid in polar space (Radius vs Angle)
    vec2 rockGrid = vec2(radius * 150.0, fract(angle) * 800.0);
    vec2 id = floor(rockGrid);
    
    // Check a random seed for this grid cell
    float h = hash(id);
    if (h > 0.995) { // Only 0.5% of cells get a dot
        // Create a tiny circle inside the cell
        float distToCenter = length(fract(rockGrid) - 0.5);
        float dotShape = smoothstep(0.9, 0.2, distToCenter);
        vec3 rockColor = vec3(0.6, 0.75, 0.6);
        texColor.rgb = mix(texColor.rgb, rockColor, dotShape * 0.5);
    }
    // 4. THE MASK: Hide the center and the corners
    // This creates the "hole" in the middle and makes it a circle
    float ringMask = smoothstep(0.4, 0.5, radius) * (1.0 - smoothstep(0.9, 1.0, radius));
    ringMask=smoothstep(uInner, uInner + 0.1, radius) * (1.0 - smoothstep(uOuter - 0.1, uOuter, radius));

    

    gl_FragColor = vec4(texColor.rgb, texColor.a * uOpacity * ringMask);

    
    if(gl_FragColor.a < 0.01) discard;
  }
  `,
);

extend({ AsteroidRingMaterial });

export default function Asteroid({
  position,
  scale = 1,
  hasRings = false, // New optional prop
}: {
  position: [number, number, number];
  scale?: number;
  hasRings?: boolean;
}) {
  const ringMatRef = useRef<any>(null!);
  const ringTexture = useTexture(ringPath);
  const { scene } = useGLTF(asteroidModel);

  // useMemo ensures these random values stay the same for THIS asteroid
  const { clone, randomRotation, ringSettings } = useMemo(() => {
    const instance = SkeletonUtils.clone(scene);

    // 1. Random Rotation (Euler angles)
    const rotation = new THREE.Euler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    );
    // Randomize ring size/tilt slightly so they aren't all identical
    const ringSettings = {
      innerRadius: 0.5 * scale,
      outerRadius: 1.5 * scale,
      tilt: new THREE.Euler(Math.random() * 0.5, 0, Math.random() * 0.5),
      speed: 0.01 + Math.random() * 0.1,
      hue: Math.random(), // Random hue shift for variety
    };

    //  Tinting (try a slightly stronger 'lerp' for more color)
    const tint = new THREE.Color().setHSL(Math.random(), 0.2, 0.7);
    instance.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        m.material = (m.material as THREE.MeshStandardMaterial).clone();
        (m.material as THREE.MeshStandardMaterial).color.lerp(tint, 0.3);
      }
    });

    return { clone: instance, randomRotation: rotation, ringSettings };
  }, [scene, scale]);

  useFrame((state) => {
    if (ringMatRef.current) {
      ringMatRef.current.uTime = state.clock.getElapsedTime();
    }
  });

  return (
    <group position={position} rotation={randomRotation}>
      <RigidBody
        type="fixed"
        colliders="cuboid"
        //position={position}
        //rotation={randomRotation}
      >
        <primitive object={clone} scale={scale} />
      </RigidBody>
      {hasRings && (
        <mesh rotation={ringSettings.tilt}>
          <planeGeometry args={[scale * 4, scale * 4]} />
          {/* @ts-expect-error don't feel like making JSX attributes for this bit*/}
          <asteroidRingMaterial
            uColorShift={ringSettings.hue}
            ref={ringMatRef}
            uTexture={ringTexture}
            transparent={true}
            side={THREE.DoubleSide}
            depthWrite={false}
            uSpeed={ringSettings.speed}
            uInner={0.48}
            uOuter={2.9}
          />
        </mesh>
      )}
    </group>
  );
}
