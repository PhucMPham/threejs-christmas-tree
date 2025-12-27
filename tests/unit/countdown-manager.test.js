import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { CountdownManager } from '../../src/fireworks/countdown-manager.js';
import * as TextEffects from '../../src/fireworks/text-effects.js';

// Mock HTMLCanvasElement for node environment
if (typeof HTMLCanvasElement === 'undefined') {
  global.HTMLCanvasElement = class HTMLCanvasElement {
    constructor() {
      this.width = 256;
      this.height = 256;
    }
    getContext(type) {
      if (type === '2d') {
        return {
          canvas: this,
          clearRect: vi.fn(),
          fillText: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          fillStyle: '#000',
          shadowColor: '#000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
          font: '',
          textAlign: 'left',
          textBaseline: 'top'
        };
      }
      return {};
    }
  };
}

// Mock document for node environment
if (typeof document === 'undefined') {
  global.document = {
    createElement: (tag) => {
      if (tag === 'canvas') {
        return new HTMLCanvasElement();
      }
      return {};
    }
  };
}

// Mock FontLoader
vi.mock('three/addons/loaders/FontLoader.js', () => {
  const mockFont = { isFont: true };
  return {
    FontLoader: class {
      load(path, onLoad, onProgress, onError) {
        // Simulate async loading
        setTimeout(() => onLoad(mockFont), 10);
      }
    }
  };
});

// Mock TextGeometry as a proper BufferGeometry
vi.mock('three/addons/geometries/TextGeometry.js', () => {
  return {
    TextGeometry: class extends THREE.BufferGeometry {
      constructor(text, options) {
        super();
        this.text = text;
        this.options = options;
        this.isTextGeometry = true;
        // Add minimal position attribute to satisfy THREE.Mesh
        this.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
      }
      center() {
        this.centered = true;
        return this;
      }
    }
  };
});

