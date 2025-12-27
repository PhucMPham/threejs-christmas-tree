/**
 * NewYearMode - Orchestration layer for New Year fireworks mode
 * Manages mode state, toggle, visibility, and component coordination
 */

import * as THREE from 'three';
import { FireworkSystem, FIREWORK_TYPE } from './firework-system.js';
import { FireworkAudio, initFireworkAudio } from './firework-audio.js';
import { CountdownManager } from './countdown-manager.js';

// Storage key for mode preference
const STORAGE_KEY = 'newYearModeEnabled';

// Bloom settings for different modes
const BLOOM_SETTINGS = {
  tree: { threshold: 0.85, strength: 0.25, radius: 0.3 },
  fireworks: { threshold: 0.5, strength: 1.5, radius: 0.6 }
};

/**
 * NewYearMode class - orchestrates fireworks, audio, and countdown
 */
export class NewYearMode {
  /**
   * @param {THREE.Scene} scene - Three.js scene
   * @param {THREE.Camera} camera - Scene camera
   * @param {THREE.Group} mainGroup - Christmas tree group to hide/show
   * @param {Object} bloomPass - UnrealBloomPass for glow adjustment
   * @param {THREE.Points} snowSystem - Snow particle system to hide/show
   */
  constructor(scene, camera, mainGroup, bloomPass, snowSystem = null) {
    this.scene = scene;
    this.camera = camera;
    this.mainGroup = mainGroup;
    this.bloomPass = bloomPass;
    this.snowSystem = snowSystem;

    // Components (lazy initialized)
    this.fireworkSystem = null;
    this.fireworkAudio = null;
    this.countdown = null;

    // State
    this.isActive = false;
    this.isInitialized = false;
    this.spawnTimer = 0;
    this.autoSpawnInterval = 1.5;
    this.typeIndex = 0;

    // Original bloom settings for restoration
    this.originalBloom = null;

    // Gesture tension state
    this.gestureMode = false;        // True when hand detected
    this.fingerCount = 5;            // Current stable finger count
    this.tensionCenter = new THREE.Vector3(0, 5, 0); // World position
    this.fistHoldTime = 0;           // Tracks how long fist is held
    this.fistHoldThreshold = 0.5;    // Seconds to trigger finale
    this.gestureFinaleTriggered = false;
  }

  /**
   * Initialize all components
   * @returns {Promise<boolean>} Success status
   */
  async init() {
    if (this.isInitialized) return true;

    try {
      // Create firework system
      this.fireworkSystem = new FireworkSystem(this.scene);

      // Create audio (lazy init on user interaction)
      this.fireworkAudio = new FireworkAudio();

      // Create countdown manager
      this.countdown = new CountdownManager(this.scene, this.bloomPass);
      await this.countdown.init();

      // Set finale callback
      this.countdown.onFinale = () => this.triggerFinale();

      // Store original bloom
      if (this.bloomPass) {
        this.originalBloom = {
          threshold: this.bloomPass.threshold,
          strength: this.bloomPass.strength,
          radius: this.bloomPass.radius
        };
      }

      // Check saved preference - auto-activate if was enabled
      this.checkSavedPreference();

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.error('NewYearMode init failed:', err);
      return false;
    }
  }

