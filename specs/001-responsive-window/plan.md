# Implementation Plan: Responsive Single-Window Architecture

**Branch**: `001-responsive-window` | **Date**: 2025-01-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-responsive-window/spec.md`

---

## Summary

Transform the current multi-window Tauri application into a single-window responsive design where the main window dynamically adjusts its size and position based on screen dimensions and current view context. The application will support smooth animated transitions between views (search, settings, plugins) with percentage-based sizing that adapts to different display sizes while maintaining min/max constraints for usability.

**Key Technical Approach**:
- Rust backend handles screen detection via Tauri's `window.current_monitor()` API
- Window size calculated as percentage of screen dimensions with min/max clamping
- Frame-based ease-out animations (200-250ms) orchestrated in Rust
- Frontend uses Zustand for navigation state and React conditional rendering for views
- Coordinated transitions where window resize and content fade happen in parallel

---

## Technical Context

**Language/Version**:
- Rust 1.75+ (backend)
- TypeScript 5.8+ (frontend)
- React 19
- Tauri 2.0

**Primary Dependencies**:
- **Backend**: `tauri` 2.0, `tokio` (async runtime), `serde` (serialization)
- **Frontend**: `@tauri-apps/api` 2.0, `zustand` (state management), `react` 19
- **Existing**: `fuse.js` 7.0 (search), `react-router-dom` (navigation)

**Storage**:
- SQLite (via `rusqlite` 0.32) for plugin state and configuration (existing)
- File system for plugin files (existing)
- No additional storage needed for this feature

**Testing**:
- **Backend**: `cargo test` (unit/integration tests)
- **Frontend**: `vitest` (unit tests), `@testing-library/react` (component tests)
- **E2E**: `playwright` or `tauri-test` (full user flows)

**Target Platform**:
- macOS 13+ (primary, initial implementation)
- Windows 10+ (later)
- Linux (Ubuntu 22.04+, later)

**Project Type**:
- Desktop application (Tauri hybrid)
- Single-window architecture (frontend + backend in same process)

**Performance Goals**:
- View transitions complete within 250ms (FR-029, SC-001)
- Maintain 30fps minimum during animations (FR-030, SC-005)
- Screen detection under 50ms (SC-006)
- Window calculations under 10ms (SC-008)
- Memory increase < 10% compared to current multi-window implementation (SC-007)

**Constraints**:
- Single display only (multi-monitor explicitly out of scope per user request)
- macOS private API required for transparent windows (`tauri.conf.json`: `macOSPrivateApi: true`)
- Window must fit within screen bounds with 20px margins (FR-004)
- Maximum 50 navigation history entries (FR-019)
- Animation queue to prevent concurrent transitions (FR-011)

**Scale/Scope**:
- 3 view types (search, settings, plugins)
- 5-20 view switches per typical user session
- Screen size range: 1366x768 (netbooks) to 3840x2160 (4K)
- DPI scaling: 1.0x to 3.0x
- Approximately 15-20 new files (10 Rust, 8 TypeScript, 2 CSS)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASSED

**Checks**:
1. ✅ **Single Project**: Feature implemented within existing `etools` repository
2. ✅ **Technology Stack**: Uses existing technologies (Rust + Tauri + React)
3. ✅ **State Management**: Uses existing Zustand (no new state management library)
4. ✅ **Scope Boundaries**: Clearly defined out-of-scope items (multi-monitor, window persistence, etc.)
5. ✅ **No Breaking Changes**: Existing functionality preserved; only window management architecture changes

**Complexity Justifications**:
| Complexity | Reason | Simpler Alternative Rejected |
|-----------|--------|-----------------------------|
| Frame-based animation in Rust | Provides precise control over window chrome timing | CSS transitions only affect content, not OS window |
| Orchestrated Rust + React transitions | Prevents content clipping during resize | Pure frontend transitions show clipping |
| Screen info caching (5s TTL) | Reduces OS API calls from ~50ms to <1ms | Repeated OS queries add latency |
| Navigation queue | Prevents animation conflicts from rapid clicks | Unqueued navigation causes jerky behavior |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-responsive-window/
├── spec.md                  # Feature specification (5 user stories, 36 FRs)
├── plan.md                  # This file (implementation plan)
├── research.md              # Phase 0: Technical decisions (10 key areas)
├── data-model.md            # Phase 1: Entity definitions (ScreenInfo, ViewConfig, etc.)
├── quickstart.md            # Phase 1: Developer onboarding guide
├── contracts/               # Phase 1: API boundaries
│   ├── tauri-commands.md    # Tauri command contracts
│   └── frontend-services.md # Frontend service interfaces
└── checklists/
    └── requirements.md      # Specification quality checklist (all passed)
```

### Source Code (repository root)

**Backend (Rust)**:

