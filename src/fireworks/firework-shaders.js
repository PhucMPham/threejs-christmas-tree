/**
 * GLSL shaders for firework particle system
 * Supports 5 firework types with additive blending + distance softness
 */

// Standard firework vertex shader - handles position, size, and life
export const fireworkVertexShader = /* glsl */`
  attribute float size;
  attribute float age;
  attribute float maxAge;
  attribute float type;
  attribute vec3 color;

  uniform float uPixelRatio;
  uniform float uTime;

  varying float vLife;
  varying vec3 vColor;
  varying float vType;

  void main() {
    vLife = 1.0 - (age / maxAge);
    vColor = color;
    vType = type;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // Size scales with life and distance
    float baseSize = size * vLife;
    gl_PointSize = baseSize * uPixelRatio * (100.0 / -mvPosition.z);
    gl_PointSize = max(gl_PointSize, 1.0); // Minimum size

    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Standard firework fragment shader - circular gradient with glow
export const fireworkFragmentShader = /* glsl */`
  varying float vLife;
  varying vec3 vColor;
  varying float vType;

  void main() {
    float dist = length(gl_PointCoord - 0.5);
    if (dist > 0.5) discard;

    // Soft circular gradient
    float alpha = smoothstep(0.5, 0.0, dist) * vLife;

    // Add glow based on life
    vec3 glow = vColor + vec3(0.3) * vLife;

    gl_FragColor = vec4(glow, alpha);
  }
`;

// Sparkler-specific vertex shader - smaller particles, continuous emission
export const sparklerVertexShader = /* glsl */`
  attribute float size;
  attribute float age;
  attribute float maxAge;
  attribute vec3 color;

  uniform float uPixelRatio;
  uniform float uTime;

  varying float vLife;
  varying vec3 vColor;
  varying float vNoise;

  // Simple noise for sparkle jitter
  float hash(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  void main() {
    vLife = 1.0 - (age / maxAge);
    vColor = color;

    // Add noise jitter for sparkle effect
    float noiseVal = hash(age * 100.0 + uTime);
    vNoise = noiseVal;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // Sparkler particles are smaller with random flicker
    float flickerSize = size * (0.5 + noiseVal * 0.5) * vLife;
    gl_PointSize = flickerSize * uPixelRatio * (80.0 / -mvPosition.z);
    gl_PointSize = max(gl_PointSize, 1.0);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Sparkler-specific fragment shader - simplified radial with noise jitter
export const sparklerFragmentShader = /* glsl */`
  varying float vLife;
  varying vec3 vColor;
  varying float vNoise;

  void main() {
    float dist = length(gl_PointCoord - 0.5);
    if (dist > 0.5) discard;

    // Radial gradient with soft edge
    float radialGradient = 1.0 - smoothstep(0.0, 0.5, dist);

    // Add sparkle intensity variation
    float sparkle = radialGradient * (0.7 + vNoise * 0.3);

    // Hot center (white) to color edge
    vec3 hotCore = mix(vec3(1.0), vColor, dist * 2.0);

    float alpha = sparkle * vLife;

    gl_FragColor = vec4(hotCore, alpha);
  }
`;
