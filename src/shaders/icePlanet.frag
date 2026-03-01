precision highp float;

uniform float uTime;
uniform int   uMode;
uniform float uShadowStrength;

varying vec3 vLocalPos;
varying vec3 vWorldNorm;
varying vec3 vViewDir;

float hash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float noise(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p);
  f = f*f*(3.0-2.0*f);
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

// Warped latitude — creates the wobbly banded look
float bandedNoise(vec3 p) {
  // Warp the y coordinate with noise so bands aren't perfectly straight
  float warp = fbm(p * 2.0 + vec3(uTime * 0.01), 5) * 0.35;
  float lat  = p.y + warp;
  // Stack multiple sine waves at different frequencies for varied band widths
  float bands = sin(lat * 14.0) * 0.5
              + sin(lat * 7.0)  * 0.3
              + sin(lat * 3.0)  * 0.2;
  // Add fine turbulence within each band
  float turb = fbm(p * 4.0 + vec3(uTime * 0.008, 0, 0), 6) * 0.4;
  return bands * 0.5 + 0.5 + turb * 0.3;
}

float warpedFbm(vec3 p, int octaves) {
  vec3 q = vec3(
    fbm(p,                         octaves),
    fbm(p + vec3(5.2, 1.3, 8.1),  octaves),
    fbm(p + vec3(1.7, 9.2, 3.5),  octaves)
  );
  return fbm(p + 1.2 * q, octaves);
}

vec3 iceColor(vec3 p) {
  float h     = warpedFbm(p * 2.5, 7);
  float crack = 1.0 - abs(fbm(p * 10.0, 5) - 0.5) * 2.0;
  crack = pow(max(crack, 0.0), 8.0);

  vec3 col;
  if      (h < 0.4) col = mix(vec3(0.10,0.22,0.48), vec3(0.55,0.78,0.92), h/0.4);
  else if (h < 0.7) col = mix(vec3(0.55,0.78,0.92), vec3(0.92,0.95,1.00), (h-0.4)/0.3);
  else              col = vec3(0.92,0.95,1.00);

  col = mix(col, vec3(0.05,0.15,0.35), crack * 0.7);
  return col;
}

void main() {
  vec3 n = normalize(vWorldNorm);
  vec3 v = normalize(vViewDir);
  vec3 p = vLocalPos;

  vec3 col = iceColor(p);

  vec3 sunDir = normalize(vec3(-0.6, 0.4, 0.8));
  float diff  = max(dot(n, sunDir), 0.0);
  float amb   = 0.10;
  float spec  = pow(max(dot(reflect(-sunDir, n), v), 0.0), 16.0) * 0.15;

  // Wide warm atmosphere rim
  float rim   = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  vec3 atmCol = vec3(0.9, 0.6, 0.3);

  col = col * (amb + diff) + spec;
  col = mix(col, atmCol, rim * 0.5);

  float term = smoothstep(-0.1, 0.2, dot(n, sunDir));
   float darkSide = 1.0 - uShadowStrength;
  col *= mix(darkSide, 1.0, term);



  gl_FragColor = vec4(col, 1.0);
}