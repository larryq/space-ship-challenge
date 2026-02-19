import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export const SpaceShell = () => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  useFrame((state) => {
    // Keep the sphere centered on the camera
    meshRef.current.position.copy(state.camera.position);

    // Pass time to the shader for the pulsing effect
    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
    void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);      
    }    
    `;
  const fragmentShader = `

        uniform float uTime;
        varying vec3 vPosition;

        // --- INDUSTRY STANDARD 3D SIMPLEX NOISE ---
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

        // First corner
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 =   v - i + dot(i, C.xxx) ;

        // Other corners
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );

        // x1 = x0 - i1  + 1.0*C.xxx;
        // x2 = x0 - i2  + 2.0*C.xxx;
        // x3 = x0 - 1.0 + 3.0*C.xxx;
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.xxx = C.yyy
        vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.xxx = -0.5 = -D.yyy

        // Permutations
        i = mod289(vec4(i, 0.0)).xyz; 
        vec4 p = permute( permute( permute( 
                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

        // Gradients: 7x7 points over a square, mapped onto an octahedron.
        // The ring size 17*17 = 289 is chosen to prevent aliasing.
        float n_ = 0.142857142857; // 1.0/7.0
        vec3  ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,7)

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);

        // Normalise gradients
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        // Mix final noise value
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
        }

        // --- END OF LIBRARY ---

        void main() {
        vec3 dir = normalize(vPosition);

        // 1. NEBULA
        // Multiply dir by a scale for density. 
        // Add time to make it drift.
        float n = snoise(dir * 1.5 + uTime * 0.015);
        n += 0.5 * snoise(dir * 3.0 - uTime * 0.01);
        
        float mask = smoothstep(-0.2, 0.6, n);
        vec3 spaceColor = vec3(0.005, 0.005, 0.02);
        vec3 nebulaColor = vec3(0.12, 0.04, 0.22);
        vec3 color = mix(spaceColor, nebulaColor, mask);

        // 2. STARS

        float starSeed = fract(sin(dot(floor(dir * 600.0), vec3(12.989, 78.233, 45.164))) * 43758.54);
        if (starSeed > 0.9992) {
            // Use the starSeed to pick a color
            // Since starSeed is > 0.9992, let's normalize it to 0.0 - 1.0 
            // so we can use it to pick colors easily.
            float colorPicker = (starSeed - 0.9992) / (1.0 - 0.9992);
            
            vec3 starColor;
            // starColor = vec3(0.6, 0.8, 1.0); // Cool Blue (O-type)
            
            if (colorPicker < 0.2) {
                starColor = vec3(0.2, 0.2, 1.0); // Cool Blue (O-type)
            } else if (colorPicker < 0.4) {
                starColor = vec3(1.0, 0.9, 0.7); // Warm Yellow (G-type)
            } else if (colorPicker < 0.6) {
                starColor = vec3(1.0, 0.6, 0.5); // Red Giant (M-type)
            } else {
                starColor = vec3(1.0, 1.0, 1.0); // Pure White (A-type)
            }

            float starAlpha = smoothstep(0.0, 1.0, (starSeed - 0.9992) / (1.0 - 0.9992)); 
            color += starColor * starAlpha;
        }
        
        gl_FragColor = vec4(color, 1.0);
        }
  
  `;

  return (
    <mesh ref={meshRef} frustumCulled={false}>
      {/* Make the sphere huge so it's behind everything else */}
      {/* <sphereGeometry args={[5000, 32, 32]} /> */}
      <sphereGeometry args={[5000, 128, 128]} />
      {/* <meshBasicMaterial
        side={THREE.BackSide}
        transparent
        opacity={0.2}
        color="#0066ff"
        wireframe // The easiest way to get a "Radar" look immediately
      /> */}
      <shaderMaterial
        ref={materialRef}
        side={THREE.DoubleSide} // Very important: we are INSIDE the sphere
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
        }}
      />
    </mesh>
  );
};
