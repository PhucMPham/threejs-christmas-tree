# Code Standards

Standards and best practices for Three.js development in this project.

## File Organization

```
/
├── main.js              # Primary entry point, scene initialization
├── index.html           # HTML template
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