  /**
   * Check and apply saved mode preference
   */
  checkSavedPreference() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'true') {
        // Don't auto-activate, just note preference
        // User must explicitly toggle
      }
    } catch (err) {
      // localStorage not available
    }
  }

  /**
   * Save mode preference
   */
  savePreference() {
    try {
      localStorage.setItem(STORAGE_KEY, String(this.isActive));
    } catch (err) {
      // localStorage not available
    }
  }

  /**
   * Activate New Year mode
   */
  activate() {
    if (!this.isInitialized) return;

    this.isActive = true;

    // Initialize audio on first activation (user interaction)
    if (this.fireworkAudio && !this.fireworkAudio.isInitialized) {
      this.fireworkAudio.init();
    }
    this.fireworkAudio?.resume();

    // Hide Christmas tree
    if (this.mainGroup) {
      this.mainGroup.visible = false;
    }

    // Hide snow particles
    if (this.snowSystem) {
      this.snowSystem.visible = false;
    }

    // Show countdown elements
    this.countdown.show();

    // Adjust bloom for neon effect
    if (this.bloomPass) {
      this.bloomPass.threshold = BLOOM_SETTINGS.fireworks.threshold;
      this.bloomPass.strength = BLOOM_SETTINGS.fireworks.strength;
      this.bloomPass.radius = BLOOM_SETTINGS.fireworks.radius;
    }

    // Start countdown
    this.countdown.start();

    // Update button state
    const btn = document.getElementById('newyear-btn');
    if (btn) {
      btn.classList.add('active');
    }

    // Save preference
    this.savePreference();

    // Reset spawn timer
    this.spawnTimer = 0;
  }

  /**
   * Deactivate New Year mode
   */
  deactivate() {
    this.isActive = false;

    // Show Christmas tree
    if (this.mainGroup) {
      this.mainGroup.visible = true;
    }

    // Show snow particles
    if (this.snowSystem) {
      this.snowSystem.visible = true;
    }

    // Hide countdown elements
    this.countdown?.hide();

    // Clear firework particles
    this.fireworkSystem?.clear();

    // Restore bloom
    if (this.bloomPass && this.originalBloom) {
      this.bloomPass.threshold = this.originalBloom.threshold;
      this.bloomPass.strength = this.originalBloom.strength;
      this.bloomPass.radius = this.originalBloom.radius;
    }

    // Stop countdown
    this.countdown?.stop();

    // Update button state
    const btn = document.getElementById('newyear-btn');
    if (btn) {
      btn.classList.remove('active');
    }

    // Save preference
    this.savePreference();
  }

  /**
   * Toggle between modes
   */
  toggle() {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  /**
   * Update gesture state from finger detection
   * @param {number} fingerCount - Detected finger count (0-5)
   * @param {number} handX - Normalized hand X (-1 to 1)
   * @param {number} handY - Normalized hand Y (-1 to 1)
   * @param {number} dt - Delta time in seconds (default 0.016 for ~60fps)
   */
  setGestureState(fingerCount, handX, handY, dt = 0.016) {
    if (!this.isActive) return;

    this.gestureMode = true;
    this.fingerCount = Math.max(0, Math.min(5, Math.round(fingerCount)));

    // Convert screen position to world position
    // Map to a reasonable 3D region in front of camera
    const clampedX = Math.max(-1, Math.min(1, handX));
    const clampedY = Math.max(-1, Math.min(1, handY));
    this.tensionCenter.set(
      clampedX * 15,           // X: -15 to +15
      5 + clampedY * -5,       // Y: 0 to 10 (inverted because screen Y is flipped)
      0                        // Z: center depth
    );

    // Update countdown display to show finger count
    if (this.countdown) {
      this.countdown.setExternalValue(this.fingerCount);
    }

    // Pass tension state to firework system
    if (this.fireworkSystem) {
      const compression = 1 - (this.fingerCount / 5);
      this.fireworkSystem.setTensionState(this.tensionCenter, compression);
    }

    // Track fist hold time
    if (this.fingerCount === 0) {
      this.fistHoldTime += dt;
      if (this.fistHoldTime >= this.fistHoldThreshold && !this.gestureFinaleTriggered) {
        this.triggerGestureFinale();
      }
    } else {
      this.fistHoldTime = 0;
      this.gestureFinaleTriggered = false;
    }
  }

  /**
   * Clear gesture state when hand not detected
   */
  clearGestureState() {
    this.gestureMode = false;
    this.fistHoldTime = 0;

    // Gradually release tension
    if (this.fireworkSystem) {
      this.fireworkSystem.setTensionState(null, 0);
    }

    // Return to timer-based countdown
    if (this.countdown) {
      this.countdown.clearExternalValue();
    }
  }

  /**
   * Trigger finale from gesture (fist held)
   */
  triggerGestureFinale() {
    this.gestureFinaleTriggered = true;

    // Spawn concentrated burst at tension center
    const burstCount = 8;
    const types = Object.values(FIREWORK_TYPE);

    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => {
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5
        );
        const spawnPos = this.tensionCenter.clone().add(offset);
        const type = types[i % types.length];

        if (this.fireworkSystem.canSpawn()) {
          this.fireworkSystem.spawn(spawnPos, type);
          this.fireworkAudio?.play(type);
        }
      }, i * 80);
    }
  }

  /**
   * Update each frame
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (!this.isActive || !this.isInitialized) return;

    // Update firework particles
    this.fireworkSystem.update(dt);

    // Update countdown
    this.countdown.update(dt);

    // Auto-spawn fireworks periodically
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.autoSpawnInterval) {
      this.spawnTimer = 0;
      this.spawnRandomFirework();
    }
  }

  /**
   * Spawn a random firework
   */
  spawnRandomFirework() {
    if (!this.fireworkSystem.canSpawn()) return;

    const types = [
      FIREWORK_TYPE.BLOOM,
      FIREWORK_TYPE.SPARK,
      FIREWORK_TYPE.DRIFT,
      FIREWORK_TYPE.SCATTER,
      FIREWORK_TYPE.SPARKLER
    ];

    // Cycle through types for variety
    const type = types[this.typeIndex % types.length];
    this.typeIndex++;

    // Random position in sky
    const x = (Math.random() - 0.5) * 20;
    const y = 5 + Math.random() * 10;
    const z = (Math.random() - 0.5) * 10;

    this.fireworkSystem.spawn(new THREE.Vector3(x, y, z), type);
    this.fireworkAudio?.play(type);
  }

  /**
   * Spawn firework at screen position (click handler)
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   */
  spawnAtScreenPosition(screenX, screenY) {
    if (!this.isActive || !this.fireworkSystem.canSpawn()) return;

    // Convert screen to normalized device coordinates
    const mouse = new THREE.Vector2();
    mouse.x = (screenX / window.innerWidth) * 2 - 1;
    mouse.y = -(screenY / window.innerHeight) * 2 + 1;

    // Project into 3D space
    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(this.camera);

    const dir = vector.sub(this.camera.position).normalize();
    const distance = 30;
    const spawnPoint = this.camera.position.clone().add(dir.multiplyScalar(distance));

    // Cycle through types
    const types = Object.values(FIREWORK_TYPE);
    const type = types[this.typeIndex % types.length];
    this.typeIndex++;

    this.fireworkSystem.spawn(spawnPoint, type);
    this.fireworkAudio?.play(type);
  }

  /**
   * Trigger grand finale - burst of all types
   */
  triggerFinale() {
    const types = [
      FIREWORK_TYPE.BLOOM,
      FIREWORK_TYPE.SPARK,
      FIREWORK_TYPE.DRIFT,
      FIREWORK_TYPE.SCATTER,
      FIREWORK_TYPE.SPARKLER
    ];

    // Spawn multiple bursts of each type with staggered timing
    types.forEach((type, i) => {
      setTimeout(() => {
        for (let j = 0; j < 3; j++) {
          const x = (Math.random() - 0.5) * 30;
          const y = 8 + Math.random() * 8;
          const z = (Math.random() - 0.5) * 15;

          if (this.fireworkSystem.canSpawn()) {
            this.fireworkSystem.spawn(new THREE.Vector3(x, y, z), type);
            this.fireworkAudio?.play(type);
          }
        }
      }, i * 200);
    });
  }

  /**
   * Check if mode is active
   * @returns {boolean}
   */
  getIsActive() {
    return this.isActive;
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.deactivate();

    this.fireworkSystem?.dispose();
    this.fireworkAudio?.dispose();
    this.countdown?.dispose();

    this.fireworkSystem = null;
    this.fireworkAudio = null;
    this.countdown = null;
    this.isInitialized = false;
  }
}
