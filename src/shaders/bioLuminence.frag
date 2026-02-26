precision highp float;

uniform float uTime;
uniform int   uMode;

varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;

float hash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float noise(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p);
  //f = f*f*(3.0-2.0*f);
  f = f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(
    mix(mix(hash3(i),             hash3(i+vec3(1,0,0)),f.x),
        mix(hash3(i+vec3(0,1,0)), hash3(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(hash3(i+vec3(0,0,1)), hash3(i+vec3(1,0,1)),f.x),
        mix(hash3(i+vec3(0,1,1)), hash3(i+vec3(1,1,1)),f.x),f.y),f.z);
}

float fbm(vec3 p, int oct) {
  float v=0., a=0.5, t=0.;
  for(int i=0;i<8;i++){
    if(i>=oct) break;
    v+=a*noise(p); t+=a; p=p*2.1+vec3(1.7,9.2,6.3); a*=0.5;
  }
  return v/t;
}

float warpedFbm(vec3 p, int oct) {
  vec3 q = vec3(fbm(p, oct), fbm(p+vec3(5.2,1.3,8.1), oct), fbm(p+vec3(1.7,9.2,3.5), oct));
  return fbm(p + 1.2*q, oct);
}

// Pulsing glow — each "organism" pulses at a slightly different phase
float pulse(vec3 p, float speed, float phase) {
  return 0.5 + 0.5 * sin(uTime * speed + phase);
}

vec3 bioColor(vec3 p) {
  // Base terrain — dark purplish rock / deep ocean
  //float terrain = warpedFbm(p * 2.0, 7);
  float terrain = warpedFbm(p * 2.7, 7);

  vec3 voidCol    = vec3(0.02, 0.01, 0.06);
  vec3 rockCol    = vec3(0.06, 0.04, 0.10);
  vec3 shallowCol = vec3(0.04, 0.08, 0.15);

  vec3 base;
  if      (terrain < 0.4) base = mix(voidCol,    shallowCol, terrain/0.4);
  else if (terrain < 0.6) base = mix(shallowCol, rockCol,    (terrain-0.4)/0.2);
  else                    base = rockCol;

  // Three overlapping bioluminescent layers at different scales + speeds
  // Each uses warped noise so the glowing patches look organic / dendritic

  // Layer 1 — large teal-cyan patches, slow pulse
//   float bio1 = pow(warpedFbm(p * 3.0 + vec3(uTime * 0.012), 6), 2.5);
//   vec3  col1 = vec3(0.0, 0.9, 0.75) * bio1 * pulse(p, 0.8, hash3(floor(p*3.0))*6.28) * 1.8;

//   // Layer 2 — medium magenta veins, medium pulse
//   float bio2 = pow(fbm(p * 6.0 + vec3(0, uTime * 0.018, 0), 5), 3.0);
//   vec3  col2 = vec3(0.9, 0.1, 0.8) * bio2 * pulse(p, 1.3, hash3(floor(p*6.0))*6.28) * 2.2;

//   // Layer 3 — fine electric blue speckles, fast flicker
//   //float bio3 = pow(noise(p * 14.0 + vec3(uTime * 0.05)), 6.0);
//   float warp = fbm(p * 3.0, 3) * 0.5;
//   float bio3 = pow(noise(p * 14.0 + warp + vec3(uTime * 0.05)), 6.0);
//   vec3  col3 = vec3(0.2, 0.5, 1.0) * bio3 * pulse(p, 2.5, hash3(floor(p*14.0))*6.28) * 3.0;

// Layer 1 — use smooth noise for phase instead of floored cells
float phase1 = noise(p * 3.0) * 6.28;
float bio1 = pow(warpedFbm(p * 3.0 + vec3(uTime * 0.012), 6), 2.5);
vec3  col1 = vec3(0.0, 0.9, 0.75) * bio1 * (0.5 + 0.5 * sin(uTime * 0.8 + phase1)) * 1.8;

// Layer 2
float phase2 = noise(p * 6.0 + vec3(5.2, 1.3, 8.1)) * 6.28;
float bio2 = pow(fbm(p * 6.0 + vec3(0, uTime * 0.018, 0), 5), 3.0);
vec3  col2 = vec3(0.9, 0.1, 0.8) * bio2 * (0.5 + 0.5 * sin(uTime * 1.3 + phase2)) * 2.2;

// Layer 3
float phase3 = noise(p * 14.0 + vec3(1.7, 9.2, 3.5)) * 6.28;
float bio3 = pow(noise(p * 14.0 + vec3(uTime * 0.05)), 6.0);
vec3  col3 = vec3(0.2, 0.5, 1.0) * bio3 * (0.5 + 0.5 * sin(uTime * 2.5 + phase3)) * 3.0;

  // Only glow where terrain is "land" — submerged areas glow dimly
  float landMask = smoothstep(0.38, 0.55, terrain);
  float seaMask  = 1.0 - landMask;

  vec3 glow = col1 * landMask
            + col2 * landMask
            + col3 * (landMask * 0.8 + seaMask * 0.2);

  // Sea bioluminescence — slow rolling waves of faint green
  float seaGlow = fbm(p * 4.0 + vec3(uTime * 0.02), 4) * seaMask;
  glow += vec3(0.0, 0.6, 0.3) * seaGlow * 0.4 * pulse(p, 0.4, 1.2);

  return base + glow;
}

void main() {
  vec3 n = normalize(vWorldNorm);
  vec3 v = normalize(vViewDir);
  vec3 p = vLocalPos;

  vec3 col = bioColor(p);

  // Dim distant sun — this world is far from its star
  vec3 sunDir = normalize(vec3(-0.6, 0.4, 0.8));
  float diff  = max(dot(n, sunDir), 0.0) * 0.4; // much weaker sunlight
  float amb   = 0.04;

  // No specular — the bioluminescence is the star of the show

  // Deep violet atmosphere rim
  float rim   = pow(1.0 - max(dot(n, v), 0.0), 3.5);
  vec3 atmCol = vec3(0.25, 0.05, 0.45);

  col = col * (amb + diff);
  col += bioColor(p) * 0.6; // add raw glow on top of lighting, unaffected by sun
  col  = mix(col, col + atmCol, rim * 0.7);

  // Terminator — but keep night side visible due to self-illumination
  float term = smoothstep(-0.15, 0.2, dot(n, sunDir));
  col *= mix(0.35, 1.0, term); // night side stays at 35% — the glow lights it

  gl_FragColor = vec4(col, 1.0);
}