/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/refs */
import { shaderMaterial, useGLTF } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
// @ts-expect-error use instead of ignore so it doesn't hide other potential issues
import courseModel from "./assets/space_course_3.glb";
import { useGame } from "./store/GameStore";
import { RigidBody } from "@react-three/rapier";

// Pre-allocate vectors to save memory
const _shipVec = new THREE.Vector3();
const _arrowVec = new THREE.Vector3();

// const CourseFloorMaterial = shaderMaterial(
//   {
//     uTime: 0,
//     uMode: 1, // 1 = lava, 2 = ice (for atm rim color)
//   },
//   // Vertex
//   `
//   varying vec3 vWorldPos;
//   varying vec3 vWorldNorm;
//   varying vec3 vViewDir;

//   void main() {
//     vec4 worldPos = modelMatrix * vec4(position, 1.0);
//     vWorldPos = worldPos.xyz;
//     vWorldNorm = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
//     vViewDir = normalize(cameraPosition - worldPos.xyz);
//     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//   }
//   `,
//   // Fragment
//   `
//   precision highp float;

//   uniform float uTime;
//   uniform int   uMode;

//   varying vec3 vWorldPos;
//   varying vec3 vWorldNorm;
//   varying vec3 vViewDir;

//   // ── Noise ────────────────────────────────────────────────────────────────
//   float hash3(vec3 p) {
//     return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
//   }

//   float noise(vec3 p) {
//     vec3 i = floor(p);
//     vec3 f = fract(p);
//     f = f * f * (3.0 - 2.0 * f);
//     return mix(
//       mix(mix(hash3(i),             hash3(i+vec3(1,0,0)), f.x),
//           mix(hash3(i+vec3(0,1,0)), hash3(i+vec3(1,1,0)), f.x), f.y),
//       mix(mix(hash3(i+vec3(0,0,1)), hash3(i+vec3(1,0,1)), f.x),
//           mix(hash3(i+vec3(0,1,1)), hash3(i+vec3(1,1,1)), f.x), f.y), f.z);
//   }

//   float fbm(vec3 p, int octaves) {
//     float value = 0.0, amplitude = 0.5, total = 0.0;
//     for (int i = 0; i < 8; i++) {
//       if (i >= octaves) break;
//       value     += amplitude * noise(p);
//       total     += amplitude;
//       p          = p * 2.1 + vec3(1.7, 9.2, 6.3);
//       amplitude *= 0.5;
//     }
//     return value / total;
//   }

//   float warpedFbm(vec3 p, int octaves) {
//     vec3 q = vec3(
//       fbm(p,                        octaves),
//       fbm(p + vec3(5.2, 1.3, 8.1), octaves),
//       fbm(p + vec3(1.7, 9.2, 3.5), octaves)
//     );
//     return fbm(p + 1.2 * q, octaves);
//   }

//   // Cylindrical sample coords: angle around Y axis + height
//   // Scale controls how zoomed in the pattern is
//   vec3 sampleCoords(vec3 worldPos, float scale) {
//     float angle = atan(worldPos.z, worldPos.x); // -PI to PI around Y axis
//     return vec3(angle * 2.0, worldPos.y, 0.0) * scale;
//   }

//   vec3 lavaColor(vec3 p) {
//     float h    = warpedFbm(p * 2.0 + vec3(uTime * 0.03), 7);
//     float glow = fbm(p * 5.0 + vec3(uTime * 0.05), 4);

//     vec3 col;
//     if      (h < 0.30) col = mix(vec3(0.06,0.04,0.04), vec3(0.20,0.05,0.02), h/0.30);
//     else if (h < 0.55) col = mix(vec3(0.20,0.05,0.02), vec3(0.95,0.30,0.02), (h-0.30)/0.25);
//     else if (h < 0.75) col = mix(vec3(0.95,0.30,0.02), vec3(1.00,0.82,0.20), (h-0.55)/0.20);
//     else               col = mix(vec3(1.00,0.82,0.20), vec3(1.0),             (h-0.75)/0.25);

//     col += vec3(1.00,0.82,0.20) * glow * 0.2;
//     return col;
//   }

//   vec3 iceColor(vec3 p) {
//     float h    = warpedFbm(p * 2.0 + vec3(uTime * 0.01), 7);
//     float glow = fbm(p * 4.0 + vec3(uTime * 0.02), 4);

//     vec3 col;
//     if      (h < 0.30) col = mix(vec3(0.05,0.10,0.20), vec3(0.20,0.35,0.55), h/0.30);
//     else if (h < 0.55) col = mix(vec3(0.20,0.35,0.55), vec3(0.55,0.75,0.90), (h-0.30)/0.25);
//     else if (h < 0.75) col = mix(vec3(0.55,0.75,0.90), vec3(0.85,0.93,0.98), (h-0.55)/0.20);
//     else               col = mix(vec3(0.85,0.93,0.98), vec3(1.0),             (h-0.75)/0.25);

