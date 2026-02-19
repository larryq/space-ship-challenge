import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef } from "react";

export function CameraRig({ shipBodyRef }) {
  // Vectors for calculation (pre-allocated to save memory)
  const vec = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const targetPos = new THREE.Vector3();
  const offset = new THREE.Vector3(0, 2, 8);

  useFrame((state) => {
    if (!shipBodyRef.current) {
      return;
    }

    try {
      // 1. Get ship world transform from physics
      const pos = shipBodyRef.current.translation();
      const rot = shipBodyRef.current.rotation();

      vec.set(pos.x, pos.y, pos.z);
      quat.set(rot.x, rot.y, rot.z, rot.w);

      // Debug: Uncomment this to see if numbers are changing in your console
      //console.log(pos.z);

      // 2. Calculate ideal position behind ship
      // This moves the 'offset' into the ship's rotated space
      targetPos.copy(offset).applyQuaternion(quat).add(vec);

      // 3. Smoothly move camera
      state.camera.position.lerp(targetPos, 0.1);

      // 4. Always look at the ship
      state.camera.lookAt(vec);
    } catch (e) {
      console.warn("Physics not yet ready:");
    }
  });

  return null;
}
