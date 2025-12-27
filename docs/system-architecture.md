# System Architecture

High-level architecture and component design for the Three.js application.

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│           Browser Window (viewport)                  │
├──────────────────────────────────────────────────────┤
│  ├─ WebGL Canvas (Three.js Render)                  │
│  │   └─ Three.js Scene Graph                        │
│  │       ├─ Camera, Meshes, Lights, Controls       │
│  │       └─ Particle System (Fireworks) NEW         │
│  │           ├─ Float32Array Buffers (2000 max)    │
│  │           ├─ ShaderMaterial (5 types)           │
│  │           └─ Points Mesh (GPU-accelerated)      │
│  │                                                   │
│  ├─ Audio Subsystem (HTML5)                         │
│  │   ├─ Audio Element (bgMusic, loop, preload)     │
│  │   ├─ Audio Control Button (volume toggle)       │
│  │   └─ localStorage (preference persistence)      │
│  │                                                   │
│  └─ UI Layer                                        │
│      ├─ Tab Navigation                             │
│      └─ Photo Upload Interface                     │
└──────────────────────────────────────────────────────┘
```

## Core Components

### Scene
- **Role**: Container for all 3D objects
- **Color**: Pure black background (0x000000)
- **Properties**: Manages lights, meshes, and spatial relationships

### Camera
- **Type**: PerspectiveCamera
- **FOV**: 75 degrees
- **Aspect**: window.innerWidth / window.innerHeight
- **Clipping**: Near (0.1), Far (1000)
- **Position**: Z = 5 (distance from objects)

### Renderer
- **Type**: WebGLRenderer with antialias
- **Size**: Full window dimensions (responsive)
- **Pixel Ratio**: window.devicePixelRatio
- **Domination**: Appended to document.body

### Mesh (Cube)
- **Geometry**: BoxGeometry (1x1x1)
- **Material**: MeshStandardMaterial
  - Color: 0x6366f1 (indigo)
  - Metalness: 0.3
  - Roughness: 0.4
- **Animation**: Rotates on X and Y axes continuously

### Lighting
- **Ambient Light**: 0xffffff, intensity 0.5
  - Provides uniform base illumination
- **Directional Light**: 0xffffff, intensity 1.0
  - Position: (5, 5, 5)
  - Creates shadows and highlights

### Controls
- **Type**: OrbitControls
- **Damping**: Enabled (smoothing factor: 0.05)
- **Interaction**: Mouse drag to rotate, scroll to zoom

### Fireworks Particle System (Phase 1: 2025-12-27)
- **Type**: GPU-accelerated particle engine via THREE.Points
- **Capacity**: 2,000 simultaneous particles
- **Buffer Management**: 7 Float32Array buffers (positions, velocities, colors, sizes, ages, maxAges, types)
- **Types**: 5 distinct behaviors (Bloom, Spark, Drift, Scatter, Sparkler) with unique physics
- **Shaders**: Custom GLSL vertex/fragment for particle rendering with additive blending
- **Performance**: Single draw call, O(1) particle removal via swap-and-pop strategy
- **Lifecycle**: spawn → update (gravity/damping) → cull (age-based) → dispose
- **Memory**: Pre-allocated buffers (~352KB), no runtime allocation, validated zero memory leaks

### Countdown Manager (Phase 3: 2025-12-27) - EXTENDED WITH GESTURE CONTROL
- **File**: `src/fireworks/countdown-manager.js`
- **Purpose**: 10-second countdown timer with rainbow neon "2025" text, finale trigger, and gesture-driven control
- **Components**:
  - Rainbow HSL cycling neon material (0.8 emissive intensity, 0.3 metalness)
  - 3D "2025" TextGeometry with bevel effect (size 2, height 0.3, bevel segments 3)
  - Canvas-based countdown plane (256x256, golden glow effect)
  - Bloom parameter switching (neon vs tree mode)
- **Timer-Based Countdown**:
  - 10-second loop: countdownValue 10→0
  - Auto-decrement every second (elapsed >= 1.0 check)
  - 2-second post-finale delay before reset
  - State Machine: isActive → countdownValue decrement → finaleTriggered → waitingAfterFinale → reset
- **Gesture Control Integration (Phase 3 NEW)**:
  - **setExternalValue(value)**: Set countdown from gesture input (0-10, auto-clamped, rounded)
    - Input validation: clamps to [0, 10], applies Math.round()
    - Change detection: only updates display on value change (prevents redundant re-renders)
    - Pauses timer-based countdown while active (externalValueSet=true)
    - Tracks lastExternalValue to detect changes
  - **clearExternalValue()**: Resume timer-based countdown
    - Resets externalValueSet=false and lastExternalValue=null
    - Countdown resumes from current value (no reset to 10)
  - **isExternallyControlled()**: Check control state
    - Returns externalValueSet boolean for UI feedback
- **State Management**:
  - externalValueSet: true when gesture controls value, false for timer
  - lastExternalValue: tracks previous gesture value for change detection
  - Resets on start()/stop() to ensure clean state transitions
- **Callback**: setFinaleCallback(fn) fires at countdown=0 for New Year effect trigger
- **Visibility**: Group-based show/hide for batch control
- **Resource Management**: Proper Font/Texture/Material disposal on cleanup

### New Year Mode Orchestration Layer (Phase 4: 2025-12-27)
- **Purpose**: Master controller for New Year fireworks mode - coordinates all sub-systems
- **File**: `src/fireworks/new-year-mode.js`
- **Key Responsibilities**:
  - Mode state management (active/inactive with localStorage persistence)
  - Component lifecycle coordination (fireworks, audio, countdown, UI button)
  - Scene visibility toggling (hide Christmas tree & snow, show countdown elements)
  - Bloom parameter management (switch between tree/fireworks post-processing presets)
- **Components Managed**:
  - FireworkSystem: Particle engine for effects
  - FireworkAudio: WebAudio synthesis (lazy initialized on user interaction)
  - CountdownManager: 10-second timer with 2025 text & finale callback
  - UI Button: CSS .active class for visual feedback
- **State Transitions**:
  ```
  [Inactive] --activate()--> [Active]
    ├─ Hide mainGroup & snowSystem
    ├─ Show countdown group
    ├─ Switch bloom: threshold 0.85→0.5, strength 0.25→1.5, radius 0.3→0.6
    ├─ Start countdown timer
    └─ Save preference to localStorage

  [Active] --deactivate()--> [Inactive]
    ├─ Show mainGroup & snowSystem
    ├─ Hide countdown group
    ├─ Clear firework particles
    ├─ Restore bloom: threshold 0.5→0.85, strength 1.5→0.25, radius 0.6→0.3
    ├─ Stop countdown timer
    └─ Save preference to localStorage
  ```
- **Interaction Patterns**:
  - **Auto-Spawn**: Cycles through firework types every 1.5s (BLOOM→SPARK→DRIFT→SCATTER→SPARKLER)
  - **Click-to-Spawn**: Converts screen coordinates to 3D world position via camera unprojection
    - Raycasts from camera through screen point to 30 units distance
    - Spawns firework at ray-cast position with type cycling
  - **Finale Trigger**: CountdownManager calls onFinale callback at countdown=0
    - Spawns 3 bursts of each firework type with 200ms stagger
    - Creates 15 total particles across 5 types over 1 second
- **Audio Integration**:
  - Lazy initialization on first activation (user gesture required)
  - Audio context resumed on each activate() for browser autoplay policy compliance
  - Plays sound effect on each firework spawn (type-specific synthesis)
- **Button State Management**:
  - querySelector('#newyear-btn') added/removed .active class on toggle
  - Provides visual feedback for mode state
- **Preference Persistence**:
  - Saves isActive state to localStorage['newYearModeEnabled']
  - Checked on init but does NOT auto-activate (requires explicit user toggle)
  - Graceful fallback if localStorage unavailable

### Audio Subsystem (PR#3)
- **Source**: HTML5 `<audio>` element with local MP3 file
- **File Location**: `./audio/jingle-bells.mp3`
- **Volume**: Set to 0.3 (30%) before playback to prevent burst
- **Looping**: Enabled (continuous background music)
- **Preload**: Auto (load media on page initialization)
- **Button Controls**: Fixed bottom-left toggle for play/pause
- **State Persistence**: localStorage saves user mute preference
- **Browser Compatibility**: Webkit prefix (`-webkit-backdrop-filter`) for Safari support

### Upload & File Management Subsystem (Phase 3)
- **Progress Bar**: Smooth gradient fill animation (green: `#22c55e` → `#4ade80`)
  - Real-time progress text showing upload count
  - ARIA progressbar role with aria-valuenow updates for accessibility
