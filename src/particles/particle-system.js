import * as THREE from 'three';

/**
 * Creates the complete particle system with snow, stardust, and sparkles
 */
export function createParticleSystem() {
  const particleGroup = new THREE.Group();

  // Snow particles
  const snow = createSnowParticles();
  particleGroup.add(snow);

  // Stardust orbiting tree
  const stardust = createStardustParticles();
  particleGroup.add(stardust);

  // Firefly ambient particles
  const fireflies = createFireflyParticles();
  particleGroup.add(fireflies);

  return particleGroup;
}

/**
 * Creates falling snow particles
 */
function createSnowParticles() {
  const particleCount = 2000;
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    // Random position in a cylinder above and around tree
    positions[i3] = (Math.random() - 0.5) * 15;
    positions[i3 + 1] = Math.random() * 12;
    positions[i3 + 2] = (Math.random() - 0.5) * 15;

    // Falling velocity with slight drift
    velocities[i3] = (Math.random() - 0.5) * 0.02;
    velocities[i3 + 1] = -0.02 - Math.random() * 0.03;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;

    // Random sizes
    sizes[i] = 2 + Math.random() * 4;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: snowVertexShader,
    fragmentShader: snowFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: window.devicePixelRatio },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const snow = new THREE.Points(geometry, material);
  snow.name = 'snowParticles';
  return snow;
}

/**
 * Creates stardust particles orbiting the tree
 */
function createStardustParticles() {
  const particleCount = 1500;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const phases = new Float32Array(particleCount);

  const goldColor = new THREE.Color(0xffd700);
  const whiteColor = new THREE.Color(0xffffff);
  const cyanColor = new THREE.Color(0x00ffff);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;

    // Spiral distribution around tree
    const angle = i * 0.1;
    const radius = 1.5 + (i / particleCount) * 2;
    const height = (i / particleCount) * 6;

    positions[i3] = Math.cos(angle) * radius;
    positions[i3 + 1] = height;
    positions[i3 + 2] = Math.sin(angle) * radius;

    // Random color between gold, white, cyan
    const colorChoice = Math.random();
    const chosenColor = colorChoice < 0.4 ? goldColor :
                       colorChoice < 0.7 ? whiteColor : cyanColor;
    colors[i3] = chosenColor.r;
    colors[i3 + 1] = chosenColor.g;
    colors[i3 + 2] = chosenColor.b;

    phases[i] = Math.random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: stardustVertexShader,
    fragmentShader: stardustFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: window.devicePixelRatio },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
  });

  const stardust = new THREE.Points(geometry, material);
  stardust.name = 'stardustParticles';
  return stardust;
}

/**
 * Creates firefly ambient particles
 */
function createFireflyParticles() {
  const particleCount = 200;
  const positions = new Float32Array(particleCount * 3);
  const phases = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    // Random position around tree
    positions[i3] = (Math.random() - 0.5) * 8;
    positions[i3 + 1] = Math.random() * 7;
    positions[i3 + 2] = (Math.random() - 0.5) * 8;

    // Movement phases
    phases[i3] = Math.random() * Math.PI * 2;
    phases[i3 + 1] = Math.random() * Math.PI * 2;
    phases[i3 + 2] = Math.random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 3));

  const material = new THREE.ShaderMaterial({
    vertexShader: fireflyVertexShader,
    fragmentShader: fireflyFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: window.devicePixelRatio },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const fireflies = new THREE.Points(geometry, material);
  fireflies.name = 'fireflyParticles';
  return fireflies;
}

/**
 * Creates a sparkle burst effect at a position
 */
export function createSparkleBurst(position) {
  const particleCount = 80;
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  const lifetimes = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3] = position.x;
    positions[i3 + 1] = position.y;
    positions[i3 + 2] = position.z;

    // Radial explosion velocity
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const speed = 0.05 + Math.random() * 0.1;

    velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
    velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
    velocities[i3 + 2] = Math.cos(phi) * speed;

    lifetimes[i] = 1.0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: sparkleVertexShader,
    fragmentShader: sparkleFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: window.devicePixelRatio },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const sparkles = new THREE.Points(geometry, material);
  sparkles.name = 'sparkleBurst';
  sparkles.userData.startTime = performance.now();
  sparkles.userData.duration = 1500; // 1.5 seconds

  return sparkles;
}

