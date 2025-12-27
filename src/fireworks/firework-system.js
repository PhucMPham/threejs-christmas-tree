import * as THREE from 'three';
import {
  fireworkVertexShader,
  fireworkFragmentShader,
  sparklerVertexShader,
  sparklerFragmentShader
} from './firework-shaders.js';
import {
  FIREWORK_TYPE,
  FIREWORK_TYPES,
  getVelocityForType,
  getColorForType,
  getSizeForType,
  getMaxAgeForType,
  getRandomType
} from './firework-types.js';

const MAX_PARTICLES = 2000;
const MAX_BURSTS = 20; // Track active bursts for cleanup

/**
 * FireworkSystem - Core particle engine with object pooling
 * Manages spawn/update/dispose lifecycle for firework particles
 */
export class FireworkSystem {
  constructor(scene) {
    this.scene = scene;

    // Pre-allocated typed arrays for particle data
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.velocities = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.sizes = new Float32Array(MAX_PARTICLES);
    this.ages = new Float32Array(MAX_PARTICLES);
    this.maxAges = new Float32Array(MAX_PARTICLES);
    this.types = new Float32Array(MAX_PARTICLES);

    this.activeCount = 0;
    this.bursts = []; // Track active burst metadata

    // Tension effect state
    this.tensionCenter = null;       // THREE.Vector3 or null
    this.tensionCompression = 0;     // 0 (no tension) to 1 (max tension)

    // Create geometry with buffer attributes
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute('age', new THREE.BufferAttribute(this.ages, 1));
    this.geometry.setAttribute('maxAge', new THREE.BufferAttribute(this.maxAges, 1));
    this.geometry.setAttribute('type', new THREE.BufferAttribute(this.types, 1));

    // Standard firework material
    this.material = new THREE.ShaderMaterial({
      vertexShader: fireworkVertexShader,
      fragmentShader: fireworkFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uTensionIntensity: { value: 0 }  // 0-1 for glow boost
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    // Create Points mesh
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.name = 'fireworkSystem';
    this.points.frustumCulled = false;

    // Sparkler uses separate material for different shader (Phase 2: multi-material support)
    // Reserved for dynamic material switching when implementing sparkler-specific effects
    this.sparklerMaterial = new THREE.ShaderMaterial({
      vertexShader: sparklerVertexShader,
      fragmentShader: sparklerFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    // Add to scene
    scene.add(this.points);

    // Handle resize
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Spawn a firework burst at given position
   * @param {THREE.Vector3} origin - Spawn position
   * @param {number} type - Firework type (FIREWORK_TYPE enum)
   * @returns {boolean} - Success (false if at capacity)
   */
  spawn(origin, type = null) {
    if (type === null) {
      type = getRandomType();
    }

    const config = FIREWORK_TYPES[type];
    const particleCount = config.particles;

    // Check if we have room
    if (this.activeCount + particleCount > MAX_PARTICLES) {
      return false;
    }

    const startIndex = this.activeCount;

    for (let i = 0; i < particleCount; i++) {
      const idx = startIndex + i;
      const i3 = idx * 3;

      // Set position at origin
      this.positions[i3] = origin.x;
      this.positions[i3 + 1] = origin.y;
      this.positions[i3 + 2] = origin.z;

      // Get velocity based on type
      const vel = getVelocityForType(type, i, particleCount, config.speed);
      this.velocities[i3] = vel.vx;
      this.velocities[i3 + 1] = vel.vy;
      this.velocities[i3 + 2] = vel.vz;

      // Set color
      const color = getColorForType(type);
      this.colors[i3] = color[0];
      this.colors[i3 + 1] = color[1];
      this.colors[i3 + 2] = color[2];

      // Set metadata
      this.sizes[idx] = getSizeForType(type);
      this.ages[idx] = 0;
      this.maxAges[idx] = getMaxAgeForType(type);
      this.types[idx] = type;
    }

    this.activeCount += particleCount;

    // Track burst
    this.bursts.push({
      startIndex,
      count: particleCount,
      type,
      spawnTime: performance.now()
    });

    // Limit burst tracking
    if (this.bursts.length > MAX_BURSTS) {
      this.bursts.shift();
    }

    return true;
  }

  /**
   * Update particle physics each frame
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (this.activeCount === 0) return;

    const time = performance.now() / 1000;
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uTensionIntensity.value = this.tensionCompression;
    this.sparklerMaterial.uniforms.uTime.value = time;

    // Update each particle
    for (let i = 0; i < this.activeCount; i++) {
      const i3 = i * 3;
      const type = this.types[i];
      const config = FIREWORK_TYPES[type];

      // Apply gravity
      this.velocities[i3 + 1] += config.gravity;

      // Apply damping
      this.velocities[i3] *= config.damping;
      this.velocities[i3 + 1] *= config.damping;
      this.velocities[i3 + 2] *= config.damping;

      // Update position
      this.positions[i3] += this.velocities[i3];
      this.positions[i3 + 1] += this.velocities[i3 + 1];
      this.positions[i3 + 2] += this.velocities[i3 + 2];

      // Apply tension effect - pull particles toward center
      if (this.tensionCenter && this.tensionCompression > 0) {
        const currentX = this.positions[i3];
        const currentY = this.positions[i3 + 1];
        const currentZ = this.positions[i3 + 2];

        // Calculate direction to tension center
        const dx = this.tensionCenter.x - currentX;
        const dy = this.tensionCenter.y - currentY;
        const dz = this.tensionCenter.z - currentZ;

        // Apply compression force (stronger as compression increases)
        const pullStrength = this.tensionCompression * 0.15;
        this.positions[i3] += dx * pullStrength;
        this.positions[i3 + 1] += dy * pullStrength;
        this.positions[i3 + 2] += dz * pullStrength;

        // Also dampen velocity more at high compression (particles slow down)
        const tensionDamping = 1 - (this.tensionCompression * 0.1);
        this.velocities[i3] *= tensionDamping;
        this.velocities[i3 + 1] *= tensionDamping;
        this.velocities[i3 + 2] *= tensionDamping;
      }

      // Update age
      this.ages[i] += dt;
    }

    // Cull dead particles
    this.cullDeadParticles();

    // Mark attributes for update
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.age.needsUpdate = true;
    this.geometry.attributes.maxAge.needsUpdate = true;
    this.geometry.attributes.type.needsUpdate = true;

    // Update draw range
    this.geometry.setDrawRange(0, this.activeCount);
  }

  /**
   * Remove particles that exceeded their max age
   * Uses swap-and-pop for O(1) removal
   */
  cullDeadParticles() {
    let i = 0;
    while (i < this.activeCount) {
      if (this.ages[i] >= this.maxAges[i]) {
        // Swap with last active particle
        const lastIdx = this.activeCount - 1;
        if (i !== lastIdx) {
          this.swapParticles(i, lastIdx);
        }
        this.activeCount--;
      } else {
        i++;
      }
    }
  }

  /**
   * Swap two particles in arrays (for efficient removal)
   */
  swapParticles(a, b) {
    const a3 = a * 3;
    const b3 = b * 3;

    // Swap positions
    [this.positions[a3], this.positions[b3]] = [this.positions[b3], this.positions[a3]];
    [this.positions[a3 + 1], this.positions[b3 + 1]] = [this.positions[b3 + 1], this.positions[a3 + 1]];
    [this.positions[a3 + 2], this.positions[b3 + 2]] = [this.positions[b3 + 2], this.positions[a3 + 2]];

    // Swap velocities
    [this.velocities[a3], this.velocities[b3]] = [this.velocities[b3], this.velocities[a3]];
    [this.velocities[a3 + 1], this.velocities[b3 + 1]] = [this.velocities[b3 + 1], this.velocities[a3 + 1]];
    [this.velocities[a3 + 2], this.velocities[b3 + 2]] = [this.velocities[b3 + 2], this.velocities[a3 + 2]];

    // Swap colors
    [this.colors[a3], this.colors[b3]] = [this.colors[b3], this.colors[a3]];
    [this.colors[a3 + 1], this.colors[b3 + 1]] = [this.colors[b3 + 1], this.colors[a3 + 1]];
    [this.colors[a3 + 2], this.colors[b3 + 2]] = [this.colors[b3 + 2], this.colors[a3 + 2]];

    // Swap metadata
    [this.sizes[a], this.sizes[b]] = [this.sizes[b], this.sizes[a]];
    [this.ages[a], this.ages[b]] = [this.ages[b], this.ages[a]];
    [this.maxAges[a], this.maxAges[b]] = [this.maxAges[b], this.maxAges[a]];
    [this.types[a], this.types[b]] = [this.types[b], this.types[a]];
  }

  /**
   * Get current active particle count
   */
  getActiveCount() {
    return this.activeCount;
  }

  /**
   * Check if system can spawn more particles
   */
  canSpawn(particleCount = 150) {
    return this.activeCount + particleCount <= MAX_PARTICLES;
  }

  /**
   * Set tension state for particle compression
   * @param {THREE.Vector3|null} center - World position to compress toward
   * @param {number} compression - 0 (scattered) to 1 (fully compressed)
   */
  setTensionState(center, compression) {
    this.tensionCenter = center;
    this.tensionCompression = Math.max(0, Math.min(1, compression));
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.material.uniforms.uPixelRatio.value = pixelRatio;
    this.sparklerMaterial.uniforms.uPixelRatio.value = pixelRatio;
  }

  /**
   * Set visibility
   */
  setVisible(visible) {
    this.points.visible = visible;
  }

  /**
   * Clear all particles
   */
  clear() {
    this.activeCount = 0;
    this.bursts = [];
    this.geometry.setDrawRange(0, 0);
  }

  /**
   * Dispose resources
   */
  dispose() {
    window.removeEventListener('resize', this.handleResize);

    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
    this.sparklerMaterial.dispose();

    this.positions = null;
    this.velocities = null;
    this.colors = null;
    this.sizes = null;
    this.ages = null;
    this.maxAges = null;
    this.types = null;
  }
}

// Re-export types for convenience
export { FIREWORK_TYPE, FIREWORK_TYPES, getRandomType };
