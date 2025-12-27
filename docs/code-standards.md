# Code Standards

Standards and best practices for Three.js development in this project.

## File Organization

```
/
├── src/christmas-tree/
│   ├── index.html       # Main application (Phase 3: gesture tree with photos)
│   └── images/          # Preloaded photos (photo1.jpg - photo5.jpg)
├── main.js              # Primary entry point, scene initialization (legacy)
├── index.html           # Entry template (legacy)
├── vite.config.js       # Build configuration
└── [future modules]/    # Scene components, utilities, etc.
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| **Variables** | camelCase | `camera`, `orbitControls`, `ambientLight` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_ZOOM_DISTANCE` |
| **Classes** | PascalCase | `OrbitControls` (from Three.js) |
| **Functions** | camelCase | `animate()`, `setupScene()` |
| **Files** | lowercase, hyphens | `orbit-controls.js` |

## Code Structure

### Scene Setup Pattern
```javascript
// 1. Initialize core components
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(...);
const renderer = new THREE.WebGLRenderer(...);

// 2. Add objects to scene
const geometry = new THREE.BoxGeometry(...);
const material = new THREE.MeshStandardMaterial(...);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// 3. Setup lighting
const ambientLight = new THREE.AmbientLight(...);
scene.add(ambientLight);

// 4. Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
```

## Best Practices

1. **Memory Management**
   - Dispose geometries: `geometry.dispose()`
   - Dispose materials: `material.dispose()`
   - Dispose textures: `texture.dispose()`

2. **Performance**
   - Use `setPixelRatio(window.devicePixelRatio)` for clarity
   - Enable damping in OrbitControls for smooth interaction
   - Avoid unnecessary re-renders

3. **Responsive Design**
   - Listen to `window.resize` events
   - Update camera aspect ratio
   - Resize renderer and canvas accordingly

4. **Three.js Imports**
   - Use named imports: `import * as THREE from 'three'`
   - Import addons: `import { OrbitControls } from 'three/addons/...'`

## Material Configuration

Use `MeshStandardMaterial` for PBR-compliant rendering:
```javascript
const material = new THREE.MeshStandardMaterial({
  color: 0x6366f1,      // sRGB color in hex
  metalness: 0.3,       // 0-1 range
  roughness: 0.4,       // 0-1 range
  emissive: 0x000000,   // Optional glow
});
```

## Lighting Setup

Standard lighting configuration:
- **Ambient Light**: Base illumination (0.5-0.7 intensity)
- **Directional Light**: Key light source (1.0 intensity)
- **Position**: Directional light at (5, 5, 5) or similar offset

## Comments & Documentation

- Use JSDoc for public functions
- Inline comments for complex logic only
- Keep comments concise and purpose-focused

## Git Commit Messages

Format: `<type>: <description>`

Examples:
- `feat: add material controls UI`
- `fix: resolve WebGL context loss on resize`
- `refactor: extract lighting into utility`
- `docs: update code standards`

## Testing Considerations

- Test on multiple browsers (Chrome, Firefox, Safari)
- Verify responsive behavior at different viewport sizes
- Check console for warnings and errors
- Monitor performance with DevTools

## Deprecated Patterns

Avoid:
- `RendererEvents` (use `window` events)
- `OrbitControls` with no damping (causes jerky motion)
- Multiple `PerspectiveCamera` instances per scene
- Hardcoded canvas dimensions (use `window.innerWidth`)

---

## Phase 3: Configuration & Customization

### CONFIG Object Structure
```javascript
const CONFIG = {
  colors: {
    bg: 0x050d1a,
    fog: 0x050d1a,
    champagneGold: 0xffd966,
    deepGreen: 0x03180a,
    accentRed: 0x990000
  },
  particles: {
    count: 1500,        // Decorative particles
    dustCount: 2000,    // Dust effect particles
    snowCount: 1000,    // Falling snow
    treeHeight: 24,     // Tree model height
    treeRadius: 8       // Tree base radius
  },
  camera: { z: 50 },
  preload: {
    autoScanLocal: false,           // Disabled for curated experience
    scanCount: 0,
    images: [
      './images/photo1.jpg',
      './images/photo2.jpg',
      './images/photo3.jpg',
      './images/photo4.jpg',
      './images/photo5.jpg'
    ]
  }
};
```

