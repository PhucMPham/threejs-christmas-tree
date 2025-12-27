# Quick Fix: Missing CSS Status Indicator

## Issue
The `status-queued` CSS class is referenced in JavaScript (line 841 & 875) but has no CSS definition.

## Location
File: `index.html`

## Current State
```javascript
// Line 839-849: Status text map
const statusMap = {
  'compressing': '⏳ Compressing...',
  'queued': '⏳ Queued',  // <- Uses CSS class .status-queued
  'uploading': '⬆️ Uploading...',
  'retrying': `🔄 Retry ${attempt}/3...`,
  'done': '✅ Done',
  'failed': '❌ Failed'
};

// Line 849: Applies CSS class
statusEl.className = `file-status status-${status}`;
```

## Missing CSS (line ~430)
```css
/* Add this after line 429 */
.status-queued { background: rgba(59,130,246,0.9); }
```

## Fix
Insert 1 line after line 429 in `index.html`:

**Before:**
```css
.status-uploading { background: rgba(139,92,246,0.9); }
```

**After:**
```css
.status-uploading { background: rgba(139,92,246,0.9); }
.status-queued { background: rgba(59,130,246,0.9); }
```

## Impact
- **Severity:** LOW
- **User Impact:** Visual styling for queued files may not display properly
- **Functional Impact:** None (inline styles fallback)
- **Deployment Risk:** None

## Testing
After fix, run:
```bash
npm run build  # Should still pass
```

All tests should pass with this fix applied.
