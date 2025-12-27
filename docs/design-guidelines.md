# Design Guidelines - Phase 01: Viewport & Safe Area Management

**Last Updated:** 2025-12-26
**Phase:** 01 - Viewport Meta & Safe Area Insets
**Status:** Implemented

## Overview

Phase 01 establishes responsive design foundations for the Three.js Christmas Tree application, focusing on mobile-first viewport configuration and safe area handling for notched/edge-to-edge devices (iPhone X+, Android with gesture navigation, etc).

## Key Implementations

### 1. Viewport Meta Configuration

#### Main viewport meta tag (`/index.html`)
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

#### Christmas Tree iframe viewport meta tag (`/src/christmas-tree/index.html`)
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```

**Key Properties:**
- `viewport-fit=cover` - Allows content to extend into safe areas (notches, dynamic islands)
- `initial-scale=1.0` - Prevents unexpected zoom on orientation change
- `width=device-width` - Responsive to actual device width
- `maximum-scale=1.0, user-scalable=no` (tree only) - Prevents pinch-zoom for gesture-based interactions

### 2. Safe Area Insets CSS Variables

CSS custom properties defined in `:root` of both HTML files:

```css
:root {
  /* Safe area insets for notched devices */
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
}
```

**Usage Pattern:**
```css
#ui-layer {
  padding-top: calc(40px + var(--safe-top));  /* Account for notch */
  box-sizing: border-box;
}

#audioControl {
  bottom: 20px;
  left: 20px;
  /* On notched devices, safe-bottom and safe-left automatically adjust */
}
```

**Browser Support:**
- iOS Safari 11.2+ (Full support)
- Chrome/Edge 69+ (Full support)
- Firefox 63+ (Full support)
- Fallback: `0px` on unsupported browsers

### 3. Responsive Breakpoint Variables

Breakpoints defined in `:root` for consistent mobile-first scaling (Phases 02-04):

```css
:root {
  --breakpoint-xs: 320px;   /* Small phones */
  --breakpoint-sm: 480px;   /* Landscape phones */
  --breakpoint-md: 768px;   /* Tablets */
  --breakpoint-lg: 1024px;  /* Large tablets */
  --breakpoint-xl: 1280px;  /* Desktops */
}
```

**Usage Pattern (Phase 02+):**
```css
@media (max-width: 768px) {
  .control-btn {
    padding: 14px 24px;
    min-width: 140px;
    min-height: 48px;  /* Minimum touch target */
  }
}
```

### 4. iOS Safari 100dvh Fix

**Problem:** iOS Safari doesn't properly handle `100vh` in mobile browsers due to dynamic address bar.

**Solution:** Dual height declaration with fallback pattern

```css
body {
  min-height: 100vh;        /* Fallback for older browsers */
  min-height: 100dvh;       /* Dynamic viewport height (iOS Safari 15+) */
}

.content {
  height: 100vh;            /* Fallback */
  height: 100dvh;           /* iOS Safari fix */
}

.content iframe {
  height: calc(100vh - 60px);        /* Fallback */
  height: calc(100dvh - 60px);       /* iOS Safari fix */
}
```

**Applied to:**
- Main body container
- Tab content areas
- Iframe height calculations

### 5. Safe Area Application in UI Layer

Christmas Tree UI layer demonstrates safe area integration:

```css
#ui-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  height: 100dvh;
  z-index: 10;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: calc(40px + var(--safe-top));  /* Dynamic notch padding */
  box-sizing: border-box;
  transition: opacity 0.5s ease;
}
```

## Mobile-First Approach

### Implementation Strategy

1. **Base Styles** (Mobile First)
   - Default styles assume smallest viewport (320px)
   - Touch targets minimum 48px height
   - Single-column layouts
   - Large, readable typography

2. **Progressive Enhancement** (Phase 02+)
   - Media queries add features at breakpoints
   - Flexible layouts adapt to landscape
   - Advanced controls appear on larger screens

3. **Safe Area Awareness**
   - Automatic padding for notched devices
   - No hardcoded safe area values
   - Graceful degradation on older devices

### Touch Target Sizing

Implemented in `/src/christmas-tree/index.html`:

```css
@media (max-width: 768px) {
  .control-btn {
    padding: 14px 24px;
    font-size: 12px;
    min-width: 140px;
    min-height: 48px;  /* Minimum touch target per WCAG */
  }

  .mode-btn {
    width: 56px;
    height: 56px;
    font-size: 22px;
  }
}
```

## File Locations & Implementations

### `/index.html`
- Main viewport configuration
- Safe area CSS variables
- Responsive breakpoints
- Tab navigation with safe area awareness
- Audio control button positioning
- Upload interface with responsive grid

### `/src/christmas-tree/index.html`
- Tree viewport configuration (gesture-optimized)
- Safe area integration in UI layer
- 100dvh fix on canvas and UI container
- Mobile-specific control adjustments
- Webcam wrapper responsive positioning
- Stats dashboard with safe area padding

## Design Patterns

### Pattern 1: Safe Area Padding
```css
element {
  padding-top: calc(default-padding + var(--safe-top));
  padding-left: calc(default-padding + var(--safe-left));
}
```

### Pattern 2: Notch-Aware Fixed Positioning
```css
fixed-element {
  top: var(--safe-top);
  left: var(--safe-left);
  right: var(--safe-right);
  bottom: var(--safe-bottom);
}
```

### Pattern 3: Dynamic Height (iOS Safari)
```css
full-height-container {
  height: 100vh;
  height: 100dvh;  /* Override on iOS Safari 15+ */
}
```

### Pattern 4: Mobile-First Responsiveness
```css
/* Base: mobile */
.element {
  font-size: 12px;
  padding: 10px;
}

/* Enhanced: larger screens */
@media (min-width: 768px) {
  .element {
    font-size: 16px;
    padding: 15px;
  }
}
```

## Browser Compatibility

| Feature | iOS | Android | Chrome | Firefox | Safari |
|---------|-----|---------|--------|---------|--------|
| viewport-fit=cover | 11.2+ | 5.0+ | 69+ | 63+ | 15+ |
| safe-area-inset-* | 11.2+ | 9.0+ | 69+ | 63+ | 15+ |
| env() function | 11.2+ | 9.0+ | 69+ | 63+ | 15+ |
| 100dvh | 15+ | 12+ | 100+ | 101+ | 16+ |

## Testing Checklist

- [ ] Viewport extends properly on notched devices
- [ ] Safe area variables adjust dynamically
- [ ] UI controls visible on all notch positions (top-left, top-right, dynamic island)
- [ ] Content doesn't hide under notch
- [ ] 100dvh fixes dynamic address bar behavior on iOS Safari
- [ ] Touch targets meet 48px minimum on mobile
- [ ] Audio/Hide UI controls positioned correctly with safe area
- [ ] Responsive breakpoints work at all viewport widths
- [ ] Landscape orientation displays correctly
- [ ] Fallback styles work on older browsers

## Next Phases

- **Phase 02:** Responsive control layouts and touch interactions
- **Phase 03:** Adaptive grid layouts for upload interface
- **Phase 04:** Dynamic typography and spacing based on viewport

## Related Files

- Implementation files: `/index.html`, `/src/christmas-tree/index.html`
- System architecture: `/docs/system-architecture.md`
- Code standards: `/docs/code-standards.md`

## References

- [W3C Safe Areas Spec](https://www.w3.org/TR/css-round-display-1/#safe-area-insets)
- [MDN: env() function](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [MDN: 100dvh viewport height](https://developer.mozilla.org/en-US/docs/Web/CSS/length#viewport_percentage_lengths)
- [WCAG 2.1: Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
