# System Architecture

High-level architecture and component design for the Three.js application.

## Architecture Overview

```
┌─────────────────────────────────────┐
│      Browser Window (viewport)      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    WebGL Canvas (Three.js Render)   │
└─────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────┐
│              Three.js Scene Graph                     │
├──────────────────────────────────────────────────────┤
│  ├─ Camera (PerspectiveCamera)                       │
│  ├─ Mesh Objects (Box, future models)               │
│  │  ├─ Geometry                                      │
│  │  ├─ Material (MeshStandardMaterial)              │
│  ├─ Lights                                          │
│  │  ├─ AmbientLight (base illumination)            │
│  │  └─ DirectionalLight (key light)                │
│  └─ Controls (OrbitControls)                        │
└──────────────────────────────────────────────────────┘
```

## Core Components

### Scene
- **Role**: Container for all 3D objects
- **Color**: Dark background (0x1a1a2e)
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

## Data Flow

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

## Future Enhancements

1. Add skybox/environment mapping
2. Implement texture-based materials
3. Add model loader for complex geometries
4. Performance monitoring dashboard
5. Mobile gesture support (pinch-to-zoom)
