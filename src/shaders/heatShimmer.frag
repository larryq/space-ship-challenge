// Fragment shader
precision highp float;

uniform float uTime;
uniform float uVelocity;  // 0.0 = no shimmer, 1.0 = full shimmer

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1,0)), f.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.1 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  vec2 centered = uv - 0.5;
  
  // Tighter circular fade — brighter in center
  float edgeFade = 1.0 - smoothstep(0.0, 0.5, length(centered));
  edgeFade = pow(edgeFade, 2.0); // sharper falloff toward edges

  float drift = uTime * 2.0;
  vec2 noiseUv = uv * 4.0 + vec2(0.0, drift);

  float n1 = fbm(noiseUv);
  float n2 = fbm(noiseUv * 1.7 + vec2(5.2, 1.3));
  float shimmer = n1 * 0.6 + n2 * 0.4;

  float intensity = clamp(uVelocity, 0.0, 1.0);

  // Visible heat cone colors — hot white/blue core, orange edges
  vec3 coreColor  = vec3(0.9, 0.95, 1.0);  // cool blue-white
  vec3 outerColor = vec3(1.0, 0.4, 0.05);  // orange heat
  vec3 col = mix(outerColor, coreColor, edgeFade * shimmer);

  // More visible alpha — still additive so it glows rather than occludes
  float alpha = intensity * edgeFade * (0.4 + shimmer * 0.4);

  gl_FragColor = vec4(col * alpha, alpha);
}