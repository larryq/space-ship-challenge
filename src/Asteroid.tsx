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
import { useGLTF, useAnimations } from "@react-three/drei";
import { useMemo } from "react";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";
import { useGraph } from "@react-three/fiber";
// @ts-expect-error use instead of ignore so it doesn't hide other potential issues
import asteroidModel from "./assets/asteroid1.glb";
export default function Asteroid({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  const { scene } = useGLTF(asteroidModel);

  // useMemo ensures these random values stay the same for THIS asteroid
  const { clone, randomRotation } = useMemo(() => {
    const instance = SkeletonUtils.clone(scene);

    // 1. Random Rotation (Euler angles)
    const rotation = new THREE.Euler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    );

    //  Tinting (try a slightly stronger 'lerp' for more color)
    const tint = new THREE.Color().setHSL(Math.random(), 0.2, 0.7);
    instance.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        m.material = (m.material as THREE.MeshStandardMaterial).clone();
        (m.material as THREE.MeshStandardMaterial).color.lerp(tint, 0.3);
      }
    });

    return { clone: instance, randomRotation: rotation };
  }, [scene]);

  return (
    <RigidBody
      type="fixed"
      colliders="cuboid"
      position={position}
      rotation={randomRotation}
    >
      <primitive object={clone} scale={scale} />
    </RigidBody>
  );
}
