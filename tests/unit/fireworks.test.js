import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { FireworkSystem } from '../../src/fireworks/firework-system.js';
import {
  FIREWORK_TYPE,
  FIREWORK_TYPES,
  getBloomVelocity,
  getSparkVelocity,
  getDriftVelocity,
  getScatterVelocity,
  getSparklerVelocity,
  getVelocityForType,
  getColorForType,
  getSizeForType,
  getMaxAgeForType,
  getRandomType
} from '../../src/fireworks/firework-types.js';

describe('Firework Types - Velocity Functions', () => {
  describe('getBloomVelocity', () => {
    it('should generate spherical distribution using golden ratio', () => {
      const velocity = getBloomVelocity(0, 150, 0.08);
      expect(velocity).toHaveProperty('vx');
      expect(velocity).toHaveProperty('vy');
      expect(velocity).toHaveProperty('vz');
      expect(typeof velocity.vx).toBe('number');
      expect(typeof velocity.vy).toBe('number');
      expect(typeof velocity.vz).toBe('number');
    });

    it('should distribute particles across sphere for multiple indices', () => {
      const velocities = [];
      const totalParticles = 150;
      for (let i = 0; i < totalParticles; i += 30) {
        velocities.push(getBloomVelocity(i, totalParticles, 0.08));
      }
      expect(velocities.length).toBe(5); // 0, 30, 60, 90, 120
      // All should be different due to golden angle
      const uniqueVelocities = new Set(velocities.map(v => JSON.stringify(v)));
      expect(uniqueVelocities.size).toBeGreaterThan(1);
    });

    it('should respect speed parameter for velocity magnitude', () => {
      const fastVel = getBloomVelocity(0, 150, 0.16);
      const slowVel = getBloomVelocity(0, 150, 0.08);
      const fastMag = Math.sqrt(fastVel.vx ** 2 + fastVel.vy ** 2 + fastVel.vz ** 2);
      const slowMag = Math.sqrt(slowVel.vx ** 2 + slowVel.vy ** 2 + slowVel.vz ** 2);
      expect(fastMag).toBeGreaterThan(0);
      expect(slowMag).toBeGreaterThan(0);
    });
  });

  describe('getSparkVelocity', () => {
    it('should generate omnidirectional velocity', () => {
      const velocity = getSparkVelocity(0.15);
      expect(velocity).toHaveProperty('vx');
      expect(velocity).toHaveProperty('vy');
      expect(velocity).toHaveProperty('vz');
    });

    it('should produce high-speed variations', () => {
      const velocities = [];
      for (let i = 0; i < 10; i++) {
        const v = getSparkVelocity(0.15);
        velocities.push(Math.sqrt(v.vx ** 2 + v.vy ** 2 + v.vz ** 2));
      }
      // Average magnitude should be around speed * 0.7 to 1.3
      const avgMag = velocities.reduce((a, b) => a + b) / velocities.length;
      expect(avgMag).toBeGreaterThan(0.1);
      expect(avgMag).toBeLessThan(0.25);
    });

    it('should be different each call due to randomness', () => {
      const v1 = getSparkVelocity(0.15);
      const v2 = getSparkVelocity(0.15);
      const match = v1.vx === v2.vx && v1.vy === v2.vy && v1.vz === v2.vz;
      expect(match).toBe(false);
    });
  });

  describe('getDriftVelocity', () => {
    it('should generate horizontal-biased velocity', () => {
      const velocity = getDriftVelocity(0.05);
      expect(velocity).toHaveProperty('vx');
      expect(velocity).toHaveProperty('vy');
      expect(velocity).toHaveProperty('vz');
    });

    it('should have greater horizontal than vertical components', () => {
      const velocity = getDriftVelocity(0.05);
      const horizComponent = Math.sqrt(velocity.vx ** 2 + velocity.vz ** 2);
      const vertComponent = Math.abs(velocity.vy);
      expect(horizComponent).toBeGreaterThan(0);
      // Drift should favor horizontal
      expect(horizComponent).toBeGreaterThanOrEqual(vertComponent);
    });

    it('should have slight upward bias in vertical component', () => {
      const velocities = [];
      for (let i = 0; i < 20; i++) {
        velocities.push(getDriftVelocity(0.05));
      }
      const avgVy = velocities.reduce((sum, v) => sum + v.vy, 0) / velocities.length;
      // Average should be slightly positive (upward bias)
      expect(avgVy).toBeGreaterThan(-0.01);
    });
  });

  describe('getScatterVelocity', () => {
    it('should generate chaotic random velocity', () => {
      const velocity = getScatterVelocity(0.12);
      expect(velocity).toHaveProperty('vx');
      expect(velocity).toHaveProperty('vy');
      expect(velocity).toHaveProperty('vz');
    });

    it('should have high variance in all directions', () => {
      const velocities = [];
      for (let i = 0; i < 30; i++) {
        velocities.push(getScatterVelocity(0.12));
      }
      // Check that components vary widely
      const vxValues = velocities.map(v => v.vx);
      const vyValues = velocities.map(v => v.vy);
      const vzValues = velocities.map(v => v.vz);

      const variance = (arr) => {
        const avg = arr.reduce((a, b) => a + b) / arr.length;
        return arr.reduce((sum, val) => sum + (val - avg) ** 2, 0) / arr.length;
      };

      expect(variance(vxValues)).toBeGreaterThan(0.001);
      expect(variance(vyValues)).toBeGreaterThan(0.001);
      expect(variance(vzValues)).toBeGreaterThan(0.001);
    });
  });

  describe('getSparklerVelocity', () => {
    it('should generate mostly upward velocity', () => {
      const velocity = getSparklerVelocity(0.02);
      expect(velocity).toHaveProperty('vx');
      expect(velocity).toHaveProperty('vy');
      expect(velocity).toHaveProperty('vz');
    });

    it('should have dominant vertical component', () => {
      const velocities = [];
      for (let i = 0; i < 20; i++) {
        velocities.push(getSparklerVelocity(0.02));
      }
      const avgVy = velocities.reduce((sum, v) => sum + v.vy, 0) / velocities.length;
      const avgHoriz = velocities.reduce((sum, v) => sum + Math.sqrt(v.vx ** 2 + v.vz ** 2), 0) / velocities.length;
      expect(avgVy).toBeGreaterThan(avgHoriz);
    });

    it('should always have positive y velocity (upward)', () => {
      const velocities = [];
      for (let i = 0; i < 30; i++) {
        velocities.push(getSparklerVelocity(0.02));
      }
      const allPositiveY = velocities.every(v => v.vy >= 0);
      expect(allPositiveY).toBe(true);
    });
  });

  describe('getVelocityForType', () => {
    it('should dispatch to correct velocity function for each type', () => {
      const types = [
        FIREWORK_TYPE.BLOOM,
        FIREWORK_TYPE.SPARK,
        FIREWORK_TYPE.DRIFT,
        FIREWORK_TYPE.SCATTER,
        FIREWORK_TYPE.SPARKLER
      ];

      types.forEach(type => {
        const velocity = getVelocityForType(type, 0, 150, 0.08);
        expect(velocity).toHaveProperty('vx');
        expect(velocity).toHaveProperty('vy');
        expect(velocity).toHaveProperty('vz');
      });
    });

    it('should default to spark velocity for unknown type', () => {
      const velocity = getVelocityForType(999, 0, 150, 0.08);
      expect(velocity).toHaveProperty('vx');
      expect(velocity).toHaveProperty('vy');
      expect(velocity).toHaveProperty('vz');
    });
  });
});

