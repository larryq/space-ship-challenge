/* eslint-disable react-hooks/purity */
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// const vertexShader = `
//   uniform float uTime;
//   uniform vec3 uShipPos;
//   uniform float uRange;
//   attribute float aSize;
//   varying float vSpeed;
//   uniform vec3 uVelocity;

//   void main() {
//     // 1. Get the original "home" position of this particle
//     vec3 pos = position;

//     // 2. The Modulo Magic (GPU style)
//     // We use 'fract' or 'mod' to keep the particle within the box around the ship
//     // This math ensures the particles move OPPOSITE to the ship's direction
//     pos.x = mod(pos.x - uShipPos.x + uRange/2.0, uRange) - uRange/2.0;
//     pos.y = mod(pos.y - uShipPos.y + uRange/2.0, uRange) - uRange/2.0;
//     pos.z = mod(pos.z - uShipPos.z + uRange/2.0, uRange) - uRange/2.0;

//     vec3 worldPosition = pos + uShipPos;
//     vec4 mvPosition = viewMatrix * vec4(worldPosition, 1.0);
//     float speed = length(uVelocity);
//     vSpeed = speed;

//     // 4. Size attenuation (further = smaller)
//     gl_PointSize = aSize * (10.0 / -mvPosition.z) ;//* (1.0 + speed * 5.0);
//     gl_Position = projectionMatrix * mvPosition;
//   }

// `;

const vertexShader = `
  uniform float uTime;
  uniform vec3 uShipPos;
  uniform float uRange;
  attribute float aSize;
  varying float vSpeed;
  uniform vec3 uVelocity;

  // Simple hash function to create a unique 3D direction
  vec3 hash33(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yxz + 19.19);
    return fract((p.xxy + p.yxx) * p.zyx) - 0.5;
  }

  void main() {
//     // 1. Get the original starting position
    vec3 pos = position;

//     //  Calculate drift direction
//     vec3 driftDir = hash33(position); 
    
//     // 2. Calculate distance from ship BEFORE applying drift
//     // We want to see how far the "home" position is
//     float distToShip = length(pos - uShipPos);
    
//     float driftFactor = 1.0 - smoothstep(30.0, 50.0, distToShip);
    
//     float driftSpeed = 7.5; 
//     pos += driftDir * uTime * driftSpeed * driftFactor;


    // We wrap the drifted position within the box around the ship
    pos.x = mod(pos.x - uShipPos.x + uRange/2.0, uRange) - uRange/2.0;
    pos.y = mod(pos.y - uShipPos.y + uRange/2.0, uRange) - uRange/2.0;
    pos.z = mod(pos.z - uShipPos.z + uRange/2.0, uRange) - uRange/2.0;

    vec3 worldPosition = pos + uShipPos;
    vec4 mvPosition = viewMatrix * vec4(worldPosition, 1.0);
    
    gl_PointSize = aSize * (10.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }






// void main() {
//     vec3 pos = position;
//     vec3 driftDir = hash33(position); 
    
//     // 1. Calculate the 'relativePos' first (the box around the ship)
//     vec3 relativePos;
//     relativePos.x = mod(pos.x - uShipPos.x + uRange/2.0, uRange) - uRange/2.0;
//     relativePos.y = mod(pos.y - uShipPos.y + uRange/2.0, uRange) - uRange/2.0;
//     relativePos.z = mod(pos.z - uShipPos.z + uRange/2.0, uRange) - uRange/2.0;

//     // 2. Calculate the distance in this local box
//     float distToShip = length(relativePos);
    

//     // Calculate the drift displacement for all particles.
//     // This way, the "drift position" is always moving smoothly in the background.
//     vec3 displacement = driftDir * uTime * 0.5;

//     // 4. Use the driftFactor to decide how much of that displacement to show.
//     // We smoothstep it so it gently slides into its drifted position as you approach.
//     float driftFactor = 1.0 - smoothstep(5.0, 15.0, distToShip);
    
//     // Mix between the stable relative position and the drifted one
//     relativePos += displacement * driftFactor;

//     // 5. Final positioning
//     vec4 mvPosition = viewMatrix * vec4(relativePos + uShipPos, 1.0);
    
//     gl_PointSize = aSize * (10.0 / -mvPosition.z);
//     gl_Position = projectionMatrix * mvPosition;
//   }



`;

const fragmentShader = `
varying float vSpeed;
  void main() {
    // Make the points round instead of square
    float distance = length(gl_PointCoord - vec2(0.5));
    if (distance > 0.5) discard;
    //Fade the edges for a "glow" look
    float alpha = 1.0 - distance;
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.8);
  }
`;

export const SpaceDust = ({ count = 2000 }) => {
  const meshRef = useRef<THREE.Points>(null!);
  const range = 100.0;
  const lastPos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());

  // Initial random positions and sizes
  const [positions, sizes] = useMemo(() => {
    const p = new Float32Array(count * 3);
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      p[i * 3] = Math.random() * range;
      p[i * 3 + 1] = Math.random() * range;
      p[i * 3 + 2] = Math.random() * range;
      s[i] = Math.random() * 2.0 + 0.5;
    }
    return [p, s];
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uShipPos: { value: new THREE.Vector3() },
      uRange: { value: range },
      uVelocity: { value: new THREE.Vector3() },
    }),
    [],
  );

  useFrame((state, delta) => {
    // eslint-disable-next-line react-hooks/immutability
    uniforms.uTime.value += delta;
    uniforms.uShipPos.value.copy(state.camera.position);
    // Calculate velocity: Current Position - Last Position
    velocity.current.subVectors(state.camera.position, lastPos.current);
    // if (state.camera.position.z - lastPos.current.z < -0.1) {
    //   velocity.current.set(0, 0, 0);
    //   console.log(
    //     `Velocity zeroed to prevent glitch: ${state.camera.position.z - lastPos.current.z}`,
    //   );
    // }

    lastPos.current.copy(state.camera.position);

    uniforms.uVelocity.value.copy(velocity.current); // Pass this to shader
  });

  return (
    <points ref={meshRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
};
