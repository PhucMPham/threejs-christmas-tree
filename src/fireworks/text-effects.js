/**
 * Text Effects - Rainbow neon material factory for 2025 text
 * Provides HSL color cycling with bloom-optimized emissive settings
 */

import * as THREE from 'three';

// Default bloom settings for neon effect - minimal glow
export const NEON_BLOOM_SETTINGS = {
  threshold: 0.8,   // High threshold = much less bloom
  strength: 0.4,    // Very subtle glow
  radius: 0.2       // Tight radius
};

// Tree mode bloom settings (restore after)
export const TREE_BLOOM_SETTINGS = {
  threshold: 0.7,
  strength: 1.0,
  radius: 0.4
};

/**
 * Create rainbow neon material with HSL cycling capability
 * @returns {THREE.MeshStandardMaterial} Material with userData.hue for animation
 */
export function createRainbowNeonMaterial() {
  const material = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.8,  // Minimal glow, clean text
    metalness: 0.3,
    roughness: 0.5
  });

  // Store hue for animation
  material.userData.hue = 0;

  return material;
}

/**
 * Update rainbow material hue over time
 * @param {THREE.MeshStandardMaterial} material - Material to update
 * @param {number} dt - Delta time in seconds
 * @param {number} speed - Hue rotation speed (default 0.1)
 */
export function updateRainbowMaterial(material, dt, speed = 0.1) {
  if (!material || !material.userData) return;

  material.userData.hue = (material.userData.hue + dt * speed) % 1;
  const color = new THREE.Color().setHSL(material.userData.hue, 1.0, 0.5);

  material.color.copy(color);
  material.emissive.copy(color);
}

/**
 * Adjust bloom pass for neon text visibility
 * @param {UnrealBloomPass} bloomPass - Bloom post-processing pass
 */
export function adjustBloomForNeon(bloomPass) {
  if (!bloomPass) return;

  bloomPass.threshold = NEON_BLOOM_SETTINGS.threshold;
  bloomPass.strength = NEON_BLOOM_SETTINGS.strength;
  bloomPass.radius = NEON_BLOOM_SETTINGS.radius;
}

/**
 * Restore bloom settings for tree mode
 * @param {UnrealBloomPass} bloomPass - Bloom post-processing pass
 */
export function restoreBloomForTree(bloomPass) {
  if (!bloomPass) return;

  bloomPass.threshold = TREE_BLOOM_SETTINGS.threshold;
  bloomPass.strength = TREE_BLOOM_SETTINGS.strength;
  bloomPass.radius = TREE_BLOOM_SETTINGS.radius;
}

/**
 * Create countdown canvas-based material
 * Uses transparent background with glow effect
 * @param {number} canvasSize - Canvas dimensions (default 256)
 * @returns {{ material: THREE.MeshBasicMaterial, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, texture: THREE.CanvasTexture }}
 */
export function createCountdownMaterial(canvasSize = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  return { material, canvas, ctx, texture };
}

/**
 * Render countdown number to canvas with glow
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {number} value - Countdown value to display
 * @param {THREE.CanvasTexture} texture - Texture to mark for update
 */
export function renderCountdownValue(ctx, value, texture) {
  const size = ctx.canvas.width;
  const center = size / 2;

  // Clear canvas
  ctx.clearRect(0, 0, size, size);

  // Minimal glow effect
  ctx.save();

  // Subtle outer glow
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 10;  // Reduced from 40
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Text style - clean and readable
  ctx.fillStyle = '#ffd700';
  ctx.font = `bold ${Math.floor(size * 0.6)}px Arial, sans-serif`;  // Slightly smaller
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw once for clean look
  ctx.fillText(value.toString(), center, center);

  ctx.restore();

  // Mark texture for update
  if (texture) {
    texture.needsUpdate = true;
  }
}
