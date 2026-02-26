varying vec3 vLocalPos;   // raw local sphere pos — used for noise (stays fixed as planet rotates)
varying vec3 vWorldNorm;  // world-space normal — used for lighting
varying vec3 vViewDir;    // direction to camera in world space

void main() {
  // Local position: unit sphere surface point, perfect for noise sampling
  vLocalPos = normalize(position);

  // World-space normal for lighting (rotates with the planet)
  vWorldNorm = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

  // World-space position for view direction
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vViewDir = normalize(cameraPosition - worldPos.xyz);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}