- **Toast Notifications**: Multi-type system (success, error, warning, info)
  - Fixed positioned at bottom with safe area insets
  - Auto-dismiss after configurable duration (default 4s)
  - Stacking support for multiple notifications
- **Retry Logic**: Manual retry button appears on failed uploads
  - Retries with exponential backoff (1s, 2s, 4s delays)
  - Per-file status indicators (compressing, queued, uploading, retrying, done, failed)
  - Stateful failure tracking for selective retries
- **Error Handling**: Comprehensive feedback via toast + status indicators
  - File compression via browser-image-compression library
  - Parallel upload queue (max 4 concurrent) with cancellation support

## Data Flow

### 3D Rendering Pipeline
```
User Input (Mouse/Scroll)
        ↓
    OrbitControls
        ↓
    Camera Position Update
        ↓
    Animation Loop
        ↓
    Mesh Rotation Update
        ↓
    Renderer.render(scene, camera)
        ↓
    WebGL Canvas Display
```

### Audio Control Pipeline (PR#3)
```
Page Load
    ↓
Check localStorage for preference
    ↓
If enabled → Autoplay with error handling
If disabled → Keep muted (default)
    ↓
User clicks audio button
    ↓
Toggle play/pause state
    ↓
Update button icon & CSS class
    ↓
Save preference to localStorage
    ↓
Audio plays with volume = 0.3 (pre-set to prevent burst)
```