//     col += vec3(0.6, 0.8, 1.0) * glow * 0.15;
//     return col;
//   }

//   void main() {
//     vec3 n = normalize(vWorldNorm);
//     vec3 v = normalize(vViewDir);

//     // Use cylindrical coords for noise sampling so it looks good on a tube
//     vec3 p = sampleCoords(vWorldPos, 0.005);

//     vec3 col = uMode == 1 ? lavaColor(p) : iceColor(p);

//     // Very subtle sun — just a gentle warmth, not a harsh day/night split
//     vec3 sunDir = normalize(vec3(-0.6, 0.4, 0.8));
//     float diff = max(dot(n, sunDir), 0.0);
//     float amb  = 0.75; // high ambient so the dark side is barely darker
//     float lighting = amb + diff * 0.25; // sun contributes only 25% on top of ambient

//     col *= lighting;

//     // Subtle specular
//     float spec = pow(max(dot(reflect(-sunDir, n), v), 0.0), 32.0) * 0.08;
//     col += spec;

//     // Very faint rim glow
//     float rim = pow(1.0 - max(dot(n, v), 0.0), 4.0);
//     vec3 atmCol = uMode == 1 ? vec3(0.8, 0.4, 0.2) : vec3(0.6, 0.8, 1.0);
//     col = mix(col, atmCol, rim * 0.15); // was 0.6 on the planets, very subtle now

//     gl_FragColor = vec4(col, 1.0);
//   }
//   `,
// );

const CourseFloorMaterial = shaderMaterial(
  {
    uTime: 0,
  },
  // Vertex
  `
  varying vec3 vWorldPos;
  varying vec3 vWorldNorm;
  varying vec3 vViewDir;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNorm = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment
  `
 precision highp float;
uniform float uTime;

varying vec3 vWorldPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;

// ── Noise ────────────────────────────────────────────────────────────────
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1,0)), f.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
    f.y
  );
}

