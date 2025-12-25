/**
 * Camera Gesture Controller for Mobile (iOS/Android)
 * Handles camera access, MediaPipe hand detection, and gesture recognition
 * with optimizations for mobile browsers.
 */

const GESTURE_CONFIG = {
  // Camera constraints optimized for mobile
  camera: {
    mobile: {
      video: {
        facingMode: 'user',
        width: { ideal: 320, max: 640 },
        height: { ideal: 240, max: 480 },
        frameRate: { ideal: 15, max: 30 }
      }
    },
    desktop: {
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    }
  },
  // MediaPipe model configuration
  mediapipe: {
    modelUrl: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    wasmUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
  }
};

/**
 * Detects if current device is mobile
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
}

/**
 * Detects iOS Safari specifically
 */
export function isIOSSafari() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua);
  return isIOS && isSafari;
}

/**
 * Check if camera is available and permissions can be requested
 */
export async function checkCameraAvailability() {
  // Check HTTPS requirement (except localhost)
  const isSecure = window.location.protocol === 'https:' ||
                   window.location.hostname === 'localhost' ||
                   window.location.hostname === '127.0.0.1';

  if (!isSecure) {
    return {
      available: false,
      reason: 'HTTPS required for camera access',
      code: 'INSECURE_CONTEXT'
    };
  }

  // Check if getUserMedia is supported
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      available: false,
      reason: 'Camera not supported in this browser',
      code: 'NOT_SUPPORTED'
    };
  }

  // Check if any video input devices exist
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some(device => device.kind === 'videoinput');
    if (!hasCamera) {
      return {
        available: false,
        reason: 'No camera detected on this device',
        code: 'NO_CAMERA'
      };
    }
  } catch (err) {
    // enumerateDevices may fail without permission, continue anyway
  }

  return { available: true };
}

/**
 * Request camera permission with mobile-optimized constraints
 */
export async function requestCameraAccess(videoElement) {
  const check = await checkCameraAvailability();
  if (!check.available) {
    throw new CameraError(check.reason, check.code);
  }

  const isMobile = isMobileDevice();
  const constraints = isMobile ? GESTURE_CONFIG.camera.mobile : GESTURE_CONFIG.camera.desktop;

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;

    // Wait for video to be ready
    await new Promise((resolve, reject) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play()
          .then(resolve)
          .catch(reject);
      };
      videoElement.onerror = reject;
      // Timeout after 10 seconds
      setTimeout(() => reject(new Error('Video load timeout')), 10000);
    });

    return {
      stream,
      width: videoElement.videoWidth,
      height: videoElement.videoHeight
    };
  } catch (err) {
    throw handleCameraError(err);
  }
}

/**
 * Initialize MediaPipe HandLandmarker with mobile fallback
 */
export async function initHandLandmarker(FilesetResolver, HandLandmarker) {
  const isMobile = isMobileDevice();

  // Load vision tasks
  const vision = await FilesetResolver.forVisionTasks(GESTURE_CONFIG.mediapipe.wasmUrl);

  // Try GPU first, fallback to CPU on mobile if needed
  const delegates = isMobile ? ['GPU', 'CPU'] : ['GPU'];
  let landmarker = null;
  let lastError = null;

  for (const delegate of delegates) {
    try {
      landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: GESTURE_CONFIG.mediapipe.modelUrl,
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
 * Returns: { detected, gesture, handX, handY }
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
 * Custom camera error class
 */
class CameraError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'CameraError';
    this.code = code;
  }
}

/**
 * Handle camera errors with user-friendly messages
 */
function handleCameraError(err) {
  const errorMessages = {
    NotAllowedError: {
      message: 'Camera access denied. Please allow camera permission.',
      code: 'PERMISSION_DENIED'
    },
    PermissionDeniedError: {
      message: 'Camera access denied. Please allow camera permission.',
      code: 'PERMISSION_DENIED'
    },
    NotFoundError: {
      message: 'No camera found on this device.',
      code: 'NOT_FOUND'
    },
    NotReadableError: {
      message: 'Camera is in use by another app.',
      code: 'IN_USE'
    },
    OverconstrainedError: {
      message: 'Camera does not meet requirements.',
      code: 'OVERCONSTRAINED'
    },
    AbortError: {
      message: 'Camera access was interrupted.',
      code: 'ABORTED'
    }
  };

  const errorInfo = errorMessages[err.name] || {
    message: `Camera error: ${err.message || err.name}`,
    code: 'UNKNOWN'
  };

  return new CameraError(errorInfo.message, errorInfo.code);
}

/**
 * Stop camera stream and cleanup
 */
export function stopCamera(videoElement) {
  if (videoElement?.srcObject) {
    const tracks = videoElement.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    videoElement.srcObject = null;
  }
}

/**
 * Get mobile-optimized UI hints
 */
export function getMobileGestureHints() {
  const isMobile = isMobileDevice();
  const isIOS = isIOSSafari();

  return {
    activateHint: isMobile
      ? 'Tap to enable camera gestures'
      : 'Click to enable gesture control',
    permissionHint: isIOS
      ? 'Allow camera access when prompted'
      : 'Grant camera permission to use gestures',
    gestureGuide: {
      fist: '✊ Fist = Tree Mode',
      open: '🖐️ Open Hand = Scatter Mode',
      pinch: '🤏 Pinch = Focus Mode'
    }
  };
}