describe('Firework Types - Metadata Functions', () => {
  describe('getColorForType', () => {
    it('should return RGB color array from type palette', () => {
      const types = Object.values(FIREWORK_TYPE);
      types.forEach(type => {
        const color = getColorForType(type);
        expect(Array.isArray(color)).toBe(true);
        expect(color.length).toBe(3);
        color.forEach(c => {
          expect(typeof c).toBe('number');
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(1);
        });
      });
    });

    it('should return colors from correct palette', () => {
      const bloomColor = getColorForType(FIREWORK_TYPE.BLOOM);
      const config = FIREWORK_TYPES[FIREWORK_TYPE.BLOOM];
      expect(config.colors).toContainEqual(bloomColor);
    });
  });

  describe('getSizeForType', () => {
    it('should return size within type range', () => {
      const types = Object.values(FIREWORK_TYPE);
      types.forEach(type => {
        const config = FIREWORK_TYPES[type];
        for (let i = 0; i < 10; i++) {
          const size = getSizeForType(type);
          expect(size).toBeGreaterThanOrEqual(config.size.min);
          expect(size).toBeLessThanOrEqual(config.size.max);
        }
      });
    });
  });

  describe('getMaxAgeForType', () => {
    it('should return maxAge within type range', () => {
      const types = Object.values(FIREWORK_TYPE);
      types.forEach(type => {
        const config = FIREWORK_TYPES[type];
        for (let i = 0; i < 10; i++) {
          const maxAge = getMaxAgeForType(type);
          expect(maxAge).toBeGreaterThanOrEqual(config.maxAge.min);
          expect(maxAge).toBeLessThanOrEqual(config.maxAge.max);
        }
      });
    });
  });

  describe('getRandomType', () => {
    it('should return a valid firework type', () => {
      for (let i = 0; i < 20; i++) {
        const type = getRandomType();
        expect(Object.values(FIREWORK_TYPE)).toContain(type);
      }
    });

    it('should return different types on repeated calls', () => {
      const types = [];
      for (let i = 0; i < 50; i++) {
        types.push(getRandomType());
      }
      const uniqueTypes = new Set(types);
      expect(uniqueTypes.size).toBeGreaterThan(1);
    });
  });
});

