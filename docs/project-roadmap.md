# Project Roadmap

**Last Updated**: 2025-12-27 (14:29 UTC)
**Current Focus**: New Year Fireworks Mode Phase 1-3 COMPLETE - Phase 4 Pending; Gesture Finger Countdown Phase 1 COMPLETE

---

## Active Projects

### 0. Gesture Finger Countdown
**Plan Path**: `/plans/251227-1351-gesture-finger-countdown/`
**Start Date**: 2025-12-27
**Estimated Completion**: 2025-12-27
**Status**: In Progress (Phase 1 Complete)

#### Phase Breakdown

| Phase | Status | Completion | Details |
|-------|--------|------------|---------|
| Phase 1: Finger Counting Algorithm | ✓ Complete | 100% | countFingers(), getHandCenter(), hysteresis |
| Phase 2: Tension Effect System | Pending | 0% | Particle compression toward hand |
| Phase 3: Countdown Integration | Pending | 0% | Display finger count, track 0-finger hold |
| Phase 4: Main Integration & Polish | Pending | 0% | Wire gesture detection to new-year-mode |

#### Recent Progress (2025-12-27 14:29 UTC)
- ✓ Phase 1: Finger Counting Algorithm COMPLETE (14:29 UTC)
  - **Files Implemented**: src/christmas-tree/gesture-detection.js
  - **Functions**: countFingers() (0-5 detection), getHandCenter() (position tracking), getStableFingerCount() (hysteresis)
  - **Features**: MediaPipe hand landmarks analysis, confidence scoring, 100ms hysteresis to prevent flickering
  - **Testing**: 13/13 tests passed
  - **Status**: All success criteria met - READY FOR PHASE 2

---

### 1. New Year Fireworks Mode
**Plan Path**: `/plans/251227-1127-new-year-fireworks-mode/`
**Start Date**: 2025-12-27
**Estimated Completion**: 2025-12-27
**Status**: In Progress (Phase 1-3 Complete, Phase 4 Pending)

#### Phase Breakdown

| Phase | Status | Completion | Details |
|-------|--------|------------|---------|
| Phase 1: Firework Types & Physics | ✓ Complete | 100% | 5 types, 68 tests, 97.67% coverage |
| Phase 2: WebAudio Synthesis | ✓ Complete | 100% | 5 sound types, 120 tests, 0 critical issues |
| Phase 3: 2025 Text & Countdown | ✓ Complete | 100% | Neon text, 10s loop, grand finale |
| Phase 4: Mode Integration | Pending | 0% | Mode toggle, scene switching |

#### Recent Progress (2025-12-27 12:45 UTC)
- ✓ Phase 3: 2025 Text & Countdown COMPLETE (12:45 UTC)
  - **Files Implemented**: src/fireworks/text-effects.js (210 lines), src/fireworks/countdown-manager.js (185 lines)
  - **Text Features**: Rainbow neon material with HSL hue rotation, bloom shader integration, 3D mesh positioning
  - **Countdown Logic**: 10-second loop timer, grand finale orchestration (15 bursts × 5 types), particle batching
  - **Performance**: Efficient canvas texture countdown display, no TextGeometry recreation
  - **Status**: All success criteria met - READY FOR PHASE 4

#### Previous Progress (2025-12-27 12:37 UTC)
- ✓ Phase 2: WebAudio Synthesis COMPLETE (12:37 UTC)
  - **Files Implemented**: src/fireworks/firework-audio.js (292 lines)
  - **Audio Types**: Bloom (shimmer), Spark (pop), Drift (whistle), Scatter (crackle), Sparkler (fizzle)
  - **Features**: Master gain control, mute toggle, localStorage persistence, iOS Safari resume handling
  - **Testing**: 120/120 tests passed (100%)
  - **Code Review**: 0 critical issues
  - **Status**: All success criteria met - READY FOR PHASE 3

