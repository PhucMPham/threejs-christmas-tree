/**
 * Tests for gesture detection finger counting functions
 */

import { describe, it, expect, vi } from 'vitest';
import { countFingers, getHandCenter, getStableFingerCount } from '../../src/christmas-tree/gesture-detection.js';

// Helper: create mock landmarks for N extended fingers
function createMockLandmarks(fingersExtended = 5, thumbExtended = true) {
  // Base positions for landmarks
  const landmarks = [];

  // Wrist (0)
  landmarks[0] = { x: 0.5, y: 0.8 };

  // Thumb: 1-4
  landmarks[1] = { x: 0.45, y: 0.7 };
  landmarks[2] = { x: 0.4, y: 0.65 };
  landmarks[3] = { x: 0.35, y: 0.6 };
  landmarks[4] = { x: thumbExtended ? 0.3 : 0.45, y: 0.55 }; // tip far from index MCP if extended

  // Index: 5-8
  landmarks[5] = { x: 0.45, y: 0.55 }; // MCP
  landmarks[6] = { x: 0.45, y: fingersExtended >= 1 ? 0.45 : 0.5 }; // PIP
  landmarks[7] = { x: 0.45, y: fingersExtended >= 1 ? 0.35 : 0.52 };
  landmarks[8] = { x: 0.45, y: fingersExtended >= 1 ? 0.25 : 0.55 }; // tip above PIP if extended

  // Middle: 9-12
  landmarks[9] = { x: 0.5, y: 0.5 }; // MCP
  landmarks[10] = { x: 0.5, y: fingersExtended >= 2 ? 0.4 : 0.52 }; // PIP
  landmarks[11] = { x: 0.5, y: fingersExtended >= 2 ? 0.3 : 0.54 };
  landmarks[12] = { x: 0.5, y: fingersExtended >= 2 ? 0.2 : 0.56 }; // tip

  // Ring: 13-16
  landmarks[13] = { x: 0.55, y: 0.55 };
  landmarks[14] = { x: 0.55, y: fingersExtended >= 3 ? 0.45 : 0.57 }; // PIP
  landmarks[15] = { x: 0.55, y: fingersExtended >= 3 ? 0.35 : 0.59 };
  landmarks[16] = { x: 0.55, y: fingersExtended >= 3 ? 0.25 : 0.61 }; // tip

  // Pinky: 17-20
  landmarks[17] = { x: 0.6, y: 0.6 }; // MCP
  landmarks[18] = { x: 0.6, y: fingersExtended >= 4 ? 0.5 : 0.62 }; // PIP
  landmarks[19] = { x: 0.6, y: fingersExtended >= 4 ? 0.4 : 0.64 };
  landmarks[20] = { x: 0.6, y: fingersExtended >= 4 ? 0.3 : 0.66 }; // tip

  return [landmarks];
}

describe('countFingers', () => {
  it('returns 0 count with empty landmarks', () => {
    const result = countFingers([]);
    expect(result.count).toBe(0);
    expect(result.confidence).toBe(0);
  });

  it('returns 0 count with null landmarks', () => {
    const result = countFingers(null);
    expect(result.count).toBe(0);
  });

  it('counts 5 fingers for open hand', () => {
    const landmarks = createMockLandmarks(4, true); // 4 fingers + thumb
    const result = countFingers(landmarks);
    expect(result.count).toBe(5);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('counts 0 fingers for fist', () => {
    const landmarks = createMockLandmarks(0, false);
    const result = countFingers(landmarks);
    expect(result.count).toBe(0);
  });

  it('counts 2 fingers for peace sign (index + middle)', () => {
    const landmarks = createMockLandmarks(2, false);
    const result = countFingers(landmarks);
    expect(result.count).toBe(2);
  });

  it('counts 1 finger for thumbs up', () => {
    const landmarks = createMockLandmarks(0, true);
    const result = countFingers(landmarks);
    expect(result.count).toBe(1);
  });
});

describe('getHandCenter', () => {
  it('returns detected:false for empty landmarks', () => {
    const result = getHandCenter([]);
    expect(result.detected).toBe(false);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('returns detected:false for null landmarks', () => {
    const result = getHandCenter(null);
    expect(result.detected).toBe(false);
  });

  it('returns normalized center for valid landmarks', () => {
    const landmarks = createMockLandmarks();
    const result = getHandCenter(landmarks);
    expect(result.detected).toBe(true);
    expect(result.x).toBeGreaterThan(-1);
    expect(result.x).toBeLessThan(1);
    expect(result.y).toBeGreaterThan(-1);
    expect(result.y).toBeLessThan(1);
  });

  it('returns center position in expected range', () => {
    const landmarks = [[
      { x: 0.5, y: 0.5 }, // wrist (0)
      ...Array(4).fill({ x: 0.5, y: 0.5 }), // 1-4
      { x: 0.5, y: 0.5 }, // index MCP (5)
      ...Array(11).fill({ x: 0.5, y: 0.5 }), // 6-16
      { x: 0.5, y: 0.5 }, // pinky MCP (17)
      ...Array(3).fill({ x: 0.5, y: 0.5 }) // 18-20
    ]];
    const result = getHandCenter(landmarks);
    expect(result.x).toBeCloseTo(0, 1);
    expect(result.y).toBeCloseTo(0, 1);
  });
});

describe('getStableFingerCount', () => {
  it('returns same count when called repeatedly with same value', () => {
    // Call multiple times with same value
    const result1 = getStableFingerCount(3);
    const result2 = getStableFingerCount(3);
    const result3 = getStableFingerCount(3);
    // Should return consistent value
    expect(result2).toBe(result1);
    expect(result3).toBe(result1);
  });

  it('eventually accepts new count after hysteresis period', async () => {
    // Initial call to set baseline
    getStableFingerCount(2);

    // Wait past hysteresis period (100ms) and call again
    await new Promise(r => setTimeout(r, 150));
    const result = getStableFingerCount(2);

    // Should have the expected count
    expect(result).toBe(2);
  });

  it('returns a number for valid input', () => {
    const result = getStableFingerCount(4);
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(5);
  });
});