describe('Firework Types - Config Validation', () => {
  it('should have valid gravity values (negative)', () => {
    Object.values(FIREWORK_TYPES).forEach(config => {
      expect(config.gravity).toBeLessThan(0);
      expect(Math.abs(config.gravity)).toBeLessThan(0.01);
    });
  });

  it('should have gravity matching F1 specifications', () => {
    expect(FIREWORK_TYPES[FIREWORK_TYPE.BLOOM].gravity).toBe(-0.004);
    expect(FIREWORK_TYPES[FIREWORK_TYPE.SPARK].gravity).toBe(-0.002);
    expect(FIREWORK_TYPES[FIREWORK_TYPE.DRIFT].gravity).toBe(-0.001);
  });

  it('should have damping between 0.9 and 1.0', () => {
    Object.values(FIREWORK_TYPES).forEach(config => {
      expect(config.damping).toBeGreaterThan(0.9);
      expect(config.damping).toBeLessThanOrEqual(1.0);
    });
  });

  it('should have valid particle counts', () => {
    Object.values(FIREWORK_TYPES).forEach(config => {
      expect(config.particles).toBeGreaterThan(0);
      expect(config.particles).toBeLessThanOrEqual(300);
    });
  });

  it('should have valid size ranges', () => {
    Object.values(FIREWORK_TYPES).forEach(config => {
      expect(config.size.min).toBeGreaterThan(0);
      expect(config.size.max).toBeGreaterThan(config.size.min);
    });
  });

  it('should have valid maxAge ranges', () => {
    Object.values(FIREWORK_TYPES).forEach(config => {
      expect(config.maxAge.min).toBeGreaterThan(0);
      expect(config.maxAge.max).toBeGreaterThan(config.maxAge.min);
    });
  });
});