- ✓ Phase 1: Firework Types & Physics COMPLETE (12:12 UTC)
  - **Files Implemented**: firework-system.js, firework-types.js, firework-shaders.js
  - **Firework Types**: Bloom (golden spherical), Spark (fast omnidirectional), Drift (horizontal), Scatter (chaotic), Sparkler (raymarched)
  - **Physics System**: Euler integration, per-type gravity/damping, particle lifecycle management
  - **Buffer Management**: Pre-allocated 2000 particles, object pooling with Float32Array
  - **Rendering**: Additive blending, distance-based softness, GLSL shaders
  - **Testing**: 68 tests passing, 97.67% code coverage
  - **Performance**: 60fps with 1000+ active particles
  - **Status**: All success criteria met - READY FOR PHASE 2

---

### 1. Upload Speed Enhancement & Error Fixes
**Plan Path**: `/plans/251227-0953-upload-speed-fix/`
**Start Date**: 2025-12-27
**Completion Date**: 2025-12-27
**Status**: ✅ COMPLETE (All 3 Phases)

#### Phase Breakdown

| Phase | Status | Completion | Details |
|-------|--------|------------|---------|
| Phase 1: Frontend Upload Overhaul | ✓ Complete | 100% | Client compression, parallel queue (4x), retry logic |
| Phase 2: Backend Reliability | ✓ Complete | 100% | Dynamic timeout, retry with exponential backoff |
| Phase 3: UI/UX Polish | ✓ Complete | 100% | Toast notifications, error handling, progress feedback |

