# Research: Responsive Single-Window Architecture

**Feature**: 001-responsive-window
**Date**: 2025-01-08
**Status**: Complete

---

## Overview

This document captures research findings for transforming the multi-window architecture into a single-window responsive design. All technical unknowns have been resolved and technology choices documented.

---

## 1. Screen Information APIs

### Decision: Use Tauri Window API

**Rationale**:
- Tauri 2.0 provides `window.current_monitor()` API to get monitor information
- Built-in support for scale factor detection
- Cross-platform API abstracts platform differences
- No additional dependencies required

**Implementation**:
```rust
let monitor = window.current_monitor()
    .map_err(|e| e.to_string())?
    .ok_or("No monitor found")?;

let size = monitor.size();
let scale_factor = monitor.scale_factor();
```

**Alternatives Considered**:
- **napi-rs (Node.js addon)**: Rejected because it requires native compilation for each platform
- **screen-info crate**: Rejected because it's Linux-specific and doesn't support macOS/Windows uniformly

---

## 2. Window Resize Animation Strategy

### Decision: Frame-Based Animation with Ease-Out Easing

**Rationale**:
- Smooth 60fps animations achievable with tokio::time::sleep
- Ease-out easing (1-(1-t)^2) provides natural deceleration
- Frame-based approach allows synchronization with content transitions
- Total duration 200-250ms is imperceptible and feels responsive

**Implementation**:
```rust
let frames = 12; // 60fps * 200ms = 12 frames
let delay_ms = 200u64 / frames;

for i in 0..=frames {
    let progress = i as f64 / frames as f64;
    let eased = 1.0 - (1.0 - progress).powi(2); // ease-out

    // Calculate intermediate size
    let new_width = start_width + (target_width - start_width) * eased;

    window.set_size(new_size)?;
    tokio::time::sleep(Duration::from_millis(delay_ms)).await;
}
```

**Alternatives Considered**:
- **CSS Transitions**: Rejected because CSS only affects content, not window chrome
- **Web Animations API**: Rejected because it doesn't control OS window size
- **Instant resize with fade**: Rejected because jarring size jumps feel unpolished

---

## 3. View State Management

### Decision: Zustand for Client-Side State

**Rationale**:
- Already used in current codebase (pluginStateStore.ts)
- Lightweight (< 3KB minified)
- Simple API (hooks-based)
- Good TypeScript support
- No boilerplate required

**Implementation**:
```typescript
interface ViewManagerState {
  currentView: ViewType;
  history: ViewHistoryEntry[];
  isTransitioning: boolean;
  direction: 'forward' | 'backward' | null;
}

const useViewStore = create<ViewManagerState>((set) => ({
  currentView: 'search',
  history: [],
  isTransitioning: false,
  direction: null,
  navigateToView: (view: ViewType) => { /* ... */ },
  goBack: () => { /* ... */ },
}));
```

**Alternatives Considered**:
- **Redux**: Rejected because overkill for this use case, adds boilerplate
- **React Context**: Rejected because performance issues with frequent updates
- **Jotai**: Rejected because not already in codebase (though lighter than Zustand)

---

## 4. Screen Size Calculation Algorithm

### Decision: Percentage-Based with Min/Max Clamping

**Rationale**:
- Percentages ensure proportional scaling across screen sizes
- Min/max constraints prevent usability issues
- 20px margin prevents window from touching screen edges
- Vertical offset allows search window to appear in upper portion

**Implementation**:
```typescript
function calculateWindowSize(
  screenWidth: number,
  screenHeight: number,
  config: ViewConfig
): CalculatedWindowLayout {
  // Calculate from percentages
  let width = screenWidth * config.widthPercent;
  let height = screenHeight * config.heightPercent;

  // Apply min/max constraints
  width = Math.max(config.minWidth, Math.min(config.maxWidth, width));
  height = Math.max(config.minHeight, Math.min(config.maxHeight, height));

  // Apply margins
  const availableWidth = screenWidth - (config.marginX * 2);
  const availableHeight = screenHeight - (config.marginY * 2);

  width = Math.min(width, availableWidth);
  height = Math.min(height, availableHeight);

  // Calculate position
  const x = (screenWidth - width) / 2;
  const y = {
    center: (screenHeight - height) / 2,
    upper: (screenHeight * config.verticalOffset) - (height / 2)
  };

  return { width, height, x, y: y[config.verticalPosition] };
}
```

**Alternatives Considered**:
- **Fixed breakpoints**: Rejected because doesn't scale smoothly
- **Content-based sizing**: Rejected because requires rendering first, causing FOUC
- **User preference system**: Rejected because out of scope (OOS clause)

---

## 5. View Transition Coordination

### Decision: Orchestrate Window Resize + Content Transition

**Rationale**:
- Coordinated animations feel more polished
- Prevents content from being clipped during resize
- Queued navigation prevents animation conflicts
- Single responsibility (resize happens in Rust, content transition in React)

**Implementation Flow**:
```
1. User clicks "Settings"
2. Frontend calls invoke('resize_window_smart')
3. Rust animates window size over 200ms
4. Rust emits event when animation starts
5. React receives event, begins content fade-out
6. At 50% point, React switches content component
7. At 100% point, content fade-in completes
8. Frontend enables navigation queue
```

**Alternatives Considered**:
- **CSS-only transitions**: Rejected because can't animate window chrome
- **Parallel animations without sync**: Rejected because content clipping visible
- **Resize first, then transition**: Rejected because adds perceived latency

---

## 6. Performance Optimization

### Decision: Lazy Loading + View Caching

**Rationale**:
- React.lazy() code-splits view components
- Only renders active view, not all views
- Cache screen info to avoid repeated OS queries
- Dequeuing prevents animation spam