/**
 * Update particle systems
 */
export function updateParticles(particleGroup, time) {
  particleGroup.traverse((child) => {
    if (child.material && child.material.uniforms && child.material.uniforms.uTime) {
      child.material.uniforms.uTime.value = time;
    }

    // Update snow positions
    if (child.name === 'snowParticles') {
      updateSnowPositions(child, time);
    }
  });
}

function updateSnowPositions(snow, time) {
  const positions = snow.geometry.attributes.position.array;
  const velocities = snow.geometry.attributes.velocity.array;

  for (let i = 0; i < positions.length / 3; i++) {
    const i3 = i * 3;

    // Update position based on velocity
    positions[i3] += velocities[i3];
    positions[i3 + 1] += velocities[i3 + 1];
    positions[i3 + 2] += velocities[i3 + 2];

    // Add wind sway
    positions[i3] += Math.sin(time + i) * 0.001;

    // Reset if below ground
    if (positions[i3 + 1] < -0.5) {
      positions[i3] = (Math.random() - 0.5) * 15;
      positions[i3 + 1] = 12;
      positions[i3 + 2] = (Math.random() - 0.5) * 15;
    }
  }

  snow.geometry.attributes.position.needsUpdate = true;
}

// Shader definitions
const snowVertexShader = /* glsl */`
  attribute float size;
  uniform float uTime;
  uniform float uPixelRatio;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * uPixelRatio * (100.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const snowFragmentShader = /* glsl */`
  void main() {
    float dist = length(gl_PointCoord - 0.5);
    if (dist > 0.5) discard;

    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.8);
  }
`;

const stardustVertexShader = /* glsl */`
  attribute float phase;
  varying vec3 vColor;
  uniform float uTime;
  uniform float uPixelRatio;

  void main() {
    vColor = color;

    // Orbital motion
    float angle = phase + uTime * 0.3;
    vec3 pos = position;
    float radius = length(pos.xz);
    pos.x = cos(angle) * radius;
    pos.z = sin(angle) * radius;

    // Vertical oscillation
    pos.y += sin(uTime * 2.0 + phase) * 0.1;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float size = 3.0 + sin(uTime * 3.0 + phase) * 1.0;
    gl_PointSize = size * uPixelRatio * (80.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const stardustFragmentShader = /* glsl */`
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - 0.5);
    if (dist > 0.5) discard;

    float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
    float glow = exp(-dist * 4.0);
    vec3 finalColor = vColor + glow * 0.5;
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const fireflyVertexShader = /* glsl */`
  attribute vec3 phase;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vBrightness;

  void main() {
    // Wandering motion
    vec3 pos = position;
    pos.x += sin(uTime * 0.5 + phase.x) * 0.5;
    pos.y += sin(uTime * 0.3 + phase.y) * 0.3;
    pos.z += cos(uTime * 0.4 + phase.z) * 0.5;

    // Brightness pulsing
    vBrightness = 0.5 + 0.5 * sin(uTime * 2.0 + phase.x * 10.0);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (5.0 + vBrightness * 3.0) * uPixelRatio * (60.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fireflyFragmentShader = /* glsl */`
  varying float vBrightness;

  void main() {
    float dist = length(gl_PointCoord - 0.5);
    if (dist > 0.5) discard;

    float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * vBrightness;
    vec3 color = mix(vec3(0.0, 1.0, 0.5), vec3(0.0, 1.0, 1.0), vBrightness);
    gl_FragColor = vec4(color, alpha);
  }
`;

const sparkleVertexShader = /* glsl */`
  attribute vec3 velocity;
  attribute float lifetime;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vLifetime;

  void main() {
    vLifetime = lifetime;

    vec4 mvPosition = modelViewMatrix * vec4(position + velocity * uTime * 50.0, 1.0);
    gl_PointSize = 6.0 * uPixelRatio * lifetime * (50.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const sparkleFragmentShader = /* glsl */`
  varying float vLifetime;

  void main() {
    float dist = length(gl_PointCoord - 0.5);
    if (dist > 0.5) discard;

    float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * vLifetime;
    vec3 color = mix(vec3(1.0, 0.8, 0.0), vec3(1.0, 1.0, 1.0), vLifetime);
    gl_FragColor = vec4(color, alpha);
  }
`;
