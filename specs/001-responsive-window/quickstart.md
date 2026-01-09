# Developer Quickstart: Responsive Single-Window Architecture

**Feature**: 001-responsive-window
**Date**: 2025-01-08
**Status**: Draft

---

## Overview

This guide helps developers quickly understand and implement the responsive single-window architecture. It covers setup, key concepts, common workflows, and debugging tips.

---

## Prerequisites

### Required Knowledge

1. **Tauri 2.0**: Understanding of IPC commands, events, and window management
2. **React 19**: Hooks, conditional rendering, Suspense for lazy loading
3. **TypeScript 5.8+**: Type definitions, interfaces, generics
4. **Rust 1.75+**: Basic syntax, async/await, error handling with `Result<T, E>`
5. **Zustand**: State management (already used in project)

### Development Environment

```bash
# Ensure you're on the feature branch
git checkout 001-responsive-window

# Install dependencies
pnpm install

# Verify Tauri setup
pnpm tauri --version
# Expected: 2.0.x or higher

# Verify Rust toolchain
cargo --version
# Expected: 1.75.x or higher
```

---

## Architecture Overview

### High-Level Flow

```
User Action (click button)
    ↓
Frontend: useViewNavigation hook
    ↓
Frontend: viewManagerStore.navigateToView()
    ↓
Frontend: invoke('resize_window_smart', { viewId })
    ↓
Backend: resize_window_smart command
    ↓
Backend: Calculate window size from ViewConfig + ScreenInfo
    ↓
Backend: Animate window resize (200ms, ease-out)
    ↓
Backend: Emit 'window:resize_start' event
    ↓
Frontend: Receive event, start content fade-out
    ↓
Frontend: Switch view component (at 50% point)
    ↓
Backend: Emit 'window:resize_complete' event
    ↓
Frontend: Complete content fade-in
    ↓
Frontend: Set isTransitioning = false
```

### Key Responsibilities

| Layer | Responsibility | Files |
|-------|---------------|-------|
| **Rust Backend** | Screen detection, window resize animation | `src-tauri/src/cmds/window.rs`, `src-tauri/src/services/` |
| **Frontend Services** | API abstraction, caching | `src/services/screenService.ts`, `src/services/windowService.ts` |
| **State Management** | View navigation, history, transition state | `src/stores/viewManagerStore.ts` |
| **React Components** | UI rendering, user interaction | `src/components/ViewContainer.tsx` |
| **Hooks** | Reusable navigation logic | `src/hooks/useViewNavigation.ts` |

---

## File Structure

### Backend Files

```text
src-tauri/src/
├── cmds/
│   └── window.rs                    # Tauri commands: get_screen_info, resize_window_smart
├── models/
│   ├── screen_info.rs               # ScreenInfo struct
│   ├── view_config.rs               # ViewConfig struct + defaults
│   └── window_layout.rs             # CalculatedWindowLayout struct
├── services/
│   ├── screen_detector.rs           # Monitor detection, caching
│   └── window_calculator.rs         # Size calculation logic
└── lib.rs                           # Register commands
```

### Frontend Files

```text
src/
├── services/
│   ├── screenService.ts             # Screen info API + caching
│   ├── windowService.ts             # Window resize API
│   └── viewTransitionService.ts     # Content transition orchestration
├── stores/
│   └── viewManagerStore.ts          # Zustand store for navigation state
├── hooks/
│   ├── useScreenInfo.ts             # Access screen info
│   └── useViewNavigation.ts         # Navigate between views
├── components/
│   ├── ViewContainer.tsx            # Conditional view rendering
│   └── views/
│       ├── SearchView.tsx           # Search view (existing)
│       ├── SettingsView.tsx         # Settings view (existing)
│       └── PluginsView.tsx          # Plugins view (existing)
└── types/
    ├── screen.ts                    # ScreenInfo type
    ├── view.ts                      # ViewType, ViewConfig
    └── events.ts                    # Event payload types
```

---

## Common Workflows

### Workflow 1: Add a New View

**Scenario**: Add a "Help" view with different window size.

**Step 1**: Define view configuration in Rust