```text
src-tauri/src/
├── cmds/
│   └── window.rs                    # NEW: get_screen_info, resize_window_smart
├── models/
│   ├── screen_info.rs               # NEW: ScreenInfo struct
│   ├── view_config.rs               # NEW: ViewConfig struct + defaults
│   └── window_layout.rs             # NEW: CalculatedWindowLayout struct
├── services/
│   ├── screen_detector.rs           # NEW: Monitor detection, DPI scaling
│   └── window_calculator.rs         # NEW: Size calculation algorithm
├── lib.rs                           # MODIFY: Register new commands
└── main.rs                          # EXISTING: Entry point
```

**Frontend (TypeScript/React)**:

```text
src/
├── services/
│   ├── screenService.ts             # NEW: Screen info API + caching
│   ├── windowService.ts             # NEW: Window resize API
│   └── viewTransitionService.ts     # NEW: Content transition orchestration
├── stores/
│   └── viewManagerStore.ts          # NEW: Zustand store for navigation
├── hooks/
│   ├── useScreenInfo.ts             # NEW: Access screen info
│   └── useViewNavigation.ts         # NEW: Navigate between views
├── components/
│   ├── ViewContainer.tsx            # NEW: Conditional view rendering
│   └── views/
│       ├── SearchView.tsx           # EXISTING: Will be refactored
│       ├── SettingsView.tsx         # EXISTING: Will be refactored
│       └── PluginsView.tsx          # EXISTING: Will be refactored
├── types/
│   ├── screen.ts                    # NEW: ScreenInfo type
│   ├── view.ts                      # NEW: ViewType, ViewConfig, ViewHistoryEntry
│   └── events.ts                    # NEW: Event payload types
└── App.tsx                          # MODIFY: Integrate ViewContainer
```

**Tests**:

```text
# Backend tests
src-tauri/tests/
├── screen_info_test.rs              # NEW: Test screen detection
├── window_calculator_test.rs        # NEW: Test calculation logic
└── integration_test.rs              # NEW: Test Tauri commands

# Frontend tests
src/
├── services/
│   ├── screenService.test.ts        # NEW: Test screen API + caching
│   └── windowService.test.ts        # NEW: Test window resize API
├── stores/
│   └── viewManagerStore.test.ts     # NEW: Test navigation state
└── components/
    └── ViewContainer.test.tsx       # NEW: Test view rendering

# E2E tests
e2e/
└── window-resize.spec.ts            # NEW: Test full user flows
```

**Structure Decision**:
This is a **desktop application** (Option 2: Web application structure adapted for Tauri). The project uses Tauri's hybrid architecture where:
- Backend is pure Rust in `src-tauri/` with commands, services, and models
- Frontend is React + TypeScript in `src/` with components, services, and hooks
- IPC communication via Tauri's `invoke()` and events

The feature adds ~10 new Rust files and ~12 new TypeScript files while refactoring existing view components to work with the new single-window architecture.

---

## Implementation Phases

### Phase 0: Research ✅ COMPLETE

**Output**: `research.md`

**Completed Tasks**:
- ✅ Resolved all technical unknowns (10 key decisions)
- ✅ Evaluated alternatives for screen detection, animation, state management
- ✅ Documented technology choices with rationale
- ✅ Identified all platform-specific requirements

**Key Decisions**:
1. Use Tauri's `window.current_monitor()` for screen info (cross-platform, no dependencies)
2. Frame-based animation with ease-out (200-250ms, 12 frames @ 60fps)
3. Zustand for state management (already in codebase)
4. Percentage-based sizing with min/max constraints
5. Orchestrated Rust + React transitions (prevents clipping)
6. Lazy loading + caching for performance
7. Graceful degradation with defaults (FR-033)
8. Multi-level testing approach (unit/integration/E2E)
9. macOS-first with platform abstractions
10. OS scale factor for DPI (automatic)

---

### Phase 1: Design & Contracts ✅ COMPLETE

**Outputs**:
- ✅ `data-model.md` - Entity definitions, relationships, validation rules
- ✅ `contracts/tauri-commands.md` - Tauri command APIs
- ✅ `contracts/frontend-services.md` - Frontend service interfaces
- ✅ `quickstart.md` - Developer onboarding guide

**Completed Tasks**:
- ✅ Defined all data entities (ScreenInfo, ViewConfig, ViewHistoryEntry, CalculatedWindowLayout)
- ✅ Specified Tauri command contracts (get_screen_info, resize_window_smart)
- ✅ Defined event contracts (window:resize_start, window:resize_complete, screen:changed)
- ✅ Created frontend service interfaces (screenService, windowService, viewTransitionService)
- ✅ Documented calculation algorithms and validation rules
- ✅ Created developer quickstart with common workflows and debugging tips

---

### Phase 2: Task Breakdown (NEXT)

**Output**: `tasks.md` (to be generated by `/speckit.tasks` command)

