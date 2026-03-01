precision highp float;

uniform float uTime;
uniform int   uMode;
uniform float uShadowStrength;

varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;

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

vec3 lavaColor(vec3 p) {
  float h    = warpedFbm(p * 2.0 + vec3(uTime * 0.07), 7);
  float glow = fbm(p * 5.0 + vec3(uTime * 0.07), 4);

  vec3 col;
  if      (h < 0.30) col = mix(vec3(0.06,0.04,0.04), vec3(0.20,0.05,0.02), h/0.30);
  else if (h < 0.55) col = mix(vec3(0.20,0.05,0.02), vec3(0.95,0.30,0.02), (h-0.30)/0.25);
  else if (h < 0.75) col = mix(vec3(0.95,0.30,0.02), vec3(1.00,0.82,0.20), (h-0.55)/0.20);
  else               col = mix(vec3(1.00,0.82,0.20), vec3(1.0),             (h-0.75)/0.25);

  col += vec3(1.00,0.82,0.20) * glow * 0.2;
  return col;
}


void main() {
  vec3 n = normalize(vWorldNorm);
  vec3 v = normalize(vViewDir);
  vec3 p = vLocalPos; // noise coords — local, unaffected by rotation


  vec3 col;
 col = lavaColor(p);

  // Sun direction (world space, fixed)
  vec3 sunDir = normalize(vec3(-0.6, 0.4, 0.8));

  float diff = max(dot(n, sunDir), 0.0);
  float amb  = 0.08;
  float spec = pow(max(dot(reflect(-sunDir, n), v), 0.0), 32.0) * 0.25;

  // Atmosphere rim glow
  float rim = pow(1.0 - max(dot(n, v), 0.0), 4.0);
  vec3 atmCol = uMode == 0 ? vec3(0.3, 0.5, 1.0)  :
                uMode == 1 ? vec3(0.8, 0.4, 0.2)  :
                uMode == 2 ? vec3(0.6, 0.8, 1.0)  :
                             vec3(1.0, 0.3, 0.05);

  col = col * (amb + diff) + spec;
  col = mix(col, atmCol, rim * 0.6);

  // Soft terminator shadow
  float terminator = smoothstep(-0.1, 0.15, dot(n, sunDir));
  float darkSide = 1.0 - uShadowStrength;
  col *= mix(darkSide, 1.0, terminator);

  gl_FragColor = vec4(col, 1.0);
}