### Photo Loading Pattern
```javascript
function loadPredefinedImages() {
  const loader = new THREE.TextureLoader();
  if (CONFIG.preload.images && CONFIG.preload.images.length > 0) {
    CONFIG.preload.images.forEach(imgPath => {
      loader.load(imgPath, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        addPhotoToScene(t);
      }, undefined, (err) => {
        console.warn('Failed to load image:', imgPath);
      });
    });
  }
}
```

### Material Tuning (Phase 3)
- **Gold Boxes/Spheres**: metalness 0.8, roughness 0.2 (reflective)
- **Gold Frames**: metalness 0.6, roughness 0.4 (less reflective for clarity)
- **Photo Display**: Best with reduced bloom (strength 0.25)

### Visual Effects Configuration
```javascript
// Bloom effect for Christmas glow
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(width, height),
  1.5,      // Radius
  0.4,      // Strength
  0.85      // Threshold
);
```

**Phase 3 Tuning:**
- Threshold 0.85 (increased for clearer photos)
- Strength 0.25 (reduced bloom on faces)
- Radius 0.3 (subtle glow effect)

---

## Phase 4: Audio System Standards (PR#3)

### HTML5 Audio Element Setup
```html
<!-- Audio element must include loop and preload attributes -->
<audio id="bgMusic" loop preload="auto">
  <source src="./audio/jingle-bells.mp3" type="audio/mpeg">
</audio>
```

**Key Points:**
- Use `id="bgMusic"` for consistent JavaScript reference
- `loop` attribute enables seamless looping
- `preload="auto"` loads media on page init
- Comment explains purpose and security benefit (local file)

### Volume Control Pattern
```javascript
// CRITICAL: Set volume BEFORE calling play()
// Prevents audio burst on first playback (race condition fix)
const bgMusic = document.getElementById('bgMusic');
bgMusic.volume = 0.3;  // Set volume first (line must be at 697)

// Then call play() with error handling
bgMusic.play().catch(err => console.log('Audio play failed:', err));
```

**Why Volume-First?**
- Browser race condition: volume may not apply if set after play()
- Default volume = 0.3 (30%) provides pleasant background level
- Prevents sudden loud burst that startles users
- Must occur before any `play()` call (lines 697, 715, 724)

### Audio State Management Pattern
```javascript
// 1. Load preference from localStorage
const savedMuted = localStorage.getItem('christmasMusicMuted');
let isMuted = savedMuted === 'false' ? false : true;

// 2. Restore UI state
if (!isMuted) {
  audioControl.classList.remove('muted');
  audioIcon.className = 'fas fa-volume-up';
}

// 3. Attempt autoplay with error handling
if (!isMuted) {
  bgMusic.play().catch(() => {
    // Autoplay blocked - revert to muted state
    isMuted = true;
    audioControl.classList.add('muted');
    audioIcon.className = 'fas fa-volume-mute';
  });
}

// 4. Save preference after user interaction
localStorage.setItem('christmasMusicMuted', isMuted);
```

**localStorage Key Points:**
- Key name: `christmasMusicMuted` (boolean as string)
- Default: `true` (muted on first visit)
- User interaction updates this value
- Persists across sessions

### Audio Button UI Standards
```html
<!-- Audio control button with glassmorphism effect -->
<button id="audioControl" class="muted" title="Toggle Christmas Music">
  <span class="pulse"></span>
  <i class="fas fa-volume-mute" id="audioIcon"></i>
</button>
```

**CSS Requirements:**
```css
#audioControl {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(212, 175, 55, 0.5);

  /* CRITICAL: Webkit prefix for Safari support (line 375) */
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);

  transition: all 0.3s;
  z-index: 200;
}

/* Icon changes based on muted state */
#audioControl.muted {
  color: rgba(212, 175, 55, 0.4);
  border-color: rgba(212, 175, 55, 0.3);
}

/* Pulse animation visible only when playing */
#audioControl:not(.muted) .pulse {
  opacity: 1;
  animation: audioPulse 2s ease-out infinite;
}
```

**Safari Compatibility:**
- Include `-webkit-backdrop-filter` prefix (line 375)
- Standard `backdrop-filter` for modern browsers (line 376)
- Ensures blur effect works across all browsers

### Audio Event Handling
```javascript
// Toggle button click handler
audioControl.addEventListener('click', () => {
  isMuted = !isMuted;

  if (isMuted) {
    bgMusic.pause();
    audioControl.classList.add('muted');
    audioIcon.className = 'fas fa-volume-mute';
  } else {
    // Set volume again before play (defensive programming)
    bgMusic.volume = 0.3;
    bgMusic.play().catch(err => console.log('Audio play failed:', err));
    audioControl.classList.remove('muted');
    audioIcon.className = 'fas fa-volume-up';
  }

  // Persist user preference
  localStorage.setItem('christmasMusicMuted', isMuted);
});
```

