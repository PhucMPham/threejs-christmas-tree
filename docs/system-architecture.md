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

## Future Enhancements

1. Add skybox/environment mapping
2. Implement texture-based materials
3. Add model loader for complex geometries
4. Performance monitoring dashboard
5. Mobile gesture support (pinch-to-zoom)
6. Chunked uploads for >32MB files
7. Progressive image optimization (WebP, AVIF support)
