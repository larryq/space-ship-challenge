/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

export const LevelIndicator = () => {
  const groupRef = useRef<THREE.Group>(null!);
  const lineRef = useRef<THREE.Mesh>(null!);
  const textRef = useRef<any>(null!);
  const headingRef = useRef<THREE.Group>(null!);

  const forward = new THREE.Vector3();
  // 16.7 degrees converted to Radians
  const CAMERA_OFFSET_RAD = 16.7 * (Math.PI / 180);

  // Helper component for the letters
  const CompassMark = ({ label, angle }: { label: string; angle: number }) => (
    <group rotation={[0, 0, -angle]}>
      <Text
        position={[0, 0.55, 0]} // Placed just outside the ring
        fontSize={0.1}
        color="#00ff00"
        depthTest={false}
        rotation={[0, 0, angle]} // "Un-rotate" the text so letters stay upright
      >
        {label}
      </Text>
    </group>
  );
  useFrame((state) => {
    const cam = state.camera;
    cam.getWorldDirection(forward);
    const TOTAL_UI_TRAVEL = 0.8; // The full height of your compass interior, top to bottom
    const MAX_PITCH = 1.16; // using a 67.1 degree limit of pitch, up and down, to prevent gimbal lock and excessive movement
    const rawPitchRad = Math.asin(forward.y);
    const adjustedPitchRad = rawPitchRad + CAMERA_OFFSET_RAD;
    const adjustedPitchDeg = adjustedPitchRad * (180 / Math.PI);

    // Calculate how many UI units the line moves per 1 radian of pitch
    const slope = TOTAL_UI_TRAVEL / 2 / MAX_PITCH;

    // Lock HUD to Camera
    groupRef.current.position.copy(cam.position);
    groupRef.current.quaternion.copy(cam.quaternion);

    // Slide the horizon line - constrained to the "compass" circle
    // We'll limit it so it doesn't fly out of the ring
    lineRef.current.position.y = THREE.MathUtils.clamp(
      -adjustedPitchRad * slope,
      -0.4,
      0.4,
    );
    // We rotate the ring the OPPOSITE way the camera turns
    if (headingRef.current) {
      headingRef.current.rotation.z = cam.rotation.y;
    }

    if (textRef.current) {
      textRef.current.text = `${adjustedPitchDeg.toFixed(1)}° Pitch`;
    }
  });

  return (
    <group ref={groupRef}>
      {/* OFFSET THE WHOLE UNIT:
        X: -2.0 (Leftish) 
        Y: 0.9 (Uppish) 
        Z: -4.0 (Distance from face)
      */}
      <group position={[-2.5, 1.3, -4.0]} scale={0.5}>
        {/* 1. COMPASS OUTER RING */}
        <group ref={headingRef}>
          <mesh>
            <ringGeometry args={[0.45, 0.47, 32]} />
            <meshBasicMaterial
              color="#00ff00"
              transparent
              opacity={0.3}
              depthTest={false}
            />
          </mesh>
          <CompassMark label="N" angle={0} />
          <CompassMark label="E" angle={-Math.PI / 2} />
          <CompassMark label="S" angle={Math.PI} />
          <CompassMark label="W" angle={Math.PI / 2} />
        </group>

        {/* 2. STATIC CROSSHAIR (Center of this HUD) */}
        <mesh>
          <ringGeometry args={[0.01, 0.03, 4]} />
          <meshBasicMaterial
            color="#00ff00"
            transparent
            opacity={0.8}
            depthTest={false}
          />
        </mesh>

        {/* 3. MOVING HORIZON LINE (Masked by the ring effectively) */}
        <mesh ref={lineRef}>
          <planeGeometry args={[0.4, 0.01]} />
          <meshBasicMaterial
            color="#00ff00"
            transparent
            opacity={0.6}
            depthTest={false}
          />
        </mesh>

        {/* 4. PITCH READOUT (Right next to the ring) */}
        <Text
          ref={textRef}
          position={[0.75, 0, 0]}
          fontSize={0.12}
          color="#00ff00"
          anchorX="left"
          depthTest={false}
        >
          0.0°
        </Text>
      </group>
    </group>
  );
};
