/**
 * Camera Permissions & Access Module
 * Handles camera availability checks, permission requests, and error handling.
 */

import { isMobileDevice } from './mobile-detection.js';

// Camera constraints optimized for mobile vs desktop
const CAMERA_CONSTRAINTS = {
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
};

/**
 * Custom camera error class with error codes
 */
export class CameraError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'CameraError';
    this.code = code;
  }
}

/**
 * Check if camera is available and permissions can be requested
 * @returns {Promise<{available: boolean, reason?: string, code?: string}>}
 */
export async function checkCameraAvailability() {
  // Check HTTPS requirement (except localhost)
  const isSecure = window.location.protocol === 'https:' ||
                   window.location.hostname === 'localhost' ||
                   window.location.hostname === '127.0.0.1';

  if (!isSecure) {
    return { available: false, reason: 'HTTPS required for camera access', code: 'INSECURE_CONTEXT' };
  }

  // Check if getUserMedia is supported
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { available: false, reason: 'Camera not supported in this browser', code: 'NOT_SUPPORTED' };
  }

  // Check if any video input devices exist
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some(device => device.kind === 'videoinput');
    if (!hasCamera) {
      return { available: false, reason: 'No camera detected on this device', code: 'NO_CAMERA' };
    }
  } catch (err) {
    // enumerateDevices may fail without permission, continue anyway
  }

  return { available: true };
}

/**
 * Request camera permission with mobile-optimized constraints
 * @param {HTMLVideoElement} videoElement - Video element to attach stream
 * @returns {Promise<{stream: MediaStream, width: number, height: number}>}
 */
export async function requestCameraAccess(videoElement) {
  const check = await checkCameraAvailability();
  if (!check.available) {
    throw new CameraError(check.reason, check.code);
  }

  const isMobile = isMobileDevice();
  const constraints = isMobile ? CAMERA_CONSTRAINTS.mobile : CAMERA_CONSTRAINTS.desktop;

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;

    // Wait for video to be ready
    await new Promise((resolve, reject) => {
      let timeoutId;
      const cleanup = () => clearTimeout(timeoutId);

      videoElement.onloadedmetadata = () => {
        cleanup();
        videoElement.play().then(resolve).catch(reject);
      };
      videoElement.onerror = (e) => { cleanup(); reject(e); };
      timeoutId = setTimeout(() => reject(new Error('Video load timeout')), 10000);
    });

    return { stream, width: videoElement.videoWidth, height: videoElement.videoHeight };
  } catch (err) {
    throw handleCameraError(err);
  }
}

/**
 * Stop camera stream and cleanup resources
 * @param {HTMLVideoElement} videoElement - Video element to cleanup
 */
export function stopCamera(videoElement) {
  if (videoElement?.srcObject) {
    const tracks = videoElement.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    videoElement.srcObject = null;
  }
}

/**
 * Handle camera errors with user-friendly messages
 */
function handleCameraError(err) {
  const errorMessages = {
    NotAllowedError: { message: 'Camera access denied. Please allow camera permission.', code: 'PERMISSION_DENIED' },
    PermissionDeniedError: { message: 'Camera access denied. Please allow camera permission.', code: 'PERMISSION_DENIED' },
    NotFoundError: { message: 'No camera found on this device.', code: 'NOT_FOUND' },
    NotReadableError: { message: 'Camera is in use by another app.', code: 'IN_USE' },
    OverconstrainedError: { message: 'Camera does not meet requirements.', code: 'OVERCONSTRAINED' },
    AbortError: { message: 'Camera access was interrupted.', code: 'ABORTED' }
  };

  const errorInfo = errorMessages[err.name] || { message: `Camera error: ${err.message || err.name}`, code: 'UNKNOWN' };
  return new CameraError(errorInfo.message, errorInfo.code);
}
