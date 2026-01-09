# Feature Specification: Responsive Single-Window Architecture

**Feature Branch**: `001-responsive-window`
**Created**: 2025-01-08
**Status**: Draft
**Input**: User description: "多显示器不要，剩下可以，按照这个方案规划一下"

## Overview

Transform the current multi-window application architecture into a single-window responsive design. The application window dynamically adjusts its size and position based on screen dimensions and current view context, providing a fluid user experience across different display sizes while maintaining all existing functionality.

---

## User Scenarios & Testing

### User Story 1 - Dynamic Window Resize (Priority: P1)

**Description**: Users experience smooth window size transitions when switching between different application views (search, settings, plugins), with the window automatically adapting to their screen size.

**Why this priority**: This is the core transformation from multi-window to single-window architecture. It establishes the foundation for all other functionality and directly impacts user experience.

**Independent Test**: Can be tested by launching the application on different screen sizes and switching between views. Delivers immediate value by eliminating window management complexity and providing consistent experience across devices.

**Acceptance Scenarios**:

1. **Given** the application is running on a 13" MacBook (2560x1600), **When** user opens the search view, **Then** the window size is 800x600 pixels positioned in the upper third of the screen
2. **Given** the search view is open, **When** user clicks the settings button, **Then** the window smoothly animates to 900x700 pixels and centers vertically on screen
3. **Given** the settings view is open on a 27" display (2560x1440), **When** user switches to settings, **Then** the window size is 900x700 pixels (respects max-width constraints)
4. **Given** the application window is at its maximum size, **When** user switches to a smaller view, **Then** the window animates down to the appropriate smaller size
5. **Given** the user is on a small laptop screen (1366x768), **When** any view opens, **Then** the window size never exceeds the available screen space minus 20px margins

---

### User Story 2 - Screen Size Detection and Adaptation (Priority: P1)

**Description**: The application automatically detects the current screen dimensions and calculates optimal window sizes for each view, ensuring windows never exceed screen boundaries or appear off-screen.

**Why this priority**: Essential for usability across different devices. Without proper screen detection, windows could be too large or appear in wrong positions, making the application unusable on certain screens.

**Independent Test**: Can be tested by running the application on different displays (MacBook 13", MacBook 16", external 1080p, 4K) and verifying window sizes are appropriate for each. Delivers value by ensuring consistent user experience regardless of hardware.

**Acceptance Scenarios**:

