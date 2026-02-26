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

float warpedFbm(vec3 p, int octaves) {
  vec3 q = vec3(
    fbm(p,                         octaves),
    fbm(p + vec3(5.2, 1.3, 8.1),  octaves),
    fbm(p + vec3(1.7, 9.2, 3.5),  octaves)
  );
  return fbm(p + 1.2 * q, octaves);
}

vec3 earthColor(vec3 p) {
  float land   = warpedFbm(p * 2.0, 7);
  float seaLvl = 0.52;
  float lat    = abs(p.y);
  float ice    = smoothstep(0.75, 0.95, lat + 0.15 * fbm(p * 4.0, 3));

  vec3 col;
  if      (land < seaLvl - 0.05) col = mix(vec3(0.05,0.12,0.40), vec3(0.08,0.25,0.55), land / seaLvl);
  else if (land < seaLvl)        col = mix(vec3(0.08,0.25,0.55), vec3(0.82,0.75,0.55), (land-(seaLvl-0.05))/0.05);
  else if (land < 0.60)          col = mix(vec3(0.82,0.75,0.55), vec3(0.18,0.48,0.12), (land-seaLvl)/0.08);
  else if (land < 0.72)          col = mix(vec3(0.18,0.48,0.12), vec3(0.35,0.28,0.18), (land-0.60)/0.12);
  else if (land < 0.82)          col = mix(vec3(0.35,0.28,0.18), vec3(0.55,0.52,0.50), (land-0.72)/0.10);
  else                           col = mix(vec3(0.55,0.52,0.50), vec3(0.92,0.94,0.96), (land-0.82)/0.18);

  col = mix(col, vec3(0.88,0.92,1.00), ice);

  float clouds = smoothstep(0.45, 0.65, fbm(p * 3.5 + vec3(uTime * 0.02), 5));
  col = mix(col, vec3(0.95,0.97,1.0), clouds * 0.75);
  return col;
}

// ── Lighting + main ───────────────────────────────────────────────────────
void main() {
  vec3 n = normalize(vWorldNorm);
  vec3 v = normalize(vViewDir);
  vec3 p = vLocalPos; // noise coords — local, unaffected by rotation

  vec3 col;
 col = earthColor(p);


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
  col *= mix(0.05, 1.0, terminator);

  gl_FragColor = vec4(col, 1.0);
}