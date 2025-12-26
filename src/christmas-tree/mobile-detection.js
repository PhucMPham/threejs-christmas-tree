/**
 * Mobile Device Detection Utilities
 * Provides device detection for responsive gesture control behavior.
 */

/**
 * Detects if current device is mobile based on user agent and touch capability
 * @returns {boolean} True if mobile device detected
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
}

/**
 * Get mobile-optimized UI hints for gesture control
 * @returns {Object} Hint strings for UI display
 */
export function getMobileGestureHints() {
  const isMobile = isMobileDevice();

  return {
    activateHint: isMobile
      ? 'Tap to enable camera gestures'
      : 'Click to enable gesture control',
    permissionHint: 'Grant camera permission to use gestures',
    gestureGuide: {
      fist: '✊ Fist = Tree Mode',
      open: '🖐️ Open Hand = Scatter Mode',
      pinch: '🤏 Pinch = Focus Mode'
    }
  };
}
