// ── Noise ─────────────────────────────────────────────────────────────────
float hash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash3(i),             hash3(i+vec3(1,0,0)), f.x),
        mix(hash3(i+vec3(0,1,0)), hash3(i+vec3(1,1,0)), f.x), f.y),
    mix(mix(hash3(i+vec3(0,0,1)), hash3(i+vec3(1,0,1)), f.x),
        mix(hash3(i+vec3(0,1,1)), hash3(i+vec3(1,1,1)), f.x), f.y), f.z);
}

float fbm(vec3 p, int octaves) {
  float value = 0.0, amplitude = 0.5, total = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    value     += amplitude * noise(p);
    total     += amplitude;
    p          = p * 2.1 + vec3(1.7, 9.2, 6.3);
    amplitude *= 0.5;
  }
  return value / total;
}

float warpedFbm(vec3 p, int octaves) {
  vec3 q = vec3(
    fbm(p,                         octaves),
    fbm(p + vec3(5.2, 1.3, 8.1),  octaves),
    fbm(p + vec3(1.7, 9.2, 3.5),  octaves)
  );
  return fbm(p + 1.2 * q, octaves);
}