### File Upload Pipeline (Phase 3)
```
User selects/drags files
    ↓
File validation (image type, size limits)
    ↓
Render preview with file metadata
    ↓
User clicks "Upload All"
    ↓
Image compression (if > 500KB)
    ├─ Update status → 'compressing'
    └─ Convert HEIC → JPEG via browser-image-compression
    ↓
Queue files for upload (concurrency = 4)
    ├─ Update status → 'queued'
    └─ Update progress bar (aria-valuenow)
    ↓
Upload with retry logic (max 3 attempts)
    ├─ Exponential backoff: 1s, 2s, 4s
    ├─ Update status → 'uploading' / 'retrying' / 'done' / 'failed'
    └─ Update progress fill & text in real-time
    ↓
Handle results
    ├─ Success → Show toast + update gallery
    ├─ Partial failure → Show toast + enable "Retry Failed" button
    └─ Full success → Show success modal
    ↓
Cleanup & reset UI
```

### New Year Countdown Pipeline (Phase 3)
```
Page initialization / User trigger
    ↓
CountdownManager.init()
    ├─ FontLoader.load() → helvetiker font
    ├─ createText2025() → TextGeometry mesh
    └─ createCountdownPlane() → canvas texture plane
    ↓
countdown.start() called
    ├─ Show group (visibility = true)
    ├─ adjustBloomForNeon() → switch bloom to neon settings
    └─ Reset state (countdownValue = 10, elapsed = 0)
    ↓
Animation loop: countdown.update(dt)
    ├─ updateRainbowMaterial(dt) → rotate HSL hue continuously
    ├─ Accumulate elapsed time
    ├─ Every 1.0s:
    │   ├─ Decrement countdownValue
    │   ├─ renderCountdownValue() → update canvas texture
    │   └─ If countdownValue === 0 → triggerFinale()
    └─ After finale wait (2s) → resetCountdown()
    ↓
countdown.triggerFinale() called
    ├─ Set finaleTriggered = true
    ├─ Call onFinale() callback (New Year effect handler)
    └─ Enter waitingAfterFinale state
    ↓
countdown.stop() / countdown.dispose()
    ├─ Hide group (visibility = false)
    ├─ restoreBloomForTree() → reset bloom to tree settings
    ├─ Dispose geometry, materials, textures
    └─ Clear all references
```

