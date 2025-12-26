# Audio Feature Quick Reference - PR#3

## Quick Start

### For Developers
**Volume Race Condition Fix:** Always set `bgMusic.volume = 0.3` BEFORE calling `play()`
```javascript
bgMusic.volume = 0.3;  // Line 697 - BEFORE any play() call
bgMusic.play().catch(err => console.log('Audio play failed:', err));
```

**Safari Support:** Include both webkit and standard backdrop-filter CSS
```css
-webkit-backdrop-filter: blur(10px);  /* Safari (line 375) */
backdrop-filter: blur(10px);          /* Chrome, Firefox, Edge (line 376) */
```

**Audio File Location:** Place MP3 at project root
```
threejs/
├── audio/
│   └── jingle-bells.mp3  ← User must add this file
├── index.html
└── ...
```

---

## Key Implementation Details

| Aspect | Details |
|--------|---------|
| **HTML Element** | `<audio id="bgMusic" loop preload="auto">` |
| **Source Path** | `./audio/jingle-bells.mp3` (local, not CDN) |
| **Default Volume** | 0.3 (30% of maximum) |
| **Button ID** | `audioControl` (bottom-left, fixed position) |
| **State Key** | `localStorage.christmasMusicMuted` (string: 'true'/'false') |
| **Default State** | Muted on first visit |
| **Icon States** | .muted class toggles `fa-volume-mute` ↔ `fa-volume-up` |
| **Animation** | Pulse effect shows when playing (`:not(.muted)`) |

---

## Code Patterns

### 1. Volume Control (CRITICAL - Order Matters)
```javascript
// Step 1: Set volume FIRST
bgMusic.volume = 0.3;

// Step 2: Then call play() with error handling
bgMusic.play().catch(err => console.log('Audio play failed:', err));
```
**Why:** Browser race condition can cause loud burst if volume set after play()

### 2. State Restoration on Page Load
```javascript
const savedMuted = localStorage.getItem('christmasMusicMuted');
let isMuted = savedMuted === 'false' ? false : true;

if (!isMuted) {
  audioControl.classList.remove('muted');
  audioIcon.className = 'fas fa-volume-up';
  bgMusic.play().catch(() => {
    isMuted = true;  // Fallback if autoplay blocked
    audioControl.classList.add('muted');
  });
}
```

### 3. Button Click Handler
```javascript
audioControl.addEventListener('click', () => {
  isMuted = !isMuted;

  if (isMuted) {
    bgMusic.pause();
    audioControl.classList.add('muted');
    audioIcon.className = 'fas fa-volume-mute';
  } else {
    bgMusic.volume = 0.3;  // Re-set volume (defensive)
    bgMusic.play().catch(err => console.log('Audio play failed:', err));
    audioControl.classList.remove('muted');
    audioIcon.className = 'fas fa-volume-up';
  }

  localStorage.setItem('christmasMusicMuted', isMuted);
});
```

---

## Safari Compatibility Checklist

- [x] `-webkit-backdrop-filter: blur(10px)` added (line 375)
- [x] Standard `backdrop-filter` for other browsers (line 376)
- [x] Audio element uses `preload="auto"`
- [x] Error handling for autoplay policy
- [x] localStorage for preference persistence

**Test:** Volume button should have frosted glass effect on Safari

---

## Files Touched in PR#3

| File | Changes | Lines |
|------|---------|-------|
| `index.html` | Audio element (line 9-10), Volume setup (697), Audio button (407-410), Audio control CSS (358-402), JavaScript (690-730) | Lines: 9-10, 358-402, 407-410, 690-730 |

---

## Documentation Files Updated

| File | Section | Subsections |
|------|---------|------------|
| `docs/codebase-summary.md` | Phase 4 Updates | Audio improvements, browser compatibility, source management, UI, persistence, flow, technical details |
| `docs/system-architecture.md` | Audio Subsystem | Component description, data flow pipeline |
| `docs/code-standards.md` | Phase 4 Audio Standards | 9 subsections with code examples and testing |

---

## Pending Actions

**User Must:** Add audio file to `/audio/jingle-bells.mp3`
- Format: MP3 (widely supported)
- Size: Should be reasonably compressed
- Duration: Any length (loops indefinitely)

**Once Added:**
- Test autoplay on Chrome, Firefox, Safari
- Verify volume at 0.3 doesn't distort
- Check localStorage persistence across browser restart
- Verify webkit-prefix on Safari

---

## Troubleshooting

### Audio not playing
- Check file exists at `./audio/jingle-bells.mp3`
- Verify browser allows autoplay (user interaction may be required)
- Check console for play() errors
- Ensure `bgMusic.volume = 0.3` executed before play()

### No blur effect on button (Safari)
- Verify `-webkit-backdrop-filter: blur(10px)` present (line 375)
- Check browser is Safari
- Clear cache and reload

### Volume too loud
- Change `bgMusic.volume = 0.3` to lower value (e.g., 0.15)
- Update in 3 locations: line 697, 715 (in click handler), 724 (autoplay)

### State not persisting across sessions
- Check localStorage is enabled in browser
- Verify key name is exactly `christmasMusicMuted`
- Look at DevTools → Application → Local Storage

---

## Browser Support

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | Supported | Full HTML5 audio, no prefixes |
| Firefox | Supported | Full HTML5 audio, no prefixes |
| Safari | Supported | Requires `-webkit-backdrop-filter` (included) |
| Edge | Supported | Full HTML5 audio, no prefixes |
| Mobile | Supported | May require user interaction for autoplay |

---

## Performance Impact

- Audio file loading: Non-blocking
- Memory footprint: Browser-managed (minimal)
- CPU usage: Negligible (native codec)
- Network: One-time MP3 load (compressed)
- Storage: localStorage entry ~20 bytes

---

## Related Files

- Implementation: `/Users/phamminhphuc/Projects/threejs/index.html`
- Architecture Doc: `/Users/phamminhphuc/Projects/threejs/docs/system-architecture.md`
- Code Standards: `/Users/phamminhphuc/Projects/threejs/docs/code-standards.md`
- Codebase Summary: `/Users/phamminhphuc/Projects/threejs/docs/codebase-summary.md`
- Full Report: `/Users/phamminhphuc/Projects/threejs/plans/reports/docs-manager-251226-1203-pr3-audio-docs.md`

---

**Last Updated:** December 26, 2025
**PR:** PR#3 Audio Feature Fixes
**Phase:** Phase 4
