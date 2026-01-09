# Tauri Command Contracts

**Feature**: 001-responsive-window
**Date**: 2025-01-08
**Status**: Draft

---

## Overview

This document defines the API contracts between Rust backend (Tauri commands) and frontend (TypeScript invocations). All commands must adhere to these interfaces for type safety and compatibility.

---

## Command: get_screen_info

**Purpose**: Detect current screen dimensions and DPI scaling factor.

**Handler Location**: `src-tauri/src/cmds/window.rs`

**Command Name**: `get_screen_info`

**Request**: No parameters

```typescript
// Frontend invocation
await invoke<ScreenInfo>('get_screen_info');
```

**Response**:

```typescript
interface ScreenInfo {
  screenWidth: number;        // Total width in pixels
  screenHeight: number;       // Total height in pixels
  availableWidth: number;     // Usable width (excludes system UI)
  availableHeight: number;    // Usable height (excludes dock/menu bar)
  scaleFactor: number;        // DPI scaling (1.0 = standard, 2.0 = Retina)
}
```

**Error Responses**:

| Error Code | Description | User Action |
|------------|-------------|-------------|
| `NO_MONITOR` | No monitor detected | Check display connection |
| `PERMISSION_DENIED` | Insufficient permissions | Grant screen permissions |
| `UNKNOWN` | OS API failure | Restart application |

**Implementation Requirements**:
- Must call `window.current_monitor()` from Tauri API
- Must calculate `availableWidth` and `availableHeight` by subtracting system UI
- Must return `scaleFactor` from monitor API
- Must cache result for 5 seconds (FR-032)
- Must complete in under 50ms (SC-006)

**Examples**:

```typescript
// Success response
{
  screenWidth: 2560,
  screenHeight: 1600,
  availableWidth: 2560,
  availableHeight: 1500,
  scaleFactor: 2.0
}

// 13" MacBook Pro (Retina)
{
  screenWidth: 3024,
  screenHeight: 1890,
  availableWidth: 3024,
  availableHeight: 1790,
  scaleFactor: 2.0
}

// 27" External Display (1080p)
{
  screenWidth: 2560,
  screenHeight: 1440,
  availableWidth: 2560,
  availableHeight: 1400,
  scaleFactor: 1.0
}
```

---

## Command: resize_window_smart

**Purpose**: Calculate and animate window resize based on target view configuration.

**Handler Location**: `src-tauri/src/cmds/window.rs`

**Command Name**: `resize_window_smart`

**Request**:

```typescript
interface ResizeWindowRequest {
  viewId: 'search' | 'settings' | 'plugins';
}

// Frontend invocation
await invoke<CalculatedWindowLayout>('resize_window_smart', {
  viewId: 'settings'
});
```

**Response**:

```typescript
interface CalculatedWindowLayout {
  width: number;              // Final window width in pixels
  height: number;             // Final window height in pixels
  x: number;                  // Window X position
  y: number;                  // Window Y position
  animationRequired: boolean; // Whether animation was performed
}
```

**Error Responses**:

| Error Code | Description | User Action |
|------------|-------------|-------------|
| `INVALID_VIEW_ID` | Unknown view identifier | Check view ID is valid |
| `SCREEN_INFO_FAILED` | Failed to get screen info | Falls back to defaults (FR-033) |
| `WINDOW_NOT_FOUND` | Window handle not found | Restart application |
| `ANIMATION_FAILED` | Resize animation failed | Window snapped to size (FR-036) |

**Implementation Requirements**:
- Must retrieve current `ScreenInfo` from cache or OS
- Must load `ViewConfig` for the given `viewId`
- Must calculate window size using percentage-based algorithm
- Must apply min/max constraints from `ViewConfig`
- Must apply 20px margins from screen edges
- Must animate resize over duration specified in `ViewConfig` (200-250ms)
- Must use ease-out easing function: `1.0 - (1.0 - progress).powi(2)`
- Must emit `window:resize_start` event when animation begins
- Must emit `window:resize_complete` event when animation ends
- Must snap to target size if animation fails (FR-036)
- Must complete within 250ms (FR-029, SC-001)

**Animation Frame Logic**:

