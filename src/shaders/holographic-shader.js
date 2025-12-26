/**
 * Holographic Shader - Creates iridescent rainbow effect
 * Used for ornaments and decorative elements
 */

export const holographicVertexShader = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vUv = uv;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const holographicFragmentShader = /* glsl */`
  uniform float uTime;
  uniform float uIntensity;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec2 vUv;

  // HSL to RGB conversion
  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }

  void main() {
    vec3 viewDir = normalize(vViewPosition);

    // Fresnel effect for edge highlighting
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);

    // Holographic color based on view angle and normal
    float hue = dot(vNormal, viewDir) * 0.5 + 0.5;
    hue = fract(hue + uTime * 0.1);

    // Create rainbow iridescence
    vec3 holoColor = hsl2rgb(vec3(hue, 0.8, 0.6));

    // Add chromatic shift based on position
    vec3 chromatic = vec3(
      sin(vNormal.x * 6.28 + uTime) * 0.5 + 0.5,
      sin(vNormal.y * 6.28 + uTime * 1.3) * 0.5 + 0.5,
      sin(vNormal.z * 6.28 + uTime * 0.7) * 0.5 + 0.5
    );

    // Combine effects
    vec3 finalColor = mix(holoColor, chromatic, 0.3);
    finalColor += fresnel * vec3(1.0, 0.9, 1.0) * 0.5;
    finalColor *= uIntensity;

    // Add sparkle
    float sparkle = pow(fresnel, 8.0) * 2.0;
    finalColor += sparkle;

    gl_FragColor = vec4(finalColor, 0.9);
  }
`;