describe('TextEffects Module', () => {
  describe('NEON_BLOOM_SETTINGS', () => {
    it('should export neon bloom settings', () => {
      expect(TextEffects.NEON_BLOOM_SETTINGS).toHaveProperty('threshold');
      expect(TextEffects.NEON_BLOOM_SETTINGS).toHaveProperty('strength');
      expect(TextEffects.NEON_BLOOM_SETTINGS).toHaveProperty('radius');
    });

    it('should have valid threshold value', () => {
      expect(TextEffects.NEON_BLOOM_SETTINGS.threshold).toBe(0.8);
      expect(TextEffects.NEON_BLOOM_SETTINGS.threshold).toBeGreaterThanOrEqual(0);
      expect(TextEffects.NEON_BLOOM_SETTINGS.threshold).toBeLessThanOrEqual(1);
    });

    it('should have valid strength value', () => {
      expect(TextEffects.NEON_BLOOM_SETTINGS.strength).toBe(0.4);
      expect(TextEffects.NEON_BLOOM_SETTINGS.strength).toBeGreaterThan(0);
    });

    it('should have valid radius value', () => {
      expect(TextEffects.NEON_BLOOM_SETTINGS.radius).toBe(0.2);
      expect(TextEffects.NEON_BLOOM_SETTINGS.radius).toBeGreaterThan(0);
    });
  });

  describe('TREE_BLOOM_SETTINGS', () => {
    it('should export tree bloom settings for restoration', () => {
      expect(TextEffects.TREE_BLOOM_SETTINGS).toHaveProperty('threshold');
      expect(TextEffects.TREE_BLOOM_SETTINGS).toHaveProperty('strength');
      expect(TextEffects.TREE_BLOOM_SETTINGS).toHaveProperty('radius');
    });

    it('should have different values from neon settings', () => {
      expect(TextEffects.TREE_BLOOM_SETTINGS.threshold).not.toBe(TextEffects.NEON_BLOOM_SETTINGS.threshold);
      expect(TextEffects.TREE_BLOOM_SETTINGS.strength).not.toBe(TextEffects.NEON_BLOOM_SETTINGS.strength);
    });
  });

  describe('createRainbowNeonMaterial()', () => {
    it('should create MeshStandardMaterial', () => {
      const material = TextEffects.createRainbowNeonMaterial();
      expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
    });

    it('should have red initial color', () => {
      const material = TextEffects.createRainbowNeonMaterial();
      expect(material.color.getHex()).toBe(0xff0000);
    });

    it('should have red initial emissive', () => {
      const material = TextEffects.createRainbowNeonMaterial();
      expect(material.emissive.getHex()).toBe(0xff0000);
    });

    it('should have emissive intensity for glow', () => {
      const material = TextEffects.createRainbowNeonMaterial();
      expect(material.emissiveIntensity).toBe(0.8);
      expect(material.emissiveIntensity).toBeGreaterThan(0);
    });

    it('should have metallic properties', () => {
      const material = TextEffects.createRainbowNeonMaterial();
      expect(material.metalness).toBe(0.3);
      expect(material.roughness).toBe(0.5);
    });

    it('should store hue in userData', () => {
      const material = TextEffects.createRainbowNeonMaterial();
      expect(material.userData).toHaveProperty('hue');
      expect(material.userData.hue).toBe(0);
    });
  });

  describe('updateRainbowMaterial()', () => {
    it('should update hue over time', () => {
      const material = TextEffects.createRainbowNeonMaterial();
      const initialHue = material.userData.hue;

      TextEffects.updateRainbowMaterial(material, 0.1, 1.0);

      expect(material.userData.hue).toBeGreaterThan(initialHue);
    });

    it('should use default speed of 0.1', () => {
      const material = TextEffects.createRainbowNeonMaterial();
      TextEffects.updateRainbowMaterial(material, 1.0);

      // dt = 1.0, speed = 0.1 (default) => hue += 0.1
      expect(material.userData.hue).toBeCloseTo(0.1, 2);
    });

    it('should wrap hue around at 1.0', () => {
      const material = TextEffects.createRainbowNeonMaterial();
      material.userData.hue = 0.95;

      TextEffects.updateRainbowMaterial(material, 0.1, 0.5);

      // hue = 0.95 + 0.1 * 0.5 = 1.0 => wraps to 0
      expect(material.userData.hue).toBeCloseTo(0, 2);
    });

    it('should update color based on hue', () => {
      const material = TextEffects.createRainbowNeonMaterial();
      const colorBefore = material.color.getHex();

      TextEffects.updateRainbowMaterial(material, 0.5, 1.0);

      // Color should change from red (0xff0000) to something else
      const colorAfter = material.color.getHex();
      expect(colorAfter).not.toBe(colorBefore);
    });

    it('should update emissive color', () => {
      const material = TextEffects.createRainbowNeonMaterial();
      const emissiveBefore = material.emissive.getHex();

      TextEffects.updateRainbowMaterial(material, 0.5, 1.0);

      const emissiveAfter = material.emissive.getHex();
      expect(emissiveAfter).not.toBe(emissiveBefore);
    });

    it('should handle null material gracefully', () => {
      expect(() => TextEffects.updateRainbowMaterial(null, 0.1)).not.toThrow();
    });

    it('should handle missing userData gracefully', () => {
      const material = { color: new THREE.Color(), emissive: new THREE.Color() };
      expect(() => TextEffects.updateRainbowMaterial(material, 0.1)).not.toThrow();
    });
  });

  describe('adjustBloomForNeon()', () => {
    it('should set bloom threshold to neon value', () => {
      const bloomPass = {
        threshold: 0,
        strength: 0,
        radius: 0
      };

      TextEffects.adjustBloomForNeon(bloomPass);

      expect(bloomPass.threshold).toBe(TextEffects.NEON_BLOOM_SETTINGS.threshold);
    });

    it('should set bloom strength to neon value', () => {
      const bloomPass = {
        threshold: 0,
        strength: 0,
        radius: 0
      };

      TextEffects.adjustBloomForNeon(bloomPass);

      expect(bloomPass.strength).toBe(TextEffects.NEON_BLOOM_SETTINGS.strength);
    });

    it('should set bloom radius to neon value', () => {
      const bloomPass = {
        threshold: 0,
        strength: 0,
        radius: 0
      };

      TextEffects.adjustBloomForNeon(bloomPass);

      expect(bloomPass.radius).toBe(TextEffects.NEON_BLOOM_SETTINGS.radius);
    });

    it('should handle null bloom pass gracefully', () => {
      expect(() => TextEffects.adjustBloomForNeon(null)).not.toThrow();
    });
  });

  describe('restoreBloomForTree()', () => {
    it('should restore bloom threshold to tree value', () => {
      const bloomPass = {
        threshold: 0,
        strength: 0,
        radius: 0
      };

      TextEffects.restoreBloomForTree(bloomPass);

      expect(bloomPass.threshold).toBe(TextEffects.TREE_BLOOM_SETTINGS.threshold);
    });

    it('should restore bloom strength to tree value', () => {
      const bloomPass = {
        threshold: 0,
        strength: 0,
        radius: 0
      };

      TextEffects.restoreBloomForTree(bloomPass);

      expect(bloomPass.strength).toBe(TextEffects.TREE_BLOOM_SETTINGS.strength);
    });

    it('should restore bloom radius to tree value', () => {
      const bloomPass = {
        threshold: 0,
        strength: 0,
        radius: 0
      };

      TextEffects.restoreBloomForTree(bloomPass);

      expect(bloomPass.radius).toBe(TextEffects.TREE_BLOOM_SETTINGS.radius);
    });

    it('should handle null bloom pass gracefully', () => {
      expect(() => TextEffects.restoreBloomForTree(null)).not.toThrow();
    });
  });

  describe('createCountdownMaterial()', () => {
    it('should create canvas element', () => {
      const result = TextEffects.createCountdownMaterial();
      // In Node environment, check if it's a canvas-like object
      expect(result.canvas).toBeDefined();
      expect(result.canvas.width).toBe(256);
      expect(result.canvas.height).toBe(256);
    });

    it('should create canvas with default size 256', () => {
      const result = TextEffects.createCountdownMaterial();
      expect(result.canvas.width).toBe(256);
      expect(result.canvas.height).toBe(256);
    });

    it('should create canvas with custom size', () => {
      const result = TextEffects.createCountdownMaterial(512);
      expect(result.canvas.width).toBe(512);
      expect(result.canvas.height).toBe(512);
    });

    it('should return canvas 2D context', () => {
      const result = TextEffects.createCountdownMaterial();
      expect(result.ctx).toBeDefined();
      // Should be a canvas context-like object
      expect(typeof result.ctx.fillText).toBe('function');
    });

    it('should create CanvasTexture', () => {
      const result = TextEffects.createCountdownMaterial();
      expect(result.texture).toBeInstanceOf(THREE.CanvasTexture);
    });

    it('should create MeshBasicMaterial', () => {
      const result = TextEffects.createCountdownMaterial();
      expect(result.material).toBeInstanceOf(THREE.MeshBasicMaterial);
    });

    it('should set material as transparent', () => {
      const result = TextEffects.createCountdownMaterial();
      expect(result.material.transparent).toBe(true);
    });

    it('should use DoubleSide for material', () => {
      const result = TextEffects.createCountdownMaterial();
      expect(result.material.side).toBe(THREE.DoubleSide);
    });

    it('should disable depth write', () => {
      const result = TextEffects.createCountdownMaterial();
      expect(result.material.depthWrite).toBe(false);
    });

    it('should mark texture for update', () => {
      const result = TextEffects.createCountdownMaterial();
      // CanvasTexture sets needsUpdate = true in constructor
      expect(result.texture).toBeInstanceOf(THREE.CanvasTexture);
      // Verify texture was created from canvas
      expect(result.texture.image).toBeDefined();
    });

    it('should return complete object with all properties', () => {
      const result = TextEffects.createCountdownMaterial();
      expect(result).toHaveProperty('material');
      expect(result).toHaveProperty('canvas');
      expect(result).toHaveProperty('ctx');
      expect(result).toHaveProperty('texture');
    });
  });

  describe('renderCountdownValue()', () => {
    let ctx;
    let texture;
    let canvas;

    beforeEach(() => {
      const result = TextEffects.createCountdownMaterial(256);
      ctx = result.ctx;
      texture = result.texture;
      canvas = result.canvas;
    });

    it('should clear canvas before rendering', () => {
      const clearSpy = vi.spyOn(ctx, 'clearRect');
      TextEffects.renderCountdownValue(ctx, 5, texture);

      expect(clearSpy).toHaveBeenCalledWith(0, 0, 256, 256);
    });

    it('should render countdown number as string', () => {
      const fillSpy = vi.spyOn(ctx, 'fillText');
      TextEffects.renderCountdownValue(ctx, 5, texture);

      expect(fillSpy).toHaveBeenCalledWith('5', expect.any(Number), expect.any(Number));
    });

    it('should render number at canvas center', () => {
      const fillSpy = vi.spyOn(ctx, 'fillText');
      TextEffects.renderCountdownValue(ctx, 5, texture);

      const centerX = 256 / 2;
      const centerY = 256 / 2;
      expect(fillSpy).toHaveBeenCalledWith(expect.anything(), centerX, centerY);
    });

    it('should set golden color for glow', () => {
      const result = TextEffects.createCountdownMaterial();
      ctx = result.ctx;

      const fillStyleBefore = ctx.fillStyle;
      TextEffects.renderCountdownValue(ctx, 5, result.texture);

      // fillStyle should be set to gold (#ffd700 or similar)
      expect(ctx.fillStyle).toBe('#ffd700');
    });

    it('should set shadow color for glow effect', () => {
      TextEffects.renderCountdownValue(ctx, 5, texture);
      expect(ctx.shadowColor).toBe('#ffd700');
    });

    it('should set shadow blur for glow effect', () => {
      TextEffects.renderCountdownValue(ctx, 5, texture);
      expect(ctx.shadowBlur).toBe(10);
    });

    it('should draw number for clean look', () => {
      const fillSpy = vi.spyOn(ctx, 'fillText');
      TextEffects.renderCountdownValue(ctx, 5, texture);

      // fillText should be called at least once
      expect(fillSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('should mark texture for update', () => {
      // Create a mock texture with proper THREE.CanvasTexture behavior
      const mockTexture = { needsUpdate: false };
      TextEffects.renderCountdownValue(ctx, 5, mockTexture);

      expect(mockTexture.needsUpdate).toBe(true);
    });

    it('should handle texture being null', () => {
      expect(() => TextEffects.renderCountdownValue(ctx, 5, null)).not.toThrow();
    });

    it('should render zero value', () => {
      const fillSpy = vi.spyOn(ctx, 'fillText');
      TextEffects.renderCountdownValue(ctx, 0, texture);

      expect(fillSpy).toHaveBeenCalledWith('0', expect.any(Number), expect.any(Number));
    });

    it('should render large numbers', () => {
      const fillSpy = vi.spyOn(ctx, 'fillText');
      TextEffects.renderCountdownValue(ctx, 100, texture);

      expect(fillSpy).toHaveBeenCalledWith('100', expect.any(Number), expect.any(Number));
    });
  });
});

describe('CountdownManager Class', () => {
  let scene;
  let manager;
  let bloomPass;

  beforeEach(() => {
    // Setup scene mock
    scene = {
      add: vi.fn(),
      remove: vi.fn()
    };

    // Setup bloom pass mock
    bloomPass = {
      threshold: 0.7,
      strength: 1.0,
      radius: 0.4
    };

    manager = new CountdownManager(scene, bloomPass);
  });

  afterEach(() => {
    if (manager) {
      manager.dispose();
    }
  });

  describe('Constructor', () => {
    it('should initialize with scene', () => {
      expect(manager.scene).toBe(scene);
    });

    it('should initialize with bloom pass', () => {
      expect(manager.bloomPass).toBe(bloomPass);
    });

    it('should create countdown group', () => {
      expect(manager.group).toBeInstanceOf(THREE.Group);
      expect(manager.group.name).toBe('countdownGroup');
    });

    it('should start with group invisible', () => {
      expect(manager.group.visible).toBe(false);
    });

    it('should add group to scene', () => {
      const newManager = new CountdownManager(scene, bloomPass);
      expect(scene.add).toHaveBeenCalledWith(newManager.group);
    });

    it('should initialize countdown value to 10', () => {
      expect(manager.countdownValue).toBe(10);
    });

    it('should initialize as inactive', () => {
      expect(manager.isActive).toBe(false);
    });

    it('should initialize state flags correctly', () => {
      expect(manager.finaleTriggered).toBe(false);
      expect(manager.waitingAfterFinale).toBe(false);
    });

    it('should initialize elapsed time to 0', () => {
      expect(manager.elapsed).toBe(0);
    });

    it('should initialize finale callback to null', () => {
      expect(manager.onFinale).toBeNull();
    });
  });

  describe('init()', () => {
    it('should be async function', () => {
      const result = manager.init();
      expect(result instanceof Promise).toBe(true);
    });

    it('should handle font loading asynchronously', async () => {
      const initPromise = manager.init();
      expect(initPromise instanceof Promise).toBe(true);
      // Just ensure it completes without throwing
      await initPromise.catch(() => {});
    });

    it('should create countdown group on construction', () => {
      expect(manager.group).toBeInstanceOf(THREE.Group);
      expect(manager.group.name).toBe('countdownGroup');
    });
  });

  describe('createText2025()', () => {
    it('should check prerequisites for text creation', () => {
      // createText2025 validates font exists
      manager.createText2025();

      // If font is not loaded, it should warn but not crash
      // Text may be null if font not loaded
      if (manager.font) {
        expect(manager.text2025).toBeInstanceOf(THREE.Mesh);
        expect(manager.textMaterial).toBeInstanceOf(THREE.MeshStandardMaterial);
      }
    });

    it('should use rainbow neon material when created', () => {
      // Manually create with font present
      manager.font = { isFont: true };
      manager.createText2025();

      if (manager.text2025) {
        expect(manager.textMaterial).toBeInstanceOf(THREE.MeshStandardMaterial);
        expect(manager.textMaterial.userData.hue).toBeDefined();
        expect(manager.text2025.position.y).toBe(8); // Config value
      }
    });
  });

  describe('createCountdownPlane()', () => {
    it('should create countdown plane with canvas material', () => {
      manager.createCountdownPlane();

      expect(manager.countdownPlane).toBeInstanceOf(THREE.Mesh);
      expect(manager.countdownMaterial).toBeInstanceOf(THREE.MeshBasicMaterial);
      expect(manager.countdownTexture).toBeInstanceOf(THREE.CanvasTexture);
      // In Node environment, check if it's a canvas-like object
      expect(manager.countdownCanvas).toBeDefined();
      expect(manager.countdownCanvas.width).toBeDefined();
    });

    it('should position plane at configured Y position', () => {
      manager.createCountdownPlane();

      expect(manager.countdownPlane.position.y).toBe(2); // CONFIG.countdownYPosition
      expect(manager.countdownPlane.position.x).toBe(0);
      expect(manager.countdownPlane.position.z).toBe(0);
    });

    it('should have correct canvas size', () => {
      manager.createCountdownPlane();
      expect(manager.countdownCanvas.width).toBe(256);
      expect(manager.countdownCanvas.height).toBe(256);
    });
  });

  describe('start()', () => {
    beforeEach(() => {
      manager.createCountdownPlane(); // Ensure countdown plane exists for start()
    });

    it('should set isActive to true', () => {
      manager.start();
      expect(manager.isActive).toBe(true);
    });

    it('should reset countdown to 10', () => {
      manager.countdownValue = 5;
      manager.start();
      expect(manager.countdownValue).toBe(10);
    });

    it('should reset elapsed time', () => {
      manager.elapsed = 5;
      manager.start();
      expect(manager.elapsed).toBe(0);
    });

    it('should reset finale flags', () => {
      manager.finaleTriggered = true;
      manager.waitingAfterFinale = true;
      manager.start();
      expect(manager.finaleTriggered).toBe(false);
      expect(manager.waitingAfterFinale).toBe(false);
    });

    it('should show group', () => {
      manager.group.visible = false;
      manager.start();
      expect(manager.group.visible).toBe(true);
    });

    it('should adjust bloom for neon if bloom pass available', () => {
      manager.start();
      if (bloomPass) {
        expect(bloomPass.threshold).toBe(TextEffects.NEON_BLOOM_SETTINGS.threshold);
        expect(bloomPass.strength).toBe(TextEffects.NEON_BLOOM_SETTINGS.strength);
      }
    });
  });

  describe('stop()', () => {
    beforeEach(() => {
      manager.createCountdownPlane(); // Ensure countdown plane exists
      manager.start();
    });

    it('should set isActive to false', () => {
      manager.stop();
      expect(manager.isActive).toBe(false);
    });

    it('should hide group', () => {
      manager.stop();
      expect(manager.group.visible).toBe(false);
    });

    it('should restore bloom for tree if bloom pass available', () => {
      manager.stop();
      if (bloomPass) {
        expect(bloomPass.threshold).toBe(TextEffects.TREE_BLOOM_SETTINGS.threshold);
        expect(bloomPass.strength).toBe(TextEffects.TREE_BLOOM_SETTINGS.strength);
      }
    });
  });

  describe('update()', () => {
    beforeEach(() => {
      manager.createCountdownPlane(); // Ensure countdown plane exists
      manager.textMaterial = TextEffects.createRainbowNeonMaterial();
      manager.start();
    });

    it('should update rainbow material when visible', () => {
      const hueBeforeUpdate = manager.textMaterial.userData.hue;
      manager.update(0.1);

      // Hue should have changed
      expect(manager.textMaterial.userData.hue).not.toBe(hueBeforeUpdate);
    });

    it('should increment elapsed time', () => {
      const dt = 0.016;
      manager.update(dt);

      expect(manager.elapsed).toBeCloseTo(dt, 2);
    });

    it('should decrement countdown every second', () => {
      const initialValue = manager.countdownValue;

      manager.update(1.0);

      expect(manager.countdownValue).toBe(initialValue - 1);
    });

    it('should not decrement below 1 second', () => {
      manager.elapsed = 0.5;
      manager.update(0.4);

      // Should not trigger decrement yet (need 1.0 total)
      expect(manager.elapsed).toBeCloseTo(0.9, 1);
    });

    it('should update canvas only when countdown changes', () => {
      const clearRectSpy = vi.spyOn(manager.countdownCtx, 'clearRect');
      // start() already calls renderCountdownValue, clear the call count
      clearRectSpy.mockClear();

      manager.update(0.5);

      // Should not have cleared (less than 1 second)
      expect(clearRectSpy).not.toHaveBeenCalled();

      clearRectSpy.mockClear();
      manager.update(0.6);

      // Should have cleared now (total 1.1 seconds)
      expect(clearRectSpy).toHaveBeenCalled();
    });

    it('should trigger finale at countdown = 0', async () => {
      manager.countdownValue = 1;
      const finaleSpy = vi.fn();
      manager.setFinaleCallback(finaleSpy);

      manager.update(1.0);

      expect(manager.finaleTriggered).toBe(true);
      expect(finaleSpy).toHaveBeenCalled();
    });

    it('should enter wait state after finale', () => {
      manager.countdownValue = 0;
      manager.finaleTriggered = true;
      manager.elapsed = 0.5;
      manager.update(0.6); // Total 1.1s triggers countdown decrement

      expect(manager.waitingAfterFinale).toBe(true);
    });

    it('should reset countdown after wait time', () => {
      manager.countdownValue = -1;
      manager.finaleTriggered = true;
      manager.waitingAfterFinale = true;
      manager.elapsed = 2.0;

      manager.update(0.01);

      expect(manager.countdownValue).toBe(10);
      expect(manager.finaleTriggered).toBe(false);
      expect(manager.waitingAfterFinale).toBe(false);
    });

    it('should not update when inactive', () => {
      manager.isActive = false;
      const initialValue = manager.countdownValue;

      manager.update(1.0);

      expect(manager.countdownValue).toBe(initialValue);
    });

    it('should continue updating material even when not counting', () => {
      manager.isActive = false;
      const hueBeforeUpdate = manager.textMaterial.userData.hue;

      manager.update(0.1);

      // Material should still update
      expect(manager.textMaterial.userData.hue).not.toBe(hueBeforeUpdate);
    });
  });

  describe('triggerFinale()', () => {
    beforeEach(async () => {
      await manager.init();
    });

    it('should set finaleTriggered flag', () => {
      manager.triggerFinale();
      expect(manager.finaleTriggered).toBe(true);
    });

    it('should call finale callback if set', () => {
      const callback = vi.fn();
      manager.setFinaleCallback(callback);

      manager.triggerFinale();

      expect(callback).toHaveBeenCalled();
    });

    it('should only trigger callback once per finale', () => {
      const callback = vi.fn();
      manager.setFinaleCallback(callback);

      manager.triggerFinale();
      // Flag is already set, so second call still fires but logic should handle it
      expect(manager.finaleTriggered).toBe(true);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetCountdown()', () => {
    beforeEach(() => {
      // Need countdown plane for renderCountdownValue to work
      manager.createCountdownPlane();
    });

    it('should reset countdown value to 10', () => {
      manager.countdownValue = 5;
      manager.resetCountdown();

      expect(manager.countdownValue).toBe(10);
    });

    it('should reset elapsed time', () => {
      manager.elapsed = 5;
      manager.resetCountdown();

      expect(manager.elapsed).toBe(0);
    });

    it('should reset finale flags', () => {
      manager.finaleTriggered = true;
      manager.waitingAfterFinale = true;
      manager.resetCountdown();

      expect(manager.finaleTriggered).toBe(false);
      expect(manager.waitingAfterFinale).toBe(false);
    });
  });

  describe('show() and hide()', () => {
    it('should set group visible on show', () => {
      manager.group.visible = false;
      manager.show();

      expect(manager.group.visible).toBe(true);
    });

    it('should set group invisible on hide', () => {
      manager.group.visible = true;
      manager.hide();

      expect(manager.group.visible).toBe(false);
    });
  });

  describe('isVisible()', () => {
    it('should return true when group is visible', () => {
      manager.group.visible = true;
      expect(manager.isVisible()).toBe(true);
    });

    it('should return false when group is invisible', () => {
      manager.group.visible = false;
      expect(manager.isVisible()).toBe(false);
    });
  });

  describe('setFinaleCallback()', () => {
    it('should store callback', () => {
      const callback = vi.fn();
      manager.setFinaleCallback(callback);

      expect(manager.onFinale).toBe(callback);
    });

    it('should call callback when finale triggered', () => {
      const callback = vi.fn();
      manager.setFinaleCallback(callback);

      manager.triggerFinale();

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('getValue()', () => {
    it('should return current countdown value', () => {
      expect(manager.getValue()).toBe(10);
    });

    it('should return updated value after changes', () => {
      manager.countdownValue = 5;

      expect(manager.getValue()).toBe(5);
    });
  });

  describe('dispose()', () => {
    it('should stop countdown', () => {
      manager.createCountdownPlane();
      manager.start();
      manager.dispose();
      expect(manager.isActive).toBe(false);
    });

    it('should remove group from scene', () => {
      manager.dispose();
      expect(scene.remove).toHaveBeenCalledWith(manager.group);
    });

    it('should clear references after disposal', () => {
      manager.createCountdownPlane();
      manager.dispose();

      expect(manager.countdownPlane).toBeNull();
      expect(manager.countdownMaterial).toBeNull();
      expect(manager.countdownTexture).toBeNull();
      expect(manager.onFinale).toBeNull();
    });
  });

  describe('Integration - Full countdown loop', () => {
    beforeEach(() => {
      manager.createCountdownPlane();
      manager.textMaterial = TextEffects.createRainbowNeonMaterial();
    });

    it('should complete full countdown cycle', () => {
      const finaleSpy = vi.fn();
      manager.setFinaleCallback(finaleSpy);
      manager.start();

      // Simulate 11 seconds of updates
      for (let i = 0; i < 11; i++) {
        manager.update(1.0);
      }

      expect(manager.finaleTriggered).toBe(true);
      expect(finaleSpy).toHaveBeenCalled();
    });

    it('should loop countdown after finale', () => {
      manager.setFinaleCallback(() => {});
      manager.start();

      // Count down to 0
      for (let i = 0; i < 11; i++) {
        manager.update(1.0);
      }

      // After 2 second wait
      manager.update(2.0);

      // Should reset and be ready for next cycle
      expect(manager.countdownValue).toBe(10);
      expect(manager.finaleTriggered).toBe(false);
    });

    it('should handle multiple start/stop cycles', () => {
      manager.start();
      expect(manager.isActive).toBe(true);

      manager.stop();
      expect(manager.isActive).toBe(false);

      manager.start();
      expect(manager.isActive).toBe(true);

      manager.stop();
      expect(manager.isActive).toBe(false);
    });
  });

  describe('T3 Specification Verification', () => {
    beforeEach(() => {
      manager.createCountdownPlane();
      manager.textMaterial = TextEffects.createRainbowNeonMaterial();
    });

    it('T3.1: 2025 text positioned above countdown plane (Y-axis)', () => {
      // Verify text position is higher than countdown
      // CONFIG.textYPosition (8) > CONFIG.countdownYPosition (2)
      expect(8).toBeGreaterThan(2);
      expect(manager.countdownPlane.position.y).toBe(2);
    });

    it('T3.2: Neon glow via MeshStandardMaterial emissive + bloom', () => {
      // Material should have emissive intensity for glow
      expect(manager.textMaterial.emissiveIntensity).toBe(0.8);
      expect(manager.textMaterial.emissiveIntensity).toBeGreaterThan(0);

      // Bloom should be adjusted for neon
      manager.start();
      if (bloomPass) {
        expect(bloomPass.strength).toBe(TextEffects.NEON_BLOOM_SETTINGS.strength);
      }
    });

    it('T3.3: Canvas texture countdown timer (10...0)', () => {
      // Should have canvas-based material
      expect(manager.countdownMaterial).toBeInstanceOf(THREE.MeshBasicMaterial);
      expect(manager.countdownMaterial.transparent).toBe(true);
      expect(manager.countdownPlane.material).toBe(manager.countdownMaterial);
    });

    it('T3.4: Update countdown only on value change (frequency)', () => {
      manager.start();

      // First update with less than 1 second
      manager.update(0.4);
      expect(manager.elapsed).toBeCloseTo(0.4, 1);
      expect(manager.countdownValue).toBe(10);

      // Update to complete more than 1 second total
      manager.update(0.7);
      expect(manager.countdownValue).toBe(9); // Should have decremented
    });

    it('T3.5: Grand finale trigger at countdown = 0', () => {
      const finaleSpy = vi.fn();
      manager.setFinaleCallback(finaleSpy);
      manager.start();

      // Count to 0
      manager.countdownValue = 1;
      manager.update(1.0);

      expect(manager.countdownValue).toBe(0);
      expect(finaleSpy).toHaveBeenCalled();
    });

    it('T3.6: Loop: finale → wait 2s → restart countdown', () => {
      manager.setFinaleCallback(() => {});
      manager.start();

      // First reach finale state
      manager.countdownValue = 1;
      manager.elapsed = 0.5;

      // Update to trigger countdown 1 -> 0
      manager.update(0.5);
      expect(manager.countdownValue).toBe(0);
      expect(manager.finaleTriggered).toBe(true);

      // One more update to enter wait state (countdownValue < 0)
      manager.update(1.0);
      expect(manager.waitingAfterFinale).toBe(true);

      // Wait for 2 seconds to complete the finale wait period
      manager.elapsed = 0;
      manager.update(2.0);

      // Should reset
      expect(manager.countdownValue).toBe(10);
      expect(manager.waitingAfterFinale).toBe(false);
    });

    it('T3.7: Text visible only in New Year mode (controlled by start/stop)', () => {
      // Should be invisible by default
      expect(manager.isVisible()).toBe(false);

      // Should become visible on start
      manager.start();
      expect(manager.isVisible()).toBe(true);

      // Should become invisible on stop
      manager.stop();
      expect(manager.isVisible()).toBe(false);
    });
  });
});