```rust
// src-tauri/src/models/view_config.rs
impl ViewConfig {
    pub fn help() -> Self {
        Self {
            view_id: "help".to_string(),
            width_percent: 0.30,
            height_percent: 0.45,
            min_width: 500,
            max_width: 700,
            min_height: 350,
            max_height: 500,
            vertical_offset: 0.0, // Centered
            transition_duration: 200,
        }
    }
}
```

**Step 2**: Add ViewType to TypeScript

```typescript
// src/types/view.ts
export type ViewType = 'search' | 'settings' | 'plugins' | 'help';
```

**Step 3**: Create view component

```typescript
// src/components/views/HelpView.tsx
export function HelpView() {
  return (
    <div className="help-view">
      <h1>Help</h1>
      <p>Documentation and support links</p>
    </div>
  );
}
```

**Step 4**: Update ViewContainer

```typescript
// src/components/ViewContainer.tsx
const HelpView = lazy(() => import('./views/HelpView'));

export function ViewContainer() {
  // ...
  return (
    <Suspense fallback={<Spinner />}>
      {/* ... existing views ... */}
      {currentView === 'help' && (
        <div data-view="help" className={`view view--${direction}`}>
          <HelpView />
        </div>
      )}
    </Suspense>
  );
}
```

**Step 5**: Test the new view

```typescript
// In your component
const { navigateTo } = useViewNavigation();

<button onClick={() => navigateTo('help')}>Open Help</button>
```

---

### Workflow 2: Debug Window Resize

**Scenario**: Window not resizing to expected size.

**Step 1**: Check screen info

```typescript
import { screenService } from '@/services/screenService';

const screenInfo = await screenService.getScreenInfo();
console.log('Screen:', screenInfo);
// Expected: { screenWidth: 2560, screenHeight: 1600, ... }
```

**Step 2**: Check calculation logic

```rust
// Add logging in src-tauri/src/services/window_calculator.rs
pub fn calculate_window_layout(
    screen_info: &ScreenInfo,
    config: &ViewConfig,
    current_size: Option<(u32, u32)>,
) -> Result<CalculatedWindowLayout, String> {
    let mut width = (screen_info.available_width as f64 * config.width_percent) as u32;
    let mut height = (screen_info.available_height as f64 * config.height_percent) as u32;

    println!("Before clamp: {}x{}", width, height);

    width = width.clamp(config.min_width, config.max_width);
    height = height.clamp(config.min_height, config.max_height);

    println!("After clamp: {}x{}", width, height);

    // ...
}
```

**Step 3**: Check Tauri command response

```typescript
import { invoke } from '@tauri-apps/api/core';

try {
  const layout = await invoke<CalculatedWindowLayout>('resize_window_smart', {
    viewId: 'settings'
  });
  console.log('Calculated layout:', layout);
} catch (error) {
  console.error('Resize failed:', error);
}
```

**Step 4**: Verify window state

```rust
// Check if window is actually resizing
window.current_size()?.to_logical::<u32>(scale_factor)
```

---

### Workflow 3: Adjust Animation Timing

**Scenario**: Animations feel too slow or too fast.

**Step 1**: Modify ViewConfig duration

```rust
// src-tauri/src/models/view_config.rs
pub fn settings() -> Self {
    Self {
        // ...
        transition_duration: 180, // Reduced from 200ms
    }
}
```

**Step 2**: Update frame calculation

```rust
// src-tauri/src/cmds/window.rs
let frames = 12; // Was 12 for 200ms, now 10 for 180ms
let delay_ms = config.transition_duration / frames;
```

**Step 3**: Sync frontend CSS transitions

```css
/* ViewContainer.css */
.view {
  transition: opacity 90ms ease-out; /* Half of 180ms */
}
```

---

## Key Concepts

### Concept 1: View Configuration

Each view has a `ViewConfig` that defines:

- **Percentage-based sizing**: `widthPercent` = 0.35 means 35% of screen width
- **Min/max constraints**: Ensures usability on all screens
- **Position offset**: `verticalOffset` = 0.2 positions window in upper portion
- **Animation duration**: How long the resize takes