**Error Handling:**
- Wrap `play()` in `.catch()` for browser autoplay policies
- Log errors to console without blocking UI
- Graceful degradation if audio unavailable

### Audio Asset Structure
```
threejs/
├── audio/                           # Audio assets directory
│   └── jingle-bells.mp3            # Christmas background music (MP3 format)
├── src/                            # Source code
└── index.html                      # References audio via relative path
```

**Audio File Requirements:**
- Format: MP3 (widely supported)
- Path: Relative from project root (`./audio/jingle-bells.mp3`)
- Loading: Via HTML5 `<audio>` element (no JavaScript decoder needed)
- Duration: Looped (any length works)

### Performance Considerations
- Audio loading: Non-blocking (preload="auto")
- Memory: Audio buffer cached by browser
- CPU: Negligible impact (native codec decoding)
- Network: MP3 compression reduces file size
- Volume: Pre-set to 0.3 avoids processing delay

### Browser Testing Checklist
- Chrome/Chromium: Test autoplay, toggle, persistence
- Firefox: Test backdrop-filter (fallback), audio playback
- Safari: Test `-webkit-backdrop-filter` prefix, autoplay policy
- Mobile: Test audio with device mute button, volume control
- Accessibility: Ensure button is keyboard-accessible, has title attribute

## Hide UI Control for Recording

### Purpose
Enable clean recording of 3D content by hiding all UI elements (tabs, audio button) with auto-reveal on interaction.

### Hide UI Button Implementation
```html
<!-- Hide UI button positioned next to audio control -->
<button id="hideUiControl" title="Hide UI for Recording (H)">
  <i class="fas fa-eye" id="hideIcon"></i>
</button>
```

**Styling (lines 405-433 in index.html):**
```css
#hideUiControl {
  position: fixed;
  bottom: 20px;
  left: 80px;          /* Right of audio control */
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(212, 175, 55, 0.5);
  transition: all 0.3s;
  z-index: 200;
}

/* Active state when UI is hidden */
#hideUiControl.active {
  border-color: #d4af37;
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
}

/* Hidden elements fade out */
.tabs.ui-hidden,
#audioControl.ui-hidden {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}
```

### Keyboard Shortcut
**H key:** Toggle UI visibility from main page or iframe
- Works from any tab (tree or upload)
- Works within iframe with cross-window communication
- Validated with origin check for security

### Toggle Logic
```javascript
function toggleUiVisibility(hidden) {
  isUiHidden = hidden;

  // Hide/show UI elements
  tabs.classList.toggle('ui-hidden', hidden);
  audioControl.classList.toggle('ui-hidden', hidden);
  hideIcon.className = hidden ? 'fas fa-eye-slash' : 'fas fa-eye';
  hideUiControl.classList.toggle('active', hidden);

  // Send to iframe
  iframe.contentWindow.postMessage({ type: 'TOGGLE_UI', hidden }, window.location.origin);

  // Auto-hide button after 2s
  if (hidden) {
    hideButtonTimeout = setTimeout(() => {
      hideUiControl.classList.add('ui-hidden');
    }, 2000);
  }
}
```

### Interaction Handlers
1. **Click Button:** Toggle visibility (prevent propagation)
2. **H Key:** Keyboard shortcut for toggle
3. **Document Click:** Reveal button when UI hidden
4. **Touch:** Mobile support with passive listener
5. **PostMessage:** Receive H key from iframe

### Cross-Window Communication
**Parent → Iframe:**
```javascript
iframe.contentWindow.postMessage({ type: 'TOGGLE_UI', hidden }, window.location.origin);
```

**Iframe → Parent (H key):**
```javascript
window.parent.postMessage({ type: 'TOGGLE_UI_FROM_IFRAME' }, window.location.origin);
```

**Security:**
- Validates `e.origin === window.location.origin`
- No sensitive data in messages
- Same-origin policy enforced

### User Experience
- **Recording Ready:** H to hide all UI, clean canvas visible
- **Auto-Reveal:** Button reappears after 2s of inactivity
- **Responsive:** Works on desktop, tablet, mobile
- **Accessible:** Button has title tooltip, keyboard accessible
- **Icon Feedback:** Eye → Eye-slash visual state change

