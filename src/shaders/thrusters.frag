


varying vec2 vUv;
uniform float uTime;
uniform float uThrottle;
uniform vec3 uColor;

void main() {
    float pulse = sin((vUv.y - uTime * 4.0) * 10.0 + uTime * 20.0) * 0.1 + 0.9;
    
    float horizontalCenter = 1.0 - abs(vUv.x - 0.5) * 2.0;
    float verticalFade = pow(1.0 - vUv.y, 0.5);
    float shape = horizontalCenter * verticalFade;
    float core = (1.0 - vUv.y) * 0.5;

    // 1. Tighten the alpha. 
    // We cap it so it's never fully opaque, which helps additive stacking.
    float alpha = clamp((shape + core) * pulse * (uThrottle + 0.1), 0.0, 0.5);
    
    // 2. Linearize the glow. 
    // We use a very small multiplier here. 
    float glowStrength = 0.5 + (uThrottle * 0.02); 
    
    // 3. MIX the color instead of multiplying it.
    // This prevents the "math" from running away into huge numbers.
    vec3 finalColor = mix(uColor * 0.5, uColor * 2.0, uThrottle * alpha);
    
    // 4. Subtle Core
    // We'll make the core blue-ish white instead of pure white to save the Bloom.
    float coreThreshold = smoothstep(0.7, 1.0, uThrottle);
    vec3 coreColor = vec3(0.8, 0.9, 1.0) * pow(alpha, 4.0) * coreThreshold;

    gl_FragColor = vec4(finalColor + coreColor, alpha);
}



// varying vec2 vUv;
// uniform float uTime;
// uniform float uThrottle;
// uniform vec3 uColor;



// void main() {
//     // 1. Noise & Pulse
//     float pulse = sin((vUv.y - uTime * 4.0) * 10.0 + uTime * 20.0) * 0.1 + 0.9;
    
//     // 2. Shape (Using your existing logic)
//     float horizontalCenter = 1.0 - abs(vUv.x - 0.5) * 2.0;
//     float verticalFade = pow(1.0 - vUv.y, 0.5);
//     float shape = horizontalCenter * verticalFade;
//     float core = (1.0 - vUv.y) * 0.5;

//     // 3. Alpha Intensity (This stays 0.0 to 1.0)
//     // We use uThrottle to drive how much of the flame exists
//     float alpha = (shape + core) * pulse * (uThrottle + 0.1);
    
//     // 4. Color Intensity (The "Glow" factor)
//     // We cap the glow so it doesn't explode. 
//     // Changed from 7.0 to 3.0. This significantly reduces the "max" brightness.
//     float glowStrength = 1.0 + (uThrottle * 1.1);
    
//     vec3 glowColor = uColor * alpha * glowStrength; 
    
//     // 5. White Hot Core
//     // Only show the white core when uThrottle is high (> 0.5)
//     float coreThreshold = smoothstep(0.5, 1.0, uThrottle);
//     vec3 coreColor = vec3(1.0) * pow(alpha, 3.0) * coreThreshold * 2.0;

//     gl_FragColor = vec4(glowColor + coreColor, alpha);
// }

/*
void main() {
    // 1. Create a scrolling noise pattern
    float noise = fract(sin(dot(vUv * 1.0, vec2(12.9898, 78.233))) * 43758.5453);
    
    // 2. Vertical "wind" movement
    float vShift = vUv.y - (uTime * 4.0);
    float pulse = sin(vShift * 10.0 + uTime * 20.0) * 0.2 + 0.8;
    
    // 3. Shape the flame (taper at the end and edges)
    float horizontalCenter = 1.0 - abs(vUv.x - 0.5) * 2.0;
   // float horizontalCenter = 1.0 - abs((vUv.x - 0.5) * 1.2); // Shrink the coordinates to expand the look
   // horizontalCenter = clamp(horizontalCenter, 0.0, 1.0);
    float core = (1.0 - vUv.y) * 0.5;
    //float verticalFade = 1.0 - vUv.y;
    float verticalFade = pow(1.0 - vUv.y, 0.5); // A power less than 1.0 makes it "sturdier"
    float shape = pow(horizontalCenter, 1.0) * verticalFade;



float intensity = (shape + core) * pulse * (uThrottle *1.5 + 0.05);
    
    // 5. HDR Color: Multiply by 10.0 or 20.0 to force Bloom to trigger
    vec3 glowColor = uColor * intensity * 15.0; 
    
    // Core: Make the center extremely bright
    vec3 coreColor = vec3(1.0, 1.0, 1.0) * pow(intensity, 2.0) * 5.0;


    
    gl_FragColor = vec4(glowColor + coreColor, intensity);
}
*/