**Example**: Search view on 13" MacBook (2560x1600)

```
Initial calculation:
  width = 2560 * 0.35 = 896px
  height = 1600 * 0.40 = 640px

After min/max clamp:
  width = min(max(896, 500), 800) = 800px
  height = min(max(640, 300), 600) = 600px

Position:
  x = (2560 - 800) / 2 = 880px
  y = (1600 * 0.20) - (600 / 2) = 320 - 300 = 20px
```

---

### Concept 2: Ease-Out Easing

Window resize uses ease-out easing: `1.0 - (1.0 - progress).powi(2)`

This creates a natural deceleration effect:

```
Frame 0:  progress = 0.0,  eased = 0.0   (0%)
Frame 1:  progress = 0.08, eased = 0.15  (15%)
Frame 2:  progress = 0.17, eased = 0.31  (31%)
Frame 3:  progress = 0.25, eased = 0.44  (44%)
Frame 4:  progress = 0.33, eased = 0.55  (55%)
Frame 5:  progress = 0.42, eased = 0.64  (64%)
Frame 6:  progress = 0.50, eased = 0.75  (75%) <-- Content switches here
Frame 7:  progress = 0.58, eased = 0.82  (82%)
Frame 8:  progress = 0.67, eased = 0.89  (89%)
Frame 9:  progress = 0.75, eased = 0.94  (94%)
Frame 10: progress = 0.83, eased = 0.97  (97%)
Frame 11: progress = 0.92, eased = 0.99  (99%)
Frame 12: progress = 1.0,  eased = 1.0   (100%)
```

---

### Concept 3: Navigation Queue

To prevent animation conflicts, navigation requests are queued:

```typescript
// User clicks "Settings" then immediately "Plugins"

navigateToView('settings');  // Starts animation
navigateToView('plugins');  // Queued (isTransitioning = true)

// After 200ms:
// 1. Settings animation completes
// 2. isTransitioning = false
// 3. Plugins animation starts automatically
```

---

### Concept 4: State Preservation

When switching views, minimal state is preserved:

```typescript
// In viewManagerStore.ts
const entry: ViewHistoryEntry = {
  viewId: currentView,
  timestamp: Date.now(),
  stateData: {
    scrollPosition: window.scrollY,  // For scroll restoration
    focusedInputId: (document.activeElement as HTMLInputElement)?.id,
  },
};
```

**Note**: Per spec (FR-028), only minimal state is preserved. Full form data or complex state is **not** saved (out of scope).

---

## Debugging Tips

### Enable Detailed Logging

**Rust Backend**:

```rust
// src-tauri/src/cmds/window.rs
#[tauri::command]
pub async fn resize_window_smart(view_id: String) -> Result<CalculatedWindowLayout, String> {
    println!("[DEBUG] resize_window_smart called with view_id={}", view_id);

    let screen_info = get_screen_info().await?;
    println!("[DEBUG] screen_info: {:?}", screen_info);

    let config = ViewConfig::from_id(&view_id)?;
    println!("[DEBUG] config: {:?}", config);

    let layout = calculate_window_layout(&screen_info, &config, None)?;
    println!("[DEBUG] calculated layout: {:?}", layout);

    // ...
}
```

**Frontend**:

```typescript
// src/services/windowService.ts
async resizeToView(viewId: ViewType): Promise<CalculatedWindowLayout> {
  console.log('[windowService] resizeToView called with:', viewId);

  const layout = await invoke<CalculatedWindowLayout>('resize_window_smart', {
    viewId,
  });

  console.log('[windowService] received layout:', layout);

  return layout;
}
```

---

### Common Issues

#### Issue 1: Window not resizing

**Symptoms**: Click button, but window size doesn't change.

**Debug Steps**:

1. Check if command is registered:
```rust
// src-tauri/src/lib.rs
.invoke_handler(tauri::generate_handler![
    get_screen_info,
    resize_window_smart,  // Must be here
])
```

2. Check console for errors:
```typescript
try {
  await invoke('resize_window_smart', { viewId: 'settings' });
} catch (error) {
  console.error('Command failed:', error);
}
```