```rust
let frames = 12; // 60fps * 200ms = 12 frames
let delay_ms = config.transition_duration / frames;

for i in 0..=frames {
    let progress = i as f64 / frames as f64;
    let eased = 1.0 - (1.0 - progress).powi(2); // ease-out

    let new_width = start_width + (target_width - start_width) * eased;
    let new_height = start_height + (target_height - start_height) * eased;

    window.set_size(PhysicalSize::new(new_width, new_height))?;
    tokio::time::sleep(Duration::from_millis(delay_ms)).await;
}
```

**Examples**:

```typescript
// Search view on 13" MacBook (2560x1600)
await invoke('resize_window_smart', { viewId: 'search' });
// Returns:
{
  width: 800,
  height: 600,
  x: 880,
  y: 200,
  animationRequired: true
}

// Settings view on 27" display (2560x1440)
await invoke('resize_window_smart', { viewId: 'settings' });
// Returns:
{
  width: 900,
  height: 700,
  x: 830,
  y: 370,
  animationRequired: true
}

// Same view (no animation)
await invoke('resize_window_smart', { viewId: 'search' });
// Returns:
{
  width: 800,
  height: 600,
  x: 880,
  y: 200,
  animationRequired: false  // Already correct size
}
```

---

## Event: window:resize_start

**Purpose**: Notify frontend that window resize animation has begun.

**Event Name**: `window:resize_start`

**Payload**:

```typescript
interface ResizeStartPayload {
  viewId: 'search' | 'settings' | 'plugins';
  targetLayout: CalculatedWindowLayout;
  estimatedDuration: number;  // milliseconds
}

// Frontend listener
import { listen } from '@tauri-apps/api/event';

await listen<ResizeStartPayload>('window:resize_start', (event) => {
  console.log('Resize started:', event.payload);
  // Begin content fade-out animation
});
```

**Implementation Requirements**:
- Must be emitted immediately when animation starts
- Must include target layout information
- Must include estimated duration from ViewConfig

---

## Event: window:resize_complete

**Purpose**: Notify frontend that window resize animation has finished.

**Event Name**: `window:resize_complete`

**Payload**:

```typescript
interface ResizeCompletePayload {
  viewId: 'search' | 'settings' | 'plugins';
  actualLayout: CalculatedWindowLayout;
  actualDuration: number;  // milliseconds
  success: boolean;
  error?: string;
}

// Frontend listener
await listen<ResizeCompletePayload>('window:resize_complete', (event) => {
  console.log('Resize complete:', event.payload);
  // Complete content fade-in animation
  // Set isTransitioning = false
});
```

**Implementation Requirements**:
- Must be emitted after animation completes (success or failure)
- Must include actual duration (for debugging)
- Must include error details if animation failed
- Must trigger `isTransitioning = false` in frontend store

---

## Event: screen:changed

**Purpose**: Notify frontend that screen resolution or configuration has changed.

**Event Name**: `screen:changed`

**Payload**:

```typescript
interface ScreenChangedPayload {
  oldScreenInfo: ScreenInfo | null;
  newScreenInfo: ScreenInfo;
  changeType: 'resolution' | 'display_disconnect' | 'display_connect' | 'scale_factor';
}

// Frontend listener
await listen<ScreenChangedPayload>('screen:changed', (event) => {
  console.log('Screen changed:', event.payload);
  // Invalidate screen info cache
  // Optionally recalculate current view size
});
```

**Implementation Requirements**:
- Must detect resolution changes via OS event listener
- Must detect display disconnect/connect
- Must detect scale factor changes
- Must invalidate cached screen info (FR-015)
- Must emit new screen info in payload

---

## Type Definitions

### Shared Types

```typescript
// types/screen.ts
export interface ScreenInfo {
  screenWidth: number;
  screenHeight: number;
  availableWidth: number;
  availableHeight: number;
  scaleFactor: number;
}

// types/view.ts
export type ViewType = 'search' | 'settings' | 'plugins';

// types/window.ts
export interface CalculatedWindowLayout {
  width: number;
  height: number;
  x: number;
  y: number;
  animationRequired: boolean;
}

// types/events.ts
export interface ResizeStartPayload {
  viewId: ViewType;
  targetLayout: CalculatedWindowLayout;
  estimatedDuration: number;
}

export interface ResizeCompletePayload {
  viewId: ViewType;
  actualLayout: CalculatedWindowLayout;
  actualDuration: number;
  success: boolean;
  error?: string;
}

export interface ScreenChangedPayload {
  oldScreenInfo: ScreenInfo | null;
  newScreenInfo: ScreenInfo;
  changeType: 'resolution' | 'display_disconnect' | 'display_connect' | 'scale_factor';
}
```

