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
  // Quintic interpolation for smoother results
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
  vec3 q = vec3(
    fbm(p,                        oct),
    fbm(p + vec3(5.2, 1.3, 8.1), oct),
    fbm(p + vec3(1.7, 9.2, 3.5), oct)
  );
  return fbm(p + 1.2*q, oct);
}

vec3 oceanColor(vec3 p) {
  // Deep ocean floor topology — slow moving tectonic-like forms
  float depth = warpedFbm(p * 1.5 + vec3(uTime * 0.002), 7);

  // Surface chop — two wave layers moving in different directions
  // simulates the cross-chop you get on open ocean
  float chop1 = fbm(p * 8.0 + vec3(uTime * 0.04, 0.0, 0.0), 4);
  float chop2 = fbm(p * 8.0 + vec3(0.0, uTime * 0.03, uTime * 0.02), 4);
  float surface = (chop1 + chop2) * 0.5;

  // Deep current glow — slow moving luminescent plankton blooms
  float current = warpedFbm(p * 3.0 + vec3(uTime * 0.008), 5);
  float bloom   = pow(max(current - 0.45, 0.0) * 3.0, 2.0);

  // Depth-based colour — abyssal black through to shallow turquoise
  vec3 abyss    = vec3(0.01, 0.02, 0.08);
  vec3 deep     = vec3(0.02, 0.06, 0.22);
  vec3 mid      = vec3(0.03, 0.18, 0.42);
  vec3 shallow  = vec3(0.05, 0.38, 0.55);
  vec3 surface_col = vec3(0.08, 0.52, 0.62);

  vec3 col;
  if      (depth < 0.2) col = mix(abyss,   deep,        depth/0.2);
  else if (depth < 0.4) col = mix(deep,    mid,         (depth-0.2)/0.2);
  else if (depth < 0.6) col = mix(mid,     shallow,     (depth-0.4)/0.2);
  else if (depth < 0.8) col = mix(shallow, surface_col, (depth-0.6)/0.2);
  else                  col = surface_col;

  // Surface chop brightens shallow areas — light scattering on wave faces
  col += vec3(0.02, 0.08, 0.10) * surface * smoothstep(0.4, 0.8, depth);

  // Deep current bioluminescence — cyan-green blooms visible through water
  col += vec3(0.0, 0.7, 0.5) * bloom * smoothstep(0.5, 0.2, depth);

  // Polar ice caps — thin icy crust at the poles
  float lat = abs(p.y);
  float ice = smoothstep(0.78, 0.95, lat + 0.1 * fbm(p * 5.0, 3));
  col = mix(col, vec3(0.75, 0.88, 0.95), ice);

  // Specular-friendly surface shimmer — brighter patches catch light better
  col += vec3(0.0, 0.04, 0.06) * surface * 0.5;

  return col;
}

void main() {
  vec3 n = normalize(vWorldNorm);
  vec3 v = normalize(vViewDir);
  vec3 p = vLocalPos;

  vec3 col = oceanColor(p);

  vec3 sunDir = normalize(vec3(-0.6, 0.4, 0.8));
  float diff  = max(dot(n, sunDir), 0.0);
  float amb   = 0.08;

  // Strong specular — open ocean is very reflective
  float spec  = pow(max(dot(reflect(-sunDir, n), v), 0.0), 64.0) * 0.6;

  // Pale blue atmosphere — thick water vapour atmosphere
  float rim   = pow(1.0 - max(dot(n, v), 0.0), 3.5);
  vec3 atmCol = vec3(0.4, 0.7, 0.9);

  col = col * (amb + diff) + spec;
  col = mix(col, atmCol, rim * 0.55);

    float term = smoothstep(-0.1, 0.2, dot(n, sunDir));
   float darkSide = 1.0 - uShadowStrength;
  col *= mix(darkSide, 1.0, term);


  gl_FragColor = vec4(col, 1.0);
}