float fbm2(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise2(p);
    p = p * 2.1 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

vec3 ember3D(vec3 cellId, vec3 localPos) {
  float seed1 = hash3(cellId);
  float seed2 = hash3(cellId + vec3(7.3, 2.1, 5.5));
  float seed3 = hash3(cellId + vec3(3.7, 5.9, 1.2));
  float seed4 = hash3(cellId + vec3(11.1, 8.4, 3.3));

  float size = 0.05 + seed2 * 0.15;

  float driftSpeed = 0.2 + seed3 * 0.6;
  float driftY     = fract(seed1 + uTime * driftSpeed * 0.1);
  float driftX     = sin(uTime * 0.3 * seed4 + seed1 * 6.28) * 0.12;
  float driftZ     = cos(uTime * 0.2 * seed3 + seed2 * 6.28) * 0.12;

  vec3 emberPos = vec3(
    0.2 + seed2 * 0.6 + driftX,
    driftY,
    0.2 + seed3 * 0.6 + driftZ
  );

  float dist = length(localPos - emberPos);
  float glow = exp(-dist * dist / (size * size));

  float flicker = 0.7 + 0.3 * sin(uTime * (3.0 + seed4 * 5.0) + seed1 * 6.28);
  glow *= flicker;

  vec3 color;
  if (seed3 < 0.5) {
    color = mix(vec3(0.3, 0.6, 1.0), vec3(0.05, 0.2, 0.8), dist / size);
  } else {
    color = mix(vec3(1.0, 0.55, 0.1), vec3(0.6, 0.1, 0.02), dist / size);
  }

  return color * glow;
}

void main() {
  vec3 n = normalize(vWorldNorm);
  vec3 v = normalize(vViewDir);

  vec3 scaledPos = vWorldPos * 0.3;

  float nebula = fbm2(scaledPos.xz * 3.0 + vec2(uTime * 0.02));
  vec3 bgColor = mix(
    mix(vec3(0.04, 0.06, 0.12), vec3(0.10, 0.04, 0.03), fbm2(scaledPos.xz + uTime * 0.01)),
    mix(
      vec3(0.15, 0.15, 0.15),//vec3(0.08, 0.12, 0.25),
      vec3(0.15, 0.15, 0.15),//vec3(0.20, 0.08, 0.04),
      fbm2(scaledPos.xz * 2.0 + 5.0)
    ),
    nebula * 0.8
  );

  vec3 embers = vec3(0.0);

  vec3 grid1 = scaledPos * vec3(3.0, 2.0, 3.0);
  embers += ember3D(floor(grid1), fract(grid1));

  vec3 grid2 = scaledPos * vec3(5.0, 4.0, 5.0) + vec3(3.7, 1.3, 2.2);
  embers += ember3D(floor(grid2), fract(grid2)) * 0.7;

  vec3 grid3 = scaledPos * vec3(9.0, 6.0, 9.0) + vec3(7.1, 4.9, 3.3);
  embers += ember3D(floor(grid3), fract(grid3)) * 0.4;

  vec3 col = bgColor + embers;

  // ── Depth / shading ───────────────────────────────────────────────────

  // 1. Diffuse — gentle light from above-ish
  vec3 sunDir = normalize(vec3(0.5, 1.0, 0.3));
  float diff = max(dot(n, sunDir), 0.0);

  // 2. Normal-based color shift — shadowed areas tint cold blue
  vec3 shadowTint = vec3(0.02, 0.04, 0.10);
  col = mix(shadowTint, col, 0.5 + diff * 0.5);
  col += col * diff * 0.9; // 0.4 = sun strength, raise for brighter highlight

  // 3. Rim darkening — edges of the cylinder recede into darkness
  float rim = pow(1.0 - max(dot(n, v), 0.0), 2.0);
  col = mix(col, col * 0.3, rim * 0.5);

  // 4. Subtle specular highlight so the surface catches the light
  float spec = pow(max(dot(reflect(-sunDir, n), v), 0.0), 24.0) * 0.15;
  col += vec3(0.3, 0.5, 0.8) * spec; // blue-tinted specular fits the space theme

  gl_FragColor = vec4(col, 1.0);
}
  `,
);

extend({ CourseFloorMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    courseFloorMaterial: ThreeElements["meshStandardMaterial"] & {
      uTime?: number;
      uColor?: THREE.Color;
      uPulseSpeed?: number;
      uPulseDensity?: number;
    };
  }
}

export const Courseway = ({
  // modelPath,
  shipRef,
  position = [0, 0, 0] as [number, number, number],
  scale = 15,
  rotation = [0, 0, 0] as [number, number, number],
}) => {
  const incrementCounter = useGame((state) => state.collectWaypoint);
  const { scene } = useGLTF(courseModel);
  const groupRef = useRef<THREE.Group>(null!);
  const floorMaterialRef = useRef<any>(null!);
  // Use a cloned scene so this instance of the course has its own unique arrows

  const { visualMeshes, physicsMeshes, arrowMeshes, localScene } =
    useMemo(() => {
      const visual = [];
      const physics = [];
      const arrows = [];
      const clonedScene = scene.clone();

      const list = [];
      //let floorMeshInner = null;
      clonedScene.traverse((child) => {
        if (child.isMesh && child.name.startsWith("WP_Arrow")) {
          child.userData.collected = false;
          arrows.push(child);
        }
        //Setup Course Floor
        if (
          child.isMesh &&
          (child.name == "CourseFloor" ||
            child.name == "CourseFloor2" ||
            child.name == "CourseFloor3")
        ) {
          //const mat = new CourseFloorMaterial();
          // child.material = mat;
          //floorMaterialRef.current = mat;
          //floorMeshInner = child;
          visual.push(child);
        } else if (child.name.includes("CourseFloor_Phys")) {
          child.visible = false;

          physics.push(child);
        }
      });
      return {
        visualMeshes: visual,
        physicsMeshes: physics,
        arrowMeshes: arrows,
        localScene: clonedScene,
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scene]);

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

    arrowMeshes.forEach((arrow) => {
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
    <group
      ref={groupRef}
      scale={[scale, scale, scale]}
      position={position}
      rotation={rotation}
    >
      {/* PHYSICS ONLY: Hidden low-poly meshes*/}
      {physicsMeshes.map((mesh, i) => (
        <RigidBody
          key={`phys-${i}`}
          type="fixed"
          colliders="trimesh"
          friction={0}
          includeInvisible={true}
        >
          <mesh
            geometry={mesh.geometry}
            visible={false}
            // The parent group handles the 48.1 scale
          />
        </RigidBody>
      ))}
      {/* VISUALS ONLY: High-poly pretty meshes (no physics!) */}
      {/* {visualMeshes.map((mesh, i) => (
        <primitive key={`vis-${i}`} object={mesh} />
      ))} */}

      {visualMeshes.map((mesh, i) => (
        <mesh key={`vis-${i}`} geometry={mesh.geometry}>
          <courseFloorMaterial
            ref={floorMaterialRef}
            uTime={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* ARROWS: Visual only */}
      {arrowMeshes.map((arrow, i) => (
        <mesh
          key={`arr-${i}`}
          geometry={arrow.geometry}
          position={arrow.position}
          rotation={arrow.rotation}
          scale={arrow.scale}
        >
          <meshStandardMaterial
            color="#00ff62"
            emissive="#00ff62"
            emissiveIntensity={1}
          />
        </mesh>
      ))}
    </group>
  );
};