### Gesture-Driven Countdown Pipeline (Phase 3 Gesture Integration)
```
Hand detection (MediaPipe)
    ↓
countFingers() → returns 0-5
    ↓
countdown.setExternalValue(fingerCount)
    ├─ Validate input: clamp(0, value, 10), round decimals
    ├─ Check change: if value !== lastExternalValue
    │   ├─ Update countdownValue = value
    │   ├─ renderCountdownValue() → update canvas texture
    │   ├─ Set externalValueSet = true
    │   └─ Store lastExternalValue = value
    └─ Prevent redundant rendering if value unchanged
    ↓
countdown.update(dt) called each frame
    ├─ if externalValueSet === true:
    │   ├─ Skip timer logic (timer paused)
    │   └─ Continue rainbow material update
    └─ if externalValueSet === false:
        └─ Normal timer countdown (decrement every 1.0s)
    ↓
Hand detection lost OR gesture interaction ends
    ↓
countdown.clearExternalValue()
    ├─ Set externalValueSet = false
    ├─ Clear lastExternalValue = null
    └─ Timer resumes from current countdownValue
    ↓
countdown.isExternallyControlled()
    └─ Returns boolean for UI state feedback (showing gesture control active)
```

## Rendering Pipeline

1. **Update Phase**
   - Update controls (camera position)
   - Rotate mesh (animation frame)
   - Calculate lighting

2. **Render Phase**
   - Clear canvas
   - Render scene to canvas
   - Display result

3. **Loop**
   - `requestAnimationFrame` ensures 60 FPS (browser dependent)

## Event Handling

| Event | Handler | Action |
|-------|---------|--------|
| `window.resize` | Resize listener | Update camera aspect & renderer size |
| Mouse drag | OrbitControls | Rotate camera around target |
| Mouse scroll | OrbitControls | Zoom in/out |

## Performance Characteristics

| Metric | Value |
|--------|-------|
| Frame Rate | 60 FPS (target) |
| Memory | ~50MB (includes Three.js + scene) |
| Bundle | ~180KB (gzipped with Three.js) |
| Load Time | <1s (with cache) |

## Scalability Considerations

### For Future Growth

1. **Multiple Objects**: Extend scene with additional meshes
2. **Advanced Materials**: Texture loading, normal maps
3. **Complex Models**: glTF/FBX loader integration
4. **Optimization**: Frustum culling, LOD systems
5. **Effects**: Post-processing, particle systems

### Code Modularity

Current structure supports extraction into:
- `scene-setup.js` - Scene initialization
- `camera-setup.js` - Camera configuration
- `lighting-setup.js` - Lighting system
- `mesh-factory.js` - Mesh creation utilities
- `animation-loop.js` - Render loop management

## Dependencies & Integrations

```
main.js
├── Three.js (library)
│   ├── core (Scene, Camera, Renderer)
│   ├── geometries (BoxGeometry)
│   ├── materials (MeshStandardMaterial)
│   ├── lights (AmbientLight, DirectionalLight)
│   └── addons
│       └── OrbitControls
└── DOM APIs
    ├── document.body
    └── window (resize, innerWidth, innerHeight)
```

