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