### Testing Checklist
- H key hides UI on main page
- H key hides UI from iframe
- Click/touch reveals button when UI hidden
- Button auto-hides after 2s
- Audio control hidden when UI hidden
- Tabs hidden when UI hidden
- Icon changes correctly (eye/eye-slash)
- Origin validation prevents XSS

---

## Phase 4: New Year Mode Orchestration Pattern

### Overview
`NewYearMode` is an orchestration layer that coordinates multiple sub-systems (fireworks, audio, countdown, UI) to implement the New Year celebration experience. This pattern allows clean separation of concerns while maintaining tight synchronization.

### Class Structure
```javascript
export class NewYearMode {
  constructor(scene, camera, mainGroup, bloomPass, snowSystem) {
    this.scene = scene;
    this.camera = camera;
    this.mainGroup = mainGroup;          // Christmas tree to hide/show
    this.bloomPass = bloomPass;          // Post-processing for bloom switching
    this.snowSystem = snowSystem;        // Snow particles to hide/show

    // Sub-systems (lazy initialized)
    this.fireworkSystem = null;
    this.fireworkAudio = null;
    this.countdown = null;

    // State tracking
    this.isActive = false;
    this.isInitialized = false;
    this.spawnTimer = 0;
    this.autoSpawnInterval = 1.5;
    this.typeIndex = 0;

    // Bloom settings storage
    this.originalBloom = null;
  }
}
```

### Key Responsibilities

**1. Initialization (async init)**
- Creates FireworkSystem, FireworkAudio, CountdownManager
- Loads font for countdown text
- Stores original bloom settings
- Checks localStorage preference
- Returns success status

**2. Mode Activation (activate)**
- Hides Christmas tree and snow
- Shows countdown elements
- Switches bloom to fireworks preset
- Starts countdown timer
- Initializes audio on first activation (user gesture required)
- Updates UI button visual state
- Saves preference to localStorage

**3. Mode Deactivation (deactivate)**
- Shows Christmas tree and snow
- Hides countdown elements
- Clears firework particles
- Restores original bloom settings
- Stops countdown timer
- Removes UI button active state
- Saves preference to localStorage

**4. Animation Loop (update)**
- Updates firework particle physics
- Updates countdown timer
- Auto-spawns fireworks on 1.5s interval
- Called every frame with delta time

### Bloom Switching Pattern

The orchestrator manages two distinct bloom presets:

```javascript
const BLOOM_SETTINGS = {
  tree: { threshold: 0.85, strength: 0.25, radius: 0.3 },
  fireworks: { threshold: 0.5, strength: 1.5, radius: 0.6 }
};
```

**During activation:**
```javascript
this.bloomPass.threshold = BLOOM_SETTINGS.fireworks.threshold;   // 0.85 → 0.5
this.bloomPass.strength = BLOOM_SETTINGS.fireworks.strength;     // 0.25 → 1.5
this.bloomPass.radius = BLOOM_SETTINGS.fireworks.radius;         // 0.3 → 0.6
```

**During deactivation:**
```javascript
this.bloomPass.threshold = this.originalBloom.threshold;
this.bloomPass.strength = this.originalBloom.strength;
this.bloomPass.radius = this.originalBloom.radius;
```

### Interaction Patterns

**Auto-Spawn (Automatic)**
- Triggers every 1.5 seconds when mode is active
- Cycles through firework types: BLOOM → SPARK → DRIFT → SCATTER → SPARKLER
- Calls `spawnRandomFirework()` internally
- Chooses random position in sky region (x: ±10, y: 5-15, z: ±5)
- Plays audio effect for each spawn

**Click-to-Spawn (User Input)**
- Called from HTML click handler on canvas
- Converts 2D screen coordinates to 3D world position
- Projects ray from camera through screen point
- Spawns at ray-cast position (30 units from camera)
- Cycles through all available types
- Plays audio effect

**Implementation:**
```javascript
spawnAtScreenPosition(screenX, screenY) {
  // Normalize to device coordinates
  const mouse = new THREE.Vector2();
  mouse.x = (screenX / window.innerWidth) * 2 - 1;
  mouse.y = -(screenY / window.innerHeight) * 2 + 1;

  // Unproject to 3D world space
  const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
  vector.unproject(this.camera);

  const dir = vector.sub(this.camera.position).normalize();
  const distance = 30;
  const spawnPoint = this.camera.position.clone().add(dir.multiplyScalar(distance));

  // Spawn with cycling type
  const types = Object.values(FIREWORK_TYPE);
  const type = types[this.typeIndex % types.length];
  this.typeIndex++;

  this.fireworkSystem.spawn(spawnPoint, type);
  this.fireworkAudio?.play(type);
}
```

