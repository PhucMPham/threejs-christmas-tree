/**
 * Gesture Detection Module
 * MediaPipe HandLandmarker integration and gesture recognition.
 */

import { isMobileDevice } from './mobile-detection.js';

// Hysteresis state for stable finger counting
let lastFingerCount = 0;
let fingerCountStableTime = 0;
const FINGER_HYSTERESIS_MS = 100;

// MediaPipe model configuration
const MEDIAPIPE_CONFIG = {
  modelUrl: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  wasmUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
};

/**
 * Initialize MediaPipe HandLandmarker with GPU/CPU fallback
 * @param {Object} FilesetResolver - MediaPipe FilesetResolver
 * @param {Object} HandLandmarker - MediaPipe HandLandmarker class
 * @returns {Promise<Object>} Initialized HandLandmarker instance
 */
export async function initHandLandmarker(FilesetResolver, HandLandmarker) {
  const isMobile = isMobileDevice();

  // Load vision tasks
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_CONFIG.wasmUrl);

  // Try GPU first, fallback to CPU on mobile if needed
  const delegates = isMobile ? ['GPU', 'CPU'] : ['GPU'];
  let landmarker = null;
  let lastError = null;

  for (const delegate of delegates) {
    try {
      landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MEDIAPIPE_CONFIG.modelUrl,
          delegate: delegate
        },
        runningMode: 'VIDEO',
        numHands: 1
      });
      console.log(`HandLandmarker initialized with ${delegate} delegate`);
      break;
    } catch (err) {
      console.warn(`Failed to init HandLandmarker with ${delegate}:`, err);
      lastError = err;
    }
  }

  if (!landmarker) {
    throw new Error(`Failed to initialize hand tracking: ${lastError?.message || 'Unknown error'}`);
  }

  return landmarker;
}

/**
 * Process hand landmarks and detect gestures
 * @param {Array} landmarks - MediaPipe hand landmarks array
 * @returns {{detected: boolean, gesture: string|null, handX: number, handY: number}}
 * Gestures: 'FIST' (closed), 'OPEN' (spread), 'PINCH' (thumb-index close)
 */
export function processHandGesture(landmarks) {
  if (!landmarks || landmarks.length === 0) {
    return { detected: false, gesture: null, handX: 0, handY: 0 };
  }

  const lm = landmarks[0];
  const wrist = lm[0];
  const middleMCP = lm[9];

  // Calculate hand center position (normalized -1 to 1)
  const handX = (lm[9].x - 0.5) * 2;
  const handY = (lm[9].y - 0.5) * 2;

  // Calculate hand size for gesture recognition
  const handSize = Math.hypot(middleMCP.x - wrist.x, middleMCP.y - wrist.y);

  // Skip if hand too small (far away or detection noise)
  if (handSize < 0.02) {
    return { detected: true, gesture: null, handX, handY };
  }

  // Calculate finger tip distances from wrist
  const tipIndices = [8, 12, 16, 20]; // index, middle, ring, pinky tips
  let avgTipDist = 0;
  tipIndices.forEach(idx => {
    avgTipDist += Math.hypot(lm[idx].x - wrist.x, lm[idx].y - wrist.y);
  });
  avgTipDist /= 4;

  // Calculate pinch distance (thumb tip to index tip)
  const pinchDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);

  // Ratios for gesture detection
  const extensionRatio = avgTipDist / handSize;
  const pinchRatio = pinchDist / handSize;

  // Determine gesture
  let gesture = null;
  if (extensionRatio < 1.5) {
    gesture = 'FIST';
  } else if (pinchRatio < 0.35) {
    gesture = 'PINCH';
  } else if (extensionRatio > 1.7) {
    gesture = 'OPEN';
  }

  return { detected: true, gesture, handX, handY };
}

/**
 * Count extended fingers (0-5) from hand landmarks
 * @param {Array} landmarks - MediaPipe hand landmarks array
 * @returns {{count: number, confidence: number}}
 */
export function countFingers(landmarks) {
  if (!landmarks || landmarks.length === 0) {
    return { count: 0, confidence: 0 };
  }

  const lm = landmarks[0];
  let count = 0;

  const wrist = lm[0];

  // Thumb: extended if tip (4) is far from index MCP (5) horizontally
  const thumbTip = lm[4];
  const indexMcp = lm[5];
  const thumbExtended = Math.abs(thumbTip.x - indexMcp.x) > 0.05;
  if (thumbExtended) count++;

  // Other fingers: extended if tip is above PIP (lower y = higher on screen)
  if (lm[8].y < lm[6].y) count++;   // Index
  if (lm[12].y < lm[10].y) count++; // Middle
  if (lm[16].y < lm[14].y) count++; // Ring
  if (lm[20].y < lm[18].y) count++; // Pinky

  // Confidence based on hand size
  const handSize = Math.hypot(lm[9].x - wrist.x, lm[9].y - wrist.y);
  const confidence = Math.min(1, handSize / 0.15);

  return { count, confidence };
}

/**
 * Get normalized hand center position (-1 to 1 range)
 * @param {Array} landmarks - MediaPipe hand landmarks array
 * @returns {{x: number, y: number, detected: boolean}}
 */
export function getHandCenter(landmarks) {
  if (!landmarks || landmarks.length === 0) {
    return { x: 0, y: 0, detected: false };
  }

  const lm = landmarks[0];

  // Palm center: average of wrist, index MCP, pinky MCP
  const palmX = (lm[0].x + lm[5].x + lm[17].x) / 3;
  const palmY = (lm[0].y + lm[5].y + lm[17].y) / 3;

  // Normalize to -1 to 1 range
  const x = (palmX - 0.5) * 2;
  const y = (palmY - 0.5) * 2;

  return { x, y, detected: true };
}

/**
 * Get stable finger count with hysteresis to prevent flickering
 * @param {number} rawCount - Current detected finger count
 * @returns {number} Stable finger count
 */
export function getStableFingerCount(rawCount) {
  const now = performance.now();

  if (rawCount === lastFingerCount) {
    fingerCountStableTime = 0;
    return lastFingerCount;
  }

  // Count changed - check stability
  if (fingerCountStableTime === 0) {
    fingerCountStableTime = now;
  }

  if (now - fingerCountStableTime >= FINGER_HYSTERESIS_MS) {
    lastFingerCount = rawCount;
    fingerCountStableTime = 0;
    return rawCount;
  }

  return lastFingerCount;
}
