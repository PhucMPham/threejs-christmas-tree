/**
 * Glow Shader - Creates pulsing emissive glow
 * Used for star topper and light points
 */

export const glowVertexShader = /* glsl */`
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const glowFragmentShader = /* glsl */`
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uPulseSpeed;
  uniform float uPulseIntensity;

  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    // Pulsing effect
    float pulse = sin(uTime * uPulseSpeed) * 0.5 + 0.5;
    pulse = pulse * uPulseIntensity + (1.0 - uPulseIntensity);

    // Core glow
    vec3 color = uColor * pulse;

    // Edge glow (fresnel-like)
    float edgeFactor = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    color += uColor * edgeFactor * 0.5;

    // Add core brightness
    float centerGlow = 1.0 - length(vUv - 0.5) * 2.0;
    centerGlow = max(0.0, centerGlow);
    color += uColor * centerGlow * 0.3;

    // Ensure bright emissive
    color = color * 1.5 + 0.2;

    gl_FragColor = vec4(color, 1.0);
  }
`;
