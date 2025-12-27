# Countdown Manager API Reference - Phase 3 Gesture Integration

## Overview

The `CountdownManager` class provides a complete countdown timer with gesture-driven control. Phase 3 adds three new methods enabling gesture input (finger counting) to override the timer-based countdown.

**File**: `src/fireworks/countdown-manager.js`
**Phase**: 3 (Countdown Integration)
**Status**: Complete - 100% tested (23 new test cases for gesture integration)

---

## Class: CountdownManager

### Constructor

```javascript
new CountdownManager(scene, bloomPass = null)
```

**Parameters:**
- `scene` (THREE.Scene): Three.js scene for adding/removing visual elements
- `bloomPass` (UnrealBloomPass, optional): Bloom post-processing pass for neon effect tuning

**Properties Initialized:**
- Timer state: `countdownValue`, `elapsed`, `isActive`, `finaleTriggered`, `waitingAfterFinale`
- **NEW**: `externalValueSet`, `lastExternalValue` (gesture control state)

---

## Public API Methods

### Timer Control (Existing)

#### `start()`
Begins countdown cycle, shows 2025 text and countdown display.

```javascript
countdown.start();
```

**Side Effects:**
- Sets `isActive = true`
- Resets `countdownValue` to 10
- Resets `elapsed` to 0
- **NEW**: Resets `externalValueSet = false` and `lastExternalValue = null`
- Shows group (visibility = true)
- Adjusts bloom parameters for neon effect

---

#### `stop()`
Stops countdown, hides elements, restores bloom settings.

```javascript
countdown.stop();
```

**Side Effects:**
- Sets `isActive = false`
- Hides group (visibility = false)
- **NEW**: Resets `externalValueSet = false` and `lastExternalValue = null`
- Restores bloom parameters for tree effect

---

#### `update(dt)`
Called each animation frame to advance countdown timer and update visuals.

```javascript
countdown.update(0.016); // dt = delta time in seconds
```

**Parameters:**
- `dt` (number): Delta time since last frame (in seconds)

**Behavior:**
- Updates rainbow material HSL hue (always)
- If `externalValueSet === true`:
  - **NEW**: Skips timer logic (countdown paused)
  - Material still updates for rainbow effect
  - Returns early without incrementing elapsed time
- If `externalValueSet === false`:
  - Accumulates `elapsed` time
  - Every 1.0 seconds:
    - Decrements `countdownValue`
    - Updates canvas texture display
    - Triggers finale callback when reaching 0
  - Handles post-finale wait state (2 seconds)
  - Auto-resets after finale wait completes

---

#### `triggerFinale()`
Manually triggers grand finale effect (called automatically at countdown = 0).

```javascript
countdown.triggerFinale();
```

**Side Effects:**
- Sets `finaleTriggered = true`
- Invokes `onFinale()` callback if registered

---

#### `resetCountdown()`
Resets internal state for next countdown cycle.

```javascript
countdown.resetCountdown();
```

**Side Effects:**
- Sets `countdownValue = 10`
- Sets `elapsed = 0`
- Sets `finaleTriggered = false`
- Sets `waitingAfterFinale = false`
- Updates canvas display to show "10"

---

### Visibility Control (Existing)

#### `show()` / `hide()` / `isVisible()`

```javascript
countdown.show();        // Make countdown visible
countdown.hide();        // Make countdown invisible
const visible = countdown.isVisible(); // Returns boolean
```

---

### Finale Integration (Existing)

#### `setFinaleCallback(callback)`
Register callback fired when countdown reaches 0.

```javascript
countdown.setFinaleCallback(() => {
  // Trigger fireworks/audio/effects
  newYearMode.triggerGrandFinale();
});
```

---

### Countdown Value Access (Existing)

#### `getValue()`
Get current countdown value (0-10).

```javascript
const currentValue = countdown.getValue(); // Returns 0-10
```

---

## NEW Phase 3 API: Gesture Control

### `setExternalValue(value)`

Set countdown value from external gesture input. Overrides timer-based countdown while active.

```javascript
// Called when hand detected with N fingers
countdown.setExternalValue(fingerCount); // fingerCount from 0-5 (or decimal)
```

**Parameters:**
- `value` (number): Desired countdown value
  - Will be clamped to [0, 10]
  - Will be rounded to nearest integer
  - Decimals allowed (5.7 → 6)

**Behavior:**
- Input validation: `clampedValue = Math.max(0, Math.min(10, Math.round(value)))`
- Change detection: Only updates if `clampedValue !== this.lastExternalValue`
- Sets `externalValueSet = true` to pause timer
- Updates `countdownValue` to clamped value
- Stores `lastExternalValue` for next comparison
- Triggers `renderCountdownValue()` only on value changes (prevents redundant canvas updates)

**Example:**
```javascript
// In gesture detection callback
const fingerCount = gestureDetection.countFingers(handData);
countdown.setExternalValue(fingerCount);
// Countdown display immediately shows finger count
// Timer is paused while external value active
```

**Performance Note:**
- Change detection prevents redundant canvas texture updates
- Only re-renders display when value actually changes
- Rainbow material still animates (visual feedback that gesture is active)

---

### `clearExternalValue()`

Resume timer-based countdown after gesture control ends.

```javascript
countdown.clearExternalValue();
```

**Behavior:**
- Sets `externalValueSet = false`
- Sets `lastExternalValue = null`
- **Does NOT reset countdown value** - timer resumes from current value
- Next `update()` call will resume normal decrement logic

**Example:**
```javascript
// Hand lost or user removed hand from camera
countdown.clearExternalValue();
// If current value was 5, timer continues counting 5→4→3...
// NOT reset back to 10
```