3. Verify window label:
```rust
let window = app.get_webview_window("main")
    .ok_or("Window 'main' not found")?;
```

---

#### Issue 2: Animation jerky

**Symptoms**: Window resize is not smooth.

**Causes**:
- Too many frames (use 12 for 200ms)
- Too much work per frame
- Blocking operations in animation loop

**Fix**:
```rust
// Don't do this in animation loop!
for i in 0..=frames {
    // ❌ Heavy calculation here
    let result = expensive_function();

    window.set_size(size)?;
    tokio::time::sleep(delay).await;
}

// Do this instead:
let results = precalculate_all_results(); // ✅ Before loop

for i in 0..=frames {
    window.set_size(results[i])?;
    tokio::time::sleep(delay).await;
}
```

---

#### Issue 3: Content clipping during transition

**Symptoms**: Content gets cut off while window is resizing.

**Fix**: Sync content transition with window resize:

```typescript
// Don't switch content immediately
navigateToView('settings');  // ❌ Content switches right away

// Wait for resize to start
windowService.onResizeStart(() => {
  fadeOut(currentView).then(() => {
    switchToView(targetView);  // ✅ Switch after fade-out
    fadeIn(targetView);
  });
});
```

---

## Testing

### Run Unit Tests

```bash
# Rust backend tests
cd src-tauri
cargo test --lib

# Frontend tests
pnpm test screenService
pnpm test windowService
pnpm test viewManagerStore
```

### Run Integration Tests

```bash
# Test Tauri commands
pnpm test:e2e window-resize.spec.ts
```

### Manual Testing Checklist

- [ ] Launch app on 13" MacBook (2560x1600)
- [ ] Verify search window is 800x600, positioned in upper third
- [ ] Click "Settings" button
- [ ] Verify window animates to 900x700, centered vertically
- [ ] Verify animation is smooth (no stuttering)
- [ ] Verify content transitions (fade + slide)
- [ ] Click back button
- [ ] Verify window animates back to 800x600
- [ ] Test on external display (1920x1080)
- [ ] Test on 4K display (3840x2160)
- [ ] Test on very small screen (1366x768)

---

## Performance Monitoring

### Measure Animation FPS

```typescript
// Add to ViewContainer.tsx
let frameCount = 0;
let startTime = performance.now();

function measureFPS() {
  frameCount++;
  const elapsed = performance.now() - startTime;

  if (elapsed >= 1000) {
    const fps = Math.round((frameCount * 1000) / elapsed);
    console.log(`FPS: ${fps}`);
    frameCount = 0;
    startTime = performance.now();
  }

  requestAnimationFrame(measureFPS);
}

measureFPS();
```

**Target**: 30fps minimum (FR-030, SC-005)

---

### Profile Screen Detection

```typescript
const start = performance.now();
const screenInfo = await screenService.getScreenInfo();
const elapsed = performance.now() - start;

console.log(`Screen detection took ${elapsed}ms`);
// Target: < 50ms (SC-006)
```

---

## Related Documentation

- **Data Model**: `/specs/001-responsive-window/data-model.md` - Entity definitions and relationships
- **Tauri Commands**: `/specs/001-responsive-window/contracts/tauri-commands.md` - API contracts
- **Frontend Services**: `/specs/001-responsive-window/contracts/frontend-services.md` - Service interfaces
- **Research**: `/specs/001-responsive-window/research.md` - Technical decisions and rationale

---

## Getting Help

1. **Check logs**: Run `pnpm tauri dev` and check terminal output
2. **Browser DevTools**: Open while app is running (should auto-open in dev mode)
3. **Tauri Docs**: https://tauri.app/v1/guides/
4. **Project docs**: `/Users/xuqi/Codes/etools/CLAUDE.md` (architecture overview)

---

## Next Steps

After completing this quickstart:

1. **Phase 2**: Review `/specs/001-responsive-window/tasks.md` for implementation tasks
2. **Start coding**: Begin with backend commands (Rust), then frontend services
3. **Test early**: Run manual tests after each component is implemented
4. **Iterate**: Refine animation timing, transitions, and error handling based on testing feedback
