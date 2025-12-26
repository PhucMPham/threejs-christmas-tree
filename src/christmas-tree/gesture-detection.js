/**
 * Gesture Detection Module
 * MediaPipe HandLandmarker integration and gesture recognition.
 */

import { isMobileDevice } from './mobile-detection.js';

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
