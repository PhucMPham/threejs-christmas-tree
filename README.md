# Three.js App

Interactive 3D visualization with Three.js, Vite, and modern JavaScript.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Opens browser at http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

## Features

- Rotating 3D cube with realistic materials
- OrbitControls for interactive camera control
- Responsive canvas scaling
- Professional lighting setup (ambient + directional)
- Hot module replacement via Vite

## Tech Stack

- **Three.js 0.170.0** - 3D graphics library
- **Vite 6.0.0** - Fast build tool & dev server
- **JavaScript ES6+** - Modern language features

## Project Structure

```
/
├── main.js           # Three.js scene setup & animation
├── index.html        # Entry HTML document
├── vite.config.js    # Vite configuration
├── package.json      # Dependencies & scripts
└── dist/             # Production build output
```

## Key Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Build optimized production bundle |
| `npm run preview` | Serve built files locally |

## Documentation

- **Setup & Architecture**: See `/docs/README.md`
- **Code Standards**: See `/docs/code-standards.md`
- **System Design**: See `/docs/system-architecture.md`
- **Requirements**: See `/docs/project-overview-pdr.md`