**Implementation**:
```typescript
// Lazy load views
const SearchView = lazy(() => import('./views/SearchView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const PluginsView = lazy(() => import('./views/PluginsView'));

// Cache screen info
let cachedScreenInfo: ScreenInfo | null = null;
async function getScreenInfo(): Promise<ScreenInfo> {
  if (cachedScreenInfo) return cachedScreenInfo;

  cachedScreenInfo = await invoke('get_screen_info');
  setTimeout(() => cachedScreenInfo = null, 5000); // Invalidate after 5s

  return cachedScreenInfo;
}
```

**Alternatives Considered**:
- **Preload all views**: Rejected because increases initial bundle size
- **No caching**: Rejected because screen detection is expensive (10-50ms)
- **View virtualization**: Rejected because overkill for 3 views

---

## 7. Error Handling Strategy

### Decision: Graceful Degradation with Defaults

**Rationale**:
- Fallback to safe window sizes if screen detection fails
- Never let app be unusable due to edge case
- Log all errors for debugging
- Snap to target size if animation fails

**Implementation**:
```rust
pub async fn resize_window_smart(
    window: Window,
    config: RelativeWindowSize,
) -> Result<CalculatedWindowSize, String> {
    // Try smart resize
    match calculate_window_size(window, config.clone()) {
        Ok(target) => {
            // Animate to target
            if let Err(e) = animate_resize(window, target) {
                // Animation failed, snap immediately
                window.set_size(target.size)?;
                log::warn!("Animation failed, snapped to size: {}", e);
            }
            Ok(target)
        }
        Err(e) => {
            // Calculation failed, use defaults
            log::error!("Calculation failed: {}", e);
            let defaults = get_default_window_size(config.id);
            window.set_size(defaults.size)?;
            Ok(defaults)
        }
    }
}
```

**Alternatives Considered**:
- **Crash on error**: Rejected because terrible UX
- **Retry mechanism**: Rejected because screen detection unlikely to recover
- **User notification**: Rejected because errors are not user-fixable

---

## 8. Testing Strategy

### Decision: Multi-Level Testing Approach

**Rationale**:
- Unit tests for calculation logic
- Integration tests for Rust commands
- E2E tests for full user flows
- Manual testing on real hardware

**Test Coverage Targets**:
- Unit tests: 80%+ coverage for calculation functions
- Integration tests: All Tauri commands
- E2E tests: 5 critical user flows
- Manual tests: 3 hardware configurations (13" MBP, 16" MBP, external monitor)

**Alternatives Considered**:
- **100% unit test coverage**: Rejected because diminishing returns
- **No E2E tests**: Rejected because window animations can't be unit tested
- **Screenshot testing**: Rejected because platform-dependent and brittle

---

## 9. Cross-Platform Considerations

### Decision: macOS-First with Platform Abstractions

**Rationale**:
- Initial implementation targets macOS (primary platform)
- Platform-specific code abstracted into modules
- Windows/Linux support added later
- Focus on platform-agnostic APIs

**Implementation**:
```rust
// Platform-specific screen info
#[cfg(target_os = "macos")]
mod screen_info_macos;

#[cfg(target_os = "windows")]
mod screen_info_windows;

// Common interface
trait ScreenInfoProvider {
    fn get_screen_info(&self) -> Result<ScreenInfo, Error>;
}
```

**Alternatives Considered**:
- **Simultaneous multi-platform**: Rejected because increases complexity 3x
- **Web-only approach**: Rejected because we're building a desktop app
- **Separate codebases**: Rejected because violates DRY principle

---

## 10. DPI Scaling

### Decision: Use OS Scale Factor

**Rationale**:
- OS handles DPI scaling automatically
- Tauri scale_factor API reports actual scaling
- No manual calculation needed
- Ensures consistent rendering across Retina/non-Retina

**Implementation**:
```rust
let scale_factor = monitor.scale_factor();
// All sizes are in logical pixels
// OS handles physical pixel conversion
```

**Alternatives Considered**:
- **Manual DPI detection**: Rejected because unreliable across platforms
- **Device-pixel-ratio CSS**: Rejected because doesn't affect window chrome
- **Fixed scaling factors**: Rejected because doesn't adapt to user preferences

---

## Summary of Key Decisions

| Area | Decision | Justification |
|------|----------|----------------|
| Screen API | Tauri window.current_monitor() | Built-in, cross-platform |
| Animation | Frame-based ease-out | Smooth, controllable |
| State Management | Zustand | Already in use, simple |
| Size Calculation | Percentage with min/max | Responsive, bounded |
| Transition Coordination | Orchestrated Rust + React | Polished UX |
| Performance | Lazy loading + caching | Fast startup |
| Error Handling | Graceful degradation | Never unusable |
| Testing | Multi-level | Comprehensive coverage |
| Platform Support | macOS-first | Focused scope |
| DPI Scaling | OS scale factor | Automatic |

---

## Open Questions Resolved

**Q1: Should we use requestAnimationFrame for animations?**
- **Answer**: No. Use Rust's tokio::sleep for window resize animations because they must happen in backend. Use React state updates for content transitions.

**Q2: Should window size be user-customizable?**
- **Answer**: No (per OOS clause). Fixed percentages with min/max constraints.

**Q3: Should we save window position across sessions?**
- **Answer**: No (per OOS clause). Out of scope for this feature.

---

## Next Steps

1. ✅ Research complete - all technical unknowns resolved
2. **Phase 1**: Generate data-model.md for state entities
3. **Phase 1**: Generate contracts/ for API boundaries
4. **Phase 1**: Generate quickstart.md for developer onboarding
5. **Phase 2**: Generate tasks.md with actionable implementation tasks
