import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/**
 * Setup post-processing effects for cinematic visuals
 */
export function createPostProcessing(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);

  // Main render pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Bloom effect for glowing elements
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.0,  // strength
    0.4,  // radius
    0.7   // threshold
  );
  composer.addPass(bloomPass);

  // Chromatic aberration
  const chromaticPass = new ShaderPass(ChromaticAberrationShader);
  chromaticPass.uniforms.uStrength.value = 0.002;
  composer.addPass(chromaticPass);

  // Vignette effect
  const vignettePass = new ShaderPass(VignetteShader);
  vignettePass.uniforms.uIntensity.value = 0.4;
  vignettePass.uniforms.uSmoothness.value = 0.4;
  composer.addPass(vignettePass);

  return {
    composer,
    bloomPass,
    chromaticPass,
    vignettePass,
    resize: (width, height) => {
      composer.setSize(width, height);
      bloomPass.resolution.set(width, height);
    }
  };
}

/**
 * Chromatic Aberration Shader
 */
const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    uStrength: { value: 0.002 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uStrength;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5);
      vec2 dir = vUv - center;
      float dist = length(dir);

      // Stronger effect at edges
      float strength = uStrength * dist * 2.0;

      vec2 offset = dir * strength;

      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;

      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `
};

/**
 * Vignette Shader
 */
const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uIntensity: { value: 0.4 },
    uSmoothness: { value: 0.4 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    uniform float uSmoothness;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      vec2 center = vec2(0.5);
      float dist = length(vUv - center) * 1.414;

      float vignette = smoothstep(1.0 - uSmoothness, 1.0, dist);
      vignette = 1.0 - vignette * uIntensity;

      gl_FragColor = vec4(color.rgb * vignette, color.a);
    }
  `
};