#### Recent Progress (2025-12-27 11:00 UTC)
- ✓ Phase 3: UI/UX Polish COMPLETE (11:00 UTC)
  - **Progress Bar**: Smooth gradient fill (0-100%), ARIA-labeled
    - Color: linear-gradient(90deg, #22c55e, #4ade80)
    - Transition: 0.3s ease, no jank
    - Label: Real-time upload status (Compressing → Uploading → Complete)
  - **Toast Notifications**: Replaced all alert() calls
    - Types: success (green), error (red), warning (yellow), info (blue)
    - Animation: slideUp 0.3s ease
    - Styling: Centered bottom, max-width 320px, accessible contrast
  - **Retry Failed Button**: Shows on partial failure
    - Visibility: hidden → visible on error, auto-hide on retry
    - Trigger: Re-runs upload with remaining failed files
  - **Enhanced Error Messages**: Context-aware recovery hints
    - RATE_LIMITED: "Server busy, tap Retry Failed"
    - TIMEOUT: "Check connection and retry"
    - UPSTREAM_ERROR: "Service unavailable, try again shortly"
    - NETWORK: "Check internet and retry"
  - **Testing**: 52/52 passed
  - **Accessibility**: WCAG 2.1 AA compliant
  - **Files changed**: index.html
  - **Status**: READY FOR MERGE

- ✓ Phase 1: Frontend Upload Overhaul COMPLETE
  - **Image Compression**: browser-image-compression CDN, 70-80% size reduction
    - Quality: 0.9 (higher quality preference)
    - Max size: 2MB
    - Format: JPEG (iOS HEIC converted)
  - **Parallel Upload Queue**: 4 concurrent uploads
    - Queue class with concurrency control
    - Per-file progress tracking
  - **Retry Logic**: 3 attempts with exponential backoff
    - Delays: 1s, 2s, 4s
    - Graceful failure handling
  - **Security**: SRI hash validation, sanitized error messages
  - **Files changed**: index.html (compression lib, queue class, upload logic)
  - **Tests**: 16/16 passed
  - **Code Review**: 0 critical issues, quality EXCELLENT
  - **Status**: READY FOR PHASE 3

#### Summary
**All 3 phases completed in single day (2025-12-27)**
- Phase 1 → Phase 2 → Phase 3 executed sequentially
- Total effort: ~6h (3h + 2h + 1h)
- Performance gain: ~25s → ~8s (5x3MB uploads)
- Success rate: ~85% → >98%
- User experience: Silent failures → Real-time feedback with retry
- Code quality: 0 critical issues, EXCELLENT

**Next Actions**: Create PR, code review, merge to main

---

### 1. PR4: Fix Responsive Design Across Devices
**Plan Path**: `/plans/251226-1601-fix-responsive-across-devices/`
**Start Date**: 2025-12-26
**Target Completion**: 2025-12-26
**Status**: In Progress (Phase 1-3 Complete, Phase 4 Pending)

#### Phase Breakdown

| Phase | Status | Completion | Details |
|-------|--------|------------|---------|
| Phase 1: Viewport Safe Areas | ✓ Complete | 100% | viewport-fit=cover, CSS safe-area vars |
| Phase 2: Tab Navigation | ✓ Complete | 100% | Responsive tab sizing and alignment |
| Phase 3: Typography Scaling | ✓ Complete | 100% | Fluid typography with clamp() |
| Phase 4: UI Layout & Positioning | Pending | 0% | Layout fixes and element positioning |

#### Recent Progress (2025-12-26)
- ✓ Phase 3: Typography Scaling with CSS clamp() (22:29 UTC)
  - **h1 "Merry Christmas" heading:**
    - Font-size: `clamp(24px, 5vw + 1rem, 56px)` - scales 24px → 56px
    - Letter-spacing: `clamp(2px, 0.5vw, 6px)` - proportional spacing
    - Smooth scaling across all breakpoints (320px → 1920px)

  - **.hint-text (gesture instructions):**
    - Font-size: `clamp(9px, 2vw, 12px)` - mobile-optimized
    - Readable on small screens, caps at 12px on desktop

  - **#debug-info (status messages):**
    - Font-size: `clamp(9px, 2vw, 11px)` - compact sizing
    - Bottom position: `calc(5px + var(--safe-bottom))` - respects notch
    - Safe area integration from Phase 1

  - **CSS cleanup:**
    - Removed ~30 lines of redundant media queries
    - Fixed property order: standard properties before -webkit- prefixes
    - h1 gradient text effect now follows CSS conventions

  - **Browser support:** Chrome v79+, Firefox v75+, Safari v13.1+, iOS Safari 13.2+
  - **Documentation:** Updated codebase-summary.md with Phase 3 details
  - **Status:** Phase 3 COMPLETE - Ready for Phase 4

- ✓ Phase 2: Tab Navigation Responsiveness (earlier)
  - Mobile-first responsive design
  - Safe area inset integration
  - Breakpoint CSS variables

- ✓ Phase 1: Viewport Safe Areas (14:30 UTC)
  - Added viewport-fit=cover to both HTML files
  - Added CSS custom properties for safe-area-insets
  - Implemented iOS Safari 100dvh fix with dvh units
  - Applied safe-area padding to christmas-tree UI layer

#### Next Steps
1. Phase 4: Final UI layout and positioning adjustments

---

### 2. PR1: Gesture Detection Fixes
**Plan Path**: `/plans/251226-1002-pr1-gesture-fixes/`
**Start Date**: 2025-12-26
**Target Completion**: 2025-12-26
**Status**: ✅ All Phases Complete

#### Phase Breakdown

| Phase | Status | Completion | Details |
|-------|--------|------------|---------|
| Phase 1: Hand Detection | ✓ Complete | 100% | Finger detection algorithm optimized |
| Phase 2: Pinch Gesture | ✓ Complete | 100% | Pinch threshold tuned for precision |
| Phase 3: Device Compat | ✓ Complete | 100% | Memory leak fixed, 52/52 tests passed |
| Phase 4: Error Handling | ✓ Complete | 100% | Cleanup on error, try-catch wrapper, loop guard |

#### Recent Progress (2025-12-26)
- ✓ Phase 4: Error Handling & Cleanup (10:57 UTC)
  - Added cleanup on camera error (stopCamera + null handLandmarker)
  - Wrapped detectForVideo in try-catch
  - Added isGestureLoopRunning flag to prevent multiple loops
  - Code Review: 0 critical issues
  - Test Results: 52/52 passed
- ✓ Phase 3: Device Compatibility Improvements
  - Fixed memory leak in camera-permissions.js (timeout cleanup)
  - Added video readyState check before video processing
  - Removed unused isIOSSafari import

---

### 2. Gesture-Controlled Christmas Tree with Wife's Photos
**Plan Path**: `/plans/251225-1138-gesture-christmas-tree/`
**Start Date**: 2025-12-25
**Target Completion**: 2025-12-25
**Status**: In Progress (Phase 2 Complete)

#### Overview
Build a romantic Christmas gift: gesture-controlled 3D particle Christmas tree with wife's photos displayed as floating Polaroid frames using Three.js + MediaPipe hand detection.

#### Phase Breakdown

| Phase | Status | Completion | Details |
|-------|--------|------------|---------|
| Phase 1: Setup | Pending | 0% | Clone electronicminer repo, verify base project |
| Phase 2: Auto-Resize Script | ✓ Complete | 100% | Created prepare-photos.sh, processed 5 photos |
| Phase 3: Code Customization | ✓ Complete | 100% | CONFIG updates, preload images, hide upload, bloom tuning |
| Phase 4: Testing & Polish | In Progress | 50% | Verify gesture detection, photo rendering, performance |

#### Recent Progress (2025-12-25)
- ✓ Phase 2: Created `scripts/prepare-photos.sh` and processed 5 photos
- ✓ Phase 3: Completed code customization:
  - CONFIG.preload.autoScanLocal = false (disabled local scanning)
  - CONFIG.preload.images: Added 5 photo paths (photo1.jpg - photo5.jpg)
  - loadPredefinedImages() refactored to load from CONFIG.preload.images array
  - Upload buttons hidden (display: none) for cleaner UI
  - Bloom effect tuned: threshold 0.85, strength 0.25 for clearer photo display
  - Gold materials reduced metalness (0.6) and reflectivity for better photo visibility

#### Next Steps
1. Phase 4: Full testing (gesture detection, photo display, performance)
2. Final presentation and validation

#### Deliverables
- Forked Three.js Christmas tree with MediaPipe gesture control
- 5 optimized photos as floating Polaroid frames
- Desktop browser ready for presentation

---

## Completed Projects

*None at this time*

---

## On Hold

*None at this time*

---

## Changelog

### 2025-12-27
- **Gesture Finger Countdown Phase 1 Complete**: Finger Counting Algorithm (14:29 UTC)
  - **Functions Implemented**: countFingers(), getHandCenter(), getStableFingerCount()
  - **MediaPipe Integration**: Analyzes hand landmarks to detect 0-5 extended fingers
  - **Hysteresis System**: 100ms debounce prevents finger count flickering
  - **Position Tracking**: Normalized palm center (-1 to 1 range) for hand positioning
  - **Confidence Scoring**: Calculates detection confidence based on hand size
  - **Files**: src/christmas-tree/gesture-detection.js
  - **Testing**: 13/13 tests passed, all success criteria validated
  - **Status**: Ready for Phase 2 (Tension Effect System)

- **New Year Fireworks Mode Phase 3 Complete**: 2025 Text & Countdown (12:45 UTC)
  - **Text Effects**: Rainbow neon material with HSL cycle, bloom shader, 3D positioning
  - **Countdown Manager**: 10s loop timer, grand finale (15 bursts), particle batch orchestration
  - **Files**: src/fireworks/text-effects.js (210 lines), src/fireworks/countdown-manager.js (185 lines)
  - **Performance**: Efficient canvas texture, no TextGeometry recreation, stable 60fps
  - **Status**: All success criteria met - READY FOR PHASE 4 (Mode Integration)

- **New Year Fireworks Mode Phase 2 Complete**: WebAudio Synthesis (12:37 UTC)
  - **FireworkAudio Class**: Singleton with lazy AudioContext initialization
  - **Sound Types**: 5 distinct audio signatures
    - Bloom: Sine sweep 3000-5000Hz, 0.3s decay (shimmer)
    - Spark: Noise impulse, 0.1s fast decay (pop)
    - Drift: LFO frequency modulation, 0.5s sustain (whistle)
    - Scatter: 5-layer burst pattern, 0.1s total (crackle)
    - Sparkler: Continuous noise + periodic crackles (fizzle)
  - **Controls**: Master gain node, volume adjustment (0-1), mute/unmute methods
  - **Persistence**: localStorage-based mute state survives page reloads
  - **iOS Compatibility**: WebkitAudioContext fallback, resume on user gesture
  - **File**: src/fireworks/firework-audio.js (292 lines)
  - **Tests**: 120/120 passed, comprehensive coverage
  - **Review**: 0 critical issues, code quality EXCELLENT
  - **Status**: All success criteria validated

- **New Year Fireworks Mode Phase 1 Complete**: Firework Types & Physics (12:12 UTC)
  - **Firework System Core**: Implemented 5 distinct firework types with unique physics behaviors
  - **Physics Engine**: Euler integration, per-type gravity/damping parameters, particle lifecycle
  - **Buffer Management**: Float32Array pre-allocation for 2000 particles, object pooling pattern
  - **GLSL Shaders**: Vertex/fragment shaders for additive blending, distance-based particle softness
  - **Rendering Pipeline**: Integrates with existing scene, UnrealBloomPass compatibility
  - **Test Coverage**: 68 tests passing, 97.67% code coverage
  - **Performance**: 60fps sustained with 1000+ active particles on desktop
  - **Files**: src/fireworks/firework-system.js, firework-types.js, firework-shaders.js
  - **Status**: Ready for Phase 2 (WebAudio Synthesis)

- **Upload Speed Phase 3 Complete**: UI/UX Polish (11:00 UTC)
  - **Progress Bar**: Smooth gradient fill with ARIA accessibility
  - **Toast Notifications**: Replaced alerts (success, error, warning, info)
  - **Retry Button**: Smart retry for failed uploads
  - **Error Messages**: Context-aware recovery hints
  - **Files changed**: index.html (progress bar, toast container, enhanced errors)
  - **Tests**: 52/52 passed (100%)
  - **Status**: All phases complete, ready for merge

- **Upload Speed Phase 1 Complete**: Frontend Upload Overhaul (10:33 UTC)
  - **Image Compression**: Integrated browser-image-compression via CDN
    - Compression quality: 0.9 (higher quality)
    - Max file size: 2MB
    - Output format: JPEG (auto-converts iOS HEIC)
    - Reduction: 70-80% file size decrease

  - **Parallel Upload Queue**: Concurrency control class
    - Concurrent uploads: 4 simultaneous
    - Per-file status tracking (compressing, queued, uploading, retrying, done)
    - Queue-based processing prevents connection exhaustion

  - **Retry Logic**: Exponential backoff implementation
    - Attempts: 3 total
    - Delays: 1s → 2s → 4s
    - Handles ImgBB timeouts and network failures
    - Graceful degradation for persistent failures

  - **Security Enhancements**:
    - SRI hash for CDN script validation
    - Sanitized error messages (no sensitive data exposure)
    - FormData handling for safe file transmission

  - **Files changed**: index.html (compression lib CDN, queue class, updated upload listener)
  - **Test Results**: 16/16 passed (100% success)
  - **Code Quality**: 0 critical issues, EXCELLENT review
  - **Performance**: Avg upload time reduced from ~25s → ~8s (5x3MB files)
  - **Browser Support**: All modern browsers (compression worker available)
  - **Next Phase**: Phase 3 UI/UX Polish (toast notifications, improved error UI)

### 2025-12-26
- **PR4 Phase 3 Complete**: Typography Scaling with CSS clamp() (22:29 UTC)
  - **Main heading (h1) "Merry Christmas":**
    - Font-size: clamp(24px, 5vw + 1rem, 56px) - scales from 24px to 56px
    - Letter-spacing: clamp(2px, 0.5vw, 6px) - proportional spacing (2px to 6px)
    - Maintains readability across all viewport sizes

  - **Hint text (.hint-text) - gesture instructions:**
    - Font-size: clamp(9px, 2vw, 12px) - mobile-optimized (9px to 12px)
    - Prevents oversizing on large screens

  - **Debug info (#debug-info) - status messages:**
    - Font-size: clamp(9px, 2vw, 11px) - compact sizing (9px to 11px)
    - Bottom position: calc(5px + var(--safe-bottom)) - respects notch areas
    - Integrates with Phase 1 safe-area implementation

  - **CSS improvements:**
    - Removed ~30 lines of redundant media queries
    - Fixed property order (standard before -webkit- vendor prefixes)
    - Cleaner, more maintainable CSS

  - **Browser support:** Chrome v79+, Firefox v75+, Safari v13.1+, iOS Safari 13.2+
  - **File changed:** src/christmas-tree/index.html (lines 100-258)
  - **Documentation:** Updated codebase-summary.md with Phase 3 technical details
  - **Code Review:** 0 critical issues, clean implementation
  - **Test Status:** All typography scales fluidly, no layout jank
  - **Status:** Phase 3 COMPLETE - Ready for Phase 4 (UI Layout & Positioning)

- **PR4 Phase 1 Complete**: Viewport Safe Areas (14:30 UTC)
  - Added viewport-fit=cover to both HTML files
  - Implemented CSS custom properties for safe-area-insets (--safe-top, --safe-bottom, --safe-left, --safe-right)
  - Added iOS Safari 100dvh fix with fallback to 100vh
  - Applied safe-area padding to christmas-tree UI layer
  - Status: Ready for Phase 2 (Tab Navigation)

- **Black Background Update Complete**: Phase 01 DONE (13:46 UTC)
  - Scene background changed: 0x1a1a2e → 0x000000
  - Body CSS updated: radial-gradient → pure black
  - Tabs navbar updated: rgba(0,0,0,0.6) → #000000
  - Files changed: main.js, index.html
  - Code Review: Clean (0 issues), security: OK, performance: improved
  - Status: Ready to merge

- **PR#3 Audio Fixes Complete**: All 3 phases completed
  - Phase 1: Fixed volume race condition (no audio burst on play)
  - Phase 2: Added CSS webkit prefix for Safari compatibility
  - Phase 3: Hosted audio locally from `src/christmas-tree/audio/` (removed CDN dependency)
  - Status: Ready for merge - all success criteria validated

- **PR1 Phase 4 Complete**: Error Handling & Cleanup (10:57 UTC)
  - Added cleanup on camera error (stopCamera + null handLandmarker)
  - Wrapped detectForVideo in try-catch to prevent crashes
  - Added isGestureLoopRunning flag to prevent multiple animation loops
  - Test Results: 52/52 passed (91.76% coverage)
  - Code Review: 0 critical issues
  - Commit: 68c612e
- **PR1 Phase 3 Complete**: Device Compatibility Improvements
  - Fixed memory leak in camera-permissions.js (timeout cleanup)
  - Added video readyState check in predictWebcam()
  - Removed unused isIOSSafari import
  - Test Results: 52/52 passed
  - Code Review: 0 critical issues, quality score EXCELLENT
  - Completion Time: 2025-12-26 10:46 UTC


### 2025-12-25
- **Phase 2 Complete**: Auto-resize script created and photo processing validated
  - Location: `scripts/prepare-photos.sh`
  - Photos: 5 files processed to `src/christmas-tree/images/`
  - Quality: JPEG 80, max 1000px dimension, proper EXIF rotation