1. **Given** the application launches on a 1920x1080 display, **When** the search view opens, **Then** the window width is 35% of screen width (672px) and height is 40% of screen height (432px)
2. **Given** the application launches on a 3024x1890 display (MacBook 16"), **When** the settings view opens, **Then** the window is constrained to maximum of 900x700 pixels despite larger screen
3. **Given** the application is moved between displays with different resolutions, **When** the view changes, **Then** the window recalculates its size based on the current display
4. **Given** the screen DPI is 2x (Retina), **When** the window renders, **Then** all UI elements appear sharp and properly scaled
5. **Given** the available screen height is reduced (dock/menu bar), **When** calculating window size, **Then** the system accounts for the reduced available space

---

### User Story 3 - Smooth View Transitions (Priority: P2)

**Description**: Users experience fluid animations when switching between views, with both window size and content transitioning smoothly to create a polished, native-like feel.

**Why this priority**: Enhances user experience and perceived quality. While the core functionality works without animations, smooth transitions make the application feel professional and cohesive.

**Independent Test**: Can be tested by rapidly switching between views and observing the animation smoothness. Delivers value by reducing visual jarring and providing clear visual feedback during state changes.

**Acceptance Scenarios**:

1. **Given** the user is in search view, **When** they click settings, **Then** the search content fades out while sliding left, the window resizes over 200ms, and the settings content fades in from the right
2. **Given** the user is in settings view, **When** they click close/return, **Then** the settings content slides right and fades out, the window shrinks, and the search content slides in from the left
3. **Given** a view transition is in progress, **When** the user attempts another navigation, **Then** the request is queued until the current transition completes
4. **Given** the user navigates back through history, **When** the transition occurs, **Then** the animation direction is reversed (content slides in from left instead of right)
5. **Given** the system is under heavy load, **When** animations play, **Then** they maintain at least 30fps and complete within the specified duration

---

### User Story 4 - View History Management (Priority: P2)

**Description**: Users can navigate back to previous views using a back button or keyboard shortcut, with the application maintaining a history stack of visited views.

**Why this priority**: Important for usability, allowing users to easily retrace their steps. Enhances the single-window experience by providing familiar navigation patterns.

**Independent Test**: Can be tested by navigating through multiple views (search → settings → plugins) and using back button to return. Delivers value by improving navigation efficiency and user control.

**Acceptance Scenarios**:

1. **Given** the user has navigated from search → settings → plugins, **When** they click back, **Then** the application returns to settings view
2. **Given** the user is on the settings view (which was opened from search), **When** they press Escape, **Then** the application returns to search view
3. **Given** the user has navigated through 5 different views, **When** they click back repeatedly, **Then** each click goes back one step in history
4. **Given** the user is on the initial search view, **When** they click back, **Then** nothing happens (no history to go back)
5. **Given** the user has gone back through history and then navigated forward, **When** they navigate to a new view, **Then** the forward history is cleared and replaced with the new view

---

### User Story 5 - Minimum and Maximum Size Constraints (Priority: P3)

**Description**: The application enforces minimum and maximum window sizes to ensure usability, preventing windows from becoming too small to use or too large for the screen.

**Why this priority**: Important edge case handling. Prevents extreme scenarios that could make the application unusable or negatively impact performance.

**Independent Test**: Can be tested by attempting to resize the application window manually (if resizing is enabled) or by testing on extremely small/large screens. Delivers value by maintaining consistent usability.

**Acceptance Scenarios**:

1. **Given** the calculated window size is less than minimum (500x300 for search), **When** the view opens, **Then** the window size is set to the minimum
2. **Given** the calculated window size exceeds maximum (800x600 for search), **When** the view opens, **Then** the window size is set to the maximum
3. **Given** the user is on a 4K display (3840x2160), **When** any view opens, **Then** the window respects maximum size constraints and doesn't become excessively large
4. **Given** the user is on a very small display (1024x768), **When** any view opens, **Then** the window fits within the screen with 20px margins
5. **Given** the screen size changes (e.g., disconnecting external monitor), **When** the application detects the change, **Then** window sizes are recalculated to fit the new screen

---

### Edge Cases

- What happens when the screen resolution changes while the application is running (e.g., disconnecting external monitor)?
  - **Answer**: The application detects the screen change and recalculates the current view's window size, animating to the new dimensions if needed

- What happens when the user manually resizes the window (if resizable is enabled)?
  - **Answer**: Manual resize temporarily overrides automatic sizing. Next view switch will recalculate based on current screen size and view configuration

- What happens when the calculated window position would be partially off-screen?
  - **Answer**: Position is adjusted to ensure the entire window is visible within the available screen area, maintaining the 20px margin from edges

- What happens if animation is in progress and user quickly switches views multiple times?
  - **Answer**: Subsequent navigation requests are queued and processed after current animation completes, preventing jarring interruptions

- What happens on very small screens (netbook, 1366x768 or smaller)?
  - **Answer**: Window size respects minimum constraints but may reduce margins to ensure content fits. If still too large, window fills available space minus essential system UI

- What happens if the screen information query fails?
  - **Answer**: System falls back to default safe window sizes (640x400 for search, 700x600 for settings) and logs the error for debugging

---

## Requirements

### Functional Requirements

#### Window Size Calculation

- **FR-001**: System MUST calculate window size as a percentage of current screen dimensions
- **FR-002**: System MUST respect minimum width constraints for each view type (search: 500px, settings: 600px, plugins: 650px)
- **FR-003**: System MUST respect maximum width constraints for each view type (search: 800px, settings: 900px, plugins: 1000px)
- **FR-004**: System MUST maintain minimum 20px horizontal and vertical margins from screen edges
- **FR-005**: System MUST calculate window height as a percentage of available screen height (excluding menu bar/dock)
- **FR-006**: System MUST position search window in upper portion of screen (20% offset from top)
- **FR-007**: System MUST position settings and plugins windows centered vertically

#### View Switching

- **FR-008**: System MUST transition between views with smooth size animations over 200-250ms duration
- **FR-009**: System MUST use ease-out easing function for all window resize animations
- **FR-010**: System MUST animate content transition (fade + slide) simultaneously with window resize
- **FR-011**: System MUST queue navigation requests if an animation is already in progress
- **FR-012**: System MUST support forward navigation direction (slides in from right, out to left)
- **FR-013**: System MUST support backward navigation direction (slides in from left, out to right)

#### Screen Detection

- **FR-014**: System MUST detect current screen dimensions (width, height, scale factor) on startup
- **FR-015**: System MUST detect screen changes (resolution changes, display disconnect/connect)
- **FR-016**: System MUST query screen information from the OS-provided monitor API
- **FR-017**: System MUST calculate window size based on the display the application window is currently on
- **FR-018**: System MUST account for DPI scaling factor when calculating window sizes

#### History Management

- **FR-019**: System MUST maintain a navigation history stack with maximum 50 entries
- **FR-020**: System MUST push current view to history before navigating to a new view
- **FR-021**: System MUST support back navigation to previous view
- **FR-022**: System MUST clear forward history when navigating to a new view (not back)
- **FR-023**: System MUST allow users to return to search view from settings via close button or Escape key

#### View Content

- **FR-024**: Search view MUST display search input and results in the window
- **FR-025**: Settings view MUST display settings interface in a larger window
- **FR-026**: Plugins view MUST display plugin management interface in a larger window
- **FR-027**: System MUST render all views within the same window (no separate windows)
- **FR-028**: System MUST preserve view state when switching (e.g., scroll position, input focus)

#### Performance

- **FR-029**: System MUST complete view transitions (animation + content switch) within 250ms
- **FR-030**: System MUST maintain at least 30fps during all animations
- **FR-031**: System MUST defer rendering of off-screen views until needed
- **FR-032**: System MUST cache calculated screen information to avoid repeated OS queries

#### Error Handling

- **FR-033**: System MUST fall back to default window sizes if screen detection fails
- **FR-034**: System MUST log all screen detection and window calculation errors
- **FR-035**: System MUST prevent windows from being positioned partially off-screen
- **FR-036**: System MUST handle gracefully if window resize animation fails (snap to target size)

---

## Key Entities

### ScreenInfo

Represents the current display characteristics:
- **screenWidth**: Total width of the display in pixels
- **screenHeight**: Total height of the display in pixels
- **availableWidth**: Usable width (excluding system UI)
- **availableHeight**: Usable height (excluding dock/menu bar)
- **scaleFactor**: DPI scaling factor (1.0 for standard, 2.0 for Retina)

### ViewConfig

Configuration for each view type:
- **viewId**: Unique identifier (search, settings, plugins)
- **widthPercent**: Target width as percentage of screen width (0.0 - 1.0)
- **heightPercent**: Target height as percentage of screen height (0.0 - 1.0)
- **minWidth**: Minimum allowed width in pixels
- **maxWidth**: Maximum allowed width in pixels
- **minHeight**: Minimum allowed height in pixels
- **maxHeight**: Maximum allowed height in pixels
- **verticalOffset**: Position offset from top (-1.0 to 1.0, where 0 is centered)
- **transitionDuration**: Animation duration in milliseconds

### ViewHistoryEntry

Record of a view visit:
- **viewId**: Which view was visited
- **timestamp**: When the visit occurred
- **stateData**: Optional state snapshot for restoring view

### CalculatedWindowLayout

Result of window size calculation:
- **width**: Final window width in pixels
- **height**: Final window height in pixels
- **x**: Window X position
- **y**: Window Y position
- **animationRequired**: Whether transition animation is needed

---

## Success Criteria

### Measurable Outcomes

#### User Experience

- **SC-001**: Users can switch between any two views in under 250ms on all supported hardware
- **SC-002**: 95% of users report that window sizes feel "appropriate" for their screen size (measured via feedback)
- **SC-003**: Fewer than 5% of users report confusion about window behavior (vs. current multi-window approach)
- **SC-004**: Users can successfully navigate back through history on first attempt in 98% of cases

#### Performance

- **SC-005**: View transitions maintain 30fps or higher on 95% of supported hardware configurations
- **SC-006**: Screen size queries complete in under 50ms on all platforms
- **SC-007**: Memory usage does not increase by more than 10% compared to current multi-window implementation
- **SC-008**: Window resize calculations complete in under 10ms

#### Compatibility

- **SC-009**: Application functions correctly on screens ranging from 1366x768 to 3840x2160
- **SC-010**: Window positioning is accurate within 10px on all supported platforms
- **SC-011**: Application handles DPI scaling from 1.0x to 3.0x without rendering issues
- **SC-012**: No windows appear off-screen or partially hidden on any supported configuration

#### Reliability

- **SC-013**: Window size calculations succeed in 99.9% of cases (fallback to defaults on failure)
- **SC-014**: View transitions complete successfully in 99.5% of attempts
- **SC-015**: Navigation history is correctly maintained in 100% of multi-view sessions
- **SC-016**: System gracefully handles screen resolution changes during active use

---

## Assumptions

### Platform Support

1. **Single Display**: Only one active display is assumed. Multi-monitor setups are not in scope for this feature.
2. **macOS Primary**: Initial implementation targets macOS. Windows and Linux support will use platform-appropriate APIs.
3. **Modern Hardware**: Supported displays range from 1366x768 (netbooks) to 4K (3840x2160).

### User Behavior

1. **Native Expectations**: Users expect the application to behave like a native desktop app with smooth animations.
2. **View Switching Frequency**: Users switch views 5-20 times per session on average.
3. **Screen Constancy**: Users typically don't change screen resolution during active use (but disconnecting external monitors is common).

### Technical Constraints

1. **Animation Performance**: Hardware can sustain 30fps animations on all target platforms.
2. **OS API Availability**: Required OS APIs for screen information are available on all target platforms.
3. **Window System**: The windowing system (Tauri) supports programmatic resize and positioning.

### Current Architecture

1. **Existing Views**: Three distinct views exist (search, settings, plugins) with defined size requirements.
2. **State Management**: Current state management system can be extended for view history.
3. **Component Structure**: Existing components can be wrapped in view containers without major refactoring.

---

## Out of Scope

The following items are explicitly excluded from this feature:

- **Multi-monitor Support**: Handling windows spanning multiple displays or detecting which monitor a window is on
- **Window Persistence**: Saving and restoring window positions across application restarts (exists separately)
- **User Customizable Sizes**: Allowing users to manually adjust window size percentages
- **Tiling/Snapping**: Windows snapping to screen edges or other windows
- **Fullscreen Mode**: Dedicated fullscreen view (different feature)
- **View Persistence Within Session**: Maintaining exact state (scroll position, form data) when switching views (minimal state ok)
- **Advanced Animations**: 3D effects, complex transitions beyond fade + slide
- **Touch/Swipe Gestures**: Touch-based navigation on touch-enabled devices