## Browser Compatibility

- **Minimum**: WebGL 2.0 support (handled by Three.js)
- **Tested**: Chrome 90+, Firefox 88+, Safari 14+
- **Mobile**: iOS Safari 14+, Chrome Android

## Backend Upload Service Architecture

### Upload Flow with Reliability Features

```
POST /upload
    ↓
[Multer Middleware]
├─ Memory storage
├─ File size check (MAX_FILE_SIZE_MB: 32MB)
└─ MIME type validation
    ↓
[Validation Chain]
├─ File existence (NO_FILE)
├─ Photo limit check (LIMIT_REACHED: 10 photos)
├─ Magic bytes validation (INVALID_TYPE)
└─ API key check (CONFIG_ERROR)
    ↓
[Base64 Encoding]
    ↓
[Retry-Wrapped Upload]
├─ uploadToImgBB()
│  ├─ Dynamic timeout calculation (15s + 5s/MB, max 60s)
│  └─ Exponential backoff on retries (1s, 2s, 4s, 8s max)
│     ├─ Detects: ECONNRESET, ETIMEDOUT, ECONNABORTED, 429, 5xx
│     └─ Max 3 attempts (configurable)
    ↓
[Response Mapping]
├─ 429 → RATE_LIMITED (retryAfter: 60)
├─ Timeout → TIMEOUT (504 Gateway Timeout)
├─ Upstream error → UPSTREAM_ERROR (502 Bad Gateway)
└─ Success → Store in DB, return count/remaining
```

### Error Code Classification System

**Transient Errors (Retryable):**
- Network: ECONNRESET, ETIMEDOUT, ECONNABORTED
- Rate limit: 429 status
- Server errors: 5xx status

**Permanent Errors (No retry):**
- NO_FILE, LIMIT_REACHED, INVALID_TYPE
- FILE_TOO_LARGE, INVALID_FILE
- CONFIG_ERROR, INTERNAL_ERROR

