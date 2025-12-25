# Project Roadmap

**Last Updated**: 2025-12-25
**Current Focus**: Gesture-Controlled Christmas Tree (Phase 2 Complete)

---

## Active Projects

### 1. Gesture-Controlled Christmas Tree with Wife's Photos
**Plan Path**: `/plans/251225-1138-gesture-christmas-tree/`
**Start Date**: 2025-12-25
**Target Completion**: 2025-12-25
**Status**: In Progress (Phase 2 Complete)

#### Overview
Build a romantic Christmas gift: gesture-controlled 3D particle Christmas tree with wife's photos displayed as floating Polaroid frames using Three.js + MediaPipe hand detection.

#### Phase Breakdown

| Phase | Status | Completion | Details |
|-------|--------|------------|---------|
| Phase 1: Setup | Pending | 0% | Clone electronicminer repo, verify base project |
| Phase 2: Auto-Resize Script | ✓ Complete | 100% | Created prepare-photos.sh, processed 5 photos |
| Phase 3: Code Customization | Pending | 0% | Update CONFIG, hide upload button |
| Phase 4: Testing & Polish | Pending | 0% | Test gestures, verify 60fps, final presentation |

#### Recent Progress (2025-12-25)
- ✓ Created `scripts/prepare-photos.sh` script with macOS sips tool
- ✓ Successfully processed 5 photos from `photos/` folder
- ✓ All photos auto-rotated and resized to 1000px max
- ✓ Output to `src/christmas-tree/images/` with quality 80
- ✓ All validation checks passed

#### Next Steps
1. Complete Phase 1: Project setup (clone + test base)
2. Proceed to Phase 3: Code customization (CONFIG + hide upload)
3. Phase 4: Full testing and final presentation

#### Deliverables
- Forked Three.js Christmas tree with MediaPipe gesture control
- 5 optimized photos as floating Polaroid frames
- Desktop browser ready for presentation

---

## Completed Projects

*None at this time*

---

## On Hold

*None at this time*

---

## Changelog

### 2025-12-25
- **Phase 2 Complete**: Auto-resize script created and photo processing validated
  - Location: `scripts/prepare-photos.sh`
  - Photos: 5 files processed to `src/christmas-tree/images/`
  - Quality: JPEG 80, max 1000px dimension, proper EXIF rotation