**Finale Trigger (Countdown Callback)**
- Called when countdown reaches 0
- Spawns burst sequences of all 5 firework types
- Staggered timing: 200ms between type bursts
- Each type spawns 3 bursts (15 total particles × 5 types)
- Uses setTimeout for animation sequencing

```javascript
triggerFinale() {
  const types = [BLOOM, SPARK, DRIFT, SCATTER, SPARKLER];
  types.forEach((type, i) => {
    setTimeout(() => {
      for (let j = 0; j < 3; j++) {
        const x = (Math.random() - 0.5) * 30;
        const y = 8 + Math.random() * 8;
        const z = (Math.random() - 0.5) * 15;

        if (this.fireworkSystem.canSpawn()) {
          this.fireworkSystem.spawn(new THREE.Vector3(x, y, z), type);
          this.fireworkAudio?.play(type);
        }
      }
    }, i * 200);  // 0ms, 200ms, 400ms, 600ms, 800ms
  });
}
```

### Audio Integration

**Lazy Initialization Pattern:**
- Audio context created on first user activation
- Prevents browser autoplay policy violations
- Audio state managed by FireworkAudio class

**Resume on Activation:**
```javascript
if (this.fireworkAudio && !this.fireworkAudio.isInitialized) {
  this.fireworkAudio.init();
}
this.fireworkAudio?.resume();  // Wake audio context from suspended state
```

**Per-Spawn Sound:**
- Each firework spawn triggers a type-specific sound
- Uses WebAudio synthesis (phase 2 implementation)
- Synthesized in real-time, no audio files needed

### State Persistence

**localStorage Key:** `newYearModeEnabled`

**Pattern:**
```javascript
checkSavedPreference() {
  const saved = localStorage.getItem('newYearModeEnabled');
  if (saved === 'true') {
    // Preference noted but does NOT auto-activate
    // User must explicitly toggle
  }
}

savePreference() {
  localStorage.setItem('newYearModeEnabled', String(this.isActive));
}
```

**Behavior:**
- Saves current state on every toggle
- Loaded on init but does NOT auto-activate
- Gracefully handles localStorage unavailability (try-catch)
- Allows users to preserve their preferred mode across sessions

### UI Button Integration

**Button Query:** `document.getElementById('newyear-btn')`

**CSS Class Management:**
- Add `.active` class when activated
- Remove `.active` class when deactivated
- CSS defines visual styling for active state

```javascript
const btn = document.getElementById('newyear-btn');
if (btn) {
  btn.classList.add('active');    // on activate
  btn.classList.remove('active');  // on deactivate
}
```

### Resource Cleanup

**Disposal Pattern:**
```javascript
dispose() {
  this.deactivate();  // Ensure clean state

  this.fireworkSystem?.dispose();
  this.fireworkAudio?.dispose();
  this.countdown?.dispose();

  // Null out references
  this.fireworkSystem = null;
  this.fireworkAudio = null;
  this.countdown = null;
  this.isInitialized = false;
}
```

### Integration Example

```javascript
// In main animation initialization
const newYearMode = new NewYearMode(scene, camera, mainGroup, bloomPass, snowSystem);
await newYearMode.init();

// In HTML button handler
window.toggleNewYearMode = () => {
  newYearMode?.toggle();
};

// In animation loop
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  newYearMode.update(dt);
  renderer.render(scene, camera);
}

// In click handler for fireworks spawning
canvas.addEventListener('click', (e) => {
  if (newYearMode?.getIsActive()) {
    newYearMode.spawnAtScreenPosition(e.clientX, e.clientY);
  }
});

// On page unload
window.addEventListener('beforeunload', () => {
  newYearMode.dispose();
});
```

### Testing Checklist
- [ ] Mode toggles successfully via button
- [ ] Tree and snow hide when activated
- [ ] Countdown displays and counts down
- [ ] Bloom settings switch correctly
- [ ] Auto-spawn works with correct intervals
- [ ] Click-to-spawn creates fireworks at cursor
- [ ] Audio initializes on first activation
- [ ] Finale spawns all 5 types with stagger
- [ ] localStorage preference persists across page reload
- [ ] Deactivation restores all original state
- [ ] dispose() cleans up all resources
- [ ] Mobile: works with touch events