### Photo Management Endpoints

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/` | POST | Upload image to ImgBB | `{success, data, count, remaining, max}` |
| `/photos` | GET | List user photos | `{photos[], count, max, remaining}` |
| `/:id` | DELETE | Delete specific photo | `{success, message, count, remaining}` |

### Dynamic Timeout Algorithm

```javascript
function calculateTimeout(fileSizeBytes) {
  const MB = 1024 * 1024;
  const sizeMB = fileSizeBytes / MB;

  // Base: 15s, add 5s per MB, max 60s
  const timeout = Math.min(15000 + (sizeMB * 5000), 60000);
  return Math.round(timeout);
}
```

**Examples:**
- 1MB file: 15s + 5s = 20s timeout
- 5MB file: 15s + 25s = 40s timeout
- 10MB file: 15s + 50s = 60s (capped)

### Exponential Backoff Strategy

```javascript
async function withRetry(fn, options = {}) {
  const { retries = 3, baseDelay = 1000, maxDelay = 8000 } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt === retries || !isRetryableError(err)) {
        throw err;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      // Wait: 1s, 2s, 4s, 8s before retry
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

### Configuration

**Environment Variables:**
- `IMGBB_API_KEY` - Required for ImgBB uploads
- `MAX_PHOTOS` - Photo limit per user (default: 10)
- `MAX_FILE_SIZE_MB` - File size limit (default: 32MB)

**Rate Limiting:**
- 15 uploads per minute per session
- Uses sessionId from request
- Configurable via factory options

### Dependencies

```
routes/upload.js
├── express (Router API)
├── multer (file parsing)
├── axios (HTTP client)
├── form-data (multipart encoding)
├── express-rate-limit (throttling)
├── file-type (magic byte validation)
└── ../lib/db.js (data persistence)
```

## Frontend Upload System Architecture (Phase 1: 2025-12-27)

### Client-Side Image Compression Pipeline
**Feature:** Automatic client-side compression before upload to reduce bandwidth and server load

**Compression Library:** `browser-image-compression@2.0.2` (CDN: jsDelivr with SRI hash)
- Location: `index.html` lines 12-15
- Features:
  - WebWorker support for non-blocking compression
  - HEIC→JPEG conversion (iOS compatibility)
  - Max file size: 2MB after compression
  - Max dimensions: 1920×1920px
  - Quality setting: 90% (high quality, small file size)
  - Fallback: Returns original file if compression fails

**Compression Flow:**
```
User selects files
    ↓
compressImage(file) called for each file
    ↓
Check: file < 500KB? Return original (skip compression)
    ↓
Configure options: maxSizeMB=2, maxWidth/Height=1920, quality=0.9
    ↓
Run compression in WebWorker (non-blocking)
    ↓
Return compressed file OR original on failure
```

### Parallel Upload Queue with Concurrency Control
**Feature:** Upload multiple files simultaneously with controlled concurrency (max 4 concurrent)

**Upload Queue Class:** Lines 736-803
- Concurrency level: 4 (configurable)
- Queue management: FIFO processing
- Progress tracking: Per-file status indicators
- Failure handling: Automatic detection + retry eligibility

**Queue Architecture:**
```
Files enqueued → Internal queue array
    ↓
While (running < 4 AND queue.length > 0):
    Dequeue file → Start upload with retry
    running++ → Track active uploads
    ↓
    uploadWithRetry(file, index, 3 retries)
        ↓
        Try: uploadFile() → POST /api/upload
        ↓
        On error: Exponential backoff (1s, 2s, 4s)
        ↓
    running-- → Mark slot available
    process() → Start next file
```

### Retry Mechanism with Exponential Backoff
**Feature:** Automatic retry for failed uploads with increasing delays

**Retry Logic:** Lines 769-783
- Max attempts: 3 total (1 initial + 2 retries)
- Backoff delays: [1000ms, 2000ms, 4000ms]
- Applies to all upload failures (network, server, timeout)
- User can manually retry via "Upload All" button

**Retry Algorithm:**
```javascript
for attempt = 0 to 3:
    try:
        return uploadFile(file)  // Success → return
    catch error:
        if attempt === 3: return failure
        delay = delays[attempt]   // 1s, 2s, 4s
        await sleep(delay)
        onProgress('retrying', attempt + 1)
```

### Per-File Status Indicators
**Feature:** Real-time visual feedback for upload progress

**Status Types:** Lines 825-849
| Status | Display | Duration | Color | Icon |
|--------|---------|----------|-------|------|
| compressing | ⏳ Compressing... | 1-10s | Blue | - |
| queued | ⏳ Queued | Until upload starts | Gray | - |
| uploading | ⬆️ Uploading... | Variable | Purple | - |
| retrying | 🔄 Retry 1/3... | 1-4s between attempts | Yellow | - |
| done | ✅ Done | Persistent | Green | Checkmark |
| failed | ❌ Failed | Persistent | Red | X |

**HTML Structure:** Lines 414-432 (CSS styling)
```html
<div class="preview-item" data-file-index="0">
  <img src="...">
  <button class="remove">...</button>
  <div class="file-info">2.5MB</div>
  <div class="file-status status-uploading">⬆️ Uploading...</div>
</div>
```

### HEIC to JPEG Conversion
**Feature:** Automatic format conversion for iOS camera images

**Implementation:** Lines 810-816 (compression options)
```javascript
const options = {
  fileType: 'image/jpeg'  // Force JPEG output
};
```

**Conversion Flow:**
- Detects HEIC input (iOS original camera format)
- Converts to JPEG during compression
- Maintains ~90% quality for visual fidelity
- Fallback: Returns original if conversion fails

## Fireworks System Technical Details (Phase 1: 2025-12-27)

### Particle Lifecycle & Physics

**Spawn Phase (spawn method):**
```
Input: origin (Vector3), type (enum 0-4, default random)
  1. Allocate particle slots: COUNT = FIREWORK_TYPES[type].particles
  2. Set positions: All particles at origin
  3. Set velocities: type-specific distribution
  4. Set colors: Random from type's palette
  5. Set sizes: Random within type's size range
  6. Set ages: 0 (birth)
  7. Set maxAges: Random within type's duration range
  8. Track burst metadata: startIndex, count, type, spawnTime
  9. Return: success flag (false if insufficient capacity)
```

**Update Phase (update method, called per frame):**
```
For each active particle:
  1. Apply gravity: velocities[i3+1] += config.gravity
  2. Apply damping: velocities *= config.damping (air resistance)
  3. Update position: positions += velocities
  4. Age particle: ages[i] += deltaTime
  5. Mark GPU buffers dirty: needsUpdate = true
  6. Cull dead particles: age >= maxAge → remove
```

**Cull Phase (cullDeadParticles method, O(n) worst case):**
```
Swap-and-pop algorithm:
  i = 0
  while i < activeCount:
    if ages[i] >= maxAges[i]:
      swap(particle[i], particle[activeCount-1])
      activeCount--
    else:
      i++
```

### Type-Specific Physics Parameters

**Bloom Type (Firework-like burst):**
- Velocity distribution: Fibonacci sphere (golden ratio angle per particle)
- Jitter: 10% randomness on each axis
- Speed variation: 80%-120% of base speed
- Effect: Even spherical expansion with slight noise
- Use case: Classic firework burst

**Spark Type (Fast spreading):**
- Velocity distribution: Spherical coordinates (theta 0-2π, phi 0-π)
- Speed variation: 70%-130% of base speed
- Effect: Random omnidirectional high-speed particles
- Use case: Fast crackling sparks

**Drift Type (Floating ascending):**
- Velocity distribution: Horizontal bias with slight upward tendency
- Horizontal component: 80%-120% of base speed
- Vertical component: 20%-50% of base speed (always positive y)
- Effect: Particles float horizontally while gently rising
- Use case: Floating ember/dust effect

**Scatter Type (Chaotic random):**
- Velocity distribution: Completely random in all directions
- Speed variation: 50%-150% of base speed
- Effect: Chaotic unpredictable trajectories
- Use case: Explosive dispersal pattern

**Sparkler Type (Continuous fizzle):**
- Velocity distribution: Mostly upward with minimal spread
- Vertical component: 50%-100% of base speed (always positive)
- Horizontal spread: Small radius around vertical axis
- Effect: Thin upward stream with slight wobble
- Use case: Sparkler stick effect

### GPU Rendering Pipeline

**Vertex Shader (Standard Fireworks):**
- Input: position, size, age, maxAge, type, color
- Calculations:
  - Life ratio: vLife = 1 - (age / maxAge)
  - Point size: baseSize * vLife * pixelRatio * (100 / -mvPosition.z)
  - Min size clamp: max(size, 1.0) to prevent disappearance
- Output: gl_Position, gl_PointSize, vLife, vColor, vType

**Fragment Shader (Standard Fireworks):**
- Input: gl_PointCoord (0-1 on point quad), vLife, vColor
- Calculations:
  - Distance from center: dist = length(gl_PointCoord - 0.5)
  - Discard pixels: if dist > 0.5
  - Soft edge: alpha = smoothstep(0.5, 0.0, dist) * vLife
  - Glow boost: color + 0.3 * vLife (additive)
- Output: gl_FragColor (color, alpha)

**Sparkler Vertex Shader (Animation):**
- Additional: Noise-based flicker via hash(age * 100 + uTime)
- Size modulation: size * (0.5 + noise * 0.5) * vLife
- Effect: Sparkling size variation independent of physics

**Sparkler Fragment Shader (Glow):**
- Hot core effect: mix(white, color, dist * 2.0)
- Sparkle intensity: radialGradient * (0.7 + noise * 0.3)
- Result: Warm glowing center fading to color edge

### Buffer Attributes & Updates

**GPU Buffer Attributes (7 total):**
| Attribute | Type | Size | Updates | Purpose |
|-----------|------|------|---------|---------|
| position | vec3 | 3 * 2000 | Every frame | Particle locations |
| color | vec3 | 3 * 2000 | Every frame | RGB color per particle |
| size | float | 1 * 2000 | Every frame | Point size scaling |
| age | float | 1 * 2000 | Every frame | Current age |
| maxAge | float | 1 * 2000 | Spawn only | Lifespan per particle |
| type | float | 1 * 2000 | Spawn only | Type enum (0-4) |
| (normal) | none | - | - | Not used (depthWrite=false) |

**Update Strategy:**
- Mark all attributes dirty every frame via needsUpdate = true
- THREE.js syncs to GPU in next render call
- Draw range optimized: setDrawRange(0, activeCount)

### Performance Optimization Techniques

1. **Pre-allocated Buffers:** Float32Array created at construction, reused forever
2. **Swap-and-pop Removal:** O(1) particle culling, no array copying
3. **Single Draw Call:** All particles rendered in one glDrawArrays
4. **Additive Blending:** Eliminates Z-sort requirement
5. **Frustum Culling Disabled:** Particles can spawn anywhere in view
6. **Burst Tracking:** Limited to 20 active bursts (LRU cleanup)
7. **No Dynamic Allocation:** Zero GC pressure during runtime
8. **PixelRatio Limiting:** Max 2x to prevent massive points on retina

### Memory Footprint

**Per-Particle Data (continuous arrays):**
- Positions: 3 floats = 12 bytes
- Velocities: 3 floats = 12 bytes (CPU-side, not GPU)
- Colors: 3 floats = 12 bytes
- Sizes: 1 float = 4 bytes
- Ages: 1 float = 4 bytes
- MaxAges: 1 float = 4 bytes
- Types: 1 float = 4 bytes
- **Subtotal: 52 bytes/particle**

**For 2000 particles:**
- All buffers: 2000 * 52 = 104KB (CPU)
- GPU buffers: ~200KB (vec3/float storage)
- Materials & geometry: ~48KB
- **Total: ~352KB**

### Integration with Scene

**Scene Graph Position:**
- FireworkSystem creates THREE.Points mesh
- Added to scene via scene.add(this.points)
- Name: 'fireworkSystem' (for debugging)
- Layer: Default layer, renders with main pass

**Rendering Order:**
1. Clear canvas
2. Render opaque meshes (camera, lighting applied)
3. Render transparent: Fireworks (additive blending, last)
4. Display result

**Z-Depth Handling:**
- depthWrite: false prevents depth buffer updates
- Particles don't occlude each other
- Additive blending: Last particle always adds to what's below
- Result: Natural light accumulation

## Future Enhancements

### Fireworks & Countdown (Phase 4+)
1. Audio-reactive finale: Trigger finale on music beat detection
2. Confetti burst: Spawn particles on countdown=0 callback
3. Camera shake: Apply brief orbital disturbance on finale
4. Trajectory trails: Add tail/ribbon effects to particles
5. Collision detection: Particles bounce off geometry
6. Wind/gravity fields: Per-region physics modulation
7. Countdown sound effects: Beep at each second, finale fanfare

### Visual & Rendering
8. Skybox/environment mapping
9. Texture-based materials
10. Model loader for complex geometries
11. Post-processing chains: Multiple bloom + tone mapping

### Performance & Monitoring
12. Performance monitoring dashboard (FPS, memory profiler)
13. Particle system batching for multi-type scenes
14. GPU instancing for large geometry counts

### Mobile & Upload
15. Mobile gesture support (pinch-to-zoom, swipe)
16. Chunked uploads for >32MB files
17. Progressive image optimization (WebP, AVIF support)
