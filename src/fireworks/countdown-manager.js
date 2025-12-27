/**
 * CountdownManager - Timer logic, 2025 text, and finale orchestration
 * Manages New Year countdown with rainbow neon 3D text and canvas timer
 */

import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import {
  createRainbowNeonMaterial,
  updateRainbowMaterial,
  createCountdownMaterial,
  renderCountdownValue,
  adjustBloomForNeon,
  restoreBloomForTree
} from './text-effects.js';

// Configuration
const CONFIG = {
  textSize: 3,
  textHeight: 0.5,
  textYPosition: 18,
  countdownPlaneSize: 4,
  countdownYPosition: 12,
  countdownStart: 10,
  finaleWaitTime: 2,
  fontPath: '/node_modules/three/examples/fonts/helvetiker_regular.typeface.json'
};

/**
 * CountdownManager class
 * Handles 2025 text rendering, countdown timer, and finale trigger
 */
export class CountdownManager {
  /**
   * @param {THREE.Scene} scene - Three.js scene
   * @param {Object} bloomPass - UnrealBloomPass for glow adjustment
   */
  constructor(scene, bloomPass = null) {
    this.scene = scene;
    this.bloomPass = bloomPass;

    // 3D text mesh
    this.text2025 = null;
    this.textMaterial = null;
    this.font = null;

    // Countdown plane and canvas
    this.countdownPlane = null;
    this.countdownMaterial = null;
    this.countdownCanvas = null;
    this.countdownCtx = null;
    this.countdownTexture = null;

    // Timer state
    this.countdownValue = CONFIG.countdownStart;
    this.elapsed = 0;
    this.isActive = false;
    this.finaleTriggered = false;
    this.waitingAfterFinale = false;

    // Callback for grand finale
    this.onFinale = null;

    // Group for all countdown elements
    this.group = new THREE.Group();
    this.group.name = 'countdownGroup';
    this.group.visible = false;
    scene.add(this.group);
  }

  /**
   * Initialize - load font and create text elements
   * @returns {Promise<boolean>} Success status
   */
  async init() {
    try {
      await this.loadFont();
      this.createText2025();
      this.createCountdownPlane();
      return true;
    } catch (err) {
      console.error('CountdownManager init failed:', err);
      return false;
    }
  }

  /**
   * Load helvetiker font
   * @returns {Promise<void>}
   */
  async loadFont() {
    const loader = new FontLoader();

    return new Promise((resolve, reject) => {
      loader.load(
        CONFIG.fontPath,
        (font) => {
          this.font = font;
          resolve();
        },
        undefined,
        (err) => {
          console.error('Font load error:', err);
          reject(err);
        }
      );
    });
  }

  /**
   * Create 2025 3D text with rainbow neon material
   */
  createText2025() {
    if (!this.font) {
      console.warn('Font not loaded, cannot create text');
      return;
    }

    const geometry = new TextGeometry('2025', {
      font: this.font,
      size: CONFIG.textSize,
      height: CONFIG.textHeight,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.05,
      bevelSegments: 3
    });

    geometry.center();

    this.textMaterial = createRainbowNeonMaterial();
    this.text2025 = new THREE.Mesh(geometry, this.textMaterial);
    this.text2025.position.set(0, CONFIG.textYPosition, 0);
    this.text2025.name = 'text2025';

    this.group.add(this.text2025);
  }

  /**
   * Create countdown canvas plane
   */
  createCountdownPlane() {
    const { material, canvas, ctx, texture } = createCountdownMaterial(256);

    this.countdownMaterial = material;
    this.countdownCanvas = canvas;
    this.countdownCtx = ctx;
    this.countdownTexture = texture;

    const planeGeometry = new THREE.PlaneGeometry(
      CONFIG.countdownPlaneSize,
      CONFIG.countdownPlaneSize
    );
    this.countdownPlane = new THREE.Mesh(planeGeometry, material);
    this.countdownPlane.position.set(0, CONFIG.countdownYPosition, 0);
    this.countdownPlane.name = 'countdownPlane';

    // Initial render
    renderCountdownValue(this.countdownCtx, CONFIG.countdownStart, this.countdownTexture);

    this.group.add(this.countdownPlane);
  }

  /**
   * Start countdown loop
   */
  start() {
    this.isActive = true;
    this.countdownValue = CONFIG.countdownStart;
    this.elapsed = 0;
    this.finaleTriggered = false;
    this.waitingAfterFinale = false;

    // Show group and update display
    this.show();
    renderCountdownValue(this.countdownCtx, this.countdownValue, this.countdownTexture);

    // Adjust bloom for neon
    adjustBloomForNeon(this.bloomPass);
  }

  /**
   * Stop countdown
   */
  stop() {
    this.isActive = false;
    this.hide();

    // Restore bloom for tree
    restoreBloomForTree(this.bloomPass);
  }

  /**
   * Update countdown - call each frame
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Update rainbow material even when not counting
    if (this.textMaterial && this.group.visible) {
      updateRainbowMaterial(this.textMaterial, dt);
    }

    if (!this.isActive) return;

    this.elapsed += dt;

    // Handle post-finale wait
    if (this.waitingAfterFinale) {
      if (this.elapsed >= CONFIG.finaleWaitTime) {
        this.resetCountdown();
      }
      return;
    }

    // Decrement every second
    if (this.elapsed >= 1.0) {
      this.elapsed = 0;
      this.countdownValue--;

      // Update display for non-negative values
      if (this.countdownValue >= 0) {
        renderCountdownValue(this.countdownCtx, this.countdownValue, this.countdownTexture);
      }

      // Trigger finale at zero
      if (this.countdownValue === 0 && !this.finaleTriggered) {
        this.triggerFinale();
      }

      // Enter wait state after finale
      if (this.countdownValue < 0 && this.finaleTriggered) {
        this.waitingAfterFinale = true;
        this.elapsed = 0;
      }
    }
  }

  /**
   * Trigger grand finale callback
   */
  triggerFinale() {
    this.finaleTriggered = true;

    if (this.onFinale && typeof this.onFinale === 'function') {
      this.onFinale();
    }
  }

  /**
   * Reset countdown for next loop
   */
  resetCountdown() {
    this.countdownValue = CONFIG.countdownStart;
    this.elapsed = 0;
    this.finaleTriggered = false;
    this.waitingAfterFinale = false;

    renderCountdownValue(this.countdownCtx, this.countdownValue, this.countdownTexture);
  }

  /**
   * Show countdown elements
   */
  show() {
    this.group.visible = true;
  }

  /**
   * Hide countdown elements
   */
  hide() {
    this.group.visible = false;
  }

  /**
   * Check if visible
   * @returns {boolean}
   */
  isVisible() {
    return this.group.visible;
  }

  /**
   * Set finale callback
   * @param {Function} callback - Called when countdown reaches 0
   */
  setFinaleCallback(callback) {
    this.onFinale = callback;
  }

  /**
   * Get current countdown value
   * @returns {number}
   */
  getValue() {
    return this.countdownValue;
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.stop();

    // Remove from scene
    this.scene.remove(this.group);

    // Dispose text
    if (this.text2025) {
      this.text2025.geometry.dispose();
      this.textMaterial.dispose();
    }

    // Dispose countdown plane
    if (this.countdownPlane) {
      this.countdownPlane.geometry.dispose();
      this.countdownMaterial.dispose();
      this.countdownTexture.dispose();
    }

    // Clear references
    this.text2025 = null;
    this.textMaterial = null;
    this.countdownPlane = null;
    this.countdownMaterial = null;
    this.countdownTexture = null;
    this.font = null;
    this.onFinale = null;
  }
}
