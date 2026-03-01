/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

const _shipPos = new THREE.Vector3();
const _gatePos = new THREE.Vector3();
const _targetDir = new THREE.Vector3();
const _localDir = new THREE.Vector3();

export const NavigationHUD = ({ shipRef }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const arrowRef = useRef<THREE.Group>(null!);
  const textRef = useRef<any>(null!);
  const crosshairRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const stargate = state.scene.getObjectByName("stargate");
    if (!stargate || !shipRef.current?.mesh || !groupRef.current) return;

    // 1. Lock HUD to Camera
    groupRef.current.position.copy(state.camera.position);
    groupRef.current.quaternion.copy(state.camera.quaternion);

    // 2. Get Positions
    shipRef.current.mesh.getWorldPosition(_shipPos);
    stargate.getWorldPosition(_gatePos);

    // 3. Update Distance Text
    const distance = _shipPos.distanceTo(_gatePos);

    // 4. PRECISE DIRECTION MATH
    // Get the vector from camera to gate
    _targetDir.subVectors(_gatePos, state.camera.position).normalize();

    // Convert that vector into the camera's local coordinate system
    // .worldToLocal effectively does: (GatePos - CamPos) * CamRotationInverse
    _localDir.copy(_gatePos);
    state.camera.worldToLocal(_localDir);

    // Now _localDir.x and _localDir.y are exactly the screen-relative coordinates.
    // .x is left/right, .y is up/down
    const angle = Math.atan2(_localDir.x, _localDir.y);

    // Smoothly rotate the arrow
    arrowRef.current.rotation.z = -angle;

    // 5. IMPROVED VISIBILITY LOGIC
    // We check the Z depth in local space.
    // If Z is negative, the object is in FRONT of the camera.
    const isFront = _localDir.z < 0;
    if (textRef.current) {
      textRef.current.text = `${Math.round(distance)} units ${isFront ? "ahead" : "behind"}`;
    }

    // Measure how centered the object is
    // A value of 1.0 means it's perfectly in the crosshairs
    const centerFactor = _targetDir.dot(
      state.camera.getWorldDirection(new THREE.Vector3()),
    );

    // Hide arrow if it's very centered (so it doesn't jitter in the middle)
    // Or if the gate is behind us, we keep the arrow visible to lead the player back
    if (isFront && centerFactor > 0.98) {
      arrowRef.current.visible = false;
      crosshairRef.current.visible = true;
    } else {
      arrowRef.current.visible = true;
      crosshairRef.current.visible = false;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Positioned at top-right of the screen in 3D space */}
      <group position={[2.5, 1.3, -4.0]} scale={0.5}>
        {/* Navigation Ring */}
        <mesh>
          <ringGeometry args={[0.35, 0.38, 32]} />
          <meshBasicMaterial
            color="#00ff62"
            transparent
            opacity={0.2}
            depthTest={false}
          />
        </mesh>

        {/* The Pointer Arrow */}
        <group ref={arrowRef}>
          <mesh position={[0, 0.45, 0]}>
            <coneGeometry args={[0.08, 0.2, 3]} />
            <meshBasicMaterial color="#00ff62" depthTest={false} />
          </mesh>
        </group>
        {/* The Crosshair  */}
        <group ref={crosshairRef}>
          <mesh position={[0, 0, 0]}>
            <circleGeometry args={[0.08, 32]} />
            <meshBasicMaterial color="#e70b21" depthTest={false} />
          </mesh>
        </group>

        {/* Distance Readout */}
        <Text
          ref={textRef}
          position={[0, -0.6, 0]}
          fontSize={0.15}
          color="#00ff62"
          textAlign="center"
          // @ts-expect-error use instead of ignore so it doesn't hide other potential issues
          depthTest={false}
        >
          WAITING...
        </Text>

        {/* Label */}
        <Text
          position={[0, 0.65, 0]}
          fontSize={0.15}
          color="#00ff62"
          // @ts-expect-error use instead of ignore so it doesn't hide other potential issues
          depthTest={false}
        >
          Stargate
        </Text>
      </group>
    </group>
  );
};