**Tasks Will Include**:
1. **Backend Implementation**:
   - Create data models (ScreenInfo, ViewConfig, CalculatedWindowLayout)
   - Implement screen detection service
   - Implement window calculator service
   - Create Tauri commands (get_screen_info, resize_window_smart)
   - Add event emissions (resize_start, resize_complete, screen_changed)
   - Write unit tests for calculation logic
   - Write integration tests for commands

2. **Frontend Implementation**:
   - Create type definitions (ScreenInfo, ViewConfig, events)
   - Implement screenService (API + caching)
   - Implement windowService (resize API)
   - Implement viewTransitionService (content transitions)
   - Create viewManagerStore (Zustand store)
   - Create useScreenInfo hook
   - Create useViewNavigation hook
   - Create ViewContainer component
   - Refactor existing view components (SearchView, SettingsView, PluginsView)
   - Update App.tsx to use ViewContainer
   - Write unit tests for services and hooks
   - Write component tests for ViewContainer

3. **Integration & Testing**:
   - Test full navigation flows (search → settings → plugins)
   - Test animation smoothness (30fps minimum)
   - Test on different screen sizes (13" MBP, 16" MBP, external 1080p, 4K)
   - Test error handling (screen detection failure, animation failure)
   - Test navigation queue (rapid clicks)
   - Test back navigation
   - Performance profiling (ensure <250ms transitions)

4. **Documentation & Cleanup**:
   - Update CLAUDE.md with new architecture
   - Remove deprecated multi-window code
   - Clean up unused imports
   - Add inline code comments
   - Final code review

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Animation performance on low-end hardware | Medium | Low | Target 30fps (not 60fps), degrade to instant resize if needed |
| Screen detection fails on some displays | High | Low | Fallback to safe defaults (FR-033), log errors |
| Content clipping during transitions | Medium | Medium | Orchestrated Rust + React timing, fade at 50% point |
| Memory leak in event listeners | High | Low | Proper cleanup in useEffect, document in quickstart |
| DPI scaling issues on Windows/Linux | Medium | Medium | Platform-specific abstractions, test on each OS |

### Implementation Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking existing functionality | High | Low | Keep old code during migration, test all existing features |
| User confusion from new UX | Medium | Low | Maintain familiar navigation patterns (back button, Escape key) |
| Animation timing hard to tune | Low | Medium | Expose duration in ViewConfig, allow easy adjustment |

---

## Success Criteria

From feature spec (16 measurable outcomes):

**User Experience**:
- SC-001: Users can switch between any two views in under 250ms on all supported hardware
- SC-002: 95% of users report window sizes feel "appropriate" for their screen
- SC-003: Fewer than 5% report confusion about window behavior
- SC-004: Users can successfully navigate back on first attempt in 98% of cases

**Performance**:
- SC-005: View transitions maintain 30fps or higher on 95% of hardware
- SC-006: Screen size queries complete in under 50ms on all platforms
- SC-007: Memory usage does not increase by more than 10% vs. current implementation
- SC-008: Window resize calculations complete in under 10ms

**Compatibility**:
- SC-009: Application functions on screens from 1366x768 to 3840x2160
- SC-010: Window positioning accurate within 10px on all platforms
- SC-011: Application handles DPI scaling from 1.0x to 3.0x
- SC-012: No windows appear off-screen or partially hidden

**Reliability**:
- SC-013: Window size calculations succeed in 99.9% of cases
- SC-014: View transitions complete successfully in 99.5% of attempts
- SC-015: Navigation history correctly maintained in 100% of multi-view sessions
- SC-016: System gracefully handles screen resolution changes during active use

---

## Next Steps

1. ✅ **Phase 0 Complete**: Research done, all technical decisions documented
2. ✅ **Phase 1 Complete**: Data model, contracts, and quickstart created
3. **NEXT: Phase 2** - Run `/speckit.tasks` command to generate `tasks.md` with actionable implementation steps

**Command to run**:
```bash
/speckit.tasks
```

This will create a detailed task breakdown with:
- ~40-50 individual tasks
- Dependency ordering (backend before frontend)
- Test requirements for each task
- Estimated complexity levels
- Clear acceptance criteria

---

## References

- **Feature Spec**: `specs/001-responsive-window/spec.md` - User stories and functional requirements
- **Research**: `specs/001-responsive-window/research.md` - Technical decisions and alternatives
- **Data Model**: `specs/001-responsive-window/data-model.md` - Entity definitions
- **Tauri Commands**: `specs/001-responsive-window/contracts/tauri-commands.md` - API contracts
- **Frontend Services**: `specs/001-responsive-window/contracts/frontend-services.md` - Service interfaces
- **Quickstart**: `specs/001-responsive-window/quickstart.md` - Developer guide
- **Project Docs**: `CLAUDE.md` - Overall architecture and conventions
