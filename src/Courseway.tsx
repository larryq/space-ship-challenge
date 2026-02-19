/* eslint-disable react-hooks/refs */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { shaderMaterial, useGLTF } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
// @ts-expect-error use instead of ignore so it doesn't hide other potential issues
import courseModel from "./assets/space_course_2.glb";
import { useGame } from "./store/GameStore";
import { RigidBody } from "@react-three/rapier";

// Pre-allocate vectors to save memory
const _shipVec = new THREE.Vector3();
const _arrowVec = new THREE.Vector3();

const CourseFloorMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color("#00ffff"),
    uPulseSpeed: 2.0,
    uPulseDensity: 10.0,
  },
  // Vertex
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment
  `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uPulseSpeed;
  uniform float uPulseDensity;
  varying vec2 vUv;
  void main() {
    // Scroll the pulse along the V coordinate (length of the track)
    float wave = sin(vUv.y * uPulseDensity - uTime * uPulseSpeed);
    
    // Create a sharp "neon" line effect
    float glow = smoothstep(0.5, 0.8, wave);
    
    vec3 finalColor = uColor * (0.2 + glow * 2.0);
    gl_FragColor = vec4(finalColor, 1.0);
  }
  `,
);

extend({ CourseFloorMaterial });

export const Courseway = ({
  // modelPath,
  shipRef,
  position = [0, 0, 0] as [number, number, number],
  scale = 1,
}) => {
  const incrementCounter = useGame((state) => state.collectWaypoint);
  const { scene } = useGLTF(courseModel);
  const groupRef = useRef<THREE.Group>(null!);
  const floorMaterialRef = useRef<any>(null!);
  // Use a cloned scene so this instance of the course has its own unique arrows
  const localScene = scene.clone();

  const visual = [];
  const physics = [];
  const arrows = [];

  const { visualMeshes, physicsMeshes, arrowMeshes } = useMemo(() => {
    const list = [];
    //let floorMeshInner = null;
    localScene.traverse((child) => {
      if (child.isMesh && child.name.startsWith("WP_Arrow")) {
        child.userData.collected = false;
        arrows.push(child);
      }
      //Setup Course Floor
      if (child.isMesh && child.name === "CourseFloor") {
        //const mat = new CourseFloorMaterial();
        // child.material = mat;
        //floorMaterialRef.current = mat;
        //floorMeshInner = child;
        visual.push(child);
      } else if (child.name.includes("CourseFloor_Phys")) {
        child.visible = false;
        // child.material = new THREE.MeshBasicMaterial({
        //   transparent: true,
        //   opacity: 0,
        //   depthWrite: false,
        // });
        physics.push(child);
      }
    });
    return {
      visualMeshes: visual,
      physicsMeshes: physics,
      arrowMeshes: arrows,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localScene]);

  const collectWaypoint = (arrow) => {
    arrow.userData.collected = true;

    // Visual Feedback
    arrow.material = arrow.material.clone();
    arrow.material.color.set("#00ff00");
    arrow.material.emissive.set("#00ff00");
    arrow.material.emissiveIntensity = 3;
    incrementCounter();

    // You could also hide it:
    // arrow.visible = false;
  };

  useFrame((state) => {
    // Ensure the ship mesh is loaded and assigned
    if (!shipRef.current || !groupRef.current) return;
    if (floorMaterialRef.current) {
      floorMaterialRef.current.uTime = state.clock.getElapsedTime();
    }

    // Force the scene to calculate where everything is in the world
    groupRef.current.updateWorldMatrix(true, true);
    shipRef.current.mesh.updateWorldMatrix(true, false);

    // 1. Get Ship's World Position
    const shipMesh = shipRef.current.mesh;
    shipMesh.getWorldPosition(_shipVec);

    arrows.forEach((arrow) => {
      if (arrow.userData.collected) return;

      // 2. Get Arrow's World Position
      arrow.getWorldPosition(_arrowVec);

      // 3. Distance Check
      const dist = _arrowVec.distanceTo(_shipVec);

      if (dist < 4 * scale) {
        //console.log("waypoint distance: ", dist);
        //console.log("waypoint name:", arrow.name);
        collectWaypoint(arrow);
      }
    });
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* PHYSICS ONLY: Hidden low-poly meshes */}
      {physicsMeshes.map((mesh, i) => (
        <RigidBody
          key={`phys-${i}`}
          type="fixed"
          colliders="trimesh"
          friction={0}
          includeInvisible={true}
        >
          <primitive object={mesh} />
        </RigidBody>
      ))}

      {/* VISUALS ONLY: High-poly pretty meshes (no physics!) */}
      {visualMeshes.map((mesh, i) => (
        <primitive key={`vis-${i}`} object={mesh} />
      ))}

      {/* ARROWS: Visual only */}
      {arrowMeshes.map((arrow, i) => (
        <primitive key={`arr-${i}`} object={arrow} />
      ))}
    </group>
  );
};