---

### `isExternallyControlled()`

Check if countdown is currently controlled by gesture input.

```javascript
const isGesture = countdown.isExternallyControlled();
```

**Returns:** `boolean`
- `true` if `setExternalValue()` has been called and display not yet cleared
- `false` if timer-based countdown is active

**Use Case - UI Feedback:**
```javascript
// Show visual indicator that gesture controls are active
if (countdown.isExternallyControlled()) {
  document.body.classList.add('gesture-active');
}
```

---

## State Management

### Timer-Based State
```javascript
isActive           // boolean - countdown running
countdownValue     // number 0-10 - current display value
elapsed            // number - time accumulated in current second
finaleTriggered    // boolean - finale callback has fired
waitingAfterFinale // boolean - in post-finale delay state
```

### Gesture Control State (NEW)
```javascript
externalValueSet   // boolean - gesture controls active
lastExternalValue  // number|null - previous gesture value for change detection
```

### Auto-Reset Behavior
Both timer-based and gesture control states reset on:
- `start()` called
- `stop()` called

This ensures clean state transitions between modes.

---

## Behavior Comparison: Timer vs Gesture Mode

### Timer-Based Countdown (Default)
```javascript
countdown.start();
// Displays 10, 9, 8, ... 1, 0 (1 second per decrement)
countdown.update(dt); // Automatically decrements
```

**Flow:**
1. Display shows 10
2. User waits 1 second
3. Display shows 9
4. Repeat until 0
5. Finale callback triggered

### Gesture-Driven Countdown (Phase 3 NEW)
```javascript
countdown.start();
// User shows hand with 5 fingers
countdown.setExternalValue(5);
// Display immediately shows 5
// Timer paused

countdown.update(dt); // Does nothing for countdown (timer skipped)

// User hides hand
countdown.clearExternalValue();
// Display continues from 5: 5→4→3... (timer resumes)
```

**Flow:**
1. Display shows 10
2. Hand gesture detected (5 fingers)
3. Display shows 5 (immediate, no wait)
4. Timer paused while gesture active
5. Hand removed
6. Timer resumes from 5
7. Display counts down normally

---

## Integration Example: Gesture Mode

Complete integration showing how gesture detection feeds into countdown:

```javascript
// In main animation loop
function animate() {
  requestAnimationFrame(animate);

  // Get hand landmarks from MediaPipe
  const handData = gestureDetection.getHandLandmarks();

  if (handData && countdown.isActive) {
    // Hand detected - use finger count
    const fingerCount = gestureDetection.countFingers(handData);
    countdown.setExternalValue(fingerCount);

    // Optional: Show visual feedback
    if (countdown.isExternallyControlled()) {
      showGestureIndicator(fingerCount);
    }
  } else if (!handData && countdown.isExternallyControlled()) {
    // Hand lost - resume timer
    countdown.clearExternalValue();
    hideGestureIndicator();
  }

  // Normal update loop
  countdown.update(dt);
  renderer.render(scene, camera);
}
```

---

## Test Coverage

**Phase 3 Gesture Integration Tests**: 23 test cases
- `setExternalValue()`: 5 tests (clamping, rounding, change detection)
- `clearExternalValue()`: 2 tests (state reset, value retention)
- `isExternallyControlled()`: 3 tests (state queries)
- `update()` with external control: 3 tests (timer skip, material update, resume)
- State reset on `start()/stop()`: 2 tests
- Full gesture workflow validation: 1 comprehensive test

**All 23 tests passing** ✓

---

## Performance Considerations

### Canvas Rendering Optimization
- Change detection prevents redundant `renderCountdownValue()` calls
- Only updates canvas texture when countdown value changes
- Saves GPU bandwidth and canvas 2D context operations

### Rainbow Material Animation
- Continues updating HSL hue even when externally controlled
- Provides visual feedback that gesture mode is active
- O(1) hue rotation (no expensive color conversions per frame)

### State Machine Efficiency
- Linear state transitions (no complex branching)
- O(1) lookup for timer vs gesture mode (boolean check)
- Pre-allocated geometry and materials (no runtime allocation)

---

## Debugging

### Check Gesture Control State
```javascript
console.log(countdown.isExternallyControlled()); // true/false
console.log(countdown.countdownValue);           // Current display value
console.log(countdown.lastExternalValue);        // Last gesture value
console.log(countdown.externalValueSet);         // Control mode flag
```

### Verify Value Changes
```javascript
countdown.setExternalValue(5);
console.log(countdown.lastExternalValue); // Should be 5

countdown.setExternalValue(5); // Same value
// Canvas NOT updated (change detection prevents redundant render)

countdown.setExternalValue(3);
console.log(countdown.lastExternalValue); // Should be 3
// Canvas updated to show 3
```

### Test Timer Pause
```javascript
countdown.start();
countdown.setExternalValue(7);

// Timer should be paused
countdown.update(1.0); // 1 full second
console.log(countdown.countdownValue); // Still 7 (not decremented)

// Resume timer
countdown.clearExternalValue();
countdown.update(1.0);
console.log(countdown.countdownValue); // Now 6 (decremented)
```

---

## Related Files

- **Test Suite**: `/tests/unit/countdown-manager.test.js` (lines 1074-1261)
- **System Architecture**: `/docs/system-architecture.md` (Gesture-Driven Countdown Pipeline)
- **Gesture Detection**: `/src/christmas-tree/gesture-detection.js` (countFingers, Phase 1)
- **Text Effects**: `/src/fireworks/text-effects.js` (renderCountdownValue, material updates)