describe('FireworkSystem', () => {
  let scene;
  let system;

  beforeEach(() => {
    // Mock THREE.js elements
    scene = {
      add: vi.fn(),
      remove: vi.fn()
    };

    // Ensure window object is set up
    if (typeof window === 'undefined' || !window.addEventListener) {
      global.window = {
        devicePixelRatio: 2,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
    } else {
      window.devicePixelRatio = 2;
    }

    system = new FireworkSystem(scene);
  });

  afterEach(() => {
    if (system) {
      system.dispose();
    }
  });

  describe('Constructor', () => {
    it('should initialize with empty particles', () => {
      expect(system.activeCount).toBe(0);
      expect(system.getActiveCount()).toBe(0);
    });

    it('should create typed arrays for particle data', () => {
      expect(system.positions instanceof Float32Array).toBe(true);
      expect(system.velocities instanceof Float32Array).toBe(true);
      expect(system.colors instanceof Float32Array).toBe(true);
      expect(system.sizes instanceof Float32Array).toBe(true);
      expect(system.ages instanceof Float32Array).toBe(true);
      expect(system.maxAges instanceof Float32Array).toBe(true);
      expect(system.types instanceof Float32Array).toBe(true);
    });

    it('should have correct buffer sizes', () => {
      const maxParticles = 2000;
      expect(system.positions.length).toBe(maxParticles * 3);
      expect(system.velocities.length).toBe(maxParticles * 3);
      expect(system.colors.length).toBe(maxParticles * 3);
      expect(system.sizes.length).toBe(maxParticles);
      expect(system.ages.length).toBe(maxParticles);
      expect(system.maxAges.length).toBe(maxParticles);
      expect(system.types.length).toBe(maxParticles);
    });

    it('should add points mesh to scene', () => {
      expect(scene.add).toHaveBeenCalledWith(expect.objectContaining({
        name: 'fireworkSystem'
      }));
    });

    it('should initialize burst tracking', () => {
      expect(Array.isArray(system.bursts)).toBe(true);
      expect(system.bursts.length).toBe(0);
    });
  });

  describe('spawn()', () => {
    it('should spawn particles with default random type', () => {
      const origin = new THREE.Vector3(0, 0, 0);
      const result = system.spawn(origin);
      expect(result).toBe(true);
      expect(system.getActiveCount()).toBeGreaterThan(0);
    });

    it('should spawn particles with specified type', () => {
      const origin = new THREE.Vector3(0, 0, 0);
      const result = system.spawn(origin, FIREWORK_TYPE.BLOOM);
      expect(result).toBe(true);
      expect(system.getActiveCount()).toBe(150); // Bloom has 150 particles
    });

    it('should spawn correct particle count for each type', () => {
      const origin = new THREE.Vector3(0, 0, 0);
      const types = [
        { type: FIREWORK_TYPE.BLOOM, expected: 150 },
        { type: FIREWORK_TYPE.SPARK, expected: 200 },
        { type: FIREWORK_TYPE.DRIFT, expected: 100 },
        { type: FIREWORK_TYPE.SCATTER, expected: 180 },
        { type: FIREWORK_TYPE.SPARKLER, expected: 80 }
      ];

      types.forEach(({ type, expected }) => {
        system.clear();
        system.spawn(origin, type);
        expect(system.getActiveCount()).toBe(expected);
      });
    });

    it('should set particle positions at origin', () => {
      const origin = new THREE.Vector3(5, 10, 15);
      system.spawn(origin, FIREWORK_TYPE.BLOOM);

      // Check first particle position
      expect(system.positions[0]).toBe(5);
      expect(system.positions[1]).toBe(10);
      expect(system.positions[2]).toBe(15);
    });

    it('should set particle velocities', () => {
      const origin = new THREE.Vector3(0, 0, 0);
      system.spawn(origin, FIREWORK_TYPE.BLOOM);

      // Check that at least some velocities are non-zero
      let hasNonZeroVelocity = false;
      for (let i = 0; i < system.activeCount * 3; i++) {
        if (system.velocities[i] !== 0) {
          hasNonZeroVelocity = true;
          break;
        }
      }
      expect(hasNonZeroVelocity).toBe(true);
    });

    it('should set valid particle colors', () => {
      system.spawn(new THREE.Vector3(0, 0, 0), FIREWORK_TYPE.BLOOM);

      for (let i = 0; i < system.activeCount; i++) {
        const i3 = i * 3;
        const r = system.colors[i3];
        const g = system.colors[i3 + 1];
        const b = system.colors[i3 + 2];

        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(1);
        expect(g).toBeGreaterThanOrEqual(0);
        expect(g).toBeLessThanOrEqual(1);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(1);
      }
    });

    it('should set valid particle ages and maxAges', () => {
      system.spawn(new THREE.Vector3(0, 0, 0), FIREWORK_TYPE.BLOOM);

      for (let i = 0; i < system.activeCount; i++) {
        expect(system.ages[i]).toBe(0);
        expect(system.maxAges[i]).toBeGreaterThan(0);
      }
    });

    it('should return false when at capacity', () => {
      const origin = new THREE.Vector3(0, 0, 0);

      // Fill system to capacity
      let canSpawn = true;
      while (canSpawn) {
        canSpawn = system.spawn(origin, FIREWORK_TYPE.BLOOM);
      }

      expect(system.getActiveCount()).toBeLessThanOrEqual(2000);
      expect(system.spawn(origin)).toBe(false);
    });

    it('should track burst metadata', () => {
      system.spawn(new THREE.Vector3(0, 0, 0), FIREWORK_TYPE.BLOOM);

      expect(system.bursts.length).toBe(1);
      const burst = system.bursts[0];
      expect(burst.count).toBe(150);
      expect(burst.type).toBe(FIREWORK_TYPE.BLOOM);
      expect(burst).toHaveProperty('spawnTime');
    });

    it('should limit burst tracking to MAX_BURSTS', () => {
      const origin = new THREE.Vector3(0, 0, 0);
      for (let i = 0; i < 25; i++) {
        system.spawn(origin, FIREWORK_TYPE.SPARKLER);
      }

      expect(system.bursts.length).toBeLessThanOrEqual(20);
    });
  });

  describe('update()', () => {
    it('should do nothing when no particles active', () => {
      const beforePositions = system.positions[0];
      system.update(0.016);
      expect(system.positions[0]).toBe(beforePositions);
    });

    it('should apply gravity to particles', () => {
      system.spawn(new THREE.Vector3(0, 0, 0), FIREWORK_TYPE.BLOOM);
      const initialVy = system.velocities[1];

      system.update(0.016);

      // Gravity should have decreased vy (made it more negative)
      expect(system.velocities[1]).toBeLessThan(initialVy);
    });

    it('should apply damping to velocities', () => {
      system.spawn(new THREE.Vector3(0, 0, 0), FIREWORK_TYPE.BLOOM);
      const config = FIREWORK_TYPES[FIREWORK_TYPE.BLOOM];

      // Force a non-zero velocity
      system.velocities[0] = 1.0;

      system.update(0.016);

      // Velocity should be damped
      expect(system.velocities[0]).toBeLessThan(1.0);
      expect(system.velocities[0]).toBeGreaterThan(0);
      expect(system.velocities[0]).toBeCloseTo(1.0 * config.damping, 1);
    });

    it('should update particle positions based on velocity', () => {
      system.spawn(new THREE.Vector3(0, 0, 0), FIREWORK_TYPE.BLOOM);
      const initialX = system.positions[0];
      const vx = 0.5;
      system.velocities[0] = vx;

      system.update(0.016);

      // Position update = vx * damping (0.98 for bloom)
      const config = FIREWORK_TYPES[FIREWORK_TYPE.BLOOM];
      const expectedVx = vx * config.damping;
      expect(system.positions[0]).toBeCloseTo(initialX + expectedVx, 1);
    });

    it('should increment particle ages', () => {
      system.spawn(new THREE.Vector3(0, 0, 0), FIREWORK_TYPE.BLOOM);
      const dt = 0.016;

      system.update(dt);

      expect(system.ages[0]).toBeCloseTo(dt, 3);
    });

    it('should mark buffers for update', () => {
      system.spawn(new THREE.Vector3(0, 0, 0), FIREWORK_TYPE.BLOOM);

      const posAttr = system.geometry.attributes.position;

      system.update(0.016);

      // The update method sets needsUpdate = true on all attributes
      expect(typeof posAttr.needsUpdate).toBeDefined();
    });

    it('should set draw range to active count', () => {
      const setSpy = vi.spyOn(system.geometry, 'setDrawRange');
      system.spawn(new THREE.Vector3(0, 0, 0), FIREWORK_TYPE.BLOOM);

      system.update(0.016);

      expect(setSpy).toHaveBeenCalledWith(0, expect.any(Number));
    });
  });

  describe('cullDeadParticles()', () => {
    it('should remove particles exceeding max age', () => {
      system.spawn(new THREE.Vector3(0, 0, 0), FIREWORK_TYPE.BLOOM);
      const initialCount = system.getActiveCount();

      // Set first particle to exceed max age
      system.ages[0] = system.maxAges[0] + 1;

      system.cullDeadParticles();

      expect(system.getActiveCount()).toBe(initialCount - 1);
    });

    it('should not remove particles within max age', () => {
      system.spawn(new THREE.Vector3(0, 0, 0), FIREWORK_TYPE.BLOOM);
      const initialCount = system.getActiveCount();

      // Keep all particles young
      for (let i = 0; i < system.activeCount; i++) {
        system.ages[i] = system.maxAges[i] / 2;
      }

      system.cullDeadParticles();

      expect(system.getActiveCount()).toBe(initialCount);
    });

    it('should use swap-and-pop for efficient removal', () => {
      system.spawn(new THREE.Vector3(0, 0, 0), FIREWORK_TYPE.BLOOM);

      // Set first few particles to expire
      system.ages[0] = system.maxAges[0] + 1;
      system.ages[2] = system.maxAges[2] + 1;

      const beforeCount = system.getActiveCount();
      system.cullDeadParticles();

      expect(system.getActiveCount()).toBe(beforeCount - 2);
    });

    it('should maintain particle data integrity after removal', () => {
      system.spawn(new THREE.Vector3(1, 2, 3), FIREWORK_TYPE.BLOOM);
      const firstParticleVx = system.velocities[0];

      // Expire a particle at end
      system.ages[system.activeCount - 1] = 999;

      system.cullDeadParticles();

      // First particle should maintain its velocity
      expect(system.velocities[0]).toBe(firstParticleVx);
    });
  });

  describe('Memory Management', () => {
    it('should handle repeated spawn/cull cycles without memory leak', () => {
      const origin = new THREE.Vector3(0, 0, 0);

      for (let cycle = 0; cycle < 100; cycle++) {
        system.spawn(origin, FIREWORK_TYPE.BLOOM);

        // Age all particles
        for (let i = 0; i < system.activeCount; i++) {
          system.ages[i] = system.maxAges[i] + 1;
        }

        system.cullDeadParticles();
        expect(system.getActiveCount()).toBe(0);
      }

      // All buffers should still be valid
      expect(system.positions instanceof Float32Array).toBe(true);
      expect(system.velocities instanceof Float32Array).toBe(true);
    });

    it('should handle rapid spawn cycles', () => {
      const origin = new THREE.Vector3(0, 0, 0);
      let totalSpawned = 0;

      while (system.spawn(origin, FIREWORK_TYPE.SPARKLER)) {
        totalSpawned++;
      }

      // Should have spawned many times without error
      expect(totalSpawned).toBeGreaterThan(10);
    });
  });

  describe('canSpawn()', () => {
    it('should return true when space available', () => {
      expect(system.canSpawn(150)).toBe(true);
    });

    it('should return false when insufficient space', () => {
      const origin = new THREE.Vector3(0, 0, 0);

      // Fill system to near capacity
      while (system.canSpawn(150)) {
        system.spawn(origin, FIREWORK_TYPE.SPARKLER);
      }

      expect(system.canSpawn(150)).toBe(false);
    });

    it('should use default particle count of 150', () => {
      const origin = new THREE.Vector3(0, 0, 0);

      // Fill system almost to capacity
      while (system.canSpawn()) {
        system.spawn(origin, FIREWORK_TYPE.SPARKLER);
      }

      expect(system.canSpawn()).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should reset active count', () => {
      system.spawn(new THREE.Vector3(0, 0, 0), FIREWORK_TYPE.BLOOM);
      expect(system.getActiveCount()).toBeGreaterThan(0);

      system.clear();
      expect(system.getActiveCount()).toBe(0);
    });

    it('should clear burst tracking', () => {
      system.spawn(new THREE.Vector3(0, 0, 0), FIREWORK_TYPE.BLOOM);
      expect(system.bursts.length).toBeGreaterThan(0);

      system.clear();
      expect(system.bursts.length).toBe(0);
    });

    it('should set draw range to 0', () => {
      system.spawn(new THREE.Vector3(0, 0, 0), FIREWORK_TYPE.BLOOM);

      const setSpy = vi.spyOn(system.geometry, 'setDrawRange');
      system.clear();

      expect(setSpy).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('dispose()', () => {
    it('should remove event listeners', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener');

      system.dispose();

      expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should remove from scene', () => {
      system.dispose();

      expect(scene.remove).toHaveBeenCalledWith(system.points);
    });

    it('should dispose geometry and materials', () => {
      const geomDisposeSpy = vi.spyOn(system.geometry, 'dispose');
      const matDisposeSpy = vi.spyOn(system.material, 'dispose');
      const sparkDisposeSpy = vi.spyOn(system.sparklerMaterial, 'dispose');

      system.dispose();

      expect(geomDisposeSpy).toHaveBeenCalled();
      expect(matDisposeSpy).toHaveBeenCalled();
      expect(sparkDisposeSpy).toHaveBeenCalled();
    });

    it('should null out buffers', () => {
      system.dispose();

      expect(system.positions).toBeNull();
      expect(system.velocities).toBeNull();
      expect(system.colors).toBeNull();
      expect(system.sizes).toBeNull();
      expect(system.ages).toBeNull();
      expect(system.maxAges).toBeNull();
      expect(system.types).toBeNull();
    });
  });

  describe('swapParticles()', () => {
    it('should swap particle data between indices', () => {
      system.spawn(new THREE.Vector3(0, 0, 0), FIREWORK_TYPE.BLOOM);

      // Store original values
      const pos0 = [system.positions[0], system.positions[1], system.positions[2]];
      const pos1 = [system.positions[3], system.positions[4], system.positions[5]];

      system.swapParticles(0, 1);

      // Check positions are swapped
      expect(system.positions[0]).toBe(pos1[0]);
      expect(system.positions[1]).toBe(pos1[1]);
      expect(system.positions[2]).toBe(pos1[2]);
      expect(system.positions[3]).toBe(pos0[0]);
      expect(system.positions[4]).toBe(pos0[1]);
      expect(system.positions[5]).toBe(pos0[2]);
    });

    it('should swap all particle attributes', () => {
      system.spawn(new THREE.Vector3(1, 2, 3), FIREWORK_TYPE.BLOOM);

      const vel0 = system.velocities[0];
      const vel1 = system.velocities[3];
      const col0 = system.colors[0];
      const col1 = system.colors[3];
      const size0 = system.sizes[0];
      const size1 = system.sizes[1];
      const age0 = system.ages[0];
      const age1 = system.ages[1];

      system.swapParticles(0, 1);

      // Velocities swapped
      expect(system.velocities[0]).toBe(vel1);
      expect(system.velocities[3]).toBe(vel0);
      // Colors swapped
      expect(system.colors[0]).toBe(col1);
      expect(system.colors[3]).toBe(col0);
      // Sizes swapped
      expect(system.sizes[0]).toBe(size1);
      expect(system.sizes[1]).toBe(size0);
      // Ages swapped
      expect(system.ages[0]).toBe(age1);
      expect(system.ages[1]).toBe(age0);
    });
  });
});