---

## Error Handling Contract

### Error Response Format

All Tauri commands must return errors in this format:

```rust
// Rust backend
#[tauri::command]
pub async fn resize_window_smart(
    view_id: String,
) -> Result<CalculatedWindowLayout, String> {
    match calculate_and_resize(view_id) {
        Ok(layout) => Ok(layout),
        Err(e) => Err(format!("WINDOW_RESIZE_FAILED: {}", e)),
    }
}
```

```typescript
// Frontend error handling
try {
  const layout = await invoke<CalculatedWindowLayout>('resize_window_smart', {
    viewId: 'settings'
  });
} catch (error) {
  const errorStr = error as string;
  if (errorStr.includes('WINDOW_RESIZE_FAILED')) {
    console.error('Resize failed:', errorStr);
    // Show user-friendly error message
  }
}
```

### Error Code Prefixes

| Prefix | Category | Example |
|--------|----------|---------|
| `NO_MONITOR` | Screen detection | `NO_MONITOR: No monitor found` |
| `INVALID_VIEW_ID` | Validation | `INVALID_VIEW_ID: Unknown view 'foo'` |
| `SCREEN_INFO_FAILED` | Screen detection | `SCREEN_INFO_FAILED: OS API error` |
| `WINDOW_NOT_FOUND` | Window management | `WINDOW_NOT_FOUND: Window 'main' not found` |
| `ANIMATION_FAILED` | Animation | `ANIMATION_FAILED: Timer error` |

---

## Performance Requirements

All commands must meet these performance targets:

| Command | Max Duration | Requirement Source |
|---------|--------------|-------------------|
| `get_screen_info` | 50ms | SC-006 |
| `resize_window_smart` | 250ms (including animation) | FR-029, SC-001 |

---

## Testing Contracts

### Unit Tests (Rust)

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_screen_info_returns_valid_data() {
        let screen_info = get_screen_info().unwrap();
        assert!(screen_info.screen_width > 0);
        assert!(screen_info.screen_height > 0);
        assert!(screen_info.scale_factor > 0.0);
    }

    #[test]
    fn test_resize_window_smart_calculates_correctly() {
        let config = ViewConfig::search();
        let screen_info = ScreenInfo {
            screen_width: 2560,
            screen_height: 1600,
            available_width: 2560,
            available_height: 1500,
            scale_factor: 2.0,
        };

        let layout = calculate_window_layout(&screen_info, &config, None).unwrap();

        assert_eq!(layout.width, 800);  // Clamped to max
        assert_eq!(layout.height, 600);
        assert!(layout.x > 0);
        assert!(layout.y > 0);
    }
}
```

### Integration Tests (TypeScript)

```typescript
import { test, expect } from 'vitest';
import { invoke } from '@tauri-apps/api/core';

test('get_screen_info returns valid structure', async () => {
  const screenInfo = await invoke<ScreenInfo>('get_screen_info');

  expect(screenInfo.screenWidth).toBeGreaterThan(0);
  expect(screenInfo.screenHeight).toBeGreaterThan(0);
  expect(screenInfo.availableWidth).toBeLessThanOrEqual(screenInfo.screenWidth);
  expect(screenInfo.availableHeight).toBeLessThanOrEqual(screenInfo.screenHeight);
  expect(screenInfo.scaleFactor).toBeGreaterThan(0);
});

test('resize_window_smart animates to settings size', async () => {
  const layout = await invoke<CalculatedWindowLayout>('resize_window_smart', {
    viewId: 'settings'
  });

  expect(layout.width).toBeGreaterThanOrEqual(600);  // min_width
  expect(layout.width).toBeLessThanOrEqual(900);    // max_width
  expect(layout.height).toBeGreaterThanOrEqual(400); // min_height
  expect(layout.height).toBeLessThanOrEqual(700);   // max_height
  expect(typeof layout.x).toBe('number');
  expect(typeof layout.y).toBe('number');
});
```

---

## Next Steps

1. **Phase 1**: Generate frontend service contracts
2. **Phase 1**: Generate quickstart.md for developer onboarding
3. **Phase 2**: Generate tasks.md with implementation steps
