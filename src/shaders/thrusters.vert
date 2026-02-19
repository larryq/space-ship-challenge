varying vec2 vUv;
uniform float uThrottle;
uniform float uTime;
uniform vec3 uColor;


void main() {
    vUv = uv;
    vec3 pos = position;

    // Assuming UV.y = 0 at engine and 1 at tail
    // Stretch the "tail" vertices based on throttle
    if (vUv.y > 0.5) {
        pos.y *= (1.0 + uThrottle * 2.5);
    }

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}