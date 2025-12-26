/**
 * Aurora Shader - Creates flowing Northern Lights effect
 * Used for tree base and ambient glow
 */

export const auroraVertexShader = /* glsl */`
  uniform float uTime;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;

    // Subtle vertex displacement for organic movement
    vec3 pos = position;
    float wave = sin(pos.y * 2.0 + uTime * 0.5) * 0.05;
    pos.x += wave;
    pos.z += wave * 0.5;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const auroraFragmentShader = /* glsl */`
  uniform float uTime;
  uniform vec3 uColorA; // Aurora green
  uniform vec3 uColorB; // Aurora magenta

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;

  // Simple noise function
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // Smooth noise
  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Fractal brownian motion
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * smoothNoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    // Create flowing aurora pattern
    vec2 uv = vUv;
    float t = uTime * 0.3;

    // Multiple layers of noise for aurora bands
    float n1 = fbm(vec2(uv.x * 3.0 + t, uv.y * 2.0));
    float n2 = fbm(vec2(uv.x * 2.0 - t * 0.5, uv.y * 3.0 + t * 0.3));
    float n3 = fbm(vec2(uv.x * 4.0 + t * 0.7, uv.y * 1.5 - t * 0.2));

    // Combine noise layers
    float aurora = (n1 + n2 * 0.5 + n3 * 0.25) / 1.75;

    // Color mixing with height influence
    float heightFactor = smoothstep(0.0, 1.0, vUv.y);
    vec3 color = mix(uColorA, uColorB, aurora + sin(t + vPosition.y) * 0.3);

    // Add shimmer
    float shimmer = sin(vPosition.x * 10.0 + t * 2.0) * 0.1 + 0.9;
    color *= shimmer;

    // Fresnel edge glow
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    color += fresnel * 0.3;

    // Alpha based on aurora intensity
    float alpha = 0.7 + aurora * 0.3;

    gl_FragColor = vec4(color, alpha);
  